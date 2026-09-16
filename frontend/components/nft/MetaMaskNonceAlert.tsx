"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isNonceRelatedError } from "@/lib/nft/hooks";

export function MetaMaskNonceAlert({
  error,
}: {
  error: Error | null | undefined;
}) {
  if (!isNonceRelatedError(error)) return null;

  return (
    <Alert variant="destructive">
      <AlertTitle>MetaMask nonce out of sync with Anvil</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <span>
          This often happens after restarting Anvil while MetaMask still
          remembers old transactions. Reset the account for your local network,
          then try again.
        </span>
        <span className="text-sm">
          In MetaMask: open the account menu → Settings → Advanced → Clear
          activity tab data, or select the account → Settings → Reset account
          (for the Localhost 8545 / chain 31337 network).
        </span>
      </AlertDescription>
    </Alert>
  );
}
