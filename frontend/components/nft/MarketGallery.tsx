"use client";

import { useState } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";
import { NftTile } from "@/components/nft/NftTile";
import { Button } from "@/components/ui/button";
import { marketApi, withMarket } from "@/lib/market/api";
import { requireWriteReady, sameAddress } from "@/lib/nft/gates";
import type { TokenRecord } from "@/lib/nft/hooks";
import { MetaMaskNonceAlert } from "@/components/nft/MetaMaskNonceAlert";
import { useNftWrite, writeErrorMessage } from "@/lib/nft/hooks";

export function MarketGallery({
  records,
  writeReady,
  account,
  onSuccess,
  loading,
}: {
  records: TokenRecord[];
  writeReady: boolean;
  account: Address | undefined;
  onSuccess: () => void;
  loading: boolean;
}) {
  const listed = records.filter((record) => record.listing?.listed);
  const { isConnected, chainId } = useAccount();
  const write = useNftWrite(onSuccess);
  const [formError, setFormError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<bigint | null>(null);

  function onBuy(record: TokenRecord) {
    write.reset();
    setFormError(null);
    setActingId(record.tokenId);
    if (!requireWriteReady({ isConnected, chainId, setFormError })) return;
    if (!record.listing?.listed) {
      setFormError("This NFT is not listed.");
      return;
    }
    if (account && sameAddress(account, record.listing.seller)) {
      setFormError("You cannot buy your own NFT.");
      return;
    }
    write.writeContract(
      withMarket(marketApi.writes.buyNFT(record.tokenId, record.listing.price))
    );
  }

  function onUnlist(record: TokenRecord) {
    write.reset();
    setFormError(null);
    setActingId(record.tokenId);
    if (!requireWriteReady({ isConnected, chainId, setFormError })) return;
    if (!record.listing?.listed) {
      setFormError("This NFT is not listed.");
      return;
    }
    if (!account || !sameAddress(account, record.listing.seller)) {
      setFormError("Only the seller can unlist.");
      return;
    }
    write.writeContract(withMarket(marketApi.writes.unlistNFT(record.tokenId)));
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading the market…</p>
    );
  }

  if (listed.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card/60 px-6 py-16 text-center">
        <p className="font-medium">Nothing is listed yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Mint an NFT in Studio, approve the marketplace, then list it here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <MetaMaskNonceAlert error={write.error} />
      {formError ? (
        <p className="text-sm text-destructive">{formError}</p>
      ) : null}
      {writeErrorMessage(write.error) ? (
        <p className="text-sm text-destructive">
          {writeErrorMessage(write.error)}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listed.map((record) => {
          const isSeller =
            account &&
            record.listing?.listed &&
            sameAddress(account, record.listing.seller);
          const acting = actingId === record.tokenId && write.busy;
          return (
            <NftTile
              key={record.tokenId.toString()}
              tokenId={record.tokenId}
              owner={record.owner}
              listing={record.listing}
              footer={
                <Button
                  type="button"
                  className="mt-1 w-full"
                  variant={isSeller ? "outline" : "default"}
                  disabled={!writeReady || write.busy}
                  onClick={() => (isSeller ? onUnlist(record) : onBuy(record))}
                >
                  {acting && write.statusLabel
                    ? write.statusLabel
                    : isSeller
                      ? "Unlist"
                      : "Buy"}
                </Button>
              }
            />
          );
        })}
      </div>
    </div>
  );
}
