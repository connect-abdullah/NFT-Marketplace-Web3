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
import type { TokenRecord } from "@/lib/nft/hooks";
import { useNftWrite, writeErrorMessage } from "@/lib/nft/hooks";
import { parseAddress } from "@/lib/nft/parse";
import { shortenAddress } from "@/lib/utils";

export function ApproveActionCard({
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
  const [approveInput, setApproveInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const isOwner = Boolean(
    account && record.owner && sameAddress(account, record.owner)
  );
  const errorText = formError ?? writeErrorMessage(write.error);
  const currentApproved =
    record.approved && record.approved !== zeroAddress
      ? record.approved
      : undefined;

  function onApprove() {
    write.reset();
    setFormError(null);
    if (!requireWriteReady({ isConnected, chainId, setFormError })) return;
    if (!isOwner) {
      setFormError("Only the owner can approve.");
      return;
    }
    const to = parseAddress(approveInput);
    if (!to) {
      setFormError("Enter a valid wallet to approve.");
      return;
    }
    write.writeContract(withContract(nftApi.writes.approve(to, record.tokenId)));
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Approve wallet</CardTitle>
        <CardDescription>
          Let another wallet send this NFT without transferring ownership yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {currentApproved ? (
          <p className="text-xs text-muted-foreground">
            Currently approved{" "}
            <span className="font-mono">{shortenAddress(currentApproved)}</span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">No wallet is approved.</p>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="approve-to">Wallet to approve</Label>
          <Input
            id="approve-to"
            value={approveInput}
            onChange={(event) => setApproveInput(event.target.value)}
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
          disabled={!writeReady || write.busy || !isOwner}
          onClick={onApprove}
        >
          {write.busy && write.statusLabel ? write.statusLabel : "Approve"}
        </Button>
      </CardFooter>
    </Card>
  );
}
