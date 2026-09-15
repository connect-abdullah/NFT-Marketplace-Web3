import { createConfig, http } from "wagmi";
import { anvil } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const targetChain = anvil;

export const config = createConfig({
  chains: [targetChain],
  connectors: [
    injected({
      shimDisconnect: true,
      unstable_shimAsyncInject: 2_000,
    }),
  ],
  ssr: true,
  transports: {
    [targetChain.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545"
    ),
  },
});
