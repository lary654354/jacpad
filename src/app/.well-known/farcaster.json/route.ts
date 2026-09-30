import { NextResponse } from "next/server";

/** Farcaster miniapp manifest removed for Jackpad. */
export async function GET() {
  return NextResponse.json(
    { error: "Jackpad is a Robinhood Chain web app, not a Farcaster miniapp." },
    { status: 410 }
  );
}
