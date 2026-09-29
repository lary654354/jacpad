"use client";

import { createConfig, http, injected, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { robinhood } from "~/lib/robinhood";
import { ROBINHOOD_RPC_URL } from "~/lib/constants";

export const config = createConfig({
  chains: [robinhood],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [robinhood.id]: http(ROBINHOOD_RPC_URL),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
