import { NextRequest, NextResponse } from "next/server";
import { dbPool } from "~/lib/db";
import { ensureCoreSchema } from "~/lib/db-schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Ensure database schema exists
    await ensureCoreSchema();
    
    const { fid, token, url } = await req.json();
    
    if (!fid || !token) {
      return NextResponse.json(
        { success: false, error: "FID dan token diperlukan" },
        { status: 400 }
      );
    }

    // Update user with notification token
    const result = await dbPool.query(
      `UPDATE users 
       SET notification_token = $1, notification_url = $2, notifications_enabled = true 
       WHERE fid = $3
       RETURNING id`,
      [token, url, fid]
    );

    // Log to console for debugging (lightweight alternative to DB logs)
    if (result.rowCount === 0) {
      console.log('Warning: User not found for FID:', fid);
    } else {
      console.log('Notification token saved successfully for FID:', fid);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Notification token saved for future use" 
    });
  } catch (error: any) {
    console.error("Error saving notification token:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
