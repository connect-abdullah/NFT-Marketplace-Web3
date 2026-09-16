import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatEther, type Address } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(addr: Address | string, chars = 4) {
  return `${addr.slice(0, 2 + chars)}…${addr.slice(-chars)}`;
}

export function formatEth(value: bigint) {
  const [whole, frac = ""] = formatEther(value).split(".");
  return `${whole}.${frac.slice(0, 4).padEnd(4, "0")} ETH`;
}
