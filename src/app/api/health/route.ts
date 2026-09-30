import { NextResponse } from "next/server";
import { dbPool } from "~/lib/db";
import { ROBINHOOD_CHAIN_ID, PONS_V2_FACTORY } from "~/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, any> = {
    app: "jackpad",
    chainId: ROBINHOOD_CHAIN_ID,
    ponsFactory: PONS_V2_FACTORY,
    timestamp: new Date().toISOString(),
  };

  try {
    if (dbPool) {
      await dbPool.query("SELECT 1");
      checks.database = true;
    } else {
      checks.database = "not configured";
    }
  } catch (error) {
    checks.database = false;
    checks.databaseError = error instanceof Error ? error.message : "Unknown error";
  }

  checks.envs = {
    DATABASE_URL: !!(process.env.DATABASE_URL || process.env.POSTGRES_URL),
    WALLETCONNECT: !!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  };

  const ok = checks.app && checks.database !== false;

  return NextResponse.json(checks, { status: ok ? 200 : 503 });
}
