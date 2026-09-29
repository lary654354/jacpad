"use client";

import { createConfig, http, injected, WagmiProvider } from "wagmi";
import { walletConnect } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { robinhood } from "~/lib/robinhood";
import { ROBINHOOD_RPC_URL } from "~/lib/constants";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "00000000000000000000000000000000";

export const config = createConfig({
  chains: [robinhood],
  connectors: [
    injected({ shimDisconnect: true }),
    walletConnect({
      projectId,
      metadata: {
        name: "Jacpad",
        description: "Launch X profile tokens on Robinhood Chain",
        url: "https://jacpad.app",
        icons: ["https://jacpad.app/logo.png"],
      },
      showQrModal: true,
    }),
  ],
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
