"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ProfileToken } from "~/lib/token-types";
import { Search, TrendingDown, TrendingUp } from "lucide-react";
import { Input } from "~/components/ui/input";

interface Props {
  onTokenSelect?: (id: string) => void;
}

export default function TokenMarketOverview({ onTokenSelect }: Props) {
  const [tokens, setTokens] = useState<ProfileToken[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/tokens");
        const data = response.ok ? await response.json() : { tokens: [] };
        const apiTokens: ProfileToken[] = Array.isArray(data) ? data : data?.tokens ?? [];
        if (!cancelled) setTokens(apiTokens);
      } catch {
        if (!cancelled) setTokens([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...tokens];
    if (q) {
      list = list.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.symbol?.toLowerCase().includes(q) ||
          t.creator?.username?.toLowerCase().includes(q) ||
          (t as any).twitter_handle?.toLowerCase().includes(q)
      );
    }
    return list.sort(
      (a, b) => (b.priceChangePercentage24h || 0) - (a.priceChangePercentage24h || 0)
    );
  }, [tokens, search]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-jac-green border-t-transparent" />
        <p className="text-sm text-zinc-400">Loading market…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Jacpad" className="mx-auto h-16 w-16 object-contain drop-shadow-[0_0_20px_rgba(57,255,20,0.45)]" />
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-jac-green">
          Jacpad
        </h1>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          X profile tokens on Robinhood Chain — powered by Pons v2.
        </p>
      </div>

      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, ticker, @handle…"
          className="pl-10 bg-zinc-950 border-zinc-800 text-white focus-visible:ring-jac-green"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="jac-panel p-10 text-center text-zinc-500 text-sm">
          No tokens yet. Be the first to launch from an X handle.
        </div>
      ) : (
        <div className="jac-panel overflow-hidden divide-y divide-zinc-900">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[11px] uppercase tracking-wider text-zinc-500">
            <div className="col-span-1">#</div>
            <div className="col-span-6">Token</div>
            <div className="col-span-3 text-right">MC</div>
            <div className="col-span-2 text-right">24h</div>
          </div>
          {filtered.map((token, i) => {
            const change = Number(token.priceChangePercentage24h) || 0;
            const up = change >= 0;
            const img = token.image || token.creator?.pfpUrl || "/logo.png";
            const mc = Number(token.marketCap) || 0;
            return (
              <button
                key={token.id || token.address}
                type="button"
                onClick={() => onTokenSelect?.(token.address || token.id)}
                className="w-full grid grid-cols-12 gap-2 items-center px-4 py-3 text-left hover:bg-jac-green/5 transition"
              >
                <div className="col-span-1 text-xs text-zinc-500 font-mono">{i + 1}</div>
                <div className="col-span-6 flex items-center gap-3 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-zinc-800" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{token.name}</p>
                    <p className="truncate text-xs text-jac-green font-mono">{token.symbol}</p>
                  </div>
                </div>
                <div className="col-span-3 text-right font-mono text-xs sm:text-sm">
                  ${mc >= 1_000_000 ? `${(mc / 1_000_000).toFixed(2)}M` : mc.toLocaleString()}
                </div>
                <div className={`col-span-2 text-right font-mono text-xs sm:text-sm flex items-center justify-end gap-1 ${up ? "text-jac-green" : "text-red-400"}`}>
                  {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {up ? "+" : ""}
                  {change.toFixed(2)}%
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
