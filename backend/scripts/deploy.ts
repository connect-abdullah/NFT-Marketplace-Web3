import { createProvider, createWallets, deployNft } from "./nftSetup.ts";

async function main() {
  const provider = createProvider();
  const { wallet1 } = createWallets(provider);
  const contract = await deployNft(wallet1);

  console.log("Deployer:", wallet1.address);
  console.log("Contract:", await contract.getAddress());
  console.log("Saved CONTRACT_ADDRESS to .env");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
