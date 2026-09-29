import { NextRequest, NextResponse } from "next/server";
import { dbPool } from "~/lib/db";
import { ensureCoreSchema } from "~/lib/db-schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { fid, title, message, notificationType } = await req.json();
    
    // Log notification attempt (disabled for now)
    console.log('Notification request received (disabled):', {
      fid,
      notificationType,
      title,
      message: message ? 'present' : 'missing'
    });

    // Return success without actually sending notification
    return NextResponse.json({ 
      success: true, 
      message: "Notification system temporarily disabled"
    });

  } catch (error: any) {
    console.error("Error in notification API:", error);
    return NextResponse.json(
      { success: false, error: "Notification system temporarily disabled" },
      { status: 200 } // Return 200 to avoid breaking the flow
    );
  }
}
