import axios from "axios";
import { COINGECKO_API_URL, COINGECKO_API_KEY } from "./constants";

// CoinGecko API types
export interface CoinGeckoToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

export interface CoinGeckoMarketData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface CoinGeckoChartData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// CoinGecko API client
export class CoinGeckoAPI {
  private baseURL: string;
  private apiKey: string | undefined;

  constructor(baseURL: string, apiKey?: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      params: {
        ...params,
        ...(this.apiKey && { x_cg_demo_api_key: this.apiKey }),
      },
    };

    try {
      const response = await axios.get<T>(url, config);
      return response.data;
    } catch (error) {
      console.error("CoinGecko API error:", error);
      throw error;
    }
  }

  // Get trending tokens
  async getTrendingTokens(): Promise<CoinGeckoToken[]> {
    const data = await this.makeRequest<{ coins: any[] }>("/search/trending");
    return data.coins.map((coin: any) => coin.item);
  }

  // Get top tokens by market cap
  async getTopTokensByMarketCap(limit: number = 100): Promise<CoinGeckoToken[]> {
    return this.makeRequest<CoinGeckoToken[]>(`/coins/markets`, {
      vs_currency: "usd",
      order: "market_cap_desc",
      per_page: limit,
      page: 1,
      sparkline: false,
    });
  }

  // Get top tokens by volume
  async getTopTokensByVolume(limit: number = 100): Promise<CoinGeckoToken[]> {
    return this.makeRequest<CoinGeckoToken[]>(`/coins/markets`, {
      vs_currency: "usd",
      order: "volume_desc",
      per_page: limit,
      page: 1,
      sparkline: false,
    });
  }

  // Get token by ID
  async getTokenById(id: string): Promise<CoinGeckoToken> {
    const data = await this.makeRequest<CoinGeckoToken[]>(`/coins/markets`, {
      vs_currency: "usd",
      ids: id,
      order: "market_cap_desc",
      per_page: 1,
      page: 1,
      sparkline: false,
    });
    return data[0];
  }

  // Get token price history
  async getTokenPriceHistory(
    id: string,
    days: number = 7,
    interval: "hourly" | "daily" = "daily"
  ): Promise<CoinGeckoMarketData> {
    return this.makeRequest<CoinGeckoMarketData>(`/coins/${id}/market_chart`, {
      vs_currency: "usd",
      days,
      interval: interval === "hourly" ? "hourly" : undefined,
    });
  }

  // Convert price history to candlestick format
  convertToCandlestick(data: CoinGeckoMarketData): CoinGeckoChartData[] {
    const { prices, market_caps, total_volumes } = data;
    
    return prices.map(([timestamp, price], index) => {
      const volume = total_volumes[index]?.[1] || 0;
      
      // For simplicity, we'll use the same price for OHLC
      // In a real implementation, you'd need to calculate proper OHLC from tick data
      return {
        timestamp,
        open: price,
        high: price * 1.02, // Mock high
        low: price * 0.98,   // Mock low
        close: price,
        volume,
      };
    });
  }

  // Get token search results
  async searchTokens(query: string): Promise<CoinGeckoToken[]> {
    const data = await this.makeRequest<{ coins: any[] }>("/search", {
      query,
    });
    return data.coins.map((coin: any) => coin.item);
  }

  // Get global market data
  async getGlobalMarketData(): Promise<{
    total_market_cap: { usd: number };
    total_volume: { usd: number };
    active_cryptocurrencies: number;
  }> {
    return this.makeRequest("/global");
  }

  // Get simple price for multiple tokens
  async getSimplePrice(ids: string[], vsCurrencies: string[] = ["usd"]): Promise<Record<string, Record<string, number>>> {
    return this.makeRequest("/simple/price", {
      ids: ids.join(","),
      vs_currencies: vsCurrencies.join(","),
    });
  }

  // Get token info by contract address (for Base tokens)
  async getTokenByContractAddress(contractAddress: string, platform: string = "base"): Promise<CoinGeckoToken | null> {
    try {
      const data = await this.makeRequest<{ id: string }>(`/coins/${platform}/contract/${contractAddress}`);
      return this.getTokenById(data.id);
    } catch (error) {
      console.error("Token not found on CoinGecko:", error);
      return null;
    }
  }
}

// Export singleton instance
export const coinGeckoAPI = new CoinGeckoAPI(COINGECKO_API_URL, COINGECKO_API_KEY);
