import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    success: false,
    error: "Clanker LP rewards removed. Jacpad uses Pons v2 on Robinhood Chain.",
    rewards: null,
  });
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Claim via Pons after token graduation.",
    },
    { status: 501 }
  );
}
