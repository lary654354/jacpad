"use client";

import React, { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  useAccount,
  useConnect,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
  useWriteContract,
} from "wagmi";
import { waitForTransactionReceipt, decodeEventLog } from "viem";
import { Rocket, Search, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  PONS_DEFAULT_LAUNCH_CONFIG_ID,
  PONS_V2_FACTORY,
  ROBINHOOD_CHAIN_ID,
} from "~/lib/constants";
import { PONS_V2_FACTORY_ABI, normalizeHandle, randomSalt } from "~/lib/pons";
import { zeroAddress } from "viem";

interface XProfile {
  username: string;
  name: string;
  bio: string;
  avatarUrl: string;
}

interface CreateProfileTokenProps {
  onTokenCreated?: (tokenAddress: string) => void;
}

export default function CreateProfileToken({ onTokenCreated }: CreateProfileTokenProps) {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending: connecting } = useConnect();
  const { switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [handleInput, setHandleInput] = useState("");
  const [profile, setProfile] = useState<XProfile | null>(null);
  const [fetching, setFetching] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [creatorTaxBps, setCreatorTaxBps] = useState(250);

  const fetchProfile = async () => {
    const handle = normalizeHandle(handleInput);
    if (!handle) {
      toast.error("Enter an X handle");
      return;
    }
    setFetching(true);
    setProfile(null);
    try {
      const res = await fetch(`/api/x/profile?handle=${encodeURIComponent(handle)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed");
      setProfile(data.profile);
      toast.success(`Loaded @${data.profile.username}`);
    } catch (e: any) {
      toast.error(e?.message || "Could not load X profile");
    } finally {
      setFetching(false);
    }
  };

  const ensureWallet = async () => {
    if (!isConnected) {
      const injected = connectors.find((c) => c.id === "injected") || connectors[0];
      if (!injected) throw new Error("No wallet connector");
      connect({ connector: injected });
      throw new Error("Connect your wallet, then launch again");
    }
    if (chainId !== ROBINHOOD_CHAIN_ID) {
      await switchChainAsync({ chainId: ROBINHOOD_CHAIN_ID });
    }
  };

  const handleLaunch = async () => {
    if (!profile) {
      toast.error("Fetch an X profile first");
      return;
    }
    setLaunching(true);
    const loadingId = toast.loading("Launching on Pons v2…");
    try {
      await ensureWallet();
      if (!address || !walletClient || !publicClient) {
        throw new Error("Wallet not ready");
      }

      const canLaunch = await publicClient.readContract({
        address: PONS_V2_FACTORY,
        abi: PONS_V2_FACTORY_ABI,
        functionName: "canLaunch",
        args: [address],
      });
      if (!canLaunch) {
        throw new Error("This wallet cannot launch on Pons right now");
      }

      const launchFee = await publicClient.readContract({
        address: PONS_V2_FACTORY,
        abi: PONS_V2_FACTORY_ABI,
        functionName: "launchFee",
      });

      const pairToken = zeroAddress;
      const launchConfigId = BigInt(PONS_DEFAULT_LAUNCH_CONFIG_ID);
      const expectedEconomics = await publicClient.readContract({
        address: PONS_V2_FACTORY,
        abi: PONS_V2_FACTORY_ABI,
        functionName: "previewLaunchEconomics",
        args: [launchConfigId, pairToken],
      });

      const symbol = profile.username.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "JAC";
      const description =
        profile.bio?.trim() ||
        `Official Jacpad token for @${profile.username} on Robinhood Chain.`;

      const params = {
        name: profile.name.slice(0, 64),
        symbol,
        logo: profile.avatarUrl || "",
        description: description.slice(0, 500),
        socials: {
          twitter: `https://x.com/${profile.username}`,
          telegram: "",
          discord: "",
          website: "",
          farcaster: "",
        },
        creatorFeeRecipient: address,
        creatorTaxBps: creatorTaxBps,
        buybackEnabled: false,
        expectedEconomics,
        salt: randomSalt(),
      };

      const hash = await writeContractAsync({
        address: PONS_V2_FACTORY,
        abi: PONS_V2_FACTORY_ABI,
        functionName: "launchToken",
        args: [params, launchConfigId, pairToken],
        value: launchFee,
        chainId: ROBINHOOD_CHAIN_ID,
      });

      toast.loading("Waiting for confirmation…", { id: loadingId });
      const receipt = await waitForTransactionReceipt(publicClient, { hash });

      let tokenAddress: `0x${string}` | undefined;
      let curveAddress: `0x${string}` | undefined;
      for (const log of receipt.logs) {
        try {
          if (log.address.toLowerCase() !== PONS_V2_FACTORY.toLowerCase()) continue;
          const decoded = decodeEventLog({
            abi: PONS_V2_FACTORY_ABI,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "TokenLaunched") {
            const args = decoded.args as { token: `0x${string}`; curve: `0x${string}` };
            tokenAddress = args.token;
            curveAddress = args.curve;
            break;
          }
        } catch {
          /* not our event */
        }
      }

      if (!tokenAddress) {
        throw new Error("Launch succeeded but token address not found in logs");
      }

      const persist = await fetch("/api/token/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenAddress,
          curveAddress,
          launchTx: hash,
          name: params.name,
          symbol: params.symbol,
          description: params.description,
          imageUrl: params.logo,
          twitterHandle: profile.username,
          walletAddress: address,
          creatorTaxBps,
        }),
      });
      const persistJson = await persist.json();
      if (!persist.ok) {
        toast.warning(`On-chain OK, DB save failed: ${persistJson.error || "unknown"}`, {
          id: loadingId,
        });
      } else {
        toast.success(`Launched @${profile.username}`, { id: loadingId });
      }

      onTokenCreated?.(tokenAddress);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.shortMessage || e?.message || "Launch failed", { id: loadingId });
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="jac-panel w-full max-w-lg mx-auto space-y-6 p-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          Launch from X
        </h2>
        <p className="text-sm text-zinc-400">
          Enter a handle — we pull name, bio, and avatar into your Pons v2 token on Robinhood Chain.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="x-handle" className="text-zinc-300">
          X handle
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-jac-green/80">@</span>
            <Input
              id="x-handle"
              value={handleInput}
              onChange={(e) => setHandleInput(e.target.value)}
              placeholder="username"
              className="pl-8 bg-black/60 border-zinc-800 text-white focus-visible:ring-jac-green"
              onKeyDown={(e) => e.key === "Enter" && fetchProfile()}
            />
          </div>
          <Button
            type="button"
            onClick={fetchProfile}
            disabled={fetching}
            className="bg-jac-green text-black hover:bg-jac-green/90 font-medium"
          >
            {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {profile && (
        <div className="flex gap-4 rounded-xl border border-jac-green/20 bg-black/50 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.avatarUrl || "/logo.png"}
            alt={profile.username}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-jac-green/40"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white truncate">{profile.name}</p>
            <p className="text-sm text-jac-green">@{profile.username}</p>
            <p className="mt-1 text-xs text-zinc-400 line-clamp-3">{profile.bio || "No bio"}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-zinc-300">Creator tax (bps)</Label>
        <Input
          type="number"
          min={0}
          max={1000}
          value={creatorTaxBps}
          onChange={(e) => setCreatorTaxBps(Number(e.target.value) || 0)}
          className="bg-black/60 border-zinc-800 text-white"
        />
        <p className="text-xs text-zinc-500">250 = 2.5%. Capped by Pons maxCreatorTaxBps.</p>
      </div>

      {!isConnected ? (
        <Button
          className="w-full bg-jac-green text-black hover:bg-jac-green/90 font-semibold h-11"
          disabled={connecting}
          onClick={() => {
            const c = connectors.find((x) => x.id === "injected") || connectors[0];
            if (c) connect({ connector: c });
          }}
        >
          <Wallet className="mr-2 h-4 w-4" />
          Connect wallet
        </Button>
      ) : (
        <Button
          className="w-full bg-jac-green text-black hover:bg-jac-green/90 font-semibold h-11 shadow-neon-green"
          disabled={!profile || launching}
          onClick={handleLaunch}
        >
          {launching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Rocket className="mr-2 h-4 w-4" />
          )}
          Launch on Pons v2
        </Button>
      )}
    </div>
  );
}
