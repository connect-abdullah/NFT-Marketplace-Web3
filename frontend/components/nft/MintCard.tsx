"use client";

import { useState } from "react";
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
import { nftApi, withContract } from "@/lib/nft/api";
import { requireWriteReady } from "@/lib/nft/gates";
import { useNftWrite, writeErrorMessage } from "@/lib/nft/hooks";

export function MintCard({
  writeReady,
  onSuccess,
}: {
  writeReady: boolean;
  onSuccess: () => void;
}) {
  const { isConnected, chainId } = useAccount();
  const write = useNftWrite(onSuccess);
  const [formError, setFormError] = useState<string | null>(null);

  function onMint() {
    write.reset();
    setFormError(null);
    if (!requireWriteReady({ isConnected, chainId, setFormError })) return;
    write.writeContract(withContract(nftApi.writes.mint()));
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Mint</CardTitle>
        <CardDescription>
          Creates a new NFT and sends it to your connected wallet.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Each mint gets the next number (0, then 1, then 2…). Look it up below
          after you mint.
        </p>
        {!writeReady ? (
          <p className="text-sm text-muted-foreground">
            Connect a wallet on the local network to mint.
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
          size="lg"
          className="w-full"
          disabled={!writeReady || write.busy}
          onClick={onMint}
        >
          {write.busy && write.statusLabel ? write.statusLabel : "Mint NFT"}
        </Button>
      </CardFooter>
    </Card>
  );
}
