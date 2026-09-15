"use client";

import { useEffect } from "react";
import type { Address } from "viem";
import { BaseError } from "viem";
import {
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { nftApi } from "@/lib/nft/api";
import { contractAddress } from "@/lib/nft/contract";

const fallbackOwner = "0x0000000000000000000000000000000000000001" as Address;

export function useTotalMinted() {
  const result = useReadContract({
    ...nftApi.reads.totalMinted(),
    query: { enabled: Boolean(contractAddress) },
  });
  return { ...result, data: result.data as bigint | undefined };
}

export function useBalanceOf(owner: Address | undefined) {
  const request = nftApi.reads.balanceOf(owner ?? fallbackOwner);
  const result = useReadContract({
    ...request,
    args: owner ? request.args : undefined,
    query: { enabled: Boolean(contractAddress && owner) },
  });
  return { ...result, data: result.data as bigint | undefined };
}

export function useOwnerOf(tokenId: bigint | undefined) {
  const request = nftApi.reads.ownerOf(tokenId ?? BigInt(0));
  const result = useReadContract({
    ...request,
    args: tokenId !== undefined ? request.args : undefined,
    query: { enabled: Boolean(contractAddress && tokenId !== undefined) },
  });
  return { ...result, data: result.data as Address | undefined };
}

export function useGetApproved(tokenId: bigint | undefined) {
  const request = nftApi.reads.getApproved(tokenId ?? BigInt(0));
  const result = useReadContract({
    ...request,
    args: tokenId !== undefined ? request.args : undefined,
    query: { enabled: Boolean(contractAddress && tokenId !== undefined) },
  });
  return { ...result, data: result.data as Address | undefined };
}

export function useNftWrite(onSuccess?: () => void) {
  const { writeContract, data: hash, isPending, error, reset } =
    useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) onSuccess?.();
  }, [isSuccess, onSuccess]);

  const busy = isPending || isConfirming;
  const statusLabel = isPending
    ? "Confirm in wallet…"
    : isConfirming
      ? "Waiting for confirmation…"
      : undefined;

  return {
    writeContract,
    hash,
    busy,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
    statusLabel,
  };
}

export function writeErrorMessage(error: Error | null | undefined) {
  if (!error) return undefined;
  return error instanceof BaseError ? error.shortMessage : error.message;
}
