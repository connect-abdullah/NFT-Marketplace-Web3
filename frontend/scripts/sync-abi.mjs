import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifacts = [
  {
    artifactPath: path.resolve(
      frontendRoot,
      "../backend/artifacts/contracts/MarketNFT.sol/MarketNFT.json"
    ),
    outPath: path.join(frontendRoot, "abi/MarketNFT.json"),
  },
  {
    artifactPath: path.resolve(
      frontendRoot,
      "../backend/artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json"
    ),
    outPath: path.join(frontendRoot, "abi/NFTMarketplace.json"),
  },
];

for (const { artifactPath, outPath } of artifacts) {
  if (!fs.existsSync(artifactPath)) {
    console.error(
      `Artifact not found at ${artifactPath}. Run \`npm run compile\` from backend/ first.`
    );
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  if (!Array.isArray(artifact.abi)) {
    console.error(`Artifact is missing an abi array: ${artifactPath}`);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify({ abi: artifact.abi }, null, 2)}\n`);
  console.log(`Wrote ${path.relative(frontendRoot, outPath)}`);
}
