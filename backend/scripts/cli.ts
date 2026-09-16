import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { ethers, type Contract, type Wallet } from "ethers";
import {
  attachMarket,
  attachNft,
  createProvider,
  createWallets,
  deployContracts,
  tokenIdFromMintReceipt,
} from "./nftSetup.ts";

type AppState = {
  provider: ethers.JsonRpcProvider;
  wallet1: Wallet;
  wallet2: Wallet;
  actor: 1 | 2;
  nftAddress: string | undefined;
  marketAddress: string | undefined;
};

type ListingRow = {
  seller: string;
  price: bigint;
  listed: boolean;
  timestamp: bigint;
};

function actorWallet(state: AppState): Wallet {
  return state.actor === 1 ? state.wallet1 : state.wallet2;
}

function requireNft(state: AppState): string {
  if (!state.nftAddress) {
    throw new Error("No NFT_ADDRESS. Deploy first (menu option 3).");
  }
  return state.nftAddress;
}

function requireMarket(state: AppState): string {
  if (!state.marketAddress) {
    throw new Error("No MARKET_ADDRESS. Deploy first (menu option 3).");
  }
  return state.marketAddress;
}

function nftFor(state: AppState, signer: Wallet): Contract {
  return attachNft(requireNft(state), signer);
}

function marketFor(state: AppState, signer: Wallet): Contract {
  return attachMarket(requireMarket(state), signer);
}

async function prompt(rl: readline.Interface, message: string): Promise<string> {
  return (await rl.question(message)).trim();
}

async function pickAddress(
  rl: readline.Interface,
  state: AppState,
  label: string
): Promise<string> {
  console.log(`  1) Wallet 1 (${state.wallet1.address})`);
  console.log(`  2) Wallet 2 (${state.wallet2.address})`);
  console.log("  3) Paste an address");
  const choice = await prompt(rl, `${label} [1/2/3]: `);
  if (choice === "1") return state.wallet1.address;
  if (choice === "2") return state.wallet2.address;
  if (choice === "3") {
    const pasted = await prompt(rl, "Address: ");
    if (!ethers.isAddress(pasted)) {
      throw new Error("Invalid address");
    }
    return ethers.getAddress(pasted);
  }
  throw new Error("Invalid choice");
}

function formatListing(listing: ListingRow): string {
  if (!listing.listed) return "not listed";
  return `listed ${ethers.formatEther(listing.price)} ETH seller=${listing.seller}`;
}

async function mintedTokenIds(contract: Contract): Promise<bigint[]> {
  const logs = await contract.queryFilter(
    contract.filters.Transfer(ethers.ZeroAddress)
  );
  const ids: bigint[] = [];
  for (const log of logs) {
    if (!("args" in log) || !log.args) continue;
    const tokenId = log.args.tokenId as bigint | undefined;
    if (tokenId !== undefined) ids.push(tokenId);
  }
  return ids;
}

async function readListing(market: Contract, tokenId: string | bigint) {
  return (await market.listings(tokenId)) as ListingRow;
}

async function printStatus(state: AppState) {
  console.log("\n--- Status ---");
  console.log("RPC:", process.env.RPC_URL);
  console.log("NFT:", state.nftAddress ?? "(not deployed)");
  console.log("Marketplace:", state.marketAddress ?? "(not deployed)");
  console.log("Actor: Wallet", state.actor, actorWallet(state).address);

  for (const [label, wallet] of [
    ["Wallet 1", state.wallet1],
    ["Wallet 2", state.wallet2],
  ] as const) {
    const eth = await state.provider.getBalance(wallet.address);
    let nft = "n/a";
    if (state.nftAddress) {
      const c = attachNft(state.nftAddress, state.wallet1);
      nft = (await c.balanceOf(wallet.address)).toString();
    }
    console.log(
      `${label}: ${wallet.address}\n  ETH: ${ethers.formatEther(eth)}\n  NFTs: ${nft}`
    );
  }

  if (state.nftAddress && state.marketAddress) {
    const nft = attachNft(state.nftAddress, state.wallet1);
    const market = attachMarket(state.marketAddress, state.wallet1);
    const ids = await mintedTokenIds(nft);
    console.log("Total minted:", ids.length.toString());
    if (ids.length > 0) {
      console.log("Tokens:");
      for (const id of ids) {
        const owner: string = await nft.ownerOf(id);
        const approved: string = await nft.getApproved(id);
        const operator: boolean = await nft.isApprovedForAll(
          owner,
          state.marketAddress
        );
        const listing = await readListing(market, id);
        const tokenApproved = approved === state.marketAddress;
        console.log(
          `  #${id} owner=${owner} approved=${approved === ethers.ZeroAddress ? "(none)" : approved} marketOperator=${operator || tokenApproved} ${formatListing(listing)}`
        );
      }
    }
    const marketBalance: bigint = await market.getMarketplaceBalance();
    console.log("Marketplace ETH:", ethers.formatEther(marketBalance));
  }
}

async function doMint(state: AppState) {
  const wallet = actorWallet(state);
  const c = nftFor(state, wallet);
  const tx = await c.mint();
  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error("Mint transaction was not mined");
  }
  const tokenId = tokenIdFromMintReceipt(c, receipt);
  console.log("Minted token", tokenId ?? "(unknown)", "to", wallet.address);
  console.log("Tx:", receipt.hash);
}

async function doOwnerOf(rl: readline.Interface, state: AppState) {
  const tokenId = await prompt(rl, "tokenId: ");
  const c = nftFor(state, state.wallet1);
  const owner: string = await c.ownerOf(tokenId);
  console.log("Owner:", owner);
}

async function doGetApproved(rl: readline.Interface, state: AppState) {
  const tokenId = await prompt(rl, "tokenId: ");
  const c = nftFor(state, state.wallet1);
  const approved: string = await c.getApproved(tokenId);
  console.log(
    "Approved:",
    approved === ethers.ZeroAddress ? "(none)" : approved
  );
  if (state.nftAddress && state.marketAddress) {
    const owner: string = await c.ownerOf(tokenId);
    const operator: boolean = await c.isApprovedForAll(owner, state.marketAddress);
    console.log("Marketplace operator (setApprovalForAll):", operator);
  }
}

async function doBalanceOf(rl: readline.Interface, state: AppState) {
  const owner = await pickAddress(rl, state, "Whose balance");
  const c = nftFor(state, state.wallet1);
  const bal: bigint = await c.balanceOf(owner);
  console.log("Balance:", bal.toString());
}

async function doApproveWallet(rl: readline.Interface, state: AppState) {
  const tokenId = await prompt(rl, "tokenId: ");
  const to = await pickAddress(rl, state, "Approve to");
  const wallet = actorWallet(state);
  const c = nftFor(state, wallet);
  const tx = await c.approve(to, tokenId);
  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error("Approve transaction was not mined");
  }
  console.log("Approved token", tokenId, "to", to);
  console.log("Tx:", receipt.hash);
}

async function doApproveMarketplace(state: AppState) {
  const wallet = actorWallet(state);
  const nft = nftFor(state, wallet);
  const market = requireMarket(state);
  const tx = await nft.setApprovalForAll(market, true);
  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error("Approve marketplace transaction was not mined");
  }
  console.log("Approved marketplace", market, "for all NFTs of", wallet.address);
  console.log("Tx:", receipt.hash);
}

async function doTransfer(rl: readline.Interface, state: AppState) {
  const tokenId = await prompt(rl, "tokenId: ");
  const from = await pickAddress(rl, state, "From");
  const to = await pickAddress(rl, state, "To");
  const wallet = actorWallet(state);
  const c = nftFor(state, wallet);
  const tx = await c.transferFrom(from, to, tokenId);
  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error("Transfer transaction was not mined");
  }
  console.log("Transferred token", tokenId, "from", from, "to", to);
  console.log("Sender (actor):", wallet.address);
  console.log("Tx:", receipt.hash);
}

async function doList(rl: readline.Interface, state: AppState) {
  const tokenId = await prompt(rl, "tokenId: ");
  const priceRaw = await prompt(rl, "Price in ETH: ");
  const price = ethers.parseEther(priceRaw);
  if (price <= 0n) {
    throw new Error("Price must be greater than 0");
  }
  const wallet = actorWallet(state);
  const c = marketFor(state, wallet);
  const tx = await c.listNFT(tokenId, price);
  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error("List transaction was not mined");
  }
  console.log("Listed token", tokenId, "for", ethers.formatEther(price), "ETH");
  console.log("Tx:", receipt.hash);
}

async function doUnlist(rl: readline.Interface, state: AppState) {
  const tokenId = await prompt(rl, "tokenId: ");
  const wallet = actorWallet(state);
  const c = marketFor(state, wallet);
  const tx = await c.unlistNFT(tokenId);
  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error("Unlist transaction was not mined");
  }
  console.log("Unlisted token", tokenId);
  console.log("Tx:", receipt.hash);
}

async function doBuy(rl: readline.Interface, state: AppState) {
  const tokenId = await prompt(rl, "tokenId: ");
  const wallet = actorWallet(state);
  const c = marketFor(state, wallet);
  const listing = await readListing(c, tokenId);
  if (!listing.listed) {
    throw new Error("Token is not listed");
  }
  const tx = await c.buyNFT(tokenId, { value: listing.price });
  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error("Buy transaction was not mined");
  }
  console.log(
    "Bought token",
    tokenId,
    "for",
    ethers.formatEther(listing.price),
    "ETH"
  );
  console.log("Tx:", receipt.hash);
}

async function doListingOf(rl: readline.Interface, state: AppState) {
  const tokenId = await prompt(rl, "tokenId: ");
  const c = marketFor(state, state.wallet1);
  const listing = await readListing(c, tokenId);
  console.log("Listing:", formatListing(listing));
  if (listing.listed) {
    console.log("Timestamp:", listing.timestamp.toString());
  }
}

function printMenu() {
  console.log(`
=== NFT Marketplace CLI ===
1) Status
2) Choose actor (Wallet 1 or 2)
3) Deploy
4) Mint
5) Owner of
6) Get approved
7) Balance of
8) Approve wallet
9) Approve marketplace
10) Transfer
11) List NFT
12) Unlist NFT
13) Buy NFT
14) Listing of
0) Exit
`);
}

async function main() {
  const provider = createProvider();
  const { wallet1, wallet2 } = createWallets(provider);
  const state: AppState = {
    provider,
    wallet1,
    wallet2,
    actor: 1,
    nftAddress: process.env.NFT_ADDRESS,
    marketAddress: process.env.MARKET_ADDRESS,
  };

  const rl = readline.createInterface({ input, output });

  console.log("Wallet 1:", wallet1.address);
  console.log("Wallet 2:", wallet2.address);

  try {
    while (true) {
      printMenu();
      const choice = await prompt(rl, "Select: ");
      try {
        switch (choice) {
          case "1":
            await printStatus(state);
            break;
          case "2": {
            const pick = await prompt(rl, "Actor [1/2]: ");
            if (pick !== "1" && pick !== "2") {
              throw new Error("Actor must be 1 or 2");
            }
            state.actor = pick === "1" ? 1 : 2;
            console.log("Actor is Wallet", state.actor, actorWallet(state).address);
            break;
          }
          case "3": {
            const wallet = actorWallet(state);
            const { nft, market } = await deployContracts(wallet);
            state.nftAddress = await nft.getAddress();
            state.marketAddress = await market.getAddress();
            console.log("Deployer:", wallet.address);
            console.log("NFT:", state.nftAddress);
            console.log("Marketplace:", state.marketAddress);
            break;
          }
          case "4":
            await doMint(state);
            break;
          case "5":
            await doOwnerOf(rl, state);
            break;
          case "6":
            await doGetApproved(rl, state);
            break;
          case "7":
            await doBalanceOf(rl, state);
            break;
          case "8":
            await doApproveWallet(rl, state);
            break;
          case "9":
            await doApproveMarketplace(state);
            break;
          case "10":
            await doTransfer(rl, state);
            break;
          case "11":
            await doList(rl, state);
            break;
          case "12":
            await doUnlist(rl, state);
            break;
          case "13":
            await doBuy(rl, state);
            break;
          case "14":
            await doListingOf(rl, state);
            break;
          case "0":
            return;
          default:
            console.log("Unknown option");
        }
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
      }
    }
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
