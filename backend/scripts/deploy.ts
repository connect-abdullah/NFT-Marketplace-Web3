import { createProvider, createWallets, deployContracts } from "./nftSetup.ts";

async function main() {
  const provider = createProvider();
  const { wallet1 } = createWallets(provider);
  const { nft, market } = await deployContracts(wallet1);

  console.log("Deployer:", wallet1.address);
  console.log("NFT:", await nft.getAddress());
  console.log("Marketplace:", await market.getAddress());
  console.log("Saved NFT_ADDRESS and MARKET_ADDRESS to .env");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
