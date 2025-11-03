#!/bin/bash
set -e  # Dừng script nếu gặp lỗi

# Load biến môi trường từ .env
export $(grep -v '^#' .env | xargs)

TLS_DEST=./config/tls
ADMIN_DEST=./config/credentials/org1-admin
WALLET_PATH=./wallet
KEYSTORE_PATH=./keystore

ORG_DOMAIN=org1.example.com
ADMIN_USER=Admin@org1.example.com

echo "🧹 Cleaning old files..."
rm -rf "$WALLET_PATH" "$KEYSTORE_PATH" "$TLS_DEST" "$ADMIN_DEST"
mkdir -p "$TLS_DEST"
mkdir -p "$ADMIN_DEST"

echo "📦 Copying TLS certs..."
cp "$FABRIC_SAMPLES_PATH/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt" \
   "$TLS_DEST/orderer-ca.crt"

cp "$FABRIC_SAMPLES_PATH/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
   "$TLS_DEST/org1-peer0-ca.crt"

cp "$FABRIC_SAMPLES_PATH/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
   "$TLS_DEST/org2-peer0-ca.crt"

cp "$FABRIC_SAMPLES_PATH/organizations/peerOrganizations/org1.example.com/ca/ca.org1.example.com-cert.pem" \
   "$TLS_DEST/ca-org1-cert.pem"

echo "✅ TLS CA files copied to: $TLS_DEST"

echo "📦 Copying admin cert and key..."
mkdir -p "$ADMIN_DEST/signcerts"
cp "$FABRIC_SAMPLES_PATH/organizations/peerOrganizations/$ORG_DOMAIN/users/$ADMIN_USER/msp/signcerts/cert.pem" \
   "$ADMIN_DEST/signcerts/"

mkdir -p "$ADMIN_DEST/keystore"
cp "$FABRIC_SAMPLES_PATH/organizations/peerOrganizations/$ORG_DOMAIN/users/$ADMIN_USER/msp/keystore/"* \
   "$ADMIN_DEST/keystore/"

echo "✅ Admin cert and key copied to: $ADMIN_DEST"

echo "🔄 Rendering connection.yaml from template..."
envsubst < ./scripts/connection-template.yaml > ./config/connection-org1.yaml
echo "✅ connection-org1.yaml generated from connection.template.yaml"

echo "🧰 Wallet and Keystore reset complete."
echo "🚀 Ready to run your backend: go run ./cmd/server"
