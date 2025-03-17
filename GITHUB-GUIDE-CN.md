# ChainIntelAI GitHub 指南

## 目录

1. [简介](#简介)
2. [前提条件](#前提条件)
3. [使用自动化脚本](#使用自动化脚本)
4. [手动设置](#手动设置)
5. [分支策略](#分支策略)
6. [提交规范](#提交规范)
7. [Pull Request 流程](#pull-request-流程)
8. [GitHub Actions](#github-actions)
9. [常见问题](#常见问题)

## 简介

本指南提供了将 ChainIntelAI 项目上传到 GitHub 并进行有效管理的详细步骤。无论您是使用我们的自动化脚本还是手动设置，本文档都将帮助您顺利完成整个过程。

## 前提条件

在开始之前，请确保您已经：

1. 安装了 Git（[下载链接](https://git-scm.com/downloads)）
2. 拥有 GitHub 账户（[注册链接](https://github.com/join)）
3. 配置了 Git 用户信息：
   ```bash
   git config --global user.name "您的名字"
   git config --global user.email "您的邮箱"
   ```
4. （可选）设置了 SSH 密钥（[GitHub 文档](https://docs.github.com/cn/authentication/connecting-to-github-with-ssh)）

## 使用自动化脚本

我们提供了一个自动化脚本来简化 GitHub 设置过程。

### 步骤 1: 运行脚本

```bash
./scripts/github-setup.sh
```

该脚本将引导您完成以下步骤：

- 检查 Git 是否已安装
- 初始化 Git 仓库
- 创建 .gitignore 文件
- 添加文件并创建初始提交
- 添加 GitHub 远程仓库
- 创建 GitHub Actions 工作流
- 创建 Issue 和 PR 模板

### 步骤 2: 按照提示操作

脚本会提示您输入必要的信息，如 GitHub 仓库 URL。请按照屏幕上的指示进行操作。

## 手动设置

如果您更喜欢手动设置，请按照以下步骤操作：

### 步骤 1: 初始化 Git 仓库

```bash
git init
```

### 步骤 2: 创建 .gitignore 文件

创建一个包含以下内容的 .gitignore 文件：

```
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
```

### 步骤 3: 添加文件并提交

```bash
git add .
git commit -m "初始提交: ChainIntelAI 项目"
```

### 步骤 4: 在 GitHub 上创建仓库

1. 登录 GitHub
2. 点击右上角的 "+" 图标，选择 "New repository"
3. 填写仓库名称（例如 "ChainIntelAI"）
4. 添加描述（可选）
5. 选择仓库可见性（公开或私有）
6. 点击 "Create repository"

### 步骤 5: 添加远程仓库并推送

```bash
git remote add origin https://github.com/用户名/ChainIntelAI.git
git push -u origin master
```

## 分支策略

我们采用以下分支策略：

- **master**: 生产环境分支，只接受来自 develop 分支的合并
- **develop**: 开发分支，包含最新的开发代码
- **feature/xxx**: 功能分支，用于开发新功能
- **bugfix/xxx**: 修复分支，用于修复 bug
- **release/x.x.x**: 发布分支，用于准备新版本发布

### 创建新功能分支

```bash
git checkout develop
git pull
git checkout -b feature/新功能名称
```

## 提交规范

我们使用以下提交消息格式：

```
<类型>(<范围>): <描述>

[可选的正文]

[可选的脚注]
```

类型包括：

- **feat**: 新功能
- **fix**: 修复 bug
- **docs**: 文档更改
- **style**: 不影响代码含义的更改（空格、格式等）
- **refactor**: 既不修复 bug 也不添加功能的代码更改
- **perf**: 提高性能的代码更改
- **test**: 添加或修正测试
- **chore**: 对构建过程或辅助工具的更改

示例：

```
feat(搜索): 添加高级搜索功能

实现了按日期、类型和状态筛选的高级搜索功能。

解决了 #123 问题
```

## Pull Request 流程

1. 将您的分支推送到 GitHub：

   ```bash
   git push origin feature/新功能名称
   ```

2. 在 GitHub 上创建 Pull Request：

   - 访问仓库页面
   - 点击 "Pull requests" 选项卡
   - 点击 "New pull request"
   - 选择基础分支（通常是 develop）和您的功能分支
   - 点击 "Create pull request"
   - 填写标题和描述
   - 点击 "Create pull request"

3. 等待代码审查和 CI 测试通过

4. 合并 Pull Request

## GitHub Actions

我们使用 GitHub Actions 进行持续集成和部署。主要工作流包括：

- **前端测试**: 在 push 和 pull request 时运行前端测试
- **后端测试**: 在 push 和 pull request 时运行后端测试

您可以在 `.github/workflows` 目录中查看和修改这些工作流。

## 常见问题

### 如何解决合并冲突？

1. 将最新的目标分支拉取到本地：

   ```bash
   git checkout develop
   git pull
   ```

2. 切换回您的分支并合并：

   ```bash
   git checkout feature/您的功能
   git merge develop
   ```

3. 解决冲突后，提交更改：
   ```bash
   git add .
   git commit -m "解决合并冲突"
   ```

### 如何撤销最后一次提交？

```bash
git reset --soft HEAD~1
```

### 如何查看提交历史？

```bash
git log --oneline --graph
```

---

如有任何问题，请联系项目维护者或在 GitHub 上创建 Issue。
