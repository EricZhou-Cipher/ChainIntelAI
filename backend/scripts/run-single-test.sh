#!/bin/bash

# 运行单个测试文件
# 用法: bash scripts/run-single-test.sh <测试文件路径>

TEST_FILE=$1

if [ -z "$TEST_FILE" ]; then
  echo "错误: 请提供测试文件路径"
  echo "用法: bash scripts/run-single-test.sh <测试文件路径>"
  exit 1
fi

echo "运行测试: $TEST_FILE"

NODE_ENV=test yarn jest "$TEST_FILE" --config=jest.config.cjs --no-cache --detectOpenHandles 