import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Address } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(addr: Address | string, chars = 4) {
  return `${addr.slice(0, 2 + chars)}…${addr.slice(-chars)}`;
}
