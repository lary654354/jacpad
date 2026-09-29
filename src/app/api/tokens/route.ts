import { NextRequest, NextResponse } from "next/server";
import { dbPool } from "~/lib/db";
import { ensureCoreSchema } from "~/lib/db-schema";

export const dynamic = "force-dynamic";

function mapToken(row: any) {
  return {
    id: row.id,
    address: row.address,
    name: row.name,
    symbol: row.symbol,
    description: row.description,
    image: row.image_url,
    image_url: row.image_url,
    twitter_handle: row.twitter_handle || row.creator_twitter || null,
    curve_address: row.curve_address || null,
    creator_wallet: row.creator_wallet || row.wallet_address || null,
    creator: {
      fid: row.creator_fid ?? null,
      username: row.creator_username,
      displayName: row.creator_display_name,
      pfpUrl: row.creator_pfp_url || row.image_url,
      twitterHandle: row.creator_twitter || row.twitter_handle || null,
      walletAddress: row.wallet_address || row.creator_wallet || null,
    },
    maxSupply: parseInt(row.max_supply || "0", 10),
    creatorFeePercentage: parseFloat(row.creator_fee_percentage || "0"),
    createdAt: row.created_at,
    marketCap: parseInt(row.market_cap_usd || 0, 10),
    volume24h: parseInt(row.volume_24h_usd || 0, 10),
    price: parseFloat(row.price_usd || 0),
    priceChange24h: parseFloat(row.price_change_24h || 0),
    priceChangePercentage24h: parseFloat(row.price_change_percentage_24h || 0),
    holders: parseInt(row.holders_count || 0, 10),
    isVerified: row.is_verified,
  };
}

const SELECT_BASE = `
  SELECT
    pt.*,
    u.username as creator_username,
    COALESCE(u.display_name, u.username) as creator_display_name,
    u.pfp_url as creator_pfp_url,
    u.fid as creator_fid,
    u.wallet_address,
    u.twitter_handle as creator_twitter,
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
  WHERE pt.is_active = true
`;

export async function GET(request: NextRequest) {
  try {
    if (!dbPool) {
      return NextResponse.json({ success: true, tokens: [] });
    }
    await ensureCoreSchema();

    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get("id");
    const tokenAddress = searchParams.get("address");
    const creatorWallet = searchParams.get("creator_wallet");
    const creatorFid = searchParams.get("creator_fid");

    if (tokenId || tokenAddress) {
      let query = SELECT_BASE;
      const params: any[] = [];
      if (tokenId) {
        query += " AND pt.id = $1";
        params.push(tokenId);
      } else {
        query += " AND lower(pt.address) = lower($1)";
        params.push(tokenAddress);
      }
      const result = await dbPool.query(query, params);
      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Token not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, token: mapToken(result.rows[0]) });
    }

    if (creatorWallet) {
      const result = await dbPool.query(
        `${SELECT_BASE} AND (
          lower(pt.creator_wallet) = lower($1)
          OR lower(u.wallet_address) = lower($1)
        ) ORDER BY pt.created_at DESC`,
        [creatorWallet]
      );
      return NextResponse.json({ success: true, tokens: result.rows.map(mapToken) });
    }

    if (creatorFid) {
      const result = await dbPool.query(
        `${SELECT_BASE} AND u.fid = $1 ORDER BY pt.created_at DESC`,
        [creatorFid]
      );
      return NextResponse.json({ success: true, tokens: result.rows.map(mapToken) });
    }

    const category = searchParams.get("category") || "trending";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    let orderBy = "ORDER BY pt.created_at DESC";
    switch (category) {
      case "trending":
        orderBy = "ORDER BY tmd.price_change_percentage_24h DESC NULLS LAST, pt.created_at DESC";
        break;
      case "top-market-cap":
        orderBy = "ORDER BY tmd.market_cap_usd DESC NULLS LAST";
        break;
      case "top-volume":
        orderBy = "ORDER BY tmd.volume_24h_usd DESC NULLS LAST";
        break;
      case "new-tokens":
        orderBy = "ORDER BY pt.created_at DESC";
        break;
    }

    const result = await dbPool.query(
      `${SELECT_BASE} ${orderBy} LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const tokens = result.rows.map(mapToken);

    return NextResponse.json({
      success: true,
      tokens,
      pagination: { limit, offset, total: tokens.length },
    });
  } catch (error) {
    console.error("Tokens fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 500 });
  }
}
