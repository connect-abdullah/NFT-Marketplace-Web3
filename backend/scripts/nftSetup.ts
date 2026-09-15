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
export const artifactPath = path.join(
  backendRoot,
  "artifacts/contracts/MyNft.sol/MyNft.json"
);

dotenv.config({ path: repoEnvPath, quiet: true });
dotenv.config({ path: backendEnvPath, quiet: true });

export type NftArtifact = {
  abi: InterfaceAbi;
  bytecode: string;
};

export function loadArtifact(): NftArtifact {
  if (!fs.existsSync(artifactPath)) {
    throw new Error(
      `Artifact not found at ${artifactPath}. Run \`npm run compile\` from backend/ first.`
    );
  }

  return JSON.parse(fs.readFileSync(artifactPath, "utf-8")) as NftArtifact;
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
  const { abi } = loadArtifact();
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

export function saveContractAddress(address: string) {
  if (fs.existsSync(repoEnvPath)) {
    upsertEnv("CONTRACT_ADDRESS", address, repoEnvPath);
  }
  if (fs.existsSync(backendEnvPath)) {
    upsertEnv("CONTRACT_ADDRESS", address, backendEnvPath);
  }
  if (!fs.existsSync(repoEnvPath) && !fs.existsSync(backendEnvPath)) {
    upsertEnv("CONTRACT_ADDRESS", address, backendEnvPath);
  }

  const rpc = process.env.RPC_URL ?? "http://127.0.0.1:8545";
  upsertEnv("NEXT_PUBLIC_CONTRACT_ADDRESS", address, frontendEnvPath);
  upsertEnv("NEXT_PUBLIC_RPC_URL", rpc, frontendEnvPath);
}

export async function deployNft(wallet: Wallet): Promise<Contract> {
  const artifact = loadArtifact();
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  saveContractAddress(address);
  return contract;
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
      if (parsed?.name === "Transfer") {
        return parsed.args.tokenId.toString();
      }
    } catch {
      // ignore unrelated logs
    }
  }
  return undefined;
}
