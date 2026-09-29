import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.text();
  console.log("/webhook POST", body);

  // Check if webhook backend is configured
  const backendEndpoint = process.env.VIBES_ENGINEERING_NOTIFICATION_BACKEND_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_VIBES_ENGINEERING_PROJECT_ID;

  if (!backendEndpoint || !projectId) {
    console.log("Webhook backend not configured, skipping notification forwarding");
    return NextResponse.json({ 
      success: true, 
      message: "Webhook received but backend not configured" 
    });
  }

  try {
    const notificationBackendEndpoint = `${backendEndpoint}?project_id=${projectId}`;

    const res = await fetch(notificationBackendEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": request.headers.get("content-type") || "application/json",
      },
      body,
    });
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Webhook forwarding error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to forward webhook" 
    }, { status: 500 });
  }
}
