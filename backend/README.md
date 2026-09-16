# Backend

Hardhat 3 project with two Solidity contracts: `MarketNFT` (custom ERC-721) and `NFTMarketplace`.

- `npm run compile` — compile `contracts/MarketNFT.sol` and `contracts/NFTMarketplace.sol`
- `npm run deploy` — deploy both to the RPC in `.env` and write `NFT_ADDRESS` / `MARKET_ADDRESS` into backend/repo `.env` plus `frontend/.env.local`
- `npm run cli` — interactive mint / approve marketplace / list / buy / transfer helper

See the [root README](../README.md) for Anvil, env keys, and how the frontend syncs the ABI.
