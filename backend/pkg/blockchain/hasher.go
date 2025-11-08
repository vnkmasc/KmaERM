package blockchain

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
)

// CalculateDataHash (Tính h1)
// Nhận vào nhiều chuỗi (ví dụ: số giấy phép, ngày hiệu lực, ...),
// nối chúng lại, băm (hash) và trả về chuỗi hex.
func CalculateDataHash(data ...string) (string, error) {
	hasher := sha256.New()
	for _, s := range data {
		if _, err := hasher.Write([]byte(s)); err != nil {
			return "", fmt.Errorf("lỗi hash dữ liệu: %w", err)
		}
	}
	hashBytes := hasher.Sum(nil)
	return hex.EncodeToString(hashBytes), nil
}

func CalculateFileHash(filePath string) (string, error) {
	// 1. Mở file từ đường dẫn vật lý
	f, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("không thể mở file %s: %w", filePath, err)
	}
	// Đảm bảo file được đóng sau khi hàm kết thúc
	defer f.Close()

	// 2. Tạo một đối tượng hash SHA-256 mới
	h := sha256.New()

	// 3. Sao chép (stream) nội dung file vào đối tượng hash
	// io.Copy hiệu quả hơn os.ReadFile vì nó không tải hết file vào RAM
	if _, err := io.Copy(h, f); err != nil {
		return "", fmt.Errorf("lỗi khi đọc file để hash: %w", err)
	}

	// 4. Lấy kết quả hash (dạng byte)
	hashBytes := h.Sum(nil)

	// 5. Chuyển đổi sang dạng chuỗi Hex (16)
	hashString := hex.EncodeToString(hashBytes)

	return hashString, nil
}
