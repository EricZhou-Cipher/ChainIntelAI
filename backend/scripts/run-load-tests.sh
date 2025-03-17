#!/bin/bash

# 运行API负载测试脚本
# 使用方法: ./run-load-tests.sh [环境]

# 默认环境为本地
ENV=${1:-local}

# 设置基于环境的URL
case $ENV in
  local)
    TARGET_URL="http://localhost:3000"
    ;;
  dev)
    TARGET_URL="https://api-dev.chainintel.ai"
    ;;
  staging)
    TARGET_URL="https://api-staging.chainintel.ai"
    ;;
  prod)
    TARGET_URL="https://api.chainintel.ai"
    ;;
  *)
    echo "未知环境: $ENV"
    echo "使用方法: ./run-load-tests.sh [local|dev|staging|prod]"
    exit 1
    ;;
esac

# 确保Artillery已安装
if ! command -v artillery &> /dev/null; then
  echo "Artillery未安装，正在安装..."
  yarn global add artillery
fi

# 创建结果目录
RESULTS_DIR="./load-test-results"
mkdir -p $RESULTS_DIR

# 获取当前时间戳
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$RESULTS_DIR/load-test-report-$ENV-$TIMESTAMP"

echo "开始对 $TARGET_URL 进行负载测试..."
echo "结果将保存到 $REPORT_FILE.json 和 $REPORT_FILE.html"

# 运行测试并生成报告
artillery run \
  --target "$TARGET_URL" \
  --output "$REPORT_FILE.json" \
  src/tests/performance/api.load.test.yml

# 生成HTML报告
artillery report --output "$REPORT_FILE.html" "$REPORT_FILE.json"

echo "负载测试完成！"
echo "JSON报告: $REPORT_FILE.json"
echo "HTML报告: $REPORT_FILE.html" 