import { ethers, type Contract, type InterfaceAbi, type Wallet } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
export const backendRoot = path.resolve(scriptsDir, "..");
export const repoRoot = path.resolve(backendRoot, "..");
export const repoEnvPath = path.join(repoRoot, ".env");
export const backendEnvPath = path.join(backendRoot, ".env");
export const frontendEnvPath = path.join(repoRoot, "frontend", ".env.local");
export const nftArtifactPath = path.join(
  backendRoot,
  "artifacts/contracts/MarketNFT.sol/MarketNFT.json"
);
export const marketArtifactPath = path.join(
  backendRoot,
  "artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json"
);

dotenv.config({ path: repoEnvPath, quiet: true });
dotenv.config({ path: backendEnvPath, quiet: true });

export type ContractArtifact = {
  abi: InterfaceAbi;
  bytecode: string;
};

function loadArtifact(artifactPath: string, label: string): ContractArtifact {
  if (!fs.existsSync(artifactPath)) {
    throw new Error(
      `Artifact not found at ${artifactPath}. Run \`npm run compile\` from backend/ first. (${label})`
    );
  }

  return JSON.parse(fs.readFileSync(artifactPath, "utf-8")) as ContractArtifact;
}

export function loadNftArtifact(): ContractArtifact {
  return loadArtifact(nftArtifactPath, "MarketNFT");
}

export function loadMarketArtifact(): ContractArtifact {
  return loadArtifact(marketArtifactPath, "NFTMarketplace");
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} in .env`);
  }
  return value;
}

export function createProvider() {
  return new ethers.JsonRpcProvider(requireEnv("RPC_URL"));
}

export function createWallets(provider: ethers.JsonRpcProvider): {
  wallet1: Wallet;
  wallet2: Wallet;
} {
  return {
    wallet1: new ethers.Wallet(requireEnv("PRIVATE_KEY"), provider),
    wallet2: new ethers.Wallet(requireEnv("PRIVATE_KEY_2"), provider),
  };
}

export function attachNft(address: string, signer: Wallet): Contract {
  const { abi } = loadNftArtifact();
  return new ethers.Contract(address, abi, signer);
}

export function attachMarket(address: string, signer: Wallet): Contract {
  const { abi } = loadMarketArtifact();
  return new ethers.Contract(address, abi, signer);
}

export function upsertEnv(key: string, value: string, envPath: string) {
  let content = "";
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf-8");
  }

  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) {
    content = content.replace(re, line);
  } else {
    const trimmed = content.replace(/\s*$/, "");
    content = trimmed ? `${trimmed}\n${line}\n` : `${line}\n`;
  }

  fs.writeFileSync(envPath, content);
  process.env[key] = value;
}

function upsertBackendEnv(key: string, value: string) {
  if (fs.existsSync(repoEnvPath)) {
    upsertEnv(key, value, repoEnvPath);
  }
  if (fs.existsSync(backendEnvPath)) {
    upsertEnv(key, value, backendEnvPath);
  }
  if (!fs.existsSync(repoEnvPath) && !fs.existsSync(backendEnvPath)) {
    upsertEnv(key, value, backendEnvPath);
  }
}

export function saveDeployedAddresses(nftAddress: string, marketAddress: string) {
  upsertBackendEnv("NFT_ADDRESS", nftAddress);
  upsertBackendEnv("MARKET_ADDRESS", marketAddress);

  const rpc = process.env.RPC_URL ?? "http://127.0.0.1:8545";
  upsertEnv("NEXT_PUBLIC_NFT_ADDRESS", nftAddress, frontendEnvPath);
  upsertEnv("NEXT_PUBLIC_MARKET_ADDRESS", marketAddress, frontendEnvPath);
  upsertEnv("NEXT_PUBLIC_RPC_URL", rpc, frontendEnvPath);
}

async function deployWithExplicitNonce(
  factory: ethers.ContractFactory,
  nonce: number,
  ...args: unknown[]
): Promise<{ contract: Contract; nextNonce: number }> {
  const contract = await factory.deploy(...args, { nonce });
  const deployTx = contract.deploymentTransaction();
  if (!deployTx) {
    throw new Error("Deployment transaction was not created");
  }
  await deployTx.wait(1);
  return { contract, nextNonce: nonce + 1 };
}

export async function deployContracts(wallet: Wallet): Promise<{
  nft: Contract;
  market: Contract;
}> {
  let nonce = await wallet.getNonce("pending");

  const nftArtifact = loadNftArtifact();
  const nftFactory = new ethers.ContractFactory(
    nftArtifact.abi,
    nftArtifact.bytecode,
    wallet
  );
  const nftDeploy = await deployWithExplicitNonce(nftFactory, nonce);
  nonce = nftDeploy.nextNonce;
  const nft = nftDeploy.contract;
  const nftAddress = await nft.getAddress();

  const marketArtifact = loadMarketArtifact();
  const marketFactory = new ethers.ContractFactory(
    marketArtifact.abi,
    marketArtifact.bytecode,
    wallet
  );
  const marketDeploy = await deployWithExplicitNonce(
    marketFactory,
    nonce,
    nftAddress
  );
  const market = marketDeploy.contract;
  const marketAddress = await market.getAddress();

  saveDeployedAddresses(nftAddress, marketAddress);
  return { nft, market };
}

export function tokenIdFromMintReceipt(
  contract: Contract,
  receipt: ethers.TransactionReceipt
): string | undefined {
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });
      if (
        parsed?.name === "Transfer" &&
        parsed.args.from === ethers.ZeroAddress
      ) {
        return parsed.args.tokenId.toString();
      }
    } catch {
      // ignore unrelated logs
    }
  }
  return undefined;
}
