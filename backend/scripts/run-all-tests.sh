#!/bin/bash

# 运行所有测试
# 用法: bash scripts/run-all-tests.sh [--ci]

# 检查是否在 CI 环境中运行
CI_MODE=false
if [ "$1" == "--ci" ]; then
  CI_MODE=true
  echo "在 CI 模式下运行测试"
fi

# 设置环境变量
export NODE_ENV=test

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# 计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 辅助函数：运行测试并检查结果
run_test() {
  local test_file=$1
  local test_name=$2
  
  echo -e "${YELLOW}运行 $test_name 测试...${NC}"
  
  if [ "$CI_MODE" = true ]; then
    yarn jest "$test_file" --no-cache --no-transform --ci
  else
    yarn jest "$test_file" --no-cache --no-transform
  fi
  
  local result=$?
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  if [ $result -eq 0 ]; then
    echo -e "${GREEN}✓ $test_name 测试通过${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗ $test_name 测试失败${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  
  echo ""
  return $result
}

# 创建测试报告目录
mkdir -p test-reports

echo "===== 开始运行测试 ====="
echo ""

# 运行单元测试
echo "===== 单元测试 ====="
run_test "src/tests/unit/monitoring/basic-telemetry.test.ts" "基本 OpenTelemetry"
run_test "src/tests/unit/monitoring/simple-telemetry.test.ts" "简单 OpenTelemetry"
run_test "src/tests/unit/monitoring/functional-telemetry.test.ts" "功能性 OpenTelemetry"

# 运行集成测试
echo "===== 集成测试 ====="
run_test "src/tests/integration/monitoring/telemetry-integration.test.ts" "OpenTelemetry 集成"

# 运行性能测试
echo "===== 性能测试 ====="
run_test "src/tests/performance/monitoring/telemetry-performance.test.ts" "OpenTelemetry 性能"

# 打印测试结果摘要
echo "===== 测试结果摘要 ====="
echo -e "总测试数: $TOTAL_TESTS"
echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
echo -e "${RED}失败: $FAILED_TESTS${NC}"
echo ""

# 如果有测试失败，则退出代码为 1
if [ $FAILED_TESTS -gt 0 ]; then
  echo -e "${RED}有 $FAILED_TESTS 个测试失败${NC}"
  exit 1
else
  echo -e "${GREEN}所有测试通过${NC}"
  exit 0
fi 