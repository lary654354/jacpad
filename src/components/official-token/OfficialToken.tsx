"use client";

import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  OFFICIAL_TOKEN_CA,
  PONS_LAUNCHPAD_URL,
  ROBINHOOD_EXPLORER_URL,
} from "~/lib/constants";

interface OfficialTokenProps {
  onOpen?: (address: string) => void;
}

export default function OfficialToken({ onOpen }: OfficialTokenProps) {
  const [price, setPrice] = useState(0);
  const [change, setChange] = useState(0);
  const [name, setName] = useState("Jackpad");
  const [symbol, setSymbol] = useState("JACK");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/token/market?address=${OFFICIAL_TOKEN_CA}`);
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled || !json?.success) return;
        setPrice(Number(json.data?.price) || 0);
        setChange(Number(json.data?.priceChangePercentage24h) || 0);
        if (json.data?.baseToken?.name) setName(json.data.baseToken.name);
        if (json.data?.baseToken?.symbol) setSymbol(json.data.baseToken.symbol);
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const up = change >= 0;

  return (
    <div className="jac-panel mx-auto max-w-md p-4 space-y-3">
      <button
        type="button"
        className="flex w-full items-center gap-3 text-left"
        onClick={() => onOpen?.(OFFICIAL_TOKEN_CA)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt={name}
          className="h-12 w-12 rounded-full object-cover ring-1 ring-jac-green/30"
        />
        <div className="min-w-0">
          <p className="font-semibold truncate">{name}</p>
          <p className="text-sm text-jac-green font-mono">{symbol}</p>
          <p className="text-xs text-zinc-500">Official</p>
        </div>
      </button>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-zinc-500">Price</span>
          <p className="font-mono">${price.toFixed(6)}</p>
        </div>
        <div>
          <span className="text-zinc-500">24h</span>
          <p className={`font-mono flex items-center gap-1 ${up ? "text-jac-green" : "text-red-400"}`}>
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {up ? "+" : ""}
            {change.toFixed(2)}%
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 bg-jac-green/15 text-jac-green hover:bg-jac-green/25 border border-jac-green/30"
          onClick={() => window.open(`${ROBINHOOD_EXPLORER_URL}/token/${OFFICIAL_TOKEN_CA}`, "_blank")}
        >
          Explorer
        </Button>
        <Button
          size="sm"
          className="flex-1 bg-jac-green text-black hover:bg-jac-green/90"
          onClick={() => window.open(PONS_LAUNCHPAD_URL, "_blank")}
        >
          Trade on Pons
        </Button>
      </div>
    </div>
  );
}
