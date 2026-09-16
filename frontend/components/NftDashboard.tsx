"use client";

import { useCallback, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectWallet } from "@/components/ConnectWallet";
import { WrongNetworkBanner } from "@/components/WrongNetworkBanner";
import { ContractAddressStrip } from "@/components/nft/ContractAddressStrip";
import { MarketGallery } from "@/components/nft/MarketGallery";
import { StatsStrip } from "@/components/nft/StatsStrip";
import { StudioCollection } from "@/components/nft/StudioCollection";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { marketAddress } from "@/lib/market/contract";
import { nftAddress } from "@/lib/nft/contract";
import { canWrite, contractsConfigured } from "@/lib/nft/gates";
import {
  useBalanceOf,
  useMarketplaceEvents,
  useMintedTokenIds,
  useTokenCatalog,
} from "@/lib/nft/hooks";
import { useQueryClient } from "@tanstack/react-query";

export function NftDashboard() {
  const { address, isConnected, chainId } = useAccount();
  const [selectedId, setSelectedId] = useState<bigint | undefined>(undefined);

  const queryClient = useQueryClient();
  const minted = useMintedTokenIds();
  const catalog = useTokenCatalog(minted.data);
  const balance = useBalanceOf(address);

  const refetchReads = useCallback(() => {
    void minted.refetch();
    catalog.refetch();
    void balance.refetch();
    void queryClient.invalidateQueries({ queryKey: ["balance"] });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- depend on refetch fns only
  }, [minted.refetch, catalog.refetch, balance.refetch, queryClient]);

  useMarketplaceEvents(refetchReads);

  const writeReady = canWrite({ isConnected, chainId });
  const listedCount = catalog.records.filter((record) => record.listing?.listed)
    .length;
  const loading = minted.isLoading || catalog.isLoading;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ContractAddressStrip
          nftAddress={nftAddress}
          marketAddress={marketAddress}
        />
        <ConnectWallet />
      </div>
      <WrongNetworkBanner />
      {!contractsConfigured() ? (
        <Alert variant="destructive">
          <AlertTitle>App is not linked to the contracts</AlertTitle>
          <AlertDescription>
            Run ./start.sh from the project folder after Anvil is running. That
            deploys the NFT and marketplace and fills in the frontend addresses.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <StatsStrip
            owned={balance.data}
            listed={listedCount}
            connected={Boolean(address)}
            address={address}
          />
          <Tabs defaultValue="market">
            <TabsList>
              <TabsTrigger value="market">Market</TabsTrigger>
              <TabsTrigger value="studio">Studio</TabsTrigger>
            </TabsList>
            <TabsContent value="market">
              <MarketGallery
                records={catalog.records}
                writeReady={writeReady}
                account={address}
                onSuccess={refetchReads}
                loading={loading}
              />
            </TabsContent>
            <TabsContent value="studio">
              <StudioCollection
                records={catalog.records}
                account={address}
                selectedId={selectedId}
                onSelect={setSelectedId}
                writeReady={writeReady}
                onSuccess={refetchReads}
                loading={loading}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
