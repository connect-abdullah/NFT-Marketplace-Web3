"use client";

import type { Address } from "viem";
import { ApproveActionCard } from "@/components/nft/ApproveActionCard";
import { ApproveMarketplaceCard } from "@/components/nft/ApproveMarketplaceCard";
import { ListActionCard } from "@/components/nft/ListActionCard";
import { MintBar } from "@/components/nft/MintBar";
import { NftTile } from "@/components/nft/NftTile";
import { SendActionCard } from "@/components/nft/SendActionCard";
import { sameAddress } from "@/lib/nft/gates";
import type { TokenRecord } from "@/lib/nft/hooks";

export function StudioCollection({
  records,
  account,
  selectedId,
  onSelect,
  writeReady,
  onSuccess,
  loading,
}: {
  records: TokenRecord[];
  account: Address | undefined;
  selectedId: bigint | undefined;
  onSelect: (tokenId: bigint) => void;
  writeReady: boolean;
  onSuccess: () => void;
  loading: boolean;
}) {
  const mine = account
    ? records.filter((record) => record.owner && sameAddress(record.owner, account))
    : [];
  const selected = mine.find((record) => record.tokenId === selectedId);

  return (
    <div className="flex flex-col gap-6">
      <MintBar writeReady={writeReady} onSuccess={onSuccess} />
      {!account ? (
        <p className="text-sm text-muted-foreground">
          Connect a wallet to see NFTs you own.
        </p>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Loading your collection…</p>
      ) : mine.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card/60 px-6 py-12 text-center">
          <p className="font-medium">Your studio is empty</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Mint an NFT to list it on the market or send it to someone else.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((record) => (
              <NftTile
                key={record.tokenId.toString()}
                tokenId={record.tokenId}
                owner={record.owner}
                listing={record.listing}
                selected={selectedId === record.tokenId}
                onSelect={() => onSelect(record.tokenId)}
              />
            ))}
          </div>
          {selected ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <ApproveMarketplaceCard
                record={selected}
                account={account}
                writeReady={writeReady}
                onSuccess={onSuccess}
              />
              <ListActionCard
                record={selected}
                account={account}
                writeReady={writeReady}
                onSuccess={onSuccess}
              />
              <SendActionCard
                record={selected}
                account={account}
                writeReady={writeReady}
                onSuccess={onSuccess}
              />
              <ApproveActionCard
                record={selected}
                account={account}
                writeReady={writeReady}
                onSuccess={onSuccess}
              />
            </div>
          ) : (
            <p className="rounded-xl border border-dashed bg-card/60 px-5 py-4 text-sm text-muted-foreground">
              Select an NFT to approve the marketplace, list it, send it, or
              approve another wallet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
