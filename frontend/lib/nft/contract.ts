import type { Abi, Address } from "viem";
import { getAddress, isAddress } from "viem";
import artifact from "@/abi/MarketNFT.json";

export const nftAbi = artifact.abi as Abi;

const raw = process.env.NEXT_PUBLIC_NFT_ADDRESS ?? "";

export const nftAddress: Address | undefined = isAddress(raw)
  ? getAddress(raw)
  : undefined;
