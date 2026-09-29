import { NextRequest, NextResponse } from "next/server";
import { dbPool } from "~/lib/db";
import { ensureCoreSchema } from "~/lib/db-schema";

// Force this route to be dynamic; do not attempt to prerender or connect at build time
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    // Lazy ensure schema at request time (avoids build-time DB access)
    await ensureCoreSchema();
    const { fid, username, displayName, pfpUrl, bio, walletAddress } = await request.json();

    if (!fid || !username) {
      return NextResponse.json({ error: "FID and username are required" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await dbPool.query(
      "SELECT id FROM users WHERE fid = $1",
      [fid]
    );

    if (existingUser.rows.length > 0) {
      // Update existing user
      await dbPool.query(
        `UPDATE users SET 
         username = $2, 
         display_name = $3, 
         pfp_url = $4, 
         bio = $5, 
         wallet_address = $6,
         updated_at = now()
         WHERE fid = $1`,
        [fid, username, displayName, pfpUrl, bio, walletAddress]
      );
      
      return NextResponse.json({ 
        success: true, 
        message: "User updated successfully",
        userId: existingUser.rows[0].id
      });
    } else {
      // Create new user
      const result = await dbPool.query(
        `INSERT INTO users (fid, username, display_name, pfp_url, bio, wallet_address) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id`,
        [fid, username, displayName, pfpUrl, bio, walletAddress]
      );

      return NextResponse.json({ 
        success: true, 
        message: "User created successfully",
        userId: result.rows[0].id
      });
    }
  } catch (error) {
    console.error("User registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Lazy ensure schema at request time (avoids build-time DB access)
    await ensureCoreSchema();
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get("fid");

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 });
    }

    const result = await dbPool.query(
      "SELECT * FROM users WHERE fid = $1",
      [fid]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      user: result.rows[0]
    });
  } catch (error) {
    console.error("User fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
