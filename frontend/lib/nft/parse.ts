import type { Address } from "viem";
import { getAddress, isAddress } from "viem";

export function parseTokenId(raw: string): bigint | undefined {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return undefined;
  return BigInt(trimmed);
}

export function parseAddress(raw: string): Address | undefined {
  const trimmed = raw.trim();
  if (!isAddress(trimmed)) return undefined;
  return getAddress(trimmed);
}
