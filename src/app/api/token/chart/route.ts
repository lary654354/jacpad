import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const days = searchParams.get("days") || "7";

    if (!address) {
      return NextResponse.json(
        { error: "Missing address parameter" },
        { status: 400 }
      );
    }

    console.log("Getting candle chart data for:", address);

    // Try to get real market data first
    try {
      const marketResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/token/market?address=${address}&days=${days}`);
      
      if (marketResponse.ok) {
        const marketData = await marketResponse.json();
        
        if (marketData.success && marketData.candles) {
          return NextResponse.json({
            success: true,
            data: marketData.candles,
            source: marketData.source,
            marketData: marketData.data,
            lastUpdated: marketData.lastUpdated,
          });
        }
      }
    } catch (error) {
      console.log("Failed to fetch real market data:", error);
    }

    // No data available
    return NextResponse.json({
      success: false,
      error: "Chart data not available",
      message: "Unable to fetch chart data from market APIs",
      source: "none",
    }, { status: 404 });

  } catch (error) {
    console.error("Get candle chart error:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
}

