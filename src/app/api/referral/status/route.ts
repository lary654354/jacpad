import { NextRequest, NextResponse } from "next/server";
import { dbPool } from "~/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fid = searchParams.get('fid');
    if (!fid) return NextResponse.json({ used: false });
    
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
    await dbPool.query(`CREATE TABLE IF NOT EXISTS user_xp (fid BIGINT PRIMARY KEY, xp INT DEFAULT 0)`);
    
    // Ensure referral code exists or generate
    const existing = await dbPool.query(`SELECT code FROM referral_codes WHERE fid=$1`, [fid]);
    let code = existing.rows?.[0]?.code as string | undefined;
    if (!code) {
      const gen = Math.random().toString(36).slice(2, 10).toUpperCase();
      try { await dbPool.query(`INSERT INTO referral_codes (fid, code) VALUES ($1,$2)`, [fid, gen]); code = gen; } catch {}
    }
    const r = await dbPool.query(`SELECT 1 FROM referral_uses WHERE referred_fid=$1 LIMIT 1`, [fid]);
    // Also return invited list and xp (optional UI extras)
    const invited = await dbPool.query(`SELECT u.username FROM referral_uses ru JOIN users u ON ru.referred_fid=u.fid WHERE ru.referrer_fid=$1 ORDER BY ru.created_at DESC LIMIT 50`, [fid]);
    const xp = await dbPool.query(`SELECT xp FROM user_xp WHERE fid=$1`, [fid]);
    return NextResponse.json({ used: (r?.rowCount || 0) > 0, code: code || null, invited: invited.rows?.map((row: any)=>row.username) || [], xp: xp.rows?.[0]?.xp || 0 });
  } catch (e) {
    console.error('Referral status error:', e);
    return NextResponse.json({ used: false, code: null, invited: [], xp: 0 });
  }
}


