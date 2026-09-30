"use client";

import { Compass, Rocket, Wallet } from "lucide-react";
import { Button } from "~/components/ui/button";
import { PONS_LAUNCHPAD_URL, ROBINHOOD_CHAIN_ID } from "~/lib/constants";

interface AboutJackpadProps {
  onExplore: () => void;
  onLaunch: () => void;
}

export default function AboutJackpad({ onExplore, onLaunch }: AboutJackpadProps) {
  return (
    <div className="space-y-14 pb-8">
      <section className="text-center space-y-5 pt-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Jackpad"
          className="mx-auto h-24 w-24 object-contain drop-shadow-[0_0_28px_rgba(57,255,20,0.5)]"
        />
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-jac-green">
          Jackpad
        </h1>
        <p className="mx-auto max-w-xl text-base sm:text-lg text-zinc-300">
          Turn a public X profile into a token on Robinhood Chain. Name, bio, and avatar become the token, launched through Pons v2 from your wallet.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            className="bg-jac-green text-black hover:bg-jac-green/90 font-semibold h-11 px-5"
            onClick={onLaunch}
          >
            <Rocket className="mr-2 h-4 w-4" />
            Launch a token
          </Button>
          <Button
            variant="outline"
            className="border-zinc-800 bg-zinc-950 text-white hover:bg-zinc-900 h-11 px-5"
            onClick={onExplore}
          >
            <Compass className="mr-2 h-4 w-4" />
            Explore
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Step
          n="01"
          title="Type an X handle"
          body="No Twitter login. Jackpad reads the public profile: display name, bio, and avatar."
        />
        <Step
          n="02"
          title="Connect your wallet"
          body="Injected wallets on Robinhood Chain. You sign the launch. Jackpad never holds your key."
        />
        <Step
          n="03"
          title="Launch on Pons v2"
          body="The token is created on-chain via the Pons factory, then listed here so others can find it."
        />
      </section>

      <section className="jac-panel p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-semibold text-white">What Jackpad is</h2>
        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
          Jackpad is a launchpad for identity tokens. Each token represents a public X account: the handle is the social link, the avatar is the logo, and the bio is the description. Trading happens on Pons after launch. This site is the directory. Explore what has been launched, or start one yourself.
        </p>
        <ul className="grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
          <li className="rounded-lg border border-zinc-900 bg-black/40 px-3 py-2">Network: Robinhood Chain ({ROBINHOOD_CHAIN_ID})</li>
          <li className="rounded-lg border border-zinc-900 bg-black/40 px-3 py-2">Factory: Pons v2 launchToken</li>
          <li className="rounded-lg border border-zinc-900 bg-black/40 px-3 py-2">Identity: public X handle, not OAuth</li>
          <li className="rounded-lg border border-zinc-900 bg-black/40 px-3 py-2">Auth: connect wallet only</li>
        </ul>
        <a
          href={PONS_LAUNCHPAD_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-jac-green hover:underline"
        >
          <Wallet className="h-4 w-4" />
          Trade graduated tokens on Pons
        </a>
      </section>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="jac-panel p-5 space-y-2 text-left">
      <p className="font-mono text-xs text-jac-green">{n}</p>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{body}</p>
    </div>
  );
}
