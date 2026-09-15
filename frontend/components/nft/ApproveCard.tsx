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
import { useNftWrite, writeErrorMessage } from "@/lib/nft/hooks";
import { parseAddress, parseTokenId } from "@/lib/nft/parse";

export function ApproveCard({
  writeReady,
  onSuccess,
  account,
  lookupInput,
  lookedUpTokenId,
  lookedUpOwner,
}: {
  writeReady: boolean;
  onSuccess: () => void;
  account: Address | undefined;
  lookupInput: string;
  lookedUpTokenId: bigint | undefined;
  lookedUpOwner: Address | undefined;
}) {
  const { isConnected, chainId } = useAccount();
  const write = useNftWrite(onSuccess);
  const [toInput, setToInput] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function onApprove() {
    write.reset();
    setFormError(null);
    if (!requireWriteReady({ isConnected, chainId, setFormError })) return;

    const tokenId = parseTokenId(tokenInput);
    const to = parseAddress(toInput);
    if (tokenId === undefined) {
      setFormError("Token number must be a whole number.");
      return;
    }
    if (!to) {
      setFormError("Enter a valid wallet address to approve.");
      return;
    }
    if (
      lookedUpTokenId === tokenId &&
      lookedUpOwner &&
      account &&
      !sameAddress(lookedUpOwner, account)
    ) {
      setFormError("Only the owner can approve someone else.");
      return;
    }

    write.writeContract(withContract(nftApi.writes.approve(to, tokenId)));
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Approve</CardTitle>
        <CardDescription>
          Let another wallet send this NFT for you. You must own it.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="approve-token">Token number</Label>
            {lookedUpTokenId !== undefined ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setTokenInput(lookupInput.trim())}
              >
                Use looked-up token
              </Button>
            ) : null}
          </div>
          <Input
            id="approve-token"
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            inputMode="numeric"
            placeholder="e.g. 0"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="approve-to">Approve this wallet</Label>
          <Input
            id="approve-to"
            value={toInput}
            onChange={(event) => setToInput(event.target.value)}
            placeholder="0x…"
            className="font-mono"
          />
        </div>
        {!writeReady ? (
          <p className="text-sm text-muted-foreground">
            Connect on the local network to approve.
          </p>
        ) : null}
        {formError ? (
          <p className="text-sm text-destructive">{formError}</p>
        ) : null}
        {writeErrorMessage(write.error) ? (
          <p className="text-sm text-destructive">
            {writeErrorMessage(write.error)}
          </p>
        ) : null}
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          className="w-full"
          disabled={!writeReady || write.busy}
          onClick={onApprove}
        >
          {write.busy && write.statusLabel ? write.statusLabel : "Approve"}
        </Button>
      </CardFooter>
    </Card>
  );
}
