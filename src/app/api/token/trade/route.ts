import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error: "In-app trade removed. Use Pons launchpad on Robinhood Chain.",
      launchpad: "https://www.ponsfamily.com/launchpad",
    },
    { status: 501 }
  );
}
