"use client";

import { toast } from "sonner";

/** Clanker LP claim removed. Jackpad uses Pons on Robinhood. */
export function useClaimRewards() {
  return {
    isPending: false,
    claimRewards: async (_tokenId?: string) => {
      toast.message("Creator fees are claimed via Pons after graduation.");
      return null;
    },
  };
}
