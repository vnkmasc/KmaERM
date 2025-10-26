package helper

import (
	"path/filepath"
	"strings"
)

func NormalizeFilePath(dbPath string) string {
	cleanPath := strings.ReplaceAll(dbPath, "\\", "/")

	cleanPath = strings.TrimPrefix(cleanPath, "../")
	cleanPath = strings.TrimPrefix(cleanPath, "./")

	rootPath := filepath.Join("..", cleanPath)

	return filepath.Clean(rootPath)
}
