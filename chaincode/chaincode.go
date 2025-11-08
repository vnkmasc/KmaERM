package main

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract cung cấp logic cho "certificate" chaincode
type SmartContract struct {
	contractapi.Contract
}

// Asset mô tả cấu trúc dữ liệu lưu trên ledger
// Chúng ta chỉ lưu hash, không lưu dữ liệu đầy đủ
type Asset struct {
	ID     string `json:"id"`
	H1Hash string `json:"h1Hash"` // Hash của metadata
	H2Hash string `json:"h2Hash"` // Hash của file
}

// SubmitFullCertificate là hàm GHI (Submit)
// Nó tạo một asset mới hoặc cập nhật asset cũ với h1 và h2
// Đây là hàm mà API "PushToBlockchain" của bạn gọi đến.
func (s *SmartContract) SubmitLisence(ctx contractapi.TransactionContextInterface, id string, h1Hash string, h2Hash string) error {
	log.Printf("SubmitLisence được gọi cho ID: %s", id)

	// (Tùy chọn) Kiểm tra xem asset đã tồn tại chưa
	exists, err := s.AssetExists(ctx, id)
	if err != nil {
		return err
	}

	var action string
	if exists {
		action = "cập nhật"
	} else {
		action = "tạo mới"
	}

	// Tạo đối tượng asset
	asset := Asset{
		ID:     id,
		H1Hash: h1Hash,
		H2Hash: h2Hash,
	}

	// Chuyển sang JSON
	assetJSON, err := json.Marshal(asset)
	if err != nil {
		return fmt.Errorf("lỗi khi marshal asset: %w", err)
	}

	// Ghi vào ledger (dùng ID làm key)
	err = ctx.GetStub().PutState(id, assetJSON)
	if err != nil {
		return fmt.Errorf("lỗi khi PutState: %w", err)
	}

	log.Printf("Đã %s asset %s thành công", action, id)
	return nil
}

// QueryCertificate là hàm ĐỌC (Evaluate)
// (Bạn sẽ dùng hàm này cho API "Verify Blockchain" trong tương lai)
func (s *SmartContract) QueryLisence(ctx contractapi.TransactionContextInterface, id string) (*Asset, error) {
	assetJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi GetState: %w", err)
	}
	if assetJSON == nil {
		return nil, fmt.Errorf("asset %s không tồn tại", id)
	}

	var asset Asset
	err = json.Unmarshal(assetJSON, &asset)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi unmarshal asset: %w", err)
	}

	return &asset, nil
}

// AssetExists kiểm tra xem asset có tồn tại không
func (s *SmartContract) AssetExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	assetJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("lỗi khi GetState: %w", err)
	}
	return assetJSON != nil, nil
}

// Main
func main() {
	assetChaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		log.Panicf("Lỗi khi tạo chaincode 'lisencecc': %v", err)
	}

	if err := assetChaincode.Start(); err != nil {
		log.Panicf("Lỗi khi khởi động chaincode 'lisencecc': %v", err)
	}
}
