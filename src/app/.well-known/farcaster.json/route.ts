import { NextResponse } from "next/server";

/** Farcaster miniapp manifest removed for Jacpad. */
export async function GET() {
  return NextResponse.json(
    { error: "Jacpad is a Robinhood Chain web app, not a Farcaster miniapp." },
    { status: 410 }
  );
}
