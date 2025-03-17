# ChainIntelAI 快速启动指南

本文档提供了快速设置和运行 ChainIntelAI 项目的步骤。

## 目录

- [前提条件](#前提条件)
- [快速启动](#快速启动)
- [手动设置](#手动设置)
- [项目结构](#项目结构)
- [常见问题](#常见问题)

## 前提条件

在开始之前，请确保您的系统满足以下要求：

- **Node.js**: v18.0.0 或更高版本
- **Yarn**: 最新版本
- **Git**: 最新版本
- **MongoDB**: 用于后端数据存储（如果运行后端）

## 快速启动

我们提供了一个快速启动脚本，可以自动完成大部分设置步骤：

```bash
# 克隆仓库（如果尚未克隆）
git clone https://github.com/EricZhou-Cipher/ChainIntelAI.git
cd ChainIntelAI

# 运行快速启动脚本
./scripts/setup.sh
```

这个脚本将：

1. 检查必要的依赖
2. 安装项目依赖
3. 设置环境变量
4. 运行基本测试
5. 提供帮助信息
6. 可选择启动开发服务器

## 手动设置

如果您更喜欢手动设置，或者快速启动脚本出现问题，请按照以下步骤操作：

### 1. 安装依赖

```bash
# 安装前端依赖
cd frontend
yarn install

# 安装后端依赖（如果需要）
cd ../backend
yarn install
```

### 2. 设置环境变量

```bash
# 前端环境变量
cd frontend
cp .env.example .env
# 编辑 .env 文件设置必要的环境变量

# 后端环境变量（如果需要）
cd ../backend
cp .env.example .env
# 编辑 .env 文件设置必要的环境变量
```

### 3. 启动开发服务器

```bash
# 启动前端开发服务器
cd frontend
yarn dev

# 启动后端开发服务器（如果需要）
cd ../backend
yarn dev
```

## 项目结构

```
ChainIntelAI/
├── frontend/              # 前端应用
│   ├── app/               # Next.js 应用程序路由和页面
│   ├── components/        # React 组件
│   ├── __tests__/         # 测试文件
│   ├── scripts/           # 实用脚本
│   │   ├── create-test.sh # 创建测试文件的脚本
│   │   └── run-tests.sh   # 运行测试的脚本
│   └── TESTING.md         # 前端测试文档
├── backend/               # 后端服务器（如果有）
├── scripts/               # 项目级脚本
│   └── setup.sh           # 快速启动脚本
├── README.md              # 项目概述
└── QUICKSTART.md          # 本文档
```

## 测试

我们为项目提供了完整的测试框架和工具：

### 创建组件测试

```bash
# 进入前端目录
cd frontend

# 为组件创建测试文件
./scripts/create-test.sh -c 组件名
# 或使用 yarn 脚本
yarn create-test -c 组件名
```

### 运行测试

```bash
# 进入前端目录
cd frontend

# 运行所有测试
./scripts/run-tests.sh -a
# 或使用 yarn 脚本
yarn run-tests -a

# 运行特定组件的测试
./scripts/run-tests.sh -c 组件名
# 或使用 yarn 脚本
yarn run-tests -c 组件名

# 以监视模式运行测试
./scripts/run-tests.sh -c 组件名 -w
# 或使用 yarn 脚本
yarn run-tests -c 组件名 -w
```

## 常见问题

### 1. 安装依赖时出错

如果在安装依赖时遇到问题，请尝试以下解决方案：

```bash
# 清除 yarn 缓存
yarn cache clean

# 删除 node_modules 目录
rm -rf node_modules

# 重新安装依赖
yarn install
```

### 2. 找不到环境变量

确保您已经正确设置了环境变量文件：

```bash
# 检查前端环境变量文件是否存在
ls -la frontend/.env

# 如果不存在，从示例文件创建
cp frontend/.env.example frontend/.env
```

### 3. 测试失败

如果测试失败，请检查：

1. 组件实现是否正确
2. 测试代码是否正确
3. 是否有异步操作需要等待

您可以使用以下命令查看详细的测试输出：

```bash
cd frontend
yarn test --verbose
```

### 4. 开发服务器无法启动

如果开发服务器无法启动，请检查：

1. 端口是否被占用（默认为 3000）
2. 环境变量是否正确设置
3. 依赖是否正确安装

您可以尝试在不同的端口上启动服务器：

```bash
cd frontend
PORT=3001 yarn dev
```

---

如有任何问题，请联系项目负责人或提交 Issue。
