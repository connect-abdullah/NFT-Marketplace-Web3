import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { ethers, type Contract, type Wallet } from "ethers";
import {
  attachNft,
  createProvider,
  createWallets,
  deployNft,
  tokenIdFromMintReceipt,
} from "./nftSetup.ts";

type AppState = {
  provider: ethers.JsonRpcProvider;
  wallet1: Wallet;
  wallet2: Wallet;
  actor: 1 | 2;
  contractAddress: string | undefined;
};

function actorWallet(state: AppState): Wallet {
  return state.actor === 1 ? state.wallet1 : state.wallet2;
}

function requireContract(state: AppState): string {
  if (!state.contractAddress) {
    throw new Error("No CONTRACT_ADDRESS. Deploy first (menu option 3).");
  }
  return state.contractAddress;
}

function contractFor(state: AppState, signer: Wallet): Contract {
  return attachNft(requireContract(state), signer);
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

async function printStatus(state: AppState) {
  console.log("\n--- Status ---");
  console.log("RPC:", process.env.RPC_URL);
  console.log("Contract:", state.contractAddress ?? "(not deployed)");
  console.log("Actor: Wallet", state.actor, actorWallet(state).address);

  for (const [label, wallet] of [
    ["Wallet 1", state.wallet1],
    ["Wallet 2", state.wallet2],
  ] as const) {
    const eth = await state.provider.getBalance(wallet.address);
    let nft = "n/a";
    if (state.contractAddress) {
      const c = attachNft(state.contractAddress, state.wallet1);
      nft = (await c.balanceOf(wallet.address)).toString();
    }
    console.log(
      `${label}: ${wallet.address}\n  ETH: ${ethers.formatEther(eth)}\n  NFTs: ${nft}`
    );
  }

  if (state.contractAddress) {
    const c = attachNft(state.contractAddress, state.wallet1);
    const minted: bigint = await c.totalMinted();
    console.log("Total minted:", minted.toString());
    if (minted > 0n) {
      console.log("Tokens:");
      for (let i = 0n; i < minted; i++) {
        const owner: string = await c.ownerOf(i);
        const approved: string = await c.getApproved(i);
        console.log(
          `  #${i} owner=${owner} approved=${approved === ethers.ZeroAddress ? "(none)" : approved}`
        );
      }
    }
  }
}

async function doMint(state: AppState) {
  const wallet = actorWallet(state);
  const c = contractFor(state, wallet);
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
  const c = contractFor(state, state.wallet1);
  const owner: string = await c.ownerOf(tokenId);
  console.log("Owner:", owner);
}

async function doGetApproved(rl: readline.Interface, state: AppState) {
  const tokenId = await prompt(rl, "tokenId: ");
  const c = contractFor(state, state.wallet1);
  const approved: string = await c.getApproved(tokenId);
  console.log(
    "Approved:",
    approved === ethers.ZeroAddress ? "(none)" : approved
  );
}

async function doBalanceOf(rl: readline.Interface, state: AppState) {
  const owner = await pickAddress(rl, state, "Whose balance");
  const c = contractFor(state, state.wallet1);
  const bal: bigint = await c.balanceOf(owner);
  console.log("Balance:", bal.toString());
}

async function doApprove(rl: readline.Interface, state: AppState) {
  const tokenId = await prompt(rl, "tokenId: ");
  const to = await pickAddress(rl, state, "Approve to");
  const wallet = actorWallet(state);
  const c = contractFor(state, wallet);
  const tx = await c.approve(to, tokenId);
  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error("Approve transaction was not mined");
  }
  console.log("Approved token", tokenId, "to", to);
  console.log("Tx:", receipt.hash);
}

async function doTransfer(rl: readline.Interface, state: AppState) {
  const tokenId = await prompt(rl, "tokenId: ");
  const from = await pickAddress(rl, state, "From");
  const to = await pickAddress(rl, state, "To");
  const wallet = actorWallet(state);
  const c = contractFor(state, wallet);
  const tx = await c.transferFrom(from, to, tokenId);
  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error("Transfer transaction was not mined");
  }
  console.log("Transferred token", tokenId, "from", from, "to", to);
  console.log("Sender (actor):", wallet.address);
  console.log("Tx:", receipt.hash);
}

function printMenu() {
  console.log(`
=== MyNft CLI ===
1) Status
2) Choose actor (Wallet 1 or 2)
3) Deploy
4) Mint
5) Owner of
6) Get approved
7) Balance of
8) Approve
9) Transfer
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
    contractAddress: process.env.CONTRACT_ADDRESS,
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
            const contract = await deployNft(wallet);
            state.contractAddress = await contract.getAddress();
            console.log("Deployer:", wallet.address);
            console.log("Contract:", state.contractAddress);
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
            await doApprove(rl, state);
            break;
          case "9":
            await doTransfer(rl, state);
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
