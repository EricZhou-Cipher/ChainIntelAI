# ChainIntelAI - 区块链智能分析平台

<div align="center">
  <img src="frontend/public/logo.png" alt="ChainIntelAI Logo" width="200" />
  <p>智能区块链数据分析与可视化平台</p>
</div>

## 项目概述

ChainIntelAI 是一个强大的区块链数据分析平台，结合了先进的人工智能技术，为用户提供深入的区块链数据洞察和可视化。该平台支持多链数据分析，包括以太坊、比特币等主流区块链，并提供智能合约分析、交易模式识别和异常检测等功能。

### 主要功能

- **多链数据分析**：支持以太坊、比特币等多个区块链的数据分析
- **智能合约分析**：自动检测智能合约漏洞和安全风险
- **交易模式识别**：识别和分析区块链上的交易模式和趋势
- **异常检测**：使用AI算法检测可疑交易和异常活动
- **数据可视化**：直观的图表和仪表板展示区块链数据
- **实时监控**：实时监控区块链活动和关键指标
- **自定义报告**：生成定制化的区块链数据分析报告

## 快速开始

请参考 [快速开始指南](QUICKSTART.md) 了解如何设置和运行项目。

## 技术栈

### 前端

- React.js
- Next.js
- TailwindCSS
- D3.js (数据可视化)
- Ethers.js (区块链交互)

### 后端

- Node.js
- Express
- MongoDB
- Redis (缓存)
- Web3.js (区块链交互)

### AI/ML

- TensorFlow
- PyTorch
- NLP 模型 (用于智能合约分析)
- 异常检测算法

## 项目结构

```
ChainIntelAI/
├── frontend/            # 前端代码
│   ├── app/             # Next.js 应用
│   ├── components/      # React 组件
│   ├── public/          # 静态资源
│   └── styles/          # 样式文件
├── backend/             # 后端代码
│   ├── api/             # API 路由
│   ├── models/          # 数据模型
│   ├── services/        # 业务逻辑
│   └── utils/           # 工具函数
├── ml/                  # 机器学习模型
│   ├── models/          # 训练好的模型
│   ├── training/        # 模型训练代码
│   └── inference/       # 模型推理代码
├── scripts/             # 实用脚本
├── tests/               # 测试代码
└── docs/                # 文档
```

## 开发指南

### 组件开发

我们提供了便捷的脚本来创建新组件和测试文件：

```bash
# 创建新组件
./frontend/scripts/create-component.sh -n ComponentName -t ui

# 创建测试文件
./frontend/scripts/create-test.sh -c ComponentName
```

### 测试

```bash
# 运行前端测试
cd frontend
yarn test

# 运行后端测试
cd backend
npm test
```

## 贡献指南

我们欢迎所有形式的贡献！请查看 [贡献指南](CONTRIBUTING.md) 了解如何参与项目开发。

## 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 联系我们

- 项目主页：[https://chainintelai.com](https://chainintelai.com)
- 问题反馈：[GitHub Issues](https://github.com/yourusername/chainintelai/issues)
- 邮箱：contact@chainintelai.com
