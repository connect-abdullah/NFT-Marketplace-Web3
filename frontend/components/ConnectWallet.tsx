"use client";

import { useMemo, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useHasInjectedProvider, useIsClient } from "@/lib/useIsClient";
import { shortenAddress } from "@/lib/utils";

function connectErrorMessage(error: Error | null) {
  if (!error) return undefined;
  if (
    error.name === "ProviderNotFoundError" ||
    error.message.includes("Provider not found")
  ) {
    return "No browser wallet found. Install MetaMask to continue.";
  }
  return error.message;
}

export function ConnectWallet() {
  const isClient = useIsClient();
  const hasProvider = useHasInjectedProvider();
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [error, setError] = useState<Error | null>(null);

  const wallets = useMemo(
    () =>
      connectors.filter((connector, _, all) => {
        if (
          connector.id === "injected" &&
          all.some((item) => item.id !== "injected")
        ) {
          return false;
        }
        return true;
      }),
    [connectors]
  );

  if (!isClient) {
    return (
      <div
        className="h-9 w-40 shrink-0 rounded-md bg-muted"
        aria-hidden
      />
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="font-mono text-xs">
          {shortenAddress(address)}
        </Badge>
        <Button type="button" variant="outline" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  const onlyInjected =
    wallets.length === 1 && wallets[0]?.id === "injected";

  if (!hasProvider && onlyInjected) {
    return (
      <p className="max-w-xs text-sm text-muted-foreground">
        Install MetaMask (or another browser wallet) to connect.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {wallets.map((connector) => (
          <Button
            key={connector.uid}
            type="button"
            disabled={isPending}
            onClick={() => {
              setError(null);
              connect({ connector }, { onError: (err) => setError(err) });
            }}
          >
            {isPending ? "Connecting…" : "Connect wallet"}
          </Button>
        ))}
      </div>
      {connectErrorMessage(error) ? (
        <p className="text-sm text-destructive">{connectErrorMessage(error)}</p>
      ) : null}
    </div>
  );
}
