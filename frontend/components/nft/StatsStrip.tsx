"use client";

import type { Address } from "viem";
import { useBalance } from "wagmi";
import { formatEth } from "@/lib/utils";
import { targetChain } from "@/lib/wagmi";

export function StatsStrip({
  owned,
  listed,
  connected,
  address,
}: {
  owned: bigint | undefined;
  listed: number;
  connected: boolean;
  address: Address | undefined;
}) {
  const { data: eth, isLoading } = useBalance({
    address,
    chainId: targetChain.id,
    query: {
      enabled: Boolean(address),
      refetchInterval: 4_000,
    },
  });

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border bg-card px-4 py-3">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          Your ETH
        </p>
        <p className="mt-1 text-xl font-semibold tabular-nums">
          {connected
            ? isLoading && !eth
              ? "…"
              : eth
                ? formatEth(eth.value)
                : "—"
            : "—"}
        </p>
      </div>
      <div className="rounded-xl border bg-card px-4 py-3">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          Your NFTs
        </p>
        <p className="mt-1 text-xl font-semibold">
          {connected ? owned?.toString() ?? "—" : "—"}
        </p>
      </div>
      <div className="rounded-xl border bg-card px-4 py-3">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          On the market
        </p>
        <p className="mt-1 text-xl font-semibold">{listed}</p>
      </div>
    </div>
  );
}
