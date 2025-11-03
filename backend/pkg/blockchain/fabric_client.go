package blockchain

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/hyperledger/fabric-sdk-go/pkg/core/config"
	"github.com/hyperledger/fabric-sdk-go/pkg/gateway"
)

type FabricConfig struct {
	ChannelName   string
	ChaincodeName string
	WalletPath    string
	CCPPath       string
	Identity      string
	MSPID         string
	CredPath      string
}

func NewFabricConfigFromEnv() *FabricConfig {
	return &FabricConfig{
		ChannelName:   getEnv("FABRIC_CHANNEL", "mychannel"),
		ChaincodeName: getEnv("FABRIC_CHAINCODE", "certificate"),
		WalletPath:    getEnv("FABRIC_WALLET_PATH", "./wallet"),
		CCPPath:       getEnv("FABRIC_CCP_PATH", "./connection.yaml"),
		Identity:      getEnv("FABRIC_IDENTITY", "admin"),
		MSPID:         getEnv("FABRIC_MSP_ID", "Org1MSP"),
		CredPath:      getEnv("FABRIC_ADMIN_CRED_PATH", ""),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

type FabricClient struct {
	cfg      *FabricConfig
	contract *gateway.Contract
}

func NewFabricClient(cfg *FabricConfig) (*FabricClient, error) {
	// Tạo ví nếu chưa có
	wallet, err := gateway.NewFileSystemWallet(cfg.WalletPath)
	if err != nil {
		return nil, fmt.Errorf("lỗi tạo wallet: %v", err)
	}

	// Nếu identity chưa tồn tại, import từ credPath
	if !wallet.Exists(cfg.Identity) {
		if cfg.CredPath == "" {
			return nil, fmt.Errorf("chưa có identity trong wallet và thiếu FABRIC_ADMIN_CRED_PATH")
		}
		certPath := filepath.Join(cfg.CredPath, "signcerts", "cert.pem")
		keyDir := filepath.Join(cfg.CredPath, "keystore")
		keyFiles, err := os.ReadDir(keyDir)
		if err != nil || len(keyFiles) == 0 {
			return nil, fmt.Errorf("không tìm thấy private key trong keystore")
		}
		keyPath := filepath.Join(keyDir, keyFiles[0].Name())

		cert, err := os.ReadFile(certPath)
		if err != nil {
			return nil, fmt.Errorf("lỗi đọc cert: %w", err)
		}
		key, err := os.ReadFile(keyPath)
		if err != nil {
			return nil, fmt.Errorf("lỗi đọc private key: %w", err)
		}
		identity := gateway.NewX509Identity(cfg.MSPID, string(cert), string(key))
		if err = wallet.Put(cfg.Identity, identity); err != nil {
			return nil, fmt.Errorf("lỗi import identity: %w", err)
		}
		fmt.Println("✅ Đã import identity vào ví")
	}

	// Kết nối gateway
	gw, err := gateway.Connect(
		gateway.WithConfig(config.FromFile(filepath.Clean(cfg.CCPPath))),
		gateway.WithIdentity(wallet, cfg.Identity),
	)
	if err != nil {
		return nil, fmt.Errorf("lỗi kết nối gateway: %v", err)
	}

	network, err := gw.GetNetwork(cfg.ChannelName)
	if err != nil {
		log.Printf("⚠️ Lỗi lấy network từ gateway (peer chưa sẵn sàng?): %v", err)
		return &FabricClient{
			cfg:      cfg,
			contract: nil,
		}, nil
	}

	contract := network.GetContract(cfg.ChaincodeName)

	return &FabricClient{
		cfg:      cfg,
		contract: contract,
	}, nil
}
