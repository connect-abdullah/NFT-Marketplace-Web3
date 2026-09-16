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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { marketApi, withMarket } from "@/lib/market/api";
import { requireWriteReady, sameAddress } from "@/lib/nft/gates";
import type { TokenRecord } from "@/lib/nft/hooks";
import { useNftWrite, writeErrorMessage } from "@/lib/nft/hooks";
import { parseEthAmount } from "@/lib/nft/parse";
import { formatEth } from "@/lib/utils";

export function ListActionCard({
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
  const [priceInput, setPriceInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const isOwner = Boolean(
    account && record.owner && sameAddress(account, record.owner)
  );
  const listed = Boolean(record.listing?.listed);
  const errorText = formError ?? writeErrorMessage(write.error);

  function onList() {
    write.reset();
    setFormError(null);
    if (!requireWriteReady({ isConnected, chainId, setFormError })) return;
    if (!isOwner) {
      setFormError("Only the owner can list this NFT.");
      return;
    }
    if (listed) {
      setFormError("This NFT is already listed.");
      return;
    }
    if (!record.marketApproved) {
      setFormError("Approve the marketplace before listing.");
      return;
    }
    const price = parseEthAmount(priceInput);
    if (price === undefined) {
      setFormError("Enter a price greater than 0 in ETH.");
      return;
    }
    write.writeContract(withMarket(marketApi.writes.listNFT(record.tokenId, price)));
  }

  function onUnlist() {
    write.reset();
    setFormError(null);
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

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>List on market</CardTitle>
        <CardDescription>
          {listed && record.listing
            ? `Currently listed for ${formatEth(record.listing.price)}.`
            : record.marketApproved
              ? "Set an ETH price and put this NFT up for sale."
              : "Approve the marketplace first, then set a price."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {listed ? (
          <p className="text-sm text-muted-foreground">
            Unlisting removes it from the market. You still own the NFT.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <Label htmlFor="list-price">Price (ETH)</Label>
            <Input
              id="list-price"
              value={priceInput}
              onChange={(event) => setPriceInput(event.target.value)}
              placeholder="0.05"
              inputMode="decimal"
            />
          </div>
        )}
        {errorText ? <p className="text-sm text-destructive">{errorText}</p> : null}
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          className="w-full"
          variant={listed ? "outline" : "default"}
          disabled={
            !writeReady ||
            write.busy ||
            !isOwner ||
            (!listed && !record.marketApproved)
          }
          onClick={listed ? onUnlist : onList}
        >
          {write.busy && write.statusLabel
            ? write.statusLabel
            : listed
              ? "Unlist"
              : "List for sale"}
        </Button>
      </CardFooter>
    </Card>
  );
}
