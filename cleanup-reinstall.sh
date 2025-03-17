#!/bin/bash

# 清理和重新安装依赖的脚本
echo "开始清理和重新安装依赖..."

# 1. 清理根目录
echo "清理根目录 node_modules..."
rm -rf /Users/mastershy/ChainIntelAI/node_modules

# 2. 清理前端目录
echo "清理前端目录 node_modules..."
rm -rf /Users/mastershy/ChainIntelAI/frontend/node_modules

# 3. 清理测试应用目录
echo "清理测试应用目录 node_modules..."
rm -rf /Users/mastershy/ChainIntelAI/test-app/node_modules

# 4. 清理演示应用目录
echo "清理演示应用目录 node_modules..."
rm -rf /Users/mastershy/ChainIntelAI/demo-app/node_modules

# 5. 重新安装根目录依赖
echo "在根目录重新安装依赖..."
cd /Users/mastershy/ChainIntelAI && yarn install

# 6. 重新安装前端目录依赖
echo "在前端目录重新安装依赖..."
cd /Users/mastershy/ChainIntelAI/frontend && yarn install

# 7. 重新安装后端 hardhat 目录依赖
echo "在后端 hardhat 目录重新安装依赖..."
cd /Users/mastershy/ChainIntelAI/backend/hardhat && yarn install

# 8. 如果 demo-app 和 test-app 有独立的 package.json，也为它们安装依赖
if [ -f "/Users/mastershy/ChainIntelAI/test-app/package.json" ]; then
  echo "在测试应用目录重新安装依赖..."
  cd /Users/mastershy/ChainIntelAI/test-app && yarn install
fi

if [ -f "/Users/mastershy/ChainIntelAI/demo-app/package.json" ]; then
  echo "在演示应用目录重新安装依赖..."
  cd /Users/mastershy/ChainIntelAI/demo-app && yarn install
fi

echo "依赖清理和重新安装完成！" 