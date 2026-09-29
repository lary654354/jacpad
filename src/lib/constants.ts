export const PROJECT_TITLE = "Jacpad";
export const PROJECT_DESCRIPTION =
  "Launch X profile tokens on Robinhood Chain with Pons v2";
export const PROJECT_CREATOR = "Jacpad";
export const PROJECT_AVATAR_URL = "/logo.png";

// Robinhood Chain mainnet
export const ROBINHOOD_CHAIN_ID = 4663;
export const ROBINHOOD_RPC_URL =
  process.env.NEXT_PUBLIC_ROBINHOOD_RPC ||
  "https://rpc.mainnet.chain.robinhood.com";
export const ROBINHOOD_EXPLORER_URL = "https://robinhoodchain.blockscout.com";

// Pons v2 (Robinhood Chain)
export const PONS_V2_FACTORY =
  (process.env.NEXT_PUBLIC_PONS_FACTORY as `0x${string}`) ||
  "0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e";
export const PONS_LAUNCHPAD_URL = "https://www.ponsfamily.com/launchpad";
export const PONS_DEFAULT_LAUNCH_CONFIG_ID = Number(
  process.env.NEXT_PUBLIC_PONS_LAUNCH_CONFIG_ID || "0"
);

// Legacy aliases kept so old imports still resolve during migration
export const BASE_CHAIN_ID = ROBINHOOD_CHAIN_ID;
export const BASE_RPC_URL = ROBINHOOD_RPC_URL;
