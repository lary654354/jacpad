import { NextRequest, NextResponse } from "next/server";
import { dbPool } from "~/lib/db";
import { ensureCoreSchema } from "~/lib/db-schema";
import { isAddress, getAddress } from "viem";

export const dynamic = "force-dynamic";

/**
 * Persist a token that was already launched on-chain via Pons v2 from the user wallet.
 * Does NOT deploy. Client calls the factory directly.
 */
export async function POST(request: NextRequest) {
  try {
    if (!dbPool) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    await ensureCoreSchema();
    const body = await request.json();

    const {
      tokenAddress,
      curveAddress,
      launchTx,
      name,
      symbol,
      description,
      imageUrl,
      twitterHandle,
      walletAddress,
      creatorTaxBps,
    } = body;

    if (!tokenAddress || !isAddress(tokenAddress)) {
      return NextResponse.json({ error: "Invalid tokenAddress" }, { status: 400 });
    }
    if (!walletAddress || !isAddress(walletAddress)) {
      return NextResponse.json({ error: "Invalid walletAddress" }, { status: 400 });
    }
    if (!name || !symbol) {
      return NextResponse.json({ error: "name and symbol required" }, { status: 400 });
    }

    const wallet = getAddress(walletAddress);
    const token = getAddress(tokenAddress);
    const handle = String(twitterHandle || "")
      .trim()
      .replace(/^@/, "")
      .toLowerCase();

    // Upsert user by wallet
    let userId: string;
    const existing = await dbPool.query(
      `SELECT id FROM users WHERE lower(wallet_address) = lower($1) LIMIT 1`,
      [wallet]
    );
    if (existing.rows[0]) {
      userId = existing.rows[0].id;
      await dbPool.query(
        `UPDATE users SET
          username = COALESCE(NULLIF($2, ''), username),
          display_name = COALESCE(NULLIF($3, ''), display_name),
          pfp_url = COALESCE(NULLIF($4, ''), pfp_url),
          bio = COALESCE(NULLIF($5, ''), bio),
          twitter_handle = COALESCE(NULLIF($6, ''), twitter_handle),
          updated_at = now()
         WHERE id = $1`,
        [userId, handle || symbol, name, imageUrl || null, description || null, handle || null]
      );
    } else {
      const inserted = await dbPool.query(
        `INSERT INTO users (wallet_address, username, display_name, pfp_url, bio, twitter_handle)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [wallet, handle || symbol.toLowerCase(), name, imageUrl || null, description || null, handle || null]
      );
      userId = inserted.rows[0].id;
    }

    // One active token per wallet (soft guard)
    const prior = await dbPool.query(
      `SELECT id FROM profile_tokens WHERE lower(creator_wallet) = lower($1) AND is_active = true LIMIT 1`,
      [wallet]
    );
    if (prior.rows[0]) {
      // Allow if same address (idempotent re-persist)
      const same = await dbPool.query(
        `SELECT id FROM profile_tokens WHERE lower(address) = lower($1) LIMIT 1`,
        [token]
      );
      if (!same.rows[0]) {
        return NextResponse.json(
          { error: "Wallet already has an active Jacpad token" },
          { status: 409 }
        );
      }
      return NextResponse.json({
        success: true,
        tokenAddress: token,
        alreadyExists: true,
      });
    }

    const feePct = creatorTaxBps != null ? Number(creatorTaxBps) / 100 : 2.5;

    await dbPool.query(
      `INSERT INTO profile_tokens (
        address, name, symbol, description, image_url, creator_id,
        max_supply, creator_fee_percentage, is_active,
        twitter_handle, curve_address, launch_tx, creator_wallet
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$9,$10,$11,$12)
      ON CONFLICT (address) DO UPDATE SET
        name = EXCLUDED.name,
        symbol = EXCLUDED.symbol,
        description = EXCLUDED.description,
        image_url = EXCLUDED.image_url,
        twitter_handle = EXCLUDED.twitter_handle,
        curve_address = EXCLUDED.curve_address,
        launch_tx = EXCLUDED.launch_tx,
        updated_at = now()`,
      [
        token,
        name,
        symbol,
        description || null,
        imageUrl || null,
        userId,
        1_000_000_000,
        feePct,
        handle || null,
        curveAddress && isAddress(curveAddress) ? getAddress(curveAddress) : null,
        launchTx || null,
        wallet,
      ]
    );

    return NextResponse.json({
      success: true,
      tokenAddress: token,
      curveAddress: curveAddress || null,
      launchTx: launchTx || null,
    });
  } catch (error: any) {
    console.error("[DEPLOY PERSIST]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to persist token" },
      { status: 500 }
    );
  }
}
