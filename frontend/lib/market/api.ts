import type { Address } from "viem";
import { targetChain } from "@/lib/wagmi";
import { marketAbi, marketAddress } from "@/lib/market/contract";

export function withMarket<T extends { address: Address | undefined }>(
  call: T
): T & { address: Address } {
  if (!call.address) {
    throw new Error("Marketplace address is not configured.");
  }
  return { ...call, address: call.address };
}

const base = {
  address: marketAddress,
  abi: marketAbi,
} as const;

export const marketApi = {
  reads: {
    listings: (tokenId: bigint) => ({
      ...base,
      functionName: "listings" as const,
      args: [tokenId] as const,
    }),
    getMarketplaceBalance: () => ({
      ...base,
      functionName: "getMarketplaceBalance" as const,
    }),
  },
  writes: {
    listNFT: (tokenId: bigint, price: bigint) => ({
      ...base,
      functionName: "listNFT" as const,
      args: [tokenId, price] as const,
      chainId: targetChain.id,
    }),
    unlistNFT: (tokenId: bigint) => ({
      ...base,
      functionName: "unlistNFT" as const,
      args: [tokenId] as const,
      chainId: targetChain.id,
    }),
    buyNFT: (tokenId: bigint, value: bigint) => ({
      ...base,
      functionName: "buyNFT" as const,
      args: [tokenId] as const,
      value,
      chainId: targetChain.id,
    }),
  },
};
