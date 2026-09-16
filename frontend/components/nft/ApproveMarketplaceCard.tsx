"use client";

import { useState } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { marketAddress } from "@/lib/market/contract";
import { nftApi, withContract } from "@/lib/nft/api";
import { requireWriteReady, sameAddress } from "@/lib/nft/gates";
import type { TokenRecord } from "@/lib/nft/hooks";
import { useNftWrite, writeErrorMessage } from "@/lib/nft/hooks";
import { shortenAddress } from "@/lib/utils";

export function ApproveMarketplaceCard({
  record,
  account,
  writeReady,
  onSuccess,
}: {
  record: TokenRecord;
  account: Address | undefined;
  writeReady: boolean;
  onSuccess: () => void;
}) {
  const { isConnected, chainId } = useAccount();
  const write = useNftWrite(onSuccess);
  const [formError, setFormError] = useState<string | null>(null);

  const isOwner = Boolean(
    account && record.owner && sameAddress(account, record.owner)
  );
  const errorText = formError ?? writeErrorMessage(write.error);

  function onApprove() {
    write.reset();
    setFormError(null);
    if (!requireWriteReady({ isConnected, chainId, setFormError })) return;
    if (!isOwner) {
      setFormError("Only the owner can approve the marketplace.");
      return;
    }
    if (!marketAddress) {
      setFormError("Marketplace address is not configured.");
      return;
    }
    write.writeContract(
      withContract(nftApi.writes.setApprovalForAll(marketAddress, true))
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Approve marketplace</CardTitle>
        <CardDescription>
          Allow the marketplace to transfer this NFT when someone buys it.
          Required before you can list.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {record.marketApproved ? (
          <p className="text-sm text-muted-foreground">
            Marketplace{" "}
            {marketAddress ? (
              <span className="font-mono">{shortenAddress(marketAddress)}</span>
            ) : null}{" "}
            can transfer NFTs you own.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            The market cannot move this NFT until you approve it.
          </p>
        )}
        {errorText ? <p className="text-sm text-destructive">{errorText}</p> : null}
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          className="w-full"
          variant="outline"
          disabled={
            !writeReady || write.busy || !isOwner || record.marketApproved
          }
          onClick={onApprove}
        >
          {write.busy && write.statusLabel
            ? write.statusLabel
            : record.marketApproved
              ? "Marketplace approved"
              : "Approve marketplace"}
        </Button>
      </CardFooter>
    </Card>
  );
}
