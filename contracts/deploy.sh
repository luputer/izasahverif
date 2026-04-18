#!/bin/bash
set -e

CONTRACT_DIR="ijazah-verify"
WASM_NAME="ijazah_verify"
FRONTEND_ENV="../frontend-rush/.env"

SCRIPT_DIR="$(pwd)"
WORKSPACE_ROOT="$(cd ../.. && pwd)"
WASM_PATH="${WORKSPACE_ROOT}/target/wasm32-unknown-unknown/release/${WASM_NAME}.wasm"

echo "=== Build contract ==="
cd "${SCRIPT_DIR}/${CONTRACT_DIR}"
cargo build --target wasm32-unknown-unknown --release
cd "$SCRIPT_DIR"

echo "=== Optimize WASM ==="
stellar contract optimize \
  --wasm "$WASM_PATH"

echo "=== Deploy ke Testnet ==="
CONTRACT_ID=$(stellar contract deploy \
  --wasm "${WORKSPACE_ROOT}/target/wasm32-unknown-unknown/release/${WASM_NAME}.optimized.wasm" \
  --source-account alice \
  --network testnet)

echo "Contract ID: $CONTRACT_ID"

if [ -f "$FRONTEND_ENV" ]; then
  # Ensure file ends with a newline before sed
  sed -i -e '$a\' "$FRONTEND_ENV"
  # Remove existing VITE_CONTRACT_ID if any
  sed -i '/VITE_CONTRACT_ID/d' "$FRONTEND_ENV"
  echo "VITE_CONTRACT_ID=$CONTRACT_ID" >> "$FRONTEND_ENV"
  echo "✅ Contract ID updated in $FRONTEND_ENV"
else
  echo "VITE_CONTRACT_ID=$CONTRACT_ID" > "$FRONTEND_ENV"
  echo "✅ Created $FRONTEND_ENV"
fi

echo "=== Initialize contract ==="
ADMIN_ADDRESS=$(stellar keys address alice)
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source-account alice \
  --network testnet \
  -- initialize \
  --admin "$ADMIN_ADDRESS"

echo "=== Daftarkan institusi ==="
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source-account alice \
  --network testnet \
  -- register_institution \
  --caller "$ADMIN_ADDRESS" \
  --institution "$ADMIN_ADDRESS"

echo "✅ Deploy selesai! Contract ID: $CONTRACT_ID"
