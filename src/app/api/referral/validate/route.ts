import { NextRequest, NextResponse } from "next/server";
import { dbPool } from "~/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { fid, refCode } = await req.json();
    if (!fid || !refCode) {
      return NextResponse.json({ valid: false, error: 'fid and refCode required' }, { status: 400 });
    }

    // Ensure all required tables exist
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

    // Check if user already used a referral code
    const used = await dbPool.query(`SELECT 1 FROM referral_uses WHERE referred_fid=$1 LIMIT 1`, [fid]);
    if ((used?.rowCount || 0) > 0) {
      return NextResponse.json({ valid: false, error: 'Referral already used' }, { status: 200 });
    }

    // Beta referral fallback first (untuk menghindari query ke users table yang mungkin kosong)
    const betaCode = process.env.BETA_REF_CODE || '';
    const betaFid = Number(process.env.BETA_REF_FID || 1);
    
    console.log('Beta validation:', { 
      inputCode: refCode, 
      betaCode, 
      betaFid, 
      matches: refCode === betaCode 
    });
    
    if (betaCode && refCode === betaCode && betaFid > 0) {
      // Valid beta code
      console.log('Beta code validated successfully');
      return NextResponse.json({ valid: true, referrerFid: betaFid }, { status: 200 });
    }

    // Resolve referrer by code (try username first, then referral_codes mapping)
    let ref = await dbPool.query(`SELECT id, fid FROM users WHERE username=$1 LIMIT 1`, [refCode]);
    let codeExists = false;
    
    if (ref.rowCount === 0) {
      // Check if code exists in referral_codes table
      const rc = await dbPool.query(`SELECT fid FROM referral_codes WHERE code=$1 LIMIT 1`, [refCode]);
      if ((rc?.rowCount || 0) > 0) {
        codeExists = true;
        // Try to find user with this FID
        ref = await dbPool.query(`SELECT id, fid FROM users WHERE fid=$1 LIMIT 1`, [rc.rows[0].fid]);
        
        if (ref.rowCount === 0) {
          // Code exists but owner hasn't registered yet
          return NextResponse.json({ 
            valid: false, 
            error: "Invalid code. Your friend hasn't created their IndenFi identity yet." 
          }, { status: 200 });
        }
      }
    }

    if (ref.rowCount === 0) {
      // Code doesn't exist at all
      return NextResponse.json({ 
        valid: false, 
        error: codeExists ? "Code owner not found" : "Referral code not found. Check the code and try again." 
      }, { status: 200 });
    }

    return NextResponse.json({ valid: true, referrerFid: ref.rows[0].fid }, { status: 200 });
  } catch (e) {
    console.error('Referral validation error:', e);
    // Return user-friendly error instead of SQL error
    return NextResponse.json({ valid: false, error: 'Invalid referral code' }, { status: 200 });
  }
}

