import type { Address } from "viem";
import { getAddress, isAddress, parseEther } from "viem";

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

export function parseEthAmount(raw: string): bigint | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  try {
    const value = parseEther(trimmed);
    return value > BigInt(0) ? value : undefined;
  } catch {
    return undefined;
  }
}
