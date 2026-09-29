import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error: "Clanker claim removed. Claim creator fees via Pons after graduation.",
    },
    { status: 501 }
  );
}
