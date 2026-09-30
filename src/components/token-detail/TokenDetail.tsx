"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { ProfileToken, TokenChartData, TokenHolder } from "~/lib/token-types";
import { TrendingUp, TrendingDown, Star, Users, Activity, ExternalLink, RefreshCw } from "lucide-react";
import { coinGeckoAPI } from "~/lib/coingecko";
import { toast } from "sonner";
import { PONS_LAUNCHPAD_URL, OFFICIAL_TOKEN_CA } from "~/lib/constants";

// No mock chart data in production

// Holders to be fetched later from chain/subgraph (placeholder empty)

// Creator rewards handled on profile page

// Helper function to format small prices
const formatSmallPrice = (price: number): string => {
  if (price === 0) return "0.000000";
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  if (price >= 0.001) return price.toFixed(5);
  if (price >= 0.0001) return price.toFixed(6);
  if (price >= 0.00001) return price.toFixed(7);
  if (price >= 0.000001) return price.toFixed(8);
  if (price >= 0.0000001) return price.toFixed(9);
  if (price >= 0.00000001) return price.toFixed(10);
  return price.toFixed(12);
};

// Simple candlestick chart component
const CandlestickChart: React.FC<{ data: TokenChartData[] }> = ({ data }) => {
  console.log("CandlestickChart received data:", data);
  
  if (!data || data.length === 0) {
    console.log("No chart data - showing empty state");
    return (
      <div className="w-full h-64 bg-crypto-dark-800/50 rounded-lg p-4 flex items-center justify-center">
        <div className="text-crypto-dark-300 text-center">
          <div className="text-2xl mb-2">📈</div>
          <div>No chart data available</div>
        </div>
      </div>
    );
  }

  const maxPrice = Math.max(...data.map(d => d.high));
  const minPrice = Math.min(...data.map(d => d.low));
  const priceRange = maxPrice - minPrice;

  console.log("Chart data:", data.length, "candles, price range:", minPrice, "to", maxPrice);
  console.log("Sample candle data:", data[0]);

  // Handle very small price ranges - use percentage-based scaling
  const adjustedPriceRange = priceRange > 0 ? priceRange : maxPrice * 0.2; // Use 20% of max price as range
  const adjustedMinPrice = priceRange > 0 ? minPrice : maxPrice * 0.8; // Start from 80% of max price

  console.log("Adjusted price range:", adjustedMinPrice, "to", maxPrice, "range:", adjustedPriceRange);
  console.log("Price formatting:", {
    minPrice: formatSmallPrice(minPrice),
    maxPrice: formatSmallPrice(maxPrice),
    priceRange: formatSmallPrice(priceRange),
    adjustedRange: formatSmallPrice(adjustedPriceRange)
  });

  return (
    <div className="w-full h-64 bg-crypto-dark-800/50 rounded-lg p-4">
      {/* Price Labels */}
      <div className="flex justify-between text-xs text-crypto-dark-400 mb-2">
        <span>${formatSmallPrice(maxPrice)}</span>
        <span>${formatSmallPrice(adjustedMinPrice)}</span>
      </div>
      
      {/* Debug info */}
      <div className="text-xs text-crypto-dark-500 mb-1">
        Chart: {data.length} candles, Range: {formatSmallPrice(adjustedPriceRange)}
      </div>
      
      <div className="h-full flex items-end justify-between gap-1 border border-crypto-dark-600 rounded">
        {data.map((candle, index) => {
          // Ensure candle values are numbers
          const open = typeof candle.open === 'string' ? parseFloat(candle.open) : candle.open;
          const high = typeof candle.high === 'string' ? parseFloat(candle.high) : candle.high;
          const low = typeof candle.low === 'string' ? parseFloat(candle.low) : candle.low;
          const close = typeof candle.close === 'string' ? parseFloat(candle.close) : candle.close;
          
          const height = adjustedPriceRange > 0 ? ((high - adjustedMinPrice) / adjustedPriceRange) * 100 : 50;
          const bodyHeight = adjustedPriceRange > 0 ? ((Math.abs(close - open)) / adjustedPriceRange) * 100 : 2;
          const isGreen = close >= open;
          
          // Clamp height values to reasonable range
          const clampedHeight = Math.min(Math.max(height, 1), 100);
          const clampedBodyHeight = Math.min(Math.max(bodyHeight, 1), 100);
          
          console.log(`Candle ${index}:`, { 
            open: formatSmallPrice(open), 
            high: formatSmallPrice(high), 
            low: formatSmallPrice(low), 
            close: formatSmallPrice(close),
            height: height,
            clampedHeight: clampedHeight,
            bodyHeight: bodyHeight,
            clampedBodyHeight: clampedBodyHeight,
            isGreen 
          });
          
          return (
            <div key={index} className="flex flex-col items-center flex-1 min-h-0">
              {/* Wick */}
              <div 
                className={`w-1 ${isGreen ? 'bg-neon-green-500' : 'bg-neon-red-500'} rounded-full`}
                style={{ 
                  height: `${clampedHeight}%`,
                  minHeight: '2px',
                  maxHeight: '100%'
                }}
              />
              {/* Body */}
              <div 
                className={`w-full ${isGreen ? 'bg-neon-green-500' : 'bg-neon-red-500'} rounded-sm`}
                style={{ 
                  height: `${clampedBodyHeight}%`,
                  minHeight: '2px',
                  maxHeight: '100%'
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Simple buy button component
const BuyButton: React.FC<{ token: ProfileToken; onBuy: () => void }> = ({ token, onBuy }) => {
  return (
    <Card className="bg-crypto-dark-800/50 backdrop-blur-sm border-crypto-dark-600">
      <CardHeader>
        <CardTitle className="text-white">Trade {token.symbol}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-crypto-dark-300 text-sm mb-4">
            Trade {token.symbol} on Clanker
          </p>
          <Button
            onClick={onBuy}
            className="w-full bg-neon-green-500 hover:bg-neon-green-600 text-black font-semibold py-3"
          >
            Buy {token.symbol}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Token detail component
export default function TokenDetail({
  tokenId,
  onBack,
}: {
  tokenId: string;
  onBack?: () => void;
}) {
  const [token, setToken] = useState<ProfileToken | null>(null);
  const [chartData, setChartData] = useState<TokenChartData[]>([]);
  const [holders, setHolders] = useState<TokenHolder[]>([]);
  const [holdersLoading, setHoldersLoading] = useState(false);
  const [holdersOffset, setHoldersOffset] = useState(0);
  const [hasMoreHolders, setHasMoreHolders] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState<string>("");
  const [hasMarketData, setHasMarketData] = useState(false);

  useEffect(() => {
    const loadTokenData = async () => {
      setLoading(true);
      try {
        // Fetch token info and market data simultaneously
        const [infoRes, marketRes, holdersRes] = await Promise.all([
          fetch(`/api/token/info?address=${tokenId}`),
          fetch(`/api/token/market?address=${tokenId}&days=7`),
          fetch(`/api/token/holders?address=${tokenId}&limit=5&offset=0`)
        ]);

        // Process token info
        let tokenInfo = null;
        if (infoRes.ok) {
          tokenInfo = await infoRes.json();
        }

        // Process market data
        let marketData = null;
        if (marketRes.ok) {
          marketData = await marketRes.json();
          console.log("Market data response:", marketData);
        } else {
          console.log("Market data request failed:", marketRes.status, marketRes.statusText);
        }

            // Process holders data
            let holdersData = null;
            if (holdersRes.ok) {
              holdersData = await holdersRes.json();
              if (holdersData?.success) {
                setHolders(holdersData.holders);
                setHasMoreHolders(holdersData.hasMore);
                console.log(`Holders data loaded:`, holdersData.holders.length, 'holders');
              }
            }

        // Combine token info with real market data
        if (tokenInfo && marketData?.success) {
          const combinedToken = {
            ...tokenInfo,
            price: marketData.data.price,
            marketCap: marketData.data.marketCap,
            volume24h: marketData.data.volume24h,
            priceChangePercentage24h: marketData.data.priceChangePercentage24h,
            priceChange24h: marketData.data.priceChange24h,
            holders: holdersData?.totalHolders || holdersData?.holders?.length || tokenInfo.holders || 1,
          };
          setToken(combinedToken);
          
          // Set candle chart data immediately
          if (marketData.candles) {
            console.log("Setting chart data:", marketData.candles);
            setChartData(marketData.candles);
            setDataSource(marketData.source);
            setHasMarketData(true);
            console.log(`Real market data loaded from ${marketData.source}:`, marketData.candles.length, 'candles');
          } else {
            console.log("No candles data in market response:", marketData);
          }
        } else if (tokenInfo) {
          // Update token with real holders count even if no market data
          const updatedToken = {
            ...tokenInfo,
            holders: holdersData?.totalHolders || holdersData?.holders?.length || tokenInfo.holders || 1,
          };
          setToken(updatedToken);
          
          // Try CoinGecko fallback for chart data
          try {
            console.log("Trying CoinGecko fallback for initial chart data...");
            const coinGeckoData = await coinGeckoAPI.getTokenByContractAddress(tokenId, "base");
            if (coinGeckoData) {
              const priceHistory = await coinGeckoAPI.getTokenPriceHistory(coinGeckoData.id, 7);
              const candles = coinGeckoAPI.convertToCandlestick(priceHistory);
              
            setChartData(candles);
              setDataSource("coingecko");
              setHasMarketData(true);
              console.log("CoinGecko fallback successful:", candles.length, 'candles');
            } else {
              setChartData([]);
              setDataSource("none");
              setHasMarketData(false);
            }
          } catch (coinGeckoError) {
            console.log("CoinGecko fallback failed:", coinGeckoError);
            setChartData([]);
            setDataSource("none");
            setHasMarketData(false);
          }
        } else if (tokenId.toLowerCase() === OFFICIAL_TOKEN_CA.toLowerCase()) {
          const fallback = {
            id: "official",
            address: OFFICIAL_TOKEN_CA,
            name: marketData?.data?.baseToken?.name || "Jackpad",
            symbol: marketData?.data?.baseToken?.symbol || "JACK",
            description: "Official Jackpad token on Robinhood Chain.",
            image: "/logo.png",
            creator: {
              fid: 0,
              username: "jackpad",
              displayName: "Jackpad",
              pfpUrl: "/logo.png",
            },
            maxSupply: 0,
            creatorFeePercentage: 0,
            createdAt: "",
            price: Number(marketData?.data?.price) || 0,
            marketCap: Number(marketData?.data?.marketCap) || 0,
            volume24h: Number(marketData?.data?.volume24h) || 0,
            priceChange24h: Number(marketData?.data?.priceChange24h) || 0,
            priceChangePercentage24h: Number(marketData?.data?.priceChangePercentage24h) || 0,
            holders: holdersData?.totalHolders || holdersData?.holders?.length || 0,
            isVerified: true,
          };
          setToken(fallback);
          if (marketData?.candles) {
            setChartData(marketData.candles);
            setDataSource(marketData.source || "market");
            setHasMarketData(true);
          }
        } else {
          setToken(null);
        }

        // Set holders data
              if (holdersData?.success) {
                setHolders(holdersData.holders);
                setHasMoreHolders(holdersData.hasMore);
                setHoldersOffset(5); // Next offset
                console.log(`Holders data loaded:`, holdersData.holders.length, 'holders');
        } else {
          setHolders([]);
        }

      } catch (error) {
        console.error("Failed to load token data:", error);
        setToken(null);
        setChartData([]);
        setHolders([]);
        setDataSource("none");
        setHasMarketData(false);
      } finally {
        setLoading(false);
      }
    };

    loadTokenData();
  }, [tokenId]);

  // Function to refresh chart data
  const refreshChartData = async () => {
    if (!tokenId) return;
    
    setRefreshing(true);
    try {
      // Try to get real market data from our API first
      const marketRes = await fetch(`/api/token/market?address=${tokenId}&days=7`);
      if (marketRes.ok) {
        const marketData = await marketRes.json();
        if (marketData.success) {
          // Update token with real market data
          if (token) {
            setToken({
              ...token,
              price: marketData.data.price,
              marketCap: marketData.data.marketCap,
              volume24h: marketData.data.volume24h,
              priceChangePercentage24h: marketData.data.priceChangePercentage24h,
            });
          }
          
          // Set candle chart data
          if (marketData.candles) {
            setChartData(marketData.candles);
            setDataSource(marketData.source);
            setHasMarketData(true);
            toast.success(`Market data refreshed from ${marketData.source}`);
            console.log(`Market data refreshed from ${marketData.source}:`, marketData.candles.length, 'candles');
            return;
          }
        }
      }

      // Fallback to CoinGecko if our API doesn't have data
      console.log("Trying CoinGecko fallback for chart data...");
      try {
        const coinGeckoData = await coinGeckoAPI.getTokenByContractAddress(tokenId, "base");
        if (coinGeckoData) {
          const priceHistory = await coinGeckoAPI.getTokenPriceHistory(coinGeckoData.id, 7);
          const candles = coinGeckoAPI.convertToCandlestick(priceHistory);
          
          setChartData(candles);
          setDataSource("coingecko");
          setHasMarketData(true);
          toast.success("Chart data loaded from CoinGecko");
          console.log("CoinGecko fallback successful:", candles.length, 'candles');
          return;
        }
      } catch (coinGeckoError) {
        console.log("CoinGecko fallback failed:", coinGeckoError);
      }

      // No data available from any source
      toast.error("No market data available");
      setChartData([]);
      setDataSource("none");
      setHasMarketData(false);
      
    } catch (error) {
      console.error("Failed to refresh chart data:", error);
      toast.error("Failed to refresh chart data");
      setChartData([]);
      setDataSource("none");
      setHasMarketData(false);
    } finally {
      setRefreshing(false);
    }
  };

  const handleBuy = async () => {
    if (!token) return;
    window.open(PONS_LAUNCHPAD_URL, "_blank");
  };

  const loadMoreHolders = async () => {
    if (!tokenId || holdersLoading) return;
    
    setHoldersLoading(true);
    try {
      const response = await fetch(`/api/token/holders?address=${tokenId}&limit=5&offset=${holdersOffset}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setHolders(prev => [...prev, ...data.holders]);
          setHoldersOffset(prev => prev + 5);
          setHasMoreHolders(data.hasMore);
        }
      }
    } catch (error) {
      console.error("Failed to load more holders:", error);
    } finally {
      setHoldersLoading(false);
    }
  };

  const handleViewProfile = () => {
    const handle =
      (token as any)?.twitter_handle ||
      (token?.creator as any)?.twitterHandle ||
      token?.creator?.username;
    if (!handle) return;
    const username = String(handle).replace("@", "");
    window.open(`https://x.com/${username}`, "_blank");
  };

  // Creator rewards are handled on the user profile page

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-crypto-dark-900 via-crypto-dark-800 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading token data...</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-crypto-dark-900 via-crypto-dark-800 to-black flex items-center justify-center">
        <div className="text-white text-xl">Token not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-crypto-dark-900 via-crypto-dark-800 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={token.creator.pfpUrl}
              alt={token.creator.displayName}
              className="w-16 h-16 rounded-full border-2 border-neon-green-500"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{token.name}</h1>
                {token.isVerified && <Star className="w-6 h-6 text-neon-green-400 fill-current" />}
              </div>
              <p className="text-neon-green-400 text-sm sm:text-base font-mono">{token.symbol}</p>
            </div>
          </div>

          {/* Compact stats are shown below the chart as one card (moved) */}
        </div>

        {/* Chart and Trade */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="lg:col-span-2 relative">
            {/* Floating View Profile Button - Outside Card */}
            <button
              onClick={handleViewProfile}
              className="absolute -top-10 right-0 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-crypto-dark-700 hover:bg-crypto-dark-600 transition-colors border border-crypto-dark-500 shadow-lg"
              title="View Creator Profile"
            >
              <span className="text-neon-green-400 text-xs font-medium">View Profile</span>
              <ExternalLink className="w-3.5 h-3.5 text-neon-green-400" />
            </button>
            
            <Card className="bg-crypto-dark-800/50 backdrop-blur-sm border-crypto-dark-600">
              <CardHeader className="py-3 sm:py-4">
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Price Chart
                  </div>
                  <Button
                    onClick={refreshChartData}
                    disabled={refreshing}
                    variant="outline"
                    size="sm"
                    className="border-crypto-dark-500 text-crypto-dark-300 hover:bg-crypto-dark-700"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 pb-3 sm:pb-4">
                {chartData.length > 0 ? (
                  <div>
                  <CandlestickChart data={chartData} />
                    {dataSource && dataSource !== "none" && (
                      <div className="mt-2 text-xs text-crypto-dark-400 text-center">
                        📊 Data from {dataSource === "dexscreener" ? "DexScreener" : dataSource === "uniswap-v3" ? "Uniswap V3" : dataSource}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-crypto-dark-300">
                    <div className="text-4xl mb-2">📈</div>
                    <div className="text-center">
                      <div className="font-medium mb-1">No Market Data Available</div>
                      <div className="text-sm text-crypto-dark-400">
                        {dataSource === "none" 
                          ? "This token is not available on DexScreener or Uniswap V3"
                          : "Loading market data..."
                        }
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Single compact stats card under the chart */}
            <Card className="mt-3 sm:mt-4 bg-crypto-dark-800/50 backdrop-blur-sm border-crypto-dark-600">
              <CardContent className="p-2.5 sm:p-3.5">
                {hasMarketData && dataSource && dataSource !== "none" && (
                  <div className="mb-2 text-xs text-crypto-dark-400 text-center">
                    💹 Live {dataSource === "dexscreener" ? "DexScreener" : dataSource === "uniswap-v3" ? "Uniswap V3" : dataSource}
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-[12px] sm:text-sm">
                  <div className="min-w-0">
                    <div className="text-crypto-dark-300">Price</div>
                    <div className="text-white font-mono whitespace-nowrap">${formatSmallPrice(token.price || 0)}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-crypto-dark-300">Market Cap</div>
                    <div className="text-white font-mono whitespace-nowrap">${(token.marketCap / 1_000_000).toFixed(2)}M</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-crypto-dark-300">Volume 24h</div>
                    <div className="text-white font-mono whitespace-nowrap">${(token.volume24h / 1_000).toFixed(1)}K</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-crypto-dark-300">24h Change</div>
                    <div className={`flex items-center gap-1 ${
                      token.priceChangePercentage24h >= 0 ? "text-neon-green-400" : "text-neon-red-400"
                    }`}>
                      {token.priceChangePercentage24h >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span className="font-mono">{token.priceChangePercentage24h >= 0 ? "+" : ""}{token.priceChangePercentage24h.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <BuyButton token={token} onBuy={handleBuy} />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-crypto-dark-800/50 border-crypto-dark-600">
            <TabsTrigger value="about" className="text-crypto-dark-300 data-[state=active]:text-white data-[state=active]:bg-crypto-dark-700">
              About Token
            </TabsTrigger>
            <TabsTrigger value="holders" className="text-crypto-dark-300 data-[state=active]:text-white data-[state=active]:bg-crypto-dark-700">
              Holders
            </TabsTrigger>
            <TabsTrigger value="transactions" className="text-crypto-dark-300 data-[state=active]:text-white data-[state=active]:bg-crypto-dark-700">
              Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-6">
            <Card className="bg-crypto-dark-800/50 backdrop-blur-sm border-crypto-dark-600">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">About {token.name}</h3>
                <p className="text-crypto-dark-300 mb-4">{token.description}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-crypto-dark-300 text-sm">Max Supply</span>
                    <p className="text-white font-mono">{token.maxSupply.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-crypto-dark-300 text-sm">Created</span>
                    <p className="text-white">{new Date(token.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-crypto-dark-300 text-sm">Holders</span>
                    <p className="text-white font-mono">{token.holders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="holders" className="mt-6">
            <Card className="bg-crypto-dark-800/50 backdrop-blur-sm border-crypto-dark-600">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Holders
                </h3>
                <div className="space-y-2">
                  {holders.length > 0 ? (
                    <>
                      {/* Header */}
                      <div className="grid grid-cols-3 gap-4 px-3 py-2 text-xs text-crypto-dark-400 font-medium border-b border-crypto-dark-600">
                        <div>Rank</div>
                        <div>Address</div>
                        <div className="text-right">Balance & %</div>
                      </div>
                      
                      {/* Holders List */}
                  {holders.map((holder, index) => (
                        <div key={index} className="grid grid-cols-3 gap-4 items-center p-3 bg-crypto-dark-700/30 hover:bg-crypto-dark-700/50 rounded-lg transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-neon-green-500/20 text-neon-green-400 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                          </div>
                          <div className="min-w-0">
                            <div className="text-white font-mono text-sm truncate" title={holder.address}>
                              {holder.address.slice(0, 6)}...{holder.address.slice(-4)}
                        </div>
                      </div>
                      <div className="text-right">
                            <div className="text-white font-mono text-sm">{holder.balance}</div>
                            <div className="text-neon-green-400 text-xs font-medium">{holder.percentage}%</div>
                      </div>
                    </div>
                  ))}
                      {hasMoreHolders && (
                        <div className="text-center pt-4">
                          <Button
                            onClick={loadMoreHolders}
                            disabled={holdersLoading}
                            variant="outline"
                            className="border-crypto-dark-500 text-crypto-dark-300 hover:bg-crypto-dark-700"
                          >
                            {holdersLoading ? "Loading..." : "Load More Holders"}
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-crypto-dark-300 text-lg mb-2">No holder data available</div>
                      <div className="text-crypto-dark-400 text-sm">Real holder tracking not implemented yet</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Creator Rewards tab removed (handled in user profile) */}

          <TabsContent value="transactions" className="mt-6">
            <Card className="bg-crypto-dark-800/50 backdrop-blur-sm border-crypto-dark-600">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">Recent Transactions</h3>
                <div className="text-crypto-dark-300 text-center py-8">
                  No transactions yet
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
