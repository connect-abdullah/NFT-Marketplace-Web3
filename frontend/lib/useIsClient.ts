"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function useHasInjectedProvider() {
  return useSyncExternalStore(
    emptySubscribe,
    () =>
      typeof window !== "undefined" &&
      Boolean((window as Window & { ethereum?: unknown }).ethereum),
    () => false
  );
}
