#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# 显示标题
echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}       ChainIntelAI 项目快速启动脚本            ${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# 检查必要的依赖
check_dependencies() {
  echo -e "${YELLOW}检查必要的依赖...${NC}"
  
  # 检查 Node.js
  if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未安装 Node.js${NC}"
    echo "请访问 https://nodejs.org 安装 Node.js v18 或更高版本"
    exit 1
  fi
  
  node_version=$(node -v | cut -d 'v' -f 2)
  required_version="18.0.0"
  
  if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo -e "${RED}错误: Node.js 版本过低${NC}"
    echo "当前版本: $node_version, 需要版本: v18.0.0 或更高"
    exit 1
  fi
  
  # 检查 Yarn
  if ! command -v yarn &> /dev/null; then
    echo -e "${YELLOW}未安装 Yarn, 正在安装...${NC}"
    npm install -g yarn
  fi
  
  # 检查 Git
  if ! command -v git &> /dev/null; then
    echo -e "${RED}错误: 未安装 Git${NC}"
    echo "请访问 https://git-scm.com 安装 Git"
    exit 1
  fi
  
  echo -e "${GREEN}所有依赖检查通过!${NC}"
}

# 安装项目依赖
install_dependencies() {
  echo -e "${YELLOW}安装项目依赖...${NC}"
  
  # 安装前端依赖
  echo -e "${YELLOW}安装前端依赖...${NC}"
  cd frontend
  yarn install
  cd ..
  
  # 安装后端依赖
  if [ -d "backend" ]; then
    echo -e "${YELLOW}安装后端依赖...${NC}"
    cd backend
    yarn install
    cd ..
  fi
  
  echo -e "${GREEN}依赖安装完成!${NC}"
}

# 设置环境变量
setup_env() {
  echo -e "${YELLOW}设置环境变量...${NC}"
  
  # 前端环境变量
  if [ -f "frontend/.env.example" ] && [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo -e "${GREEN}已创建前端环境变量文件: frontend/.env${NC}"
    echo -e "${YELLOW}请根据需要编辑此文件${NC}"
  fi
  
  # 后端环境变量
  if [ -d "backend" ] && [ -f "backend/.env.example" ] && [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo -e "${GREEN}已创建后端环境变量文件: backend/.env${NC}"
    echo -e "${YELLOW}请根据需要编辑此文件${NC}"
  fi
}

# 运行测试
run_tests() {
  echo -e "${YELLOW}运行基本测试...${NC}"
  
  # 运行前端测试
  cd frontend
  yarn test
  cd ..
  
  echo -e "${GREEN}基本测试完成!${NC}"
}

# 启动开发服务器
start_dev_server() {
  echo -e "${YELLOW}是否要启动开发服务器? (y/n)${NC}"
  read -r start_server
  
  if [[ $start_server =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}启动前端开发服务器...${NC}"
    cd frontend
    yarn dev
  else
    echo -e "${GREEN}设置完成! 您可以稍后使用以下命令启动开发服务器:${NC}"
    echo -e "  cd frontend && yarn dev"
    if [ -d "backend" ]; then
      echo -e "  cd backend && yarn dev"
    fi
  fi
}

# 显示帮助信息
show_help() {
  echo -e "${YELLOW}项目快速启动指南${NC}"
  echo ""
  echo -e "${GREEN}1. 开发命令:${NC}"
  echo "   - 启动前端开发服务器: cd frontend && yarn dev"
  if [ -d "backend" ]; then
    echo "   - 启动后端开发服务器: cd backend && yarn dev"
  fi
  echo ""
  echo -e "${GREEN}2. 测试命令:${NC}"
  echo "   - 运行前端测试: cd frontend && yarn test"
  echo "   - 运行组件测试: cd frontend && yarn test:component"
  echo "   - 创建组件测试: cd frontend && yarn create-test -c 组件名"
  echo "   - 运行特定组件测试: cd frontend && yarn run-tests -c 组件名"
  echo ""
  echo -e "${GREEN}3. 构建命令:${NC}"
  echo "   - 构建前端: cd frontend && yarn build"
  if [ -d "backend" ]; then
    echo "   - 构建后端: cd backend && yarn build"
  fi
  echo ""
  echo -e "${GREEN}4. 文档:${NC}"
  echo "   - 前端测试文档: frontend/TESTING.md"
  if [ -d "backend" ]; then
    echo "   - 后端测试文档: backend/TESTING.md"
  fi
  echo ""
  echo -e "${YELLOW}如需更多帮助，请参阅项目 README.md 文件${NC}"
}

# 主函数
main() {
  check_dependencies
  install_dependencies
  setup_env
  run_tests
  show_help
  start_dev_server
}

# 执行主函数
main 