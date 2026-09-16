"use client";

import type { ReactNode } from "react";
import type { Address } from "viem";
import { Badge } from "@/components/ui/badge";
import { NftArt } from "@/components/nft/NftArt";
import type { Listing } from "@/lib/market/contract";
import { cn, formatEth, shortenAddress } from "@/lib/utils";

export function NftTile({
  tokenId,
  owner,
  listing,
  selected = false,
  onSelect,
  footer,
}: {
  tokenId: bigint;
  owner: Address | undefined;
  listing: Listing | undefined;
  selected?: boolean;
  onSelect?: () => void;
  footer?: ReactNode;
}) {
  const listed = Boolean(listing?.listed);
  const clickable = Boolean(onSelect);

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm transition-shadow",
        "hover:shadow-md",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      <button
        type="button"
        className={cn(
          "relative block w-full overflow-hidden bg-secondary p-3 text-left",
          clickable ? "cursor-pointer" : "cursor-default"
        )}
        onClick={onSelect}
        disabled={!clickable}
      >
        <div className="relative aspect-square overflow-hidden rounded-xl">
          <NftArt tokenId={tokenId} className="h-full w-full" />
          <span className="absolute bottom-2 left-2 rounded-md bg-card/90 px-2 py-0.5 font-mono text-xs tracking-wide">
            #{tokenId.toString()}
          </span>
        </div>
        {listed && listing ? (
          <Badge variant="ochre" className="absolute top-5 right-5">
            {formatEth(listing.price)}
          </Badge>
        ) : null}
      </button>
      <div className="flex flex-1 flex-col gap-3 px-4 pt-1 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
              NFT
            </p>
            <h3 className="text-lg font-semibold tracking-tight">
              #{tokenId.toString()}
            </h3>
          </div>
          {listed ? (
            <Badge variant="outline">Listed</Badge>
          ) : (
            <Badge variant="secondary">Unlisted</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Owner{" "}
          <span className="font-mono">
            {owner ? shortenAddress(owner) : "…"}
          </span>
        </p>
        {listed && listing ? (
          <p className="text-sm font-medium text-ochre">
            {formatEth(listing.price)}
          </p>
        ) : null}
        {footer}
      </div>
    </article>
  );
}
