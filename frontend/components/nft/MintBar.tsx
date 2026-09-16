"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { nftApi, withContract } from "@/lib/nft/api";
import { requireWriteReady } from "@/lib/nft/gates";
import { MetaMaskNonceAlert } from "@/components/nft/MetaMaskNonceAlert";
import { useNftWrite, writeErrorMessage } from "@/lib/nft/hooks";

export function MintBar({
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
    <div className="flex flex-col gap-3 rounded-xl border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">Mint a new NFT</p>
        <p className="text-sm text-muted-foreground">
          Creates the next token and sends it to your connected wallet.
        </p>
        <MetaMaskNonceAlert error={write.error} />
        {formError ? (
          <p className="mt-2 text-sm text-destructive">{formError}</p>
        ) : null}
        {writeErrorMessage(write.error) ? (
          <p className="mt-2 text-sm text-destructive">
            {writeErrorMessage(write.error)}
          </p>
        ) : null}
      </div>
      <Button
        type="button"
        size="lg"
        className="shrink-0"
        disabled={!writeReady || write.busy}
        onClick={onMint}
      >
        {write.busy && write.statusLabel ? write.statusLabel : "Mint"}
      </Button>
    </div>
  );
}
