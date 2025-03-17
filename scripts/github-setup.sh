#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# 显示标题
echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}       ChainIntelAI GitHub 设置脚本             ${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# 检查 Git 是否安装
check_git() {
  echo -e "${YELLOW}检查 Git 是否安装...${NC}"
  
  if ! command -v git &> /dev/null; then
    echo -e "${RED}错误: 未安装 Git${NC}"
    echo "请访问 https://git-scm.com 安装 Git"
    exit 1
  fi
  
  echo -e "${GREEN}Git 已安装!${NC}"
}

# 初始化 Git 仓库
init_git_repo() {
  echo -e "${YELLOW}初始化 Git 仓库...${NC}"
  
  # 检查是否已经是 Git 仓库
  if [ -d ".git" ]; then
    echo -e "${YELLOW}已经是 Git 仓库，跳过初始化${NC}"
    return
  fi
  
  git init
  echo -e "${GREEN}Git 仓库初始化完成!${NC}"
}

# 创建 .gitignore 文件
create_gitignore() {
  echo -e "${YELLOW}创建 .gitignore 文件...${NC}"
  
  if [ -f ".gitignore" ]; then
    echo -e "${YELLOW}已存在 .gitignore 文件，是否覆盖? (y/n)${NC}"
    read -r overwrite
    if [[ ! $overwrite =~ ^[Yy]$ ]]; then
      echo -e "${YELLOW}保留现有 .gitignore 文件${NC}"
      return
    fi
  fi
  
  cat > .gitignore << EOL
# 依赖
node_modules/
.pnp/
.pnp.js

# 测试
coverage/

# 构建输出
.next/
out/
build/
dist/

# 环境变量
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 日志
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 编辑器
.idea/
.vscode/
*.swp
*.swo

# 操作系统
.DS_Store
Thumbs.db

# 缓存
.cache/
.eslintcache
EOL
  
  echo -e "${GREEN}.gitignore 文件创建完成!${NC}"
}

# 添加文件到 Git
add_files() {
  echo -e "${YELLOW}添加文件到 Git...${NC}"
  
  git add .
  
  echo -e "${GREEN}文件添加完成!${NC}"
}

# 创建初始提交
create_initial_commit() {
  echo -e "${YELLOW}创建初始提交...${NC}"
  
  git commit -m "初始提交: ChainIntelAI 项目"
  
  echo -e "${GREEN}初始提交创建完成!${NC}"
}

# 添加 GitHub 远程仓库
add_remote() {
  echo -e "${YELLOW}是否添加 GitHub 远程仓库? (y/n)${NC}"
  read -r add_remote
  
  if [[ $add_remote =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}请输入 GitHub 仓库 URL (例如: https://github.com/username/repo.git):${NC}"
    read -r repo_url
    
    if [ -z "$repo_url" ]; then
      echo -e "${RED}错误: 未提供仓库 URL${NC}"
      return
    fi
    
    git remote add origin "$repo_url"
    echo -e "${GREEN}远程仓库添加完成!${NC}"
    
    echo -e "${YELLOW}是否推送到远程仓库? (y/n)${NC}"
    read -r push_remote
    
    if [[ $push_remote =~ ^[Yy]$ ]]; then
      git push -u origin master
      echo -e "${GREEN}推送到远程仓库完成!${NC}"
    fi
  fi
}

# 创建 GitHub Actions 工作流
create_github_actions() {
  echo -e "${YELLOW}是否创建 GitHub Actions 工作流? (y/n)${NC}"
  read -r create_actions
  
  if [[ $create_actions =~ ^[Yy]$ ]]; then
    mkdir -p .github/workflows
    
    # 创建前端测试工作流
    cat > .github/workflows/frontend-tests.yml << EOL
name: 前端测试

on:
  push:
    branches: [ master, develop ]
    paths:
      - 'frontend/**'
  pull_request:
    branches: [ master, develop ]
    paths:
      - 'frontend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    defaults:
      run:
        working-directory: frontend
        
    steps:
    - uses: actions/checkout@v3
    
    - name: 设置 Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'yarn'
        cache-dependency-path: frontend/yarn.lock
        
    - name: 安装依赖
      run: yarn install
      
    - name: 运行测试
      run: yarn test
EOL
    
    # 如果存在后端，创建后端测试工作流
    if [ -d "backend" ]; then
      cat > .github/workflows/backend-tests.yml << EOL
name: 后端测试

on:
  push:
    branches: [ master, develop ]
    paths:
      - 'backend/**'
  pull_request:
    branches: [ master, develop ]
    paths:
      - 'backend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    defaults:
      run:
        working-directory: backend
        
    steps:
    - uses: actions/checkout@v3
    
    - name: 设置 Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'yarn'
        cache-dependency-path: backend/yarn.lock
        
    - name: 安装依赖
      run: yarn install
      
    - name: 运行测试
      run: yarn test
EOL
    fi
    
    echo -e "${GREEN}GitHub Actions 工作流创建完成!${NC}"
  fi
}

# 创建 GitHub Issue 和 PR 模板
create_github_templates() {
  echo -e "${YELLOW}是否创建 GitHub Issue 和 PR 模板? (y/n)${NC}"
  read -r create_templates
  
  if [[ $create_templates =~ ^[Yy]$ ]]; then
    mkdir -p .github/ISSUE_TEMPLATE
    
    # Bug 报告模板
    cat > .github/ISSUE_TEMPLATE/bug_report.md << EOL
---
name: Bug 报告
about: 创建报告以帮助我们改进
title: '[BUG] '
labels: bug
assignees: ''
---

**描述 Bug**
清晰简洁地描述 Bug 是什么。

**复现步骤**
复现行为的步骤:
1. 前往 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

**预期行为**
清晰简洁地描述您期望发生的事情。

**截图**
如果适用，添加截图以帮助解释您的问题。

**环境信息:**
 - 操作系统: [例如 iOS]
 - 浏览器: [例如 chrome, safari]
 - 版本: [例如 22]

**附加上下文**
在此处添加有关问题的任何其他上下文。
EOL
    
    # 功能请求模板
    cat > .github/ISSUE_TEMPLATE/feature_request.md << EOL
---
name: 功能请求
about: 为这个项目提出一个想法
title: '[功能] '
labels: enhancement
assignees: ''
---

**您的功能请求是否与问题相关? 请描述。**
清晰简洁地描述问题是什么。例如，当 [...] 时我总是感到沮丧。

**描述您想要的解决方案**
清晰简洁地描述您希望发生的事情。

**描述您考虑过的替代方案**
清晰简洁地描述您考虑过的任何替代解决方案或功能。

**附加上下文**
在此处添加有关功能请求的任何其他上下文或截图。
EOL
    
    # PR 模板
    cat > .github/pull_request_template.md << EOL
## 描述

请包括对更改的摘要以及相关动机和背景。列出此拉取请求所需的任何依赖项。

修复 # (issue)

## 更改类型

- [ ] Bug 修复 (非破坏性变更，修复问题)
- [ ] 新功能 (非破坏性变更，添加功能)
- [ ] 破坏性变更 (会导致现有功能无法按预期工作的修复或功能)
- [ ] 文档更新

## 如何测试?

请描述我们可以验证您的更改的步骤。提供相关的说明，以便我们可以复现。请还列出任何相关的详细信息。

## 检查清单:

- [ ] 我的代码遵循此项目的代码风格
- [ ] 我已经自我审查了我自己的代码
- [ ] 我已经为我的更改添加了注释，特别是在难以理解的区域
- [ ] 我已经对我的更改进行了相应的修改
- [ ] 我的更改不会产生新的警告
- [ ] 我已经添加了测试，证明我的修复是有效的或者我的功能是有效的
- [ ] 新的和现有的单元测试在我的更改下通过
- [ ] 任何依赖性更改都已记录在下面并更新到相关文档
EOL
    
    echo -e "${GREEN}GitHub Issue 和 PR 模板创建完成!${NC}"
  fi
}

# 主函数
main() {
  check_git
  init_git_repo
  create_gitignore
  add_files
  create_initial_commit
  add_remote
  create_github_actions
  create_github_templates
  
  echo -e "${GREEN}GitHub 设置完成!${NC}"
  echo -e "${YELLOW}接下来的步骤:${NC}"
  echo "1. 在 GitHub 上创建仓库 (如果尚未创建)"
  echo "2. 推送代码到 GitHub: git push -u origin master"
  echo "3. 设置分支保护规则 (在 GitHub 仓库设置中)"
  echo "4. 邀请团队成员加入仓库"
}

# 执行主函数
main 