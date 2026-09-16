"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Address } from "viem";
import { BaseError, zeroAddress } from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
  useWriteContract,
} from "wagmi";
import { marketApi } from "@/lib/market/api";
import {
  mapListing,
  marketAbi,
  marketAddress,
  type Listing,
} from "@/lib/market/contract";
import { nftApi } from "@/lib/nft/api";
import { nftAbi, nftAddress } from "@/lib/nft/contract";
import { sameAddress } from "@/lib/nft/gates";

const fallbackOwner = "0x0000000000000000000000000000000000000001" as Address;
const fallbackOperator = "0x0000000000000000000000000000000000000002" as Address;
const mintedQueryKey = ["nft", "minted", nftAddress] as const;

export type TokenRecord = {
  tokenId: bigint;
  owner: Address | undefined;
  approved: Address | undefined;
  operatorApproved: boolean;
  marketApproved: boolean;
  listing: Listing | undefined;
};

export function useBalanceOf(owner: Address | undefined) {
  const request = nftApi.reads.balanceOf(owner ?? fallbackOwner);
  const result = useReadContract({
    ...request,
    args: owner ? request.args : undefined,
    query: { enabled: Boolean(nftAddress && owner) },
  });
  return { ...result, data: result.data as bigint | undefined };
}

export function useOwnerOf(tokenId: bigint | undefined) {
  const request = nftApi.reads.ownerOf(tokenId ?? BigInt(0));
  const result = useReadContract({
    ...request,
    args: tokenId !== undefined ? request.args : undefined,
    query: { enabled: Boolean(nftAddress && tokenId !== undefined) },
  });
  return { ...result, data: result.data as Address | undefined };
}

export function useGetApproved(tokenId: bigint | undefined) {
  const request = nftApi.reads.getApproved(tokenId ?? BigInt(0));
  const result = useReadContract({
    ...request,
    args: tokenId !== undefined ? request.args : undefined,
    query: { enabled: Boolean(nftAddress && tokenId !== undefined) },
  });
  return { ...result, data: result.data as Address | undefined };
}

export function useListings(tokenId: bigint | undefined) {
  const request = marketApi.reads.listings(tokenId ?? BigInt(0));
  const result = useReadContract({
    ...request,
    args: tokenId !== undefined ? request.args : undefined,
    query: { enabled: Boolean(marketAddress && tokenId !== undefined) },
  });
  return { ...result, data: mapListing(result.data) };
}

export function useMarketplaceBalance() {
  const result = useReadContract({
    ...marketApi.reads.getMarketplaceBalance(),
    query: { enabled: Boolean(marketAddress) },
  });
  return { ...result, data: result.data as bigint | undefined };
}

export function useMintedTokenIds() {
  const client = usePublicClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: mintedQueryKey,
    enabled: Boolean(nftAddress && client),
    queryFn: async () => {
      if (!client || !nftAddress) return [] as bigint[];
      const logs = await client.getContractEvents({
        address: nftAddress,
        abi: nftAbi,
        eventName: "Transfer",
        args: { from: zeroAddress },
        fromBlock: BigInt(0),
        toBlock: "latest",
      });
      const ids: bigint[] = [];
      for (const log of logs) {
        const tokenId = (log.args as { tokenId?: bigint } | undefined)?.tokenId;
        if (tokenId !== undefined) ids.push(tokenId);
      }
      return ids;
    },
  });

  function invalidateMinted() {
    void queryClient.invalidateQueries({ queryKey: mintedQueryKey });
  }

  useWatchContractEvent({
    address: nftAddress,
    abi: nftAbi,
    eventName: "Transfer",
    args: { from: zeroAddress },
    enabled: Boolean(nftAddress),
    onLogs: invalidateMinted,
  });

  return query;
}

export function useTokenCatalog(tokenIds: bigint[] | undefined) {
  const ids = tokenIds ?? [];
  const nftReady = Boolean(nftAddress && ids.length > 0);
  const marketReady = Boolean(marketAddress && ids.length > 0);

  const owners = useReadContracts({
    contracts: ids.map((tokenId) => nftApi.reads.ownerOf(tokenId)),
    query: { enabled: nftReady },
  });
  const approved = useReadContracts({
    contracts: ids.map((tokenId) => nftApi.reads.getApproved(tokenId)),
    query: { enabled: nftReady },
  });
  const listings = useReadContracts({
    contracts: ids.map((tokenId) => marketApi.reads.listings(tokenId)),
    query: { enabled: marketReady },
  });

  const ownersReady = Boolean(owners.data && marketAddress);
  const operators = useReadContracts({
    contracts: ids.map((_, index) => {
      const ownerResult = owners.data?.[index];
      const owner =
        ownerResult?.status === "success"
          ? (ownerResult.result as Address)
          : fallbackOwner;
      return nftApi.reads.isApprovedForAll(
        owner,
        marketAddress ?? fallbackOperator
      );
    }),
    query: { enabled: ownersReady },
  });

  const records: TokenRecord[] = ids.map((tokenId, index) => {
    const ownerResult = owners.data?.[index];
    const approvedResult = approved.data?.[index];
    const listingResult = listings.data?.[index];
    const operatorResult = operators.data?.[index];
    const owner =
      ownerResult?.status === "success"
        ? (ownerResult.result as Address)
        : undefined;
    const approvedAddr =
      approvedResult?.status === "success"
        ? (approvedResult.result as Address)
        : undefined;
    const operatorApproved =
      operatorResult?.status === "success"
        ? Boolean(operatorResult.result)
        : false;
    const tokenApproved = Boolean(
      marketAddress &&
        approvedAddr &&
        !isZeroAddress(approvedAddr) &&
        sameAddress(approvedAddr, marketAddress)
    );
    return {
      tokenId,
      owner,
      approved: approvedAddr,
      operatorApproved,
      marketApproved: operatorApproved || tokenApproved,
      listing:
        listingResult?.status === "success"
          ? mapListing(listingResult.result)
          : undefined,
    };
  });

  const refetch = useCallback(() => {
    void owners.refetch();
    void approved.refetch();
    void listings.refetch();
    void operators.refetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- depend on refetch fns only
  }, [owners.refetch, approved.refetch, listings.refetch, operators.refetch]);

  return {
    records,
    refetch,
    isLoading:
      nftReady &&
      (owners.isLoading ||
        approved.isLoading ||
        listings.isLoading ||
        operators.isLoading),
    isError:
      owners.isError ||
      approved.isError ||
      listings.isError ||
      operators.isError,
  };
}

export function useMarketplaceEvents(onChange: () => void) {
  const nftEnabled = Boolean(nftAddress);
  const marketEnabled = Boolean(marketAddress);

  useWatchContractEvent({
    address: marketAddress,
    abi: marketAbi,
    eventName: "NFTListed",
    enabled: marketEnabled,
    onLogs: onChange,
  });
  useWatchContractEvent({
    address: marketAddress,
    abi: marketAbi,
    eventName: "NFTUnlisted",
    enabled: marketEnabled,
    onLogs: onChange,
  });
  useWatchContractEvent({
    address: marketAddress,
    abi: marketAbi,
    eventName: "NFTBought",
    enabled: marketEnabled,
    onLogs: onChange,
  });
  useWatchContractEvent({
    address: nftAddress,
    abi: nftAbi,
    eventName: "Transfer",
    enabled: nftEnabled,
    onLogs: onChange,
  });
  useWatchContractEvent({
    address: nftAddress,
    abi: nftAbi,
    eventName: "Approval",
    enabled: nftEnabled,
    onLogs: onChange,
  });
  useWatchContractEvent({
    address: nftAddress,
    abi: nftAbi,
    eventName: "ApprovalForAll",
    enabled: nftEnabled,
    onLogs: onChange,
  });
}

export function useNftWrite(onSuccess?: () => void): {
  writeContract: (params: unknown) => void;
  hash: `0x${string}` | undefined;
  busy: boolean;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: Error | null | undefined;
  reset: () => void;
  statusLabel: string | undefined;
} {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContract: sendWrite, data: hash, isPending, error, reset } =
    useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (isSuccess) onSuccessRef.current?.();
  }, [isSuccess]);

  const writeContract = useCallback(
    (params: unknown) => {
      void (async () => {
        const payload =
          params !== null && typeof params === "object" ? params : {};
        if (!publicClient || !address) {
          sendWrite(payload as never);
          return;
        }
        try {
          const nonce = await publicClient.getTransactionCount({
            address,
            blockTag: "pending",
          });
          sendWrite({ ...payload, nonce } as never);
        } catch {
          sendWrite(payload as never);
        }
      })();
    },
    [address, publicClient, sendWrite]
  );

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
    error: error ?? receiptError,
    reset,
    statusLabel,
  };
}

export function isNonceRelatedError(error: Error | null | undefined) {
  if (!error) return false;
  const text =
    error instanceof BaseError
      ? `${error.shortMessage} ${error.message}`.toLowerCase()
      : error.message.toLowerCase();
  return (
    text.includes("nonce") ||
    text.includes("nonce too low") ||
    text.includes("already been used")
  );
}

export function writeErrorMessage(error: Error | null | undefined) {
  if (!error) return undefined;
  if (isNonceRelatedError(error)) {
    return "Transaction rejected: wallet nonce is out of sync with Anvil. Reset the MetaMask account for localhost (see alert above), then retry.";
  }
  return error instanceof BaseError ? error.shortMessage : error.message;
}

export function isZeroAddress(value: Address | undefined) {
  return !value || value === zeroAddress;
}
