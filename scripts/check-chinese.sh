#!/bin/bash
# DeepClaw v3.5.0 - Chinese Character Detection Script
# Usage: ./scripts/check-chinese.sh
# Exit 1 if Chinese characters found in source files

echo "Checking for Chinese characters in source files..."

# Find TypeScript files with Chinese characters
CHINESE_FILES=$(find src -name "*.ts" -exec grep -lP '[\x{4e00}-\x{9fff}]' {} \; 2>/dev/null)

if [ -n "$CHINESE_FILES" ]; then
    echo "❌ Chinese characters found in the following files:"
    echo "$CHINESE_FILES"
    exit 1
else
    echo "✅ No Chinese characters in source files"
    exit 0
fi
