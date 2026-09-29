import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Missing address parameter" },
        { status: 400 }
      );
    }

    // For now, return mock price
    // In production, you would fetch from DEX or price oracle
    console.log("Getting token price for:", address);

    const mockPrice = "0.001";

    return NextResponse.json({
      address,
      price: mockPrice,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Get token price error:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
}
