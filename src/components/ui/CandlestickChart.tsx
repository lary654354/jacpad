"use client";

import React, { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData } from "lightweight-charts";
import { RefreshCw } from "lucide-react";

interface CandlestickChartProps {
  tokenAddress: string;
  days?: number;
  onRefresh?: () => void;
}

interface CandlestickDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export default function CandlestickChart({ tokenAddress, days = 7, onRefresh }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>("");

  const loadChartData = async () => {
    if (!tokenAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/token/candlestick?address=${tokenAddress}&days=${days}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const candles: CandlestickData[] = data.data.map((item: CandlestickDataPoint) => ({
          time: item.time,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        }));
        
        if (seriesRef.current) {
          seriesRef.current.setData(candles);
        }
        
        setDataSource(data.source);
        console.log(`Candlestick data loaded from ${data.source}:`, candles.length, 'candles');
      } else {
        setError(data.message || "No candlestick data available");
        setDataSource("none");
      }
    } catch (err) {
      console.error("Failed to load candlestick data:", err);
      setError("Failed to load chart data");
      setDataSource("none");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { type: ColorType.Solid, color: "#0E1117" },
        textColor: "#DDD",
      },
      grid: {
        vertLines: { color: "#222" },
        horzLines: { color: "#222" },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: "#333",
      },
      timeScale: {
        borderColor: "#333",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderDownColor: "#ef5350",
      borderUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      wickUpColor: "#26a69a",
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Load initial data
    loadChartData();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [tokenAddress, days]);

  const handleRefresh = () => {
    loadChartData();
    if (onRefresh) {
      onRefresh();
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-crypto-dark-300">Loading chart data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-crypto-dark-300">
        <div className="text-4xl mb-2">📈</div>
        <div className="text-center">
          <div className="font-medium mb-1">No Chart Data Available</div>
          <div className="text-sm text-crypto-dark-400 mb-4">{error}</div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-neon-green-500 hover:bg-neon-green-600 text-black rounded-md text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={handleRefresh}
          className="p-2 bg-crypto-dark-700 hover:bg-crypto-dark-600 rounded-md border border-crypto-dark-500"
          title="Refresh Chart"
        >
          <RefreshCw className="w-4 h-4 text-neon-green-400" />
        </button>
      </div>
      
      <div ref={chartContainerRef} className="w-full h-64" />
      
      {dataSource && dataSource !== "none" && (
        <div className="mt-2 text-xs text-crypto-dark-400 text-center">
          📊 Data from {dataSource === "coingecko" ? "CoinGecko" : dataSource === "dexscreener" ? "DexScreener" : dataSource}
        </div>
      )}
    </div>
  );
}
