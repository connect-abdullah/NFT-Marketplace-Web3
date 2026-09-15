"use client";

import { useState } from "react";
import type { Address } from "viem";
import { zeroAddress } from "viem";
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

export function SendCard({
  writeReady,
  onSuccess,
  account,
  lookupInput,
  lookedUpTokenId,
  lookedUpOwner,
  lookedUpApproved,
}: {
  writeReady: boolean;
  onSuccess: () => void;
  account: Address | undefined;
  lookupInput: string;
  lookedUpTokenId: bigint | undefined;
  lookedUpOwner: Address | undefined;
  lookedUpApproved: Address | undefined;
}) {
  const { isConnected, chainId } = useAccount();
  const write = useNftWrite(onSuccess);
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function onSend() {
    write.reset();
    setFormError(null);
    if (!requireWriteReady({ isConnected, chainId, setFormError })) return;

    const tokenId = parseTokenId(tokenInput);
    const from = parseAddress(fromInput);
    const to = parseAddress(toInput);
    if (tokenId === undefined) {
      setFormError("Token number must be a whole number.");
      return;
    }
    if (!from) {
      setFormError("Enter the current owner’s wallet in From.");
      return;
    }
    if (!to) {
      setFormError("Enter a valid wallet to send to.");
      return;
    }

    if (
      lookedUpTokenId === tokenId &&
      lookedUpOwner &&
      !sameAddress(lookedUpOwner, from)
    ) {
      setFormError("From must be the current owner.");
      return;
    }

    if (account && lookedUpTokenId === tokenId && lookedUpOwner) {
      const isOwner = sameAddress(lookedUpOwner, account);
      const isApproved =
        lookedUpApproved &&
        lookedUpApproved !== zeroAddress &&
        sameAddress(lookedUpApproved, account);
      if (!isOwner && !isApproved) {
        setFormError("Only the owner or an approved wallet can send.");
        return;
      }
    }

    write.writeContract(
      withContract(nftApi.writes.transferFrom(from, to, tokenId))
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Send</CardTitle>
        <CardDescription>
          Move an NFT to another wallet. You must be the owner or approved.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="send-token">Token number</Label>
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
            id="send-token"
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            inputMode="numeric"
            placeholder="e.g. 0"
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="send-from">From (current owner)</Label>
            {account ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFromInput(account)}
              >
                Use connected wallet
              </Button>
            ) : null}
          </div>
          <Input
            id="send-from"
            value={fromInput}
            onChange={(event) => setFromInput(event.target.value)}
            placeholder="0x…"
            className="font-mono"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="send-to">To</Label>
          <Input
            id="send-to"
            value={toInput}
            onChange={(event) => setToInput(event.target.value)}
            placeholder="0x…"
            className="font-mono"
          />
        </div>
        {!writeReady ? (
          <p className="text-sm text-muted-foreground">
            Connect on the local network to send.
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
          onClick={onSend}
        >
          {write.busy && write.statusLabel ? write.statusLabel : "Send NFT"}
        </Button>
      </CardFooter>
    </Card>
  );
}
