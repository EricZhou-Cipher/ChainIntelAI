# ChainIntelAI | 链智能 AI

<div align="center">
  <img src="docs/images/logo.png" alt="ChainIntelAI Logo" width="200"/>
  <p>
    <b>区块链智能分析平台 | Blockchain Intelligence Analysis Platform</b>
  </p>
</div>

[English](#english) | [中文](#chinese)

---

<a name="english"></a>

## 🌐 English

### Overview

ChainIntelAI is an advanced blockchain intelligence platform that monitors, analyzes, and detects suspicious activities across multiple blockchain networks. Leveraging AI and machine learning algorithms, it provides real-time risk assessment and alerts for crypto transactions.

### Key Features

- **Multi-chain Monitoring**: Track transactions across Ethereum, BSC, Polygon, and other EVM-compatible chains
- **AI-powered Risk Analysis**: Detect suspicious patterns and potential threats using advanced machine learning models
- **Real-time Alerts**: Receive instant notifications for high-risk transactions
- **Address Profiling**: Build comprehensive risk profiles for blockchain addresses
- **Historical Data Analysis**: Analyze past transaction patterns to identify trends
- **User-friendly Dashboard**: Visualize blockchain activities and risk metrics

### Technology Stack

- **Backend**: Node.js, Express, MongoDB
- **AI/ML**: TensorFlow, Python
- **Blockchain Interaction**: ethers.js, Web3.js
- **Frontend**: React, TypeScript, Tailwind CSS
- **DevOps**: Docker, GitHub Actions, AWS

### Getting Started

#### Prerequisites

- Node.js (v18 or higher)
- MongoDB
- Ethereum RPC endpoint (Infura, Alchemy, or local node)

#### Installation

```bash
# Clone the repository
git clone https://github.com/EricZhou-Cipher/ChainIntelAI.git
cd ChainIntelAI

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the development server
npm run dev
```

#### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --testPathPattern=auth
```

### Project Structure

```
ChainIntelAI/
├── backend/               # Backend server code
│   ├── src/               # Source files
│   │   ├── analyzer/      # Risk analysis modules
│   │   ├── api/           # API endpoints
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Request handlers
│   │   ├── database/      # Database models and connections
│   │   ├── middleware/    # Express middleware
│   │   ├── monitoring/    # System monitoring
│   │   ├── notifier/      # Alert notification system
│   │   ├── pipeline/      # Data processing pipeline
│   │   ├── profiling/     # Address profiling logic
│   │   ├── scheduler/     # Task scheduling
│   │   └── utils/         # Utility functions
│   ├── tests/             # Test files
│   └── package.json       # Dependencies
├── frontend/              # Frontend application
├── docs/                  # Documentation
└── README.md              # Project overview
```

### Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<a name="chinese"></a>

## 🌐 中文

### 概述

ChainIntelAI 是一个先进的区块链智能分析平台，可监控、分析和检测多个区块链网络上的可疑活动。通过利用人工智能和机器学习算法，它为加密货币交易提供实时风险评估和警报。

### 主要特点

- **多链监控**：跟踪以太坊、BSC、Polygon 和其他 EVM 兼容链上的交易
- **AI 驱动的风险分析**：使用先进的机器学习模型检测可疑模式和潜在威胁
- **实时警报**：接收高风险交易的即时通知
- **地址画像**：为区块链地址建立全面的风险档案
- **历史数据分析**：分析过去的交易模式以识别趋势
- **用户友好的仪表板**：可视化区块链活动和风险指标

### 技术栈

- **后端**：Node.js, Express, MongoDB
- **AI/ML**：TensorFlow, Python
- **区块链交互**：ethers.js, Web3.js
- **前端**：React, TypeScript, Tailwind CSS
- **DevOps**：Docker, GitHub Actions, AWS

### 快速开始

#### 前提条件

- Node.js (v18 或更高版本)
- MongoDB
- 以太坊 RPC 端点 (Infura, Alchemy 或本地节点)

#### 安装

```bash
# 克隆仓库
git clone https://github.com/EricZhou-Cipher/ChainIntelAI.git
cd ChainIntelAI

# 安装依赖
npm install

# 设置环境变量
cp .env.example .env
# 编辑.env文件进行配置

# 启动开发服务器
npm run dev
```

#### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试套件
npm test -- --testPathPattern=auth
```

### 项目结构

```
ChainIntelAI/
├── backend/               # 后端服务器代码
│   ├── src/               # 源文件
│   │   ├── analyzer/      # 风险分析模块
│   │   ├── api/           # API端点
│   │   ├── config/        # 配置文件
│   │   ├── controllers/   # 请求处理器
│   │   ├── database/      # 数据库模型和连接
│   │   ├── middleware/    # Express中间件
│   │   ├── monitoring/    # 系统监控
│   │   ├── notifier/      # 警报通知系统
│   │   ├── pipeline/      # 数据处理管道
│   │   ├── profiling/     # 地址画像逻辑
│   │   ├── scheduler/     # 任务调度
│   │   └── utils/         # 实用函数
│   ├── tests/             # 测试文件
│   └── package.json       # 依赖项
├── frontend/              # 前端应用
├── docs/                  # 文档
└── README.md              # 项目概述
```

### 贡献

我们欢迎贡献！请查看我们的[贡献指南](CONTRIBUTING.md)了解详情。

### 许可证

本项目采用 MIT 许可证 - 详情请参阅[LICENSE](LICENSE)文件。
