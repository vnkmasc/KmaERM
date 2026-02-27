package main

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
)

func main() {
	// 1. Sinh Private Key
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		panic(err)
	}

	privBytes := x509.MarshalPKCS1PrivateKey(privateKey)
	privPEM := pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: privBytes})

	// 2. Sinh Public Key
	pubBytes, err := x509.MarshalPKIXPublicKey(&privateKey.PublicKey)
	pubPEM := pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: pubBytes})

	fmt.Println("--- COPY CÁI NÀY VÀO SQL ---")
	fmt.Printf("UPDATE users SET private_key_pem = '%s', public_key_pem = '%s' WHERE email = 'admin@system.com';\n", string(privPEM), string(pubPEM))
}
