"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

const WagmiProvider = dynamic(
  () => import("~/components/providers/WagmiProvider"),
  { ssr: false }
);

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      persistence: "localStorage",
      person_profiles: "identified_only",
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider>
      <PostHogProvider>{children}</PostHogProvider>
    </WagmiProvider>
  );
}
