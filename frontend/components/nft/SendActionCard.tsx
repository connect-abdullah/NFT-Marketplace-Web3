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
import { nftApi, withContract } from "@/lib/nft/api";
import { requireWriteReady, sameAddress } from "@/lib/nft/gates";
import type { TokenRecord } from "@/lib/nft/hooks";
import { isZeroAddress, useNftWrite, writeErrorMessage } from "@/lib/nft/hooks";
import { parseAddress } from "@/lib/nft/parse";

export function SendActionCard({
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
  const [toInput, setToInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const isOwner = Boolean(
    account && record.owner && sameAddress(account, record.owner)
  );
  const isApproved = Boolean(
    account &&
      record.approved &&
      !isZeroAddress(record.approved) &&
      sameAddress(account, record.approved)
  );
  const errorText = formError ?? writeErrorMessage(write.error);

  function onTransfer() {
    write.reset();
    setFormError(null);
    if (!requireWriteReady({ isConnected, chainId, setFormError })) return;
    if (!record.owner) {
      setFormError("Owner is still loading.");
      return;
    }
    const to = parseAddress(toInput);
    if (!to) {
      setFormError("Enter a valid wallet to send to.");
      return;
    }
    if (!isOwner && !isApproved) {
      setFormError("Only the owner or an approved wallet can send.");
      return;
    }
    write.writeContract(
      withContract(nftApi.writes.transferFrom(record.owner, to, record.tokenId))
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Send NFT</CardTitle>
        <CardDescription>
          Transfer this NFT to another wallet. You must own it or be approved.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="transfer-to">Recipient</Label>
          <Input
            id="transfer-to"
            value={toInput}
            onChange={(event) => setToInput(event.target.value)}
            placeholder="0x…"
            className="font-mono"
          />
        </div>
        {errorText ? <p className="text-sm text-destructive">{errorText}</p> : null}
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          className="w-full"
          variant="outline"
          disabled={!writeReady || write.busy || (!isOwner && !isApproved)}
          onClick={onTransfer}
        >
          {write.busy && write.statusLabel ? write.statusLabel : "Send"}
        </Button>
      </CardFooter>
    </Card>
  );
}
