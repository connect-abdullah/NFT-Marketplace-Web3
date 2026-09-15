"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { writeErrorMessage } from "@/lib/nft/hooks";

export function StatsCard({
  totalMinted,
  totalMintedError,
  balance,
  connected,
}: {
  totalMinted: bigint | undefined;
  totalMintedError: Error | null;
  balance: bigint | undefined;
  connected: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Collection</CardTitle>
        <CardDescription>
          How many NFTs exist, and how many your wallet owns.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Total minted</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              {totalMintedError
                ? "—"
                : totalMinted !== undefined
                  ? totalMinted.toString()
                  : "…"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Your NFTs</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              {!connected
                ? "—"
                : balance !== undefined
                  ? balance.toString()
                  : "…"}
            </p>
            {!connected ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Connect a wallet to see how many you own.
              </p>
            ) : null}
          </div>
        </div>
        {totalMintedError ? (
          <>
            <Separator className="my-4" />
            <p className="text-sm text-destructive">
              {writeErrorMessage(totalMintedError)}
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
