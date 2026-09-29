// Profile Token types
export interface ProfileToken {
  id: string;
  address: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  creator: {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl: string;
  };
  maxSupply: number;
  creatorFeePercentage: number;
  createdAt: string;
  marketCap: number;
  volume24h: number;
  price: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  holders: number;
  isVerified: boolean;
}

export interface TokenMarketData {
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  high24h: number;
  low24h: number;
  lastUpdated: string;
}

export interface TokenChartData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TokenHolder {
  address: string;
  balance: string;
  percentage: number;
  isCreator: boolean;
}

export interface TokenTransaction {
  id: string;
  tokenAddress: string;
  type: "buy" | "sell";
  amount: string;
  price: string;
  totalValue: string;
  userAddress: string;
  timestamp: string;
  txHash: string;
}

export interface CreatorReward {
  tokenId: string; // Added tokenId for contract calls
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  totalFees: string;
  claimableFees: string;
  lastClaimed: string;
  nextClaimAvailable: string;
  // Added for real rewards API
  clankerRewards?: number;
  creatorRewards?: number;
  interfaceRewards?: number;
  totalRewards?: number;
  creatorRewardsUSD?: number;
  interfaceRewardsUSD?: number;
  totalRewardsUSD?: number;
  ethPrice?: number;
}

export interface TokenDeployForm {
  name: string;
  symbol: string;
  description: string;
  image: string;
  maxSupply: number;
  creatorFeePercentage: number;
}

// Clanker v4.0.0 Types
export interface ClankerTokenV4 {
  name: string;
  symbol: string;
  tokenAdmin: string;
  image?: string;
  metadata?: {
    description?: string;
    socialMediaUrls?: string[];
    auditUrls?: string[];
  };
  context?: {
    interface: string;
    platform: string;
    messageId: string;
    id: string;
  };
  pool?: {
    pairedToken: string;
    tickIfToken0IsClanker: number;
    positions: Array<{
      tickLower: number;
      tickUpper: number;
      positionBps: number;
    }>;
  };
  fees?: {
    type: "static" | "dynamic";
    clankerFee: number;
    pairedFee: number;
  };
  rewards?: {
    recipients: Array<{
      recipient: string;
      admin: string;
      bps: number;
      token: "Both" | "Paired" | "Clanker";
    }>;
  };
  vault?: {
    percentage: number;
    lockupDuration: number;
    vestingDuration: number;
    recipient?: string;
  };
  devBuy?: {
    ethAmount: number;
    poolKey?: {
      currency0: string;
      currency1: string;
      fee: number;
      tickSpacing: number;
      hooks: string;
    };
    amountOutMin?: number;
  };
}

export interface ClankerDeployResult {
  txHash: string;
  waitForTransaction: () => Promise<{ address: string; error?: any }>;
  error?: any;
}

export interface TokenTradeForm {
  tokenAddress: string;
  amount: string;
  type: "buy" | "sell";
}

// Market categories
export type MarketCategory = 
  | "trending"
  | "new-tokens";

// Sort options
export type SortOption = 
  | "market-cap-desc"
  | "market-cap-asc"
  | "volume-desc"
  | "volume-asc"
  | "price-desc"
  | "price-asc";

// Filter options
export interface TokenFilters {
  category: MarketCategory;
  sort: SortOption;
  search: string;
  minMarketCap?: number;
  maxMarketCap?: number;
  minVolume?: number;
  maxVolume?: number;
  verifiedOnly?: boolean;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

// User profile types
export interface UserProfile {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio?: string;
  createdAt: string;
  tokensCreated: ProfileToken[];
  totalTokensCreated: number;
  totalMarketCap: number;
  totalVolume24h: number;
  creatorRewards: CreatorReward[];
  totalClaimableRewards: string;
  isVerified: boolean;
}

// Market overview types
export interface MarketOverview {
  totalTokens: number;
  totalMarketCap: number;
  totalVolume24h: number;
  marketCapChange24h: number;
  volumeChange24h: number;
  topGainers: ProfileToken[];
  topLosers: ProfileToken[];
  newTokens: ProfileToken[];
  trendingTokens: ProfileToken[];
}

// Podium types
export interface PodiumToken {
  rank: 1 | 2 | 3;
  token: ProfileToken;
  marketCap: number;
  change24h: number;
}
