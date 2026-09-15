"use client";

import type { Address } from "viem";
import { zeroAddress } from "viem";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { writeErrorMessage } from "@/lib/nft/hooks";
import { shortenAddress } from "@/lib/utils";

function approvedLabel(
  approved: Address | undefined,
  approvedError: Error | null
) {
  if (approvedError) return writeErrorMessage(approvedError);
  if (!approved) return "…";
  if (approved === zeroAddress) return "-----";
  return shortenAddress(approved);
}

export function TokenCard({
  lookupInput,
  onLookupInputChange,
  tokenId,
  owner,
  ownerError,
  approved,
  approvedError,
}: {
  lookupInput: string;
  onLookupInputChange: (value: string) => void;
  tokenId: bigint | undefined;
  owner: Address | undefined;
  ownerError: Error | null;
  approved: Address | undefined;
  approvedError: Error | null;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Look up a token</CardTitle>
        <CardDescription>
          Enter a token number to see who owns it and who may send it.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="token-number">Token number</Label>
          <Input
            id="token-number"
            value={lookupInput}
            onChange={(event) => onLookupInputChange(event.target.value)}
            inputMode="numeric"
            placeholder="e.g. 0"
          />
        </div>
        {lookupInput.trim() && tokenId === undefined ? (
          <p className="text-sm text-destructive">
            Use a whole number (0, 1, 2…).
          </p>
        ) : null}
        {tokenId !== undefined ? (
          <>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Owner</p>
                <p className="mt-1 font-mono text-sm break-all">
                  {ownerError
                    ? writeErrorMessage(ownerError)
                    : owner
                      ? shortenAddress(owner)
                      : "…"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved to</p>
                <p className="mt-1 font-mono text-sm break-all">
                  {approvedLabel(approved, approvedError)}
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            After you mint, the new number is usually one less than “Total
            minted”.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
