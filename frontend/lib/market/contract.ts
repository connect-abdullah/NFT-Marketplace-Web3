import type { Abi, Address } from "viem";
import { getAddress, isAddress } from "viem";
import artifact from "@/abi/NFTMarketplace.json";

export const marketAbi = artifact.abi as Abi;

const raw = process.env.NEXT_PUBLIC_MARKET_ADDRESS ?? "";

export const marketAddress: Address | undefined = isAddress(raw)
  ? getAddress(raw)
  : undefined;

export type Listing = {
  seller: Address;
  price: bigint;
  listed: boolean;
  timestamp: bigint;
};

export function mapListing(data: unknown): Listing | undefined {
  if (data == null) return undefined;

  if (Array.isArray(data) && data.length >= 4) {
    return {
      seller: data[0] as Address,
      price: data[1] as bigint,
      listed: Boolean(data[2]),
      timestamp: data[3] as bigint,
    };
  }

  if (typeof data === "object") {
    const row = data as {
      seller?: Address;
      price?: bigint;
      listed?: boolean;
      timestamp?: bigint;
    };
    if (
      row.seller === undefined ||
      row.price === undefined ||
      row.listed === undefined ||
      row.timestamp === undefined
    ) {
      return undefined;
    }
    return {
      seller: row.seller,
      price: row.price,
      listed: row.listed,
      timestamp: row.timestamp,
    };
  }

  return undefined;
}
