import type { Address } from "viem";
import { targetChain } from "@/lib/wagmi";
import { nftAbi, nftAddress } from "@/lib/nft/contract";

export function withContract<T extends { address: Address | undefined }>(
  call: T
): T & { address: Address } {
  if (!call.address) {
    throw new Error("Contract address is not configured.");
  }
  return { ...call, address: call.address };
}

const base = {
  address: nftAddress,
  abi: nftAbi,
} as const;

export const nftApi = {
  reads: {
    ownerOf: (tokenId: bigint) => ({
      ...base,
      functionName: "ownerOf" as const,
      args: [tokenId] as const,
    }),
    balanceOf: (owner: Address) => ({
      ...base,
      functionName: "balanceOf" as const,
      args: [owner] as const,
    }),
    getApproved: (tokenId: bigint) => ({
      ...base,
      functionName: "getApproved" as const,
      args: [tokenId] as const,
    }),
    isApprovedForAll: (owner: Address, operator: Address) => ({
      ...base,
      functionName: "isApprovedForAll" as const,
      args: [owner, operator] as const,
    }),
  },
  writes: {
    mint: () => ({
      ...base,
      functionName: "mint" as const,
      chainId: targetChain.id,
    }),
    approve: (to: Address, tokenId: bigint) => ({
      ...base,
      functionName: "approve" as const,
      args: [to, tokenId] as const,
      chainId: targetChain.id,
    }),
    setApprovalForAll: (operator: Address, approved: boolean) => ({
      ...base,
      functionName: "setApprovalForAll" as const,
      args: [operator, approved] as const,
      chainId: targetChain.id,
    }),
    transferFrom: (from: Address, to: Address, tokenId: bigint) => ({
      ...base,
      functionName: "transferFrom" as const,
      args: [from, to, tokenId] as const,
      chainId: targetChain.id,
    }),
  },
};
