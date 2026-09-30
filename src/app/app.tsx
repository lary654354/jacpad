"use client";

import React, { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { Toaster, toast } from "sonner";
import TokenMarketOverview from "~/components/token-market/TokenMarketOverview";
import TokenDetail from "~/components/token-detail/TokenDetail";
import CreateProfileToken from "~/components/create-token/CreateProfileToken";
import UserProfile from "~/components/user-profile/UserProfile";
import AboutJacpad from "~/components/about/AboutJacpad";
import { Compass, Home, Rocket, User, Wallet, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { ROBINHOOD_CHAIN_ID } from "~/lib/constants";
import { Button } from "~/components/ui/button";

type Page = "about" | "explore" | "create" | "profile";

export default function App() {
  const { isConnected, address, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();

  const [page, setPage] = useState<Page>("about");
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (!isConnected || chainId === ROBINHOOD_CHAIN_ID) return;
    switchChainAsync({ chainId: ROBINHOOD_CHAIN_ID }).catch(() => {
      toast.error("Switch wallet to Robinhood Chain (4663)");
    });
  }, [isConnected, chainId, switchChainAsync]);

  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";

  const connectWallet = () => {
    const injected = connectors.find((c) => c.id === "injected") || connectors[0];
    if (!injected) {
      toast.error("No wallet found");
      return;
    }
    connect({ connector: injected });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-zinc-900/80 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <button
            type="button"
            className="flex items-center gap-2"
            onClick={() => setPage("about")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Jacpad" className="h-8 w-8 object-contain" />
            <span className="text-lg font-semibold tracking-wide text-jac-green drop-shadow-[0_0_12px_rgba(57,255,20,0.35)]">
              Jacpad
            </span>
          </button>

          <nav className="flex items-center gap-1 sm:gap-2">
            <NavBtn active={page === "about"} onClick={() => setPage("about")} icon={<Home className="h-4 w-4" />} label="Home" />
            <NavBtn active={page === "explore"} onClick={() => setPage("explore")} icon={<Compass className="h-4 w-4" />} label="Explore" />
            <NavBtn active={page === "create"} onClick={() => setPage("create")} icon={<Rocket className="h-4 w-4" />} label="Launch" />
            <NavBtn active={page === "profile"} onClick={() => setPage("profile")} icon={<User className="h-4 w-4" />} label="Profile" />
          </nav>

          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs text-zinc-400 font-mono">{short}</span>
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-900"
                onClick={() => disconnect()}
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="bg-jac-green text-black hover:bg-jac-green/90 font-semibold"
              disabled={isPending}
              onClick={connectWallet}
            >
              <Wallet className="mr-1.5 h-3.5 w-3.5" />
              Connect
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <ErrorBoundary>
          {page === "about" && (
            <AboutJacpad
              onExplore={() => setPage("explore")}
              onLaunch={() => setPage("create")}
            />
          )}
          {page === "explore" && (
            <TokenMarketOverview
              onTokenSelect={(id) => {
                setSelectedTokenId(id);
                setDetailOpen(true);
              }}
            />
          )}
          {page === "create" && (
            <CreateProfileToken
              onTokenCreated={() => {
                setPage("profile");
              }}
            />
          )}
          {page === "profile" && <UserProfile />}
        </ErrorBoundary>
      </main>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-950 text-white">
          <DialogHeader>
            <DialogTitle className="text-jac-green">Token</DialogTitle>
          </DialogHeader>
          {selectedTokenId && (
            <TokenDetail
              tokenId={selectedTokenId}
              onBack={() => setDetailOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Toaster richColors position="top-center" theme="dark" />
    </div>
  );
}

function NavBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition ${
        active
          ? "bg-jac-green/15 text-jac-green"
          : "text-zinc-400 hover:text-white hover:bg-zinc-900"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
