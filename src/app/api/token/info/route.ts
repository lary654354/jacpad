import { NextRequest, NextResponse } from "next/server";
import { dbPool } from "~/lib/db";
import { OFFICIAL_TOKEN_CA } from "~/lib/constants";

function officialToken() {
  return {
    id: "official",
    address: OFFICIAL_TOKEN_CA,
    name: "Jackpad",
    symbol: "JACK",
    description: "Official Jackpad token on Robinhood Chain.",
    image: "/logo.png",
    creator: {
      fid: null,
      username: "jackpad",
      displayName: "Jackpad",
      pfpUrl: "/logo.png",
    },
    maxSupply: 0,
    creatorFeePercentage: 0,
    createdAt: null,
    price: 0,
    marketCap: 0,
    volume24h: 0,
    priceChange24h: 0,
    priceChangePercentage24h: 0,
    holders: 0,
    isVerified: true,
  };
}

function isOfficialAddress(address: string) {
  return address.toLowerCase() === OFFICIAL_TOKEN_CA.toLowerCase();
}

export async function GET(request: NextRequest) {
  const address = new URL(request.url).searchParams.get("address");
  try {
    if (!address) {
      return NextResponse.json(
        { error: "Missing address parameter" },
        { status: 400 }
      );
    }

    console.log("Getting token info for:", address);

    // Check if database is available
    if (!dbPool) {
      if (isOfficialAddress(address)) {
        return NextResponse.json(officialToken());
      }
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    // Check if address is UUID (token ID) or contract address
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(address);
    
    // Fetch real token data from database
    const query = isUUID 
      ? `
        SELECT 
          pt.*,
          u.username as creator_username,
          COALESCE(u.display_name, u.username) as creator_display_name,
          u.pfp_url as creator_pfp_url,
          u.fid as creator_fid,
          tmd.price_usd,
          tmd.market_cap_usd,
          tmd.volume_24h_usd,
          tmd.price_change_24h,
          tmd.price_change_percentage_24h,
          tmd.high_24h,
          tmd.low_24h,
          tmd.holders_count,
          tmd.last_updated
        FROM profile_tokens pt
        JOIN users u ON pt.creator_id = u.id
        LEFT JOIN token_market_data tmd ON pt.id = tmd.token_id
        WHERE pt.id = $1 AND pt.is_active = true
      `
      : `
        SELECT 
          pt.*,
          u.username as creator_username,
          COALESCE(u.display_name, u.username) as creator_display_name,
          u.pfp_url as creator_pfp_url,
          u.fid as creator_fid,
          tmd.price_usd,
          tmd.market_cap_usd,
          tmd.volume_24h_usd,
          tmd.price_change_24h,
          tmd.price_change_percentage_24h,
          tmd.high_24h,
          tmd.low_24h,
          tmd.holders_count,
          tmd.last_updated
        FROM profile_tokens pt
        JOIN users u ON pt.creator_id = u.id
        LEFT JOIN token_market_data tmd ON pt.id = tmd.token_id
        WHERE lower(pt.address) = lower($1) AND pt.is_active = true
      `;

    const result = await dbPool.query(query, [address]);

    if (result.rows.length === 0) {
      if (isOfficialAddress(address)) {
        return NextResponse.json(officialToken());
      }
      return NextResponse.json(
        { error: "Token not found" },
        { status: 404 }
      );
    }

    const row = result.rows[0];
    
    const tokenInfo = {
      id: row.id,
      address: row.address,
      name: row.name,
      symbol: row.symbol,
      description: row.description,
      image: row.image_url,
      creator: {
        fid: row.creator_fid,
        username: row.creator_username,
        displayName: row.creator_display_name,
        pfpUrl: row.creator_pfp_url,
      },
      maxSupply: parseInt(row.max_supply),
      creatorFeePercentage: parseFloat(row.creator_fee_percentage),
      createdAt: row.created_at,
      // Market data with proper defaults
      price: parseFloat(row.price_usd || 0.00000000009999999999999999), // Use initial price if no market data
      marketCap: parseInt(row.market_cap_usd || 10000000000), // Use initial market cap if no market data
      volume24h: parseInt(row.volume_24h_usd || 0),
      priceChange24h: parseFloat(row.price_change_24h || 0),
      priceChangePercentage24h: parseFloat(row.price_change_percentage_24h || 0),
      holders: parseInt(row.holders_count || 1),
      isVerified: row.is_verified,
      lastUpdated: row.last_updated,
    };

    return NextResponse.json(tokenInfo);

  } catch (error) {
    console.error("Get token info error:", error);
    if (address && isOfficialAddress(address)) {
      return NextResponse.json(officialToken());
    }
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
}
