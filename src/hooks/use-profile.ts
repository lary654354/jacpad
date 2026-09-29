"use client";

import { useAccount } from "wagmi";

/** Wallet-based profile stub (replaces Farcaster profile hook). */
export function useProfile() {
  const { address, isConnected } = useAccount();
  const username = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : undefined;
  const profile = {
    fid: undefined as number | undefined,
    username,
    displayName: username,
    pfpUrl: undefined as string | undefined,
  };

  return {
    ...profile,
    profile,
    isSDKLoaded: true,
    isConnected,
    address,
    viewProfile: async (_fid?: number) => {},
    viewCurrentOrSpecificProfile: (_fid?: number) => {},
  };
}
