"use client";

import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Button } from "~/components/ui/button";
import { PONS_LAUNCHPAD_URL, ROBINHOOD_EXPLORER_URL } from "~/lib/constants";

type TokenRow = {
  id: string;
  address: string;
  name: string;
  symbol: string;
  image?: string;
  image_url?: string;
  twitter_handle?: string;
  price?: number;
  marketCap?: number;
  volume24h?: number;
  priceChangePercentage24h?: number;
};

export default function UserProfile() {
  const { address, isConnected } = useAccount();
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setTokens([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tokens?creator_wallet=${address}`);
        const json = res.ok ? await res.json() : { tokens: [] };
        const list: TokenRow[] = Array.isArray(json) ? json : json.tokens || [];
        if (!cancelled) setTokens(list);
      } catch {
        if (!cancelled) setTokens([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address]);

  if (!isConnected || !address) {
    return (
      <div className="jac-panel mx-auto max-w-md p-8 text-center space-y-3">
        <Wallet className="mx-auto h-10 w-10 text-jac-green" />
        <h2 className="text-xl font-semibold">Connect wallet</h2>
        <p className="text-sm text-zinc-400">Your launched Jackpad tokens show up here.</p>
      </div>
    );
  }

  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;

  return (
    <div className="space-y-6">
      <div className="jac-panel p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-jac-green/80">Wallet</p>
          <p className="font-mono text-lg text-white">{short}</p>
        </div>
        <a
          href={`${ROBINHOOD_EXPLORER_URL}/address/${address}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-jac-green hover:underline"
        >
          View on explorer
        </a>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-zinc-400">Your tokens</h3>
        {loading ? (
          <p className="text-zinc-500">Loading…</p>
        ) : tokens.length === 0 ? (
          <div className="jac-panel p-6 text-center text-zinc-400 text-sm">
            No tokens yet. Launch one from an X handle.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {tokens.map((t) => {
              const change = Number(t.priceChangePercentage24h) || 0;
              const img = t.image || t.image_url || "/logo.png";
              return (
                <div key={t.id || t.address} className="jac-panel p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={t.name} className="h-12 w-12 rounded-full object-cover ring-1 ring-jac-green/30" />
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{t.name}</p>
                      <p className="text-sm text-jac-green font-mono">{t.symbol}</p>
                      {t.twitter_handle && (
                        <a
                          href={`https://x.com/${t.twitter_handle}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-zinc-400 hover:text-jac-green"
                        >
                          @{t.twitter_handle}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-500">Price</span>
                      <p className="font-mono">${(Number(t.price) || 0).toFixed(6)}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">24h</span>
                      <p className={`font-mono flex items-center gap-1 ${change >= 0 ? "text-jac-green" : "text-red-400"}`}>
                        {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {change >= 0 ? "+" : ""}
                        {change.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-jac-green/15 text-jac-green hover:bg-jac-green/25 border border-jac-green/30"
                      onClick={() => window.open(`${ROBINHOOD_EXPLORER_URL}/token/${t.address}`, "_blank")}
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}
