import { dbPool } from "./db";

export async function ensureCoreSchema() {
  if (!dbPool) return;

  await dbPool.query(`DO $$
  BEGIN
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
    EXCEPTION WHEN insufficient_privilege THEN
      NULL;
    END;
    BEGIN
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    EXCEPTION WHEN insufficient_privilege THEN
      NULL;
    END;
    BEGIN
      PERFORM gen_random_uuid();
    EXCEPTION WHEN undefined_function THEN
      PERFORM uuid_generate_v4();
      CREATE OR REPLACE FUNCTION gen_random_uuid() RETURNS uuid AS $fn$ SELECT uuid_generate_v4(); $fn$ LANGUAGE SQL;
    END;
  END$$;`);

  // Users: wallet-first (Jacpad). Keep fid nullable for legacy rows.
  await dbPool.query(`CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fid bigint UNIQUE,
    wallet_address text UNIQUE,
    username text NOT NULL,
    display_name text,
    pfp_url text,
    bio text,
    twitter_handle text,
    is_verified boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );`);

  await dbPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_handle text;`);
  try {
    await dbPool.query(`ALTER TABLE users ALTER COLUMN fid DROP NOT NULL;`);
  } catch {
    /* already nullable or column missing */
  }
  await dbPool.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_wallet_address_uidx ON users (lower(wallet_address)) WHERE wallet_address IS NOT NULL;`);
  await dbPool.query(`CREATE INDEX IF NOT EXISTS users_twitter_handle_idx ON users (lower(twitter_handle));`);

  await dbPool.query(`CREATE TABLE IF NOT EXISTS profile_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    address text UNIQUE NOT NULL,
    name text NOT NULL,
    symbol text NOT NULL,
    description text,
    image_url text,
    creator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    max_supply bigint NOT NULL DEFAULT 1000000000,
    creator_fee_percentage decimal(5,2) NOT NULL DEFAULT 2.5,
    is_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );`);

  await dbPool.query(`ALTER TABLE profile_tokens ADD COLUMN IF NOT EXISTS twitter_handle text;`);
  await dbPool.query(`ALTER TABLE profile_tokens ADD COLUMN IF NOT EXISTS curve_address text;`);
  await dbPool.query(`ALTER TABLE profile_tokens ADD COLUMN IF NOT EXISTS launch_tx text;`);
  await dbPool.query(`ALTER TABLE profile_tokens ADD COLUMN IF NOT EXISTS creator_wallet text;`);
  await dbPool.query(`ALTER TABLE profile_tokens ADD COLUMN IF NOT EXISTS requester_fid bigint;`);

  await dbPool.query(`CREATE TABLE IF NOT EXISTS token_market_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id uuid NOT NULL REFERENCES profile_tokens(id) ON DELETE CASCADE,
    price_usd decimal(20,8) NOT NULL DEFAULT 0,
    market_cap_usd bigint NOT NULL DEFAULT 0,
    volume_24h_usd bigint NOT NULL DEFAULT 0,
    price_change_24h decimal(20,8) NOT NULL DEFAULT 0,
    price_change_percentage_24h decimal(10,4) NOT NULL DEFAULT 0,
    high_24h decimal(20,8) NOT NULL DEFAULT 0,
    low_24h decimal(20,8) NOT NULL DEFAULT 0,
    holders_count integer NOT NULL DEFAULT 0,
    last_updated timestamptz DEFAULT now()
  );`);

  await dbPool.query(`CREATE TABLE IF NOT EXISTS token_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id uuid NOT NULL REFERENCES profile_tokens(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type text NOT NULL CHECK (transaction_type IN ('buy', 'sell')),
    amount decimal(20,8) NOT NULL,
    price_usd decimal(20,8) NOT NULL,
    total_value_usd decimal(20,8) NOT NULL,
    tx_hash text NOT NULL,
    block_number bigint,
    gas_used bigint,
    gas_price bigint,
    created_at timestamptz DEFAULT now()
  );`);

  await dbPool.query(`CREATE TABLE IF NOT EXISTS token_holders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id uuid NOT NULL REFERENCES profile_tokens(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance decimal(20,8) NOT NULL DEFAULT 0,
    percentage decimal(10,6) NOT NULL DEFAULT 0,
    is_creator boolean DEFAULT false,
    first_acquired_at timestamptz,
    last_updated_at timestamptz DEFAULT now(),
    UNIQUE(token_id, user_id)
  );`);

  await dbPool.query(`CREATE TABLE IF NOT EXISTS creator_rewards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id uuid NOT NULL REFERENCES profile_tokens(id) ON DELETE CASCADE,
    creator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_fees_earned decimal(20,8) NOT NULL DEFAULT 0,
    fees_claimed decimal(20,8) NOT NULL DEFAULT 0,
    claimable_fees decimal(20,8) NOT NULL DEFAULT 0,
    last_claimed_at timestamptz,
    next_claim_available_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );`);

  await dbPool.query(`CREATE TABLE IF NOT EXISTS kv (
    key text PRIMARY KEY,
    value jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamptz NOT NULL DEFAULT now()
  );`);

  await dbPool.query(`CREATE TABLE IF NOT EXISTS files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id text,
    filename text NOT NULL,
    mime_type text,
    data bytea NOT NULL,
    created_at timestamptz DEFAULT now()
  );`);

  await dbPool.query(`CREATE INDEX IF NOT EXISTS profile_tokens_creator_idx ON profile_tokens(creator_id);`);
  await dbPool.query(`CREATE INDEX IF NOT EXISTS profile_tokens_address_idx ON profile_tokens(address);`);
  await dbPool.query(`CREATE INDEX IF NOT EXISTS profile_tokens_twitter_idx ON profile_tokens(lower(twitter_handle));`);
  await dbPool.query(`CREATE INDEX IF NOT EXISTS profile_tokens_wallet_idx ON profile_tokens(lower(creator_wallet));`);
  await dbPool.query(`CREATE INDEX IF NOT EXISTS token_market_data_token_idx ON token_market_data(token_id);`);
}
