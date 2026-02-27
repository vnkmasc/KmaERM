package utils

import (
	"crypto"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"os"
)

var GlobalMasterKey = []byte("01234567890123456789012345678901")

const DEFAULT_DEMO_KEY = "01234567890123456789012345678901"

var FakeDB_EncryptedKEK []byte

func init() {
	realKEK := []byte("key_encryption_key_32_bytes_long")
	encrypted, _ := EncryptAES(realKEK, GlobalMasterKey)
	FakeDB_EncryptedKEK = encrypted
}

func GenerateRandomKey() ([]byte, error) {
	key := make([]byte, 32)
	if _, err := io.ReadFull(rand.Reader, key); err != nil {
		return nil, fmt.Errorf("failed to generate random key: %w", err)
	}
	return key, nil
}

func EncryptAES(plaintext []byte, key []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}

	return gcm.Seal(nonce, nonce, plaintext, nil), nil
}

func DecryptAES(encryptedData []byte, key []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonceSize := gcm.NonceSize()
	if len(encryptedData) < nonceSize {
		return nil, errors.New("ciphertext too short")
	}

	nonce, ciphertext := encryptedData[:nonceSize], encryptedData[nonceSize:]
	return gcm.Open(nil, nonce, ciphertext, nil)
}

func GetKEK() ([]byte, error) {
	encryptedKEK := FakeDB_EncryptedKEK
	if len(encryptedKEK) == 0 {
		return nil, errors.New("system kek not found")
	}

	return DecryptAES(encryptedKEK, GlobalMasterKey)
}

func GetSystemMasterKey() ([]byte, error) {

	keyStr := os.Getenv("APP_MASTER_KEY")

	if keyStr == "" {
		keyStr = DEFAULT_DEMO_KEY
	}

	keyBytes := []byte(keyStr)

	if len(keyBytes) != 32 {
		return nil, fmt.Errorf("lỗi bảo mật: Master Key phải có độ dài đúng 32 bytes (hiện tại: %d bytes)", len(keyBytes))
	}

	return keyBytes, nil
}

func SignHash(dataHash string, privateKeyPEM string) (string, error) {
	block, _ := pem.Decode([]byte(privateKeyPEM))
	if block == nil {
		return "", errors.New("private key không hợp lệ")
	}
	priv, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		return "", err
	}

	// Hash lại dataHash (để đảm bảo input an toàn cho RSA)
	h := sha256.New()
	h.Write([]byte(dataHash))
	hashed := h.Sum(nil)

	// Ký
	signature, err := rsa.SignPKCS1v15(rand.Reader, priv, crypto.SHA256, hashed)
	if err != nil {
		return "", err
	}

	return base64.StdEncoding.EncodeToString(signature), nil
}

func GenerateRSAKeyPair() (string, string, error) {
	// 1. Sinh Private Key (2048 bit)
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return "", "", err
	}

	// 2. Encode Private Key sang PEM
	privBytes := x509.MarshalPKCS1PrivateKey(privateKey)
	privPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: privBytes,
	})

	// 3. Encode Public Key sang PEM
	pubBytes, err := x509.MarshalPKIXPublicKey(&privateKey.PublicKey)
	if err != nil {
		return "", "", err
	}
	pubPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "PUBLIC KEY",
		Bytes: pubBytes,
	})

	return string(privPEM), string(pubPEM), nil
}
