"use client";

import { useCallback, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectWallet } from "@/components/ConnectWallet";
import { WrongNetworkBanner } from "@/components/WrongNetworkBanner";
import { MintCard, ApproveCard, SendCard, TokenCard, StatsCard } from "@/components/nft";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { contractAddress } from "@/lib/nft/contract";
import { canWrite } from "@/lib/nft/gates";
import {
  useBalanceOf,
  useGetApproved,
  useOwnerOf,
  useTotalMinted,
} from "@/lib/nft/hooks";
import { parseTokenId } from "@/lib/nft/parse";
import { shortenAddress } from "@/lib/utils";

export function NftDashboard() {
  const { address, isConnected, chainId } = useAccount();
  const [lookupInput, setLookupInput] = useState("");
  const tokenId = parseTokenId(lookupInput);

  const totalMinted = useTotalMinted();
  const balance = useBalanceOf(address);
  const ownerOf = useOwnerOf(tokenId);
  const approved = useGetApproved(tokenId);

  const refetchReads = useCallback(() => {
    void totalMinted.refetch();
    void balance.refetch();
    void ownerOf.refetch();
    void approved.refetch();
  }, [approved, balance, ownerOf, totalMinted]);

  const writeReady = canWrite({ isConnected, chainId });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {contractAddress ? (
            <Badge variant="outline" className="font-mono">
              Contract {shortenAddress(contractAddress)}
            </Badge>
          ) : null}
        </div>
        <ConnectWallet />
      </div>
      <WrongNetworkBanner />
      {!contractAddress ? (
        <Alert variant="destructive">
          <AlertTitle>App is not linked to a contract</AlertTitle>
          <AlertDescription>
            Run ./start.sh from the project folder after Anvil is running. That
            deploys the contract and fills in the frontend address.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <StatsCard
            totalMinted={totalMinted.data}
            totalMintedError={totalMinted.error}
            balance={balance.data}
            connected={Boolean(address)}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <MintCard writeReady={writeReady} onSuccess={refetchReads} />
            <TokenCard
              lookupInput={lookupInput}
              onLookupInputChange={setLookupInput}
              tokenId={tokenId}
              owner={ownerOf.data}
              ownerError={ownerOf.error}
              approved={approved.data}
              approvedError={approved.error}
            />
            <ApproveCard
              writeReady={writeReady}
              onSuccess={refetchReads}
              account={address}
              lookupInput={lookupInput}
              lookedUpTokenId={tokenId}
              lookedUpOwner={ownerOf.data}
            />
            <SendCard
              writeReady={writeReady}
              onSuccess={refetchReads}
              account={address}
              lookupInput={lookupInput}
              lookedUpTokenId={tokenId}
              lookedUpOwner={ownerOf.data}
              lookedUpApproved={approved.data}
            />
          </div>
        </>
      )}
    </div>
  );
}
