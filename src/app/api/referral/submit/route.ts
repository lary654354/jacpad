import { NextRequest, NextResponse } from "next/server";
import { dbPool } from "~/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { fid, refCode, txHash } = await req.json();
    if (!fid || !refCode) return NextResponse.json({ error: 'fid and refCode required' }, { status: 400 });

    // Ensure tables exist
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        fid bigint UNIQUE NOT NULL,
        wallet_address text,
        username text NOT NULL,
        display_name text,
        pfp_url text,
        bio text,
        is_verified boolean DEFAULT false,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `);
    await dbPool.query(`CREATE TABLE IF NOT EXISTS referral_codes (fid BIGINT PRIMARY KEY, code TEXT UNIQUE NOT NULL, created_at TIMESTAMP DEFAULT NOW())`);
    await dbPool.query(`CREATE TABLE IF NOT EXISTS referral_uses (id SERIAL PRIMARY KEY, referrer_fid BIGINT NOT NULL, referred_fid BIGINT UNIQUE NOT NULL, tx_hash TEXT, created_at TIMESTAMP DEFAULT NOW())`);
    await dbPool.query(`CREATE TABLE IF NOT EXISTS user_xp (fid BIGINT PRIMARY KEY, xp INT DEFAULT 0)`);

    // Resolve referrer by code (assuming code is username or stored code in users table)
    // Try username first, otherwise try referral_codes mapping
    let ref = await dbPool.query(`SELECT id, fid FROM users WHERE username=$1 LIMIT 1`, [refCode]);
    if (ref.rowCount === 0) {
      const rc = await dbPool.query(`SELECT fid FROM referral_codes WHERE code=$1 LIMIT 1`, [refCode]);
      if ((rc?.rowCount || 0) > 0) {
        ref = await dbPool.query(`SELECT id, fid FROM users WHERE fid=$1 LIMIT 1`, [rc.rows[0].fid]);
      }
    }
    // Beta referral fallback
    if (ref.rowCount === 0) {
      const betaCode = process.env.BETA_REF_CODE || '';
      const betaFid = Number(process.env.BETA_REF_FID || 1);
      
      console.log('Beta submit check:', { 
        inputCode: refCode, 
        betaCode, 
        betaFid, 
        matches: refCode === betaCode 
      });
      
      if (betaCode && refCode === betaCode && betaFid > 0) {
        // allow beta code without requiring existing user row
        await dbPool.query(`CREATE TABLE IF NOT EXISTS user_xp (fid BIGINT PRIMARY KEY, xp INT DEFAULT 0)`);
        console.log('Beta code accepted in submit');
        // Proceed with betaFid as referrer
        ref = { rowCount: 1, rows: [{ id: null, fid: betaFid }] } as any;
      }

    }
    if (ref.rowCount === 0) return NextResponse.json({ error: 'Referral code not found or owner hasn\'t registered yet' }, { status: 404 });

    // Ensure not already used
    const used = await dbPool.query(`SELECT 1 FROM referral_uses WHERE referred_fid=$1 LIMIT 1`, [fid]);
    if ((used?.rowCount || 0) > 0) return NextResponse.json({ error: 'You already used a referral code' }, { status: 409 });

    // Insert referral use
    await dbPool.query(
      `INSERT INTO referral_uses (referrer_fid, referred_fid, tx_hash) VALUES ($1,$2,$3)`,
      [ref.rows[0].fid, fid, txHash || null]
    );

    // Increment XP for both
    await dbPool.query(`INSERT INTO user_xp (fid, xp) VALUES ($1,50) ON CONFLICT (fid) DO UPDATE SET xp=user_xp.xp+50`, [ref.rows[0].fid]);
    await dbPool.query(`INSERT INTO user_xp (fid, xp) VALUES ($1,50) ON CONFLICT (fid) DO UPDATE SET xp=user_xp.xp+50`, [fid]);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}



