"use client";

import type { Address } from "viem";
import { Badge } from "@/components/ui/badge";
import { shortenAddress } from "@/lib/utils";

export function ContractAddressStrip({
  nftAddress,
  marketAddress,
}: {
  nftAddress: Address | undefined;
  marketAddress: Address | undefined;
}) {
  if (!nftAddress && !marketAddress) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {nftAddress ? (
        <Badge
          variant="outline"
          className="border-primary/50 bg-primary/10 font-mono"
          title={nftAddress}
        >
          Contract address {shortenAddress(nftAddress)}
        </Badge>
      ) : null}
      {marketAddress ? (
        <Badge variant="ochre" className="font-mono" title={marketAddress}>
          Market address {shortenAddress(marketAddress)}
        </Badge>
      ) : null}
    </div>
  );
}
