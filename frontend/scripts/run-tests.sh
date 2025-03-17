#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # 无颜色

# 显示帮助信息
show_help() {
  echo -e "${YELLOW}测试运行脚本${NC}"
  echo "用法: ./run-tests.sh [选项]"
  echo ""
  echo "选项:"
  echo "  -a, --all          运行所有测试"
  echo "  -c, --component    运行指定组件的测试"
  echo "  -w, --watch        以监视模式运行测试"
  echo "  -h, --help         显示帮助信息"
  echo ""
  echo "示例:"
  echo "  ./run-tests.sh -a                # 运行所有测试"
  echo "  ./run-tests.sh -c SearchBar      # 运行SearchBar组件的测试"
  echo "  ./run-tests.sh -c SearchBar -w   # 以监视模式运行SearchBar组件的测试"
}

# 运行所有测试
run_all_tests() {
  local watch_mode=$1
  
  echo -e "${GREEN}运行所有测试...${NC}"
  
  if [ "$watch_mode" = true ]; then
    yarn test --watch
  else
    yarn test
  fi
}

# 运行组件测试
run_component_test() {
  local component=$1
  local watch_mode=$2
  
  echo -e "${GREEN}运行 ${component} 组件的测试...${NC}"
  
  # 检查测试文件是否存在
  if [ ! -f "__tests__/components/${component}.test.js" ]; then
    echo -e "${RED}错误: 找不到测试文件 __tests__/components/${component}.test.js${NC}"
    echo -e "请先使用 create-test.sh 脚本创建测试文件"
    exit 1
  fi
  
  if [ "$watch_mode" = true ]; then
    yarn test __tests__/components/${component}.test.js --watch
  else
    yarn test __tests__/components/${component}.test.js
  fi
}

# 主函数
main() {
  # 如果没有参数，显示帮助信息
  if [ $# -eq 0 ]; then
    show_help
    exit 0
  fi
  
  local run_all=false
  local component=""
  local watch_mode=false
  
  # 解析参数
  while [ "$1" != "" ]; do
    case $1 in
      -a | --all )          run_all=true
                            ;;
      -c | --component )    shift
                            component=$1
                            ;;
      -w | --watch )        watch_mode=true
                            ;;
      -h | --help )         show_help
                            exit 0
                            ;;
      * )                   echo -e "${RED}错误: 未知选项 $1${NC}"
                            show_help
                            exit 1
    esac
    shift
  done
  
  # 运行测试
  if [ "$run_all" = true ]; then
    run_all_tests $watch_mode
  elif [ -n "$component" ]; then
    run_component_test "$component" $watch_mode
  else
    echo -e "${RED}错误: 未指定要运行的测试${NC}"
    show_help
    exit 1
  fi
}

# 执行主函数
main "$@" 