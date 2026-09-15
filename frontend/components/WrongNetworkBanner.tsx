"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useIsClient } from "@/lib/useIsClient";
import { targetChain } from "@/lib/wagmi";

export function WrongNetworkBanner() {
  const isClient = useIsClient();
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  const wrongNetwork =
    isClient && isConnected && chainId !== targetChain.id;

  if (!wrongNetwork) return null;

  return (
    <Alert className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <AlertTitle>Wrong network</AlertTitle>
        <AlertDescription>
          This app uses {targetChain.name} (chain id {targetChain.id}). Switch
          in MetaMask, or tap the button.
        </AlertDescription>
      </div>
      <Button
        type="button"
        className="shrink-0"
        disabled={isPending}
        onClick={() => switchChain({ chainId: targetChain.id })}
      >
        {isPending ? "Switching…" : `Switch to ${targetChain.name}`}
      </Button>
    </Alert>
  );
}
