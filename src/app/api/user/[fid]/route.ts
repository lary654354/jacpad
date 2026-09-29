import { NextRequest, NextResponse } from "next/server";
import { dbPool } from "~/lib/db";
import { ensureCoreSchema } from "~/lib/db-schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ fid: string }> }) {
  try {
    await ensureCoreSchema();
    const { fid } = await ctx.params;
    const fidNum = Number(fid);
    if (!fidNum) return NextResponse.json({ error: "Missing fid" }, { status: 400 });

    const ures = await dbPool.query(`SELECT * FROM users WHERE fid = $1`, [fidNum]);
    const user = ures.rows[0];
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true, user });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
} 