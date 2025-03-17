#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # 无颜色

# 显示帮助信息
show_help() {
  echo -e "${YELLOW}组件生成脚本${NC}"
  echo "用法: ./create-component.sh [选项]"
  echo ""
  echo "选项:"
  echo "  -n, --name        组件名称 (必需)"
  echo "  -t, --type        组件类型 (可选): page, layout, ui, form, data"
  echo "                    默认: ui"
  echo "  -p, --path        组件路径 (可选)"
  echo "                    默认: 根据类型自动确定"
  echo "  -s, --style       样式类型 (可选): css, scss, tailwind"
  echo "                    默认: tailwind"
  echo "  -c, --create-test 是否创建测试文件 (可选): true, false"
  echo "                    默认: true"
  echo "  -h, --help        显示帮助信息"
  echo ""
  echo "示例:"
  echo "  ./create-component.sh -n Button -t ui"
  echo "  ./create-component.sh -n UserForm -t form -s scss"
  echo "  ./create-component.sh -n Dashboard -t page -p app/dashboard"
}

# 创建组件
create_component() {
  local name=$1
  local type=$2
  local path=$3
  local style=$4
  local create_test=$5
  
  # 确定组件路径
  if [ -z "$path" ]; then
    case $type in
      page)
        path="app/pages"
        ;;
      layout)
        path="app/layouts"
        ;;
      ui)
        path="components/ui"
        ;;
      form)
        path="components/forms"
        ;;
      data)
        path="components/data"
        ;;
      *)
        path="components"
        ;;
    esac
  fi
  
  # 创建目录（如果不存在）
  mkdir -p "$path"
  
  # 创建组件文件
  component_file="$path/$name.jsx"
  
  echo -e "${GREEN}创建组件: $component_file${NC}"
  
  # 根据样式类型生成不同的组件模板
  case $style in
    css)
      css_file="$path/$name.css"
      
      # 创建 CSS 文件
      cat > "$css_file" << EOL
/* $name 组件样式 */
.$name {
  /* 在这里添加样式 */
}
EOL
      
      # 创建组件文件
      cat > "$component_file" << EOL
import React from 'react';
import './$name.css';

/**
 * $name 组件
 * 
 * @param {object} props - 组件属性
 * @returns {JSX.Element} 组件
 */
const $name = (props) => {
  return (
    <div className="$name">
      {/* 组件内容 */}
      $name 组件
    </div>
  );
};

export default $name;
EOL
      ;;
      
    scss)
      scss_file="$path/$name.scss"
      
      # 创建 SCSS 文件
      cat > "$scss_file" << EOL
/* $name 组件样式 */
.$name {
  /* 在这里添加样式 */
  
  &__header {
    /* 头部样式 */
  }
  
  &__content {
    /* 内容样式 */
  }
  
  &__footer {
    /* 底部样式 */
  }
}
EOL
      
      # 创建组件文件
      cat > "$component_file" << EOL
import React from 'react';
import './$name.scss';

/**
 * $name 组件
 * 
 * @param {object} props - 组件属性
 * @returns {JSX.Element} 组件
 */
const $name = (props) => {
  return (
    <div className="$name">
      <div className="$name__header">
        {/* 头部内容 */}
      </div>
      <div className="$name__content">
        {/* 主要内容 */}
        $name 组件
      </div>
      <div className="$name__footer">
        {/* 底部内容 */}
      </div>
    </div>
  );
};

export default $name;
EOL
      ;;
      
    tailwind | *)
      # 创建组件文件
      cat > "$component_file" << EOL
import React from 'react';

/**
 * $name 组件
 * 
 * @param {object} props - 组件属性
 * @returns {JSX.Element} 组件
 */
const $name = (props) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* 组件内容 */}
      $name 组件
    </div>
  );
};

export default $name;
EOL
      ;;
  esac
  
  echo -e "${GREEN}组件文件已创建: $component_file${NC}"
  
  # 创建测试文件
  if [ "$create_test" = true ]; then
    # 确保测试目录存在
    mkdir -p "__tests__/components"
    
    test_file="__tests__/components/$name.test.js"
    
    echo -e "${GREEN}创建测试文件: $test_file${NC}"
    
    cat > "$test_file" << EOL
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import $name from '../../$path/$name';

describe('$name组件', () => {
  test('正确渲染组件', () => {
    render(<$name />);
    
    // 验证组件渲染
    expect(screen.getByText(/$name 组件/i)).toBeInTheDocument();
  });
  
  // 添加更多测试...
});
EOL
    
    echo -e "${GREEN}测试文件已创建: $test_file${NC}"
  fi
  
  echo -e "${GREEN}组件 $name 创建完成!${NC}"
}

# 主函数
main() {
  # 如果没有参数，显示帮助信息
  if [ $# -eq 0 ]; then
    show_help
    exit 0
  fi
  
  local name=""
  local type="ui"
  local path=""
  local style="tailwind"
  local create_test=true
  
  # 解析参数
  while [ "$1" != "" ]; do
    case $1 in
      -n | --name )         shift
                            name=$1
                            ;;
      -t | --type )         shift
                            type=$1
                            ;;
      -p | --path )         shift
                            path=$1
                            ;;
      -s | --style )        shift
                            style=$1
                            ;;
      -c | --create-test )  shift
                            create_test=$1
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
  
  # 验证必要参数
  if [ -z "$name" ]; then
    echo -e "${RED}错误: 未指定组件名称${NC}"
    show_help
    exit 1
  fi
  
  # 创建组件
  create_component "$name" "$type" "$path" "$style" "$create_test"
}

# 执行主函数
main "$@" 