"use client";

import { useAccount } from "wagmi";

/** Wallet-based profile stub (replaces Farcaster profile hook). */
export function useProfile() {
  const { address, isConnected } = useAccount();
  return {
    profile: {
      fid: undefined as number | undefined,
      username: address ? `${address.slice(0, 6)}…${address.slice(-4)}` : undefined,
      displayName: undefined as string | undefined,
      pfpUrl: undefined as string | undefined,
    },
    isSDKLoaded: true,
    isConnected,
    address,
    viewProfile: async () => {},
    viewCurrentOrSpecificProfile: () => {},
  };
}
