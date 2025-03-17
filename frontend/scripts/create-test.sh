#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # 无颜色

# 显示帮助信息
show_help() {
  echo -e "${YELLOW}测试文件生成脚本${NC}"
  echo "用法: ./create-test.sh [选项]"
  echo ""
  echo "选项:"
  echo "  -c, --component    组件名称 (必需)"
  echo "  -p, --path         组件路径 (可选)"
  echo "                     默认: components"
  echo "  -t, --test-path    测试文件路径 (可选)"
  echo "                     默认: tests/components"
  echo "  -h, --help         显示帮助信息"
  echo ""
  echo "示例:"
  echo "  ./create-test.sh -c Button"
  echo "  ./create-test.sh -c UserForm -p components/forms"
  echo "  ./create-test.sh -c Dashboard -p app/pages -t tests/pages"
}

# 创建测试文件
create_test() {
  local component=$1
  local component_path=$2
  local test_path=$3
  
  # 确保测试目录存在
  mkdir -p "$test_path"
  
  # 测试文件路径
  test_file="$test_path/$component.test.jsx"
  
  echo -e "${GREEN}创建测试文件: $test_file${NC}"
  
  # 创建测试文件
  cat > "$test_file" << EOL
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import $component from '../../$component_path/$component';

describe('$component组件', () => {
  test('正确渲染组件', () => {
    render(<$component />);
    
    // 在这里添加断言
    // 例如: expect(screen.getByText('按钮')).toBeInTheDocument();
  });
  
  test('点击事件正常工作', () => {
    const handleClick = jest.fn();
    render(<$component onClick={handleClick} />);
    
    // 在这里添加点击测试
    // 例如: fireEvent.click(screen.getByRole('button'));
    // expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('属性正确应用', () => {
    render(<$component data-testid="test-component" />);
    
    // 在这里测试属性
    // 例如: expect(screen.getByTestId('test-component')).toHaveAttribute('disabled');
  });
  
  // 添加更多测试...
});
EOL
  
  echo -e "${GREEN}测试文件已创建: $test_file${NC}"
  echo -e "${YELLOW}提示: 请根据组件的实际功能修改测试用例${NC}"
}

# 主函数
main() {
  # 如果没有参数，显示帮助信息
  if [ $# -eq 0 ]; then
    show_help
    exit 0
  fi
  
  local component=""
  local component_path="components"
  local test_path="tests/components"
  
  # 解析参数
  while [ "$1" != "" ]; do
    case $1 in
      -c | --component )   shift
                           component=$1
                           ;;
      -p | --path )        shift
                           component_path=$1
                           ;;
      -t | --test-path )   shift
                           test_path=$1
                           ;;
      -h | --help )        show_help
                           exit 0
                           ;;
      * )                  echo -e "${RED}错误: 未知选项 $1${NC}"
                           show_help
                           exit 1
    esac
    shift
  done
  
  # 验证必要参数
  if [ -z "$component" ]; then
    echo -e "${RED}错误: 未指定组件名称${NC}"
    show_help
    exit 1
  fi
  
  # 检查组件文件是否存在
  component_file="$component_path/$component.jsx"
  if [ ! -f "$component_file" ]; then
    component_file="$component_path/$component.js"
    if [ ! -f "$component_file" ]; then
      component_file="$component_path/$component.tsx"
      if [ ! -f "$component_file" ]; then
        echo -e "${YELLOW}警告: 未找到组件文件 $component_path/$component.jsx|js|tsx${NC}"
        echo -e "${YELLOW}将继续创建测试文件，但可能需要调整导入路径${NC}"
      fi
    fi
  fi
  
  # 创建测试文件
  create_test "$component" "$component_path" "$test_path"
}

# 执行主函数
main "$@" 