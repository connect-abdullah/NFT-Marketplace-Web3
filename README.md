# NFT Marketplace

A local NFT marketplace: mint NFTs, approve the marketplace, list them at a fixed ETH price, buy them, or send them between wallets. Two contracts run against a local Anvil node (Hardhat’s chain id 31337): a custom ERC-721 (`MarketNFT`) and a separate `NFTMarketplace`.

## What you can do

- **Mint** an NFT to your connected wallet
- **Approve marketplace** (`setApprovalForAll`) so the market can transfer on a sale
- **List** an NFT you own for a price in ETH (requires that approval)
- **Buy** a listed NFT (exact price, cannot buy your own). The market calls `safeTransferFrom`
- **Unlist** an NFT you listed
- **Approve** another wallet, then **transfer** an NFT

There is no protocol fee. A successful buy sends the full payment to the seller.

## Prerequisites

- Node.js 20+
- [Anvil](https://book.getfoundry.sh/anvil/) (Foundry)
- A browser wallet such as MetaMask, with a local network:
  - RPC `http://127.0.0.1:8545`
  - Chain id `31337`
  - Import an Anvil private key for test ETH

Backend scripts also need `backend/.env` (or a repo-root `.env`) with:

```
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0x...
PRIVATE_KEY_2=0x...
```

Use two Anvil accounts so you can mint from one wallet and buy from the other.

## Quick start

1. Start Anvil in one terminal:

```bash
anvil
```

2. From the project root, compile, deploy, sync the ABI, and start the app:

```bash
./start.sh
```

3. Open [http://localhost:3000](http://localhost:3000), connect the wallet on the local network, then in **Studio**: mint, approve the marketplace, list. Use **Market** to buy.

`./start.sh` writes `NEXT_PUBLIC_NFT_ADDRESS`, `NEXT_PUBLIC_MARKET_ADDRESS`, and `NEXT_PUBLIC_RPC_URL` into `frontend/.env.local`. If the UI still shows old addresses, stop the script and run it again so Next.js picks up the new env.

## Manual steps

```bash
# backend
cd backend
npm install
npm run compile
npm run deploy

# frontend
cd ../frontend
npm install
npm run sync-abi
npm run dev
```

`npm run sync-abi` copies only `{ abi }` from `MarketNFT` and `NFTMarketplace` artifacts into `frontend/abi/`. Compile first; the script exits if an artifact is missing.

## Frontend env

`frontend/.env.local` (see `frontend/.env.local.example`):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_RPC_URL` | HTTP RPC (defaults to `http://127.0.0.1:8545`) |
| `NEXT_PUBLIC_NFT_ADDRESS` | Deployed `MarketNFT` address |
| `NEXT_PUBLIC_MARKET_ADDRESS` | Deployed `NFTMarketplace` address |

Never put private keys in the frontend or in `NEXT_PUBLIC_*` variables.

## CLI

From `backend/`, with Anvil running and `.env` set:

```bash
npm run cli
```

The menu covers status, deploy, mint, owner/approval/balance lookups, approve wallet, approve marketplace, transfer, list, unlist, buy, and listing lookup.

## MetaMask

Import an Anvil account from the keys Anvil prints at startup. After you restart Anvil, use **Settings → Advanced → Reset account** in MetaMask so the nonce matches the new chain.

`MarketNFT` is a custom ERC-721-style contract (`Transfer` / `Approval` / `ApprovalForAll`, plus `setApprovalForAll`). Redeploy after changing contracts (`./start.sh`).

## Layout

- `backend/contracts/MarketNFT.sol` — ERC-721 mint
- `backend/contracts/NFTMarketplace.sol` — list / unlist / buy
- `backend/scripts/` — deploy helpers and CLI
- `frontend/` — Next.js App Router UI (wagmi + viem)
