import type { Address } from "viem";
import { targetChain } from "@/lib/wagmi";
import { marketAddress } from "@/lib/market/contract";
import { nftAddress } from "@/lib/nft/contract";

export function isOnTargetChain(chainId: number | undefined) {
  return chainId === targetChain.id;
}

export function contractsConfigured() {
  return Boolean(nftAddress && marketAddress);
}

export function canWrite(params: {
  isConnected: boolean;
  chainId: number | undefined;
}) {
  return Boolean(
    params.isConnected && isOnTargetChain(params.chainId) && contractsConfigured()
  );
}

export function requireWriteReady(params: {
  isConnected: boolean;
  chainId: number | undefined;
  setFormError: (message: string) => void;
}): boolean {
  if (!contractsConfigured()) {
    params.setFormError("NFT and marketplace addresses are not configured.");
    return false;
  }
  if (!params.isConnected) {
    params.setFormError("Connect a wallet first.");
    return false;
  }
  if (!isOnTargetChain(params.chainId)) {
    params.setFormError("Switch to the correct network to send transactions.");
    return false;
  }
  return true;
}

export function sameAddress(a: Address | string, b: Address | string) {
  return a.toLowerCase() === b.toLowerCase();
}
