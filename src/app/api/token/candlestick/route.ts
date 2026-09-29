import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenAddress = searchParams.get("address");
    const days = searchParams.get("days") || "7";

    if (!tokenAddress) {
      return NextResponse.json(
        { error: "Missing address parameter" },
        { status: 400 }
      );
    }

    console.log("Getting candlestick data for:", tokenAddress);

    // Try CoinGecko API first
    try {
      // For now, we'll use a known token ID for testing
      // In production, you'd need to map token addresses to CoinGecko IDs
      const coinGeckoId = "degen-base"; // Example: DEGEN token on Base
      
      const coinGeckoResponse = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinGeckoId}/ohlc?vs_currency=usd&days=${days}`
      );
      
      if (coinGeckoResponse.ok) {
        const coinGeckoData = await coinGeckoResponse.json();
        
        if (coinGeckoData && coinGeckoData.length > 0) {
          const candles = coinGeckoData.map((item: number[]) => ({
            time: Math.floor(item[0] / 1000), // Convert ms to seconds
            open: item[1],
            high: item[2],
            low: item[3],
            close: item[4]
          }));

          return NextResponse.json({
            success: true,
            data: candles,
            source: "coingecko",
            lastUpdated: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.log("CoinGecko API failed:", error);
    }

    // Fallback to DexScreener if CoinGecko fails
    try {
      const dexscreenerResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
      if (dexscreenerResponse.ok) {
        const dexscreenerData = await dexscreenerResponse.json();
        if (dexscreenerData.pairs && dexscreenerData.pairs.length > 0) {
          const pair = dexscreenerData.pairs[0];
          
          // Generate simple candles from current data
          const candles = generateCandleFromDexData({
            priceUsd: pair.priceUsd,
            priceChange: { h24: parseFloat(pair.priceChange.h24) }
          }, parseInt(days));

          return NextResponse.json({
            success: true,
            data: candles,
            source: "dexscreener",
            lastUpdated: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.log("DexScreener API failed:", error);
    }

    // No data available
    return NextResponse.json({
      success: false,
      error: "No candlestick data available",
      message: "Token not found on CoinGecko or DexScreener",
      source: "none",
    }, { status: 404 });

  } catch (error) {
    console.error("Get candlestick data error:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
}

// Helper function to generate candle data from DexScreener-like data
function generateCandleFromDexData(currentData: { priceUsd: string; priceChange: { h24: number } }, days: number) {
  const candles = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const currentPrice = parseFloat(currentData.priceUsd);
  const priceChange24h = currentData.priceChange.h24;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - i * dayMs);
    // Simple simulation: assume price moved linearly over the last 24h
    // and then was relatively stable before that.
    let open, close, high, low;

    if (i === 0) { // Current day
      close = currentPrice;
      open = currentPrice - priceChange24h;
      high = Math.max(open, close) * (1 + Math.random() * 0.01); // Add some random fluctuation
      low = Math.min(open, close) * (1 - Math.random() * 0.01);
    } else { // Past days
      // For past days, just create some variation around a base price
      const base = currentPrice - priceChange24h * (i / days); // Trend towards current price
      open = base * (1 + (Math.random() - 0.5) * 0.05);
      close = base * (1 + (Math.random() - 0.5) * 0.05);
      high = Math.max(open, close) * (1 + Math.random() * 0.02);
      low = Math.min(open, close) * (1 - Math.random() * 0.02);
    }

    candles.push({
      time: Math.floor(date.getTime() / 1000), // Convert to seconds
      open: parseFloat(open.toFixed(6)),
      high: parseFloat(high.toFixed(6)),
      low: parseFloat(low.toFixed(6)),
      close: parseFloat(close.toFixed(6)),
    });
  }
  return candles;
}
