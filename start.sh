#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RPC_URL="${RPC_URL:-http://127.0.0.1:8545}"

echo "Checking Anvil at ${RPC_URL}..."
if ! curl -sS -m 2 -X POST "${RPC_URL}" \
  -H "content-type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' \
  | grep -q '"result"'; then
  echo
  echo "Anvil is not running."
  echo "In a separate terminal, start it:"
  echo "  anvil"
  echo
  echo "Then run this script again from the project folder:"
  echo "  ./start.sh"
  exit 1
fi

echo "Compiling and deploying MyNft..."
cd "${ROOT}/backend"
npm run compile
npm run deploy

echo "Syncing ABI into the frontend..."
cd "${ROOT}/frontend"
npm run sync-abi

echo
echo "Starting the app at http://localhost:3000"
echo "If Next.js does not pick up a new contract address, stop this script (Ctrl+C) and run ./start.sh again."
echo
npm run dev
