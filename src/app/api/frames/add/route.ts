import { NextRequest, NextResponse } from "next/server";
import { dbPool } from "~/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fid } = body as { fid?: number };
    if (!fid) return NextResponse.json({ error: 'fid required' }, { status: 400 });

    // Ensure table exists
    await dbPool.query(`CREATE TABLE IF NOT EXISTS notification_logs (
      id SERIAL PRIMARY KEY,
      fid BIGINT,
      type TEXT,
      message TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    await dbPool.query(
      `INSERT INTO notification_logs (fid, type, message) VALUES ($1,$2,$3)`,
      [fid, 'frame_pinned', 'User pinned/added the mini-app frame']
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}


