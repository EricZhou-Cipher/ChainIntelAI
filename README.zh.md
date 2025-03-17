# ChainIntel AI 区块链分析平台

ChainIntel AI 是一个先进的区块链数据分析平台，专注于提供高性能、直观的区块链数据可视化和分析工具。

![ChainIntel AI 平台截图](./public/screenshot.png)

## 性能优化亮点

本项目实现了多种先进的性能优化方案，以确保即使在处理大规模区块链网络数据时也能提供流畅的用户体验：

### 1. 双模式渲染引擎

- **WebGL 渲染引擎**：使用 PixiJS 实现基于 WebGL 的高性能渲染，适用于大型网络图（>100 节点）
- **SVG 渲染引擎**：使用 D3.js 实现基于 SVG 的标准渲染，适用于小型网络图和不支持 WebGL 的环境
- **智能切换**：基于节点数量和设备性能自动选择最佳渲染方式

### 2. 视口裁剪技术

- **屏幕外节点优化**：只渲染当前视口内的节点，大幅减少绘制开销
- **层级结构**：自动将远离焦点的节点分组为集群，减少渲染负担
- **动态详细程度**：根据缩放级别调整节点的渲染细节

### 3. 后台处理和缓存

- **Web Worker**：在后台线程生成和处理大型网络数据，避免阻塞主线程
- **数据流分析**：增量处理大型区块链数据，减少内存占用
- **结果缓存**：缓存频繁访问的数据和计算结果，减少重复计算

### 4. 自适应性能管理

- **性能监控**：实时监测 FPS 和渲染时间，自动调整渲染细节
- **设备能力检测**：检测设备 WebGL 支持情况和性能级别，优化渲染策略
- **性能仪表板**：提供可视化性能指标和优化建议

### 5. 用户体验优化

- **渐进式加载**：首先显示重要节点，然后逐步加载完整网络
- **响应式交互**：即使在大型网络中也保持流畅的拖拽、缩放和选择操作
- **智能布局**：自动调整节点位置以减少重叠，提高可读性

## 主要功能

- **区块链网络分析**：可视化地址、交易和合约之间的关系
- **风险评估**：基于网络分析识别可疑活动和高风险地址
- **实时监控**：追踪新交易并更新网络视图
- **交易追踪**：追踪资金流向和来源
- **地址聚类**：识别可能属于同一实体的地址组

## 技术栈

- **前端**：Next.js、React、TypeScript、Tailwind CSS
- **可视化**：D3.js、PixiJS、WebGL
- **性能优化**：Web Workers、WebGL 检测、性能监控
- **国际化**：i18next（支持中文和英文）

## 快速开始

### 要求

- Node.js 16+
- npm 或 yarn

### 安装依赖

```bash
yarn install
```

### 开发模式

```bash
yarn dev
```

浏览器访问：http://localhost:3000

### 构建生产版本

```bash
yarn build
yarn start
```

## 项目结构

```
/
├── frontend/                # 前端代码
│   ├── app/                 # Next.js 页面和组件
│   │   ├── dashboard/       # 仪表板页面
│   │   ├── transactions/    # 交易页面
│   │   ├── addresses/       # 地址页面
│   │   ├── network-analysis/# 网络分析页面
│   │   └── i18n/            # 国际化文件
│   ├── components/          # 共享组件
│   │   ├── BlockchainNetwork.tsx          # 标准网络可视化组件
│   │   ├── BlockchainNetworkOptimized.tsx # 优化版网络可视化组件
│   │   ├── BlockchainNetworkTypes.ts      # 类型定义
│   │   ├── ErrorBoundary.tsx              # 错误边界组件
│   │   └── PerformanceDashboard.tsx       # 性能仪表板组件
│   ├── utils/               # 工具函数
│   │   ├── blockchainDataService.ts       # 区块链数据服务
│   │   ├── networkDataService.ts          # 网络数据服务
│   │   └── webglDetector.ts               # WebGL 检测工具
│   └── public/              # 静态资源
│       └── workers/         # Web Workers
└── tests/                   # 测试文件
```

## 核心功能详解

### 区块链网络可视化

区块链网络可视化组件使用力导向布局算法显示地址和交易之间的关系。节点根据类型（地址、交易、合约）和风险级别使用不同的颜色和形状，连接线表示交易关系。

```typescript
// 使用优化版组件
<BlockchainNetworkOptimized
  nodes={networkData.nodes}
  links={networkData.links}
  width={1000}
  height={600}
  onNodeClick={handleNodeClick}
  onLinkClick={handleLinkClick}
/>
```

### WebGL 检测

系统会自动检测用户浏览器是否支持 WebGL 渲染，并根据设备性能选择最佳渲染模式：

```typescript
// 检测 WebGL 支持
const isSupported = isWebGLSupported();

// 获取设备性能级别
const performanceLevel = getDevicePerformanceLevel();

// 根据节点数量和设备性能选择渲染模式
const bestMode = detectBestVisualizationMode(nodeCount);
```

### Web Worker 数据处理

对于大型网络数据生成和处理，系统使用 Web Worker 在后台线程进行，避免阻塞主线程：

```typescript
// 使用 Web Worker 生成大型网络数据
const largeData = await generateLargeNetworkData(500, 1000, 600);
```

## 性能测试结果

| 测试场景 | 节点数 | 链接数 | SVG 模式 FPS | WebGL 模式 FPS | 内存占用减少 |
| -------- | ------ | ------ | ------------ | -------------- | ------------ |
| 小型网络 | 50     | 75     | 60 FPS       | 60 FPS         | -            |
| 中型网络 | 200    | 350    | 30 FPS       | 58 FPS         | 15%          |
| 大型网络 | 1000   | 2000   | 5 FPS        | 45 FPS         | 40%          |
| 超大网络 | 5000   | 10000  | <1 FPS       | 30 FPS         | 65%          |

## 常见问题解答

**问题**：系统支持哪些区块链？
**回答**：目前支持以太坊、比特币和币安智能链。

**问题**：数据是实时的吗？
**回答**：是的，系统支持实时数据更新，但也可以离线分析历史数据。

**问题**：如何处理大型网络渲染性能问题？
**回答**：系统采用多种优化策略，包括 WebGL 渲染、视口裁剪、节点聚类等，可处理高达数万节点的网络。

## 贡献指南

我们欢迎各种形式的贡献！若要参与项目开发：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

MIT License

## 联系我们

如有问题或建议，请通过以下方式联系我们：

- 电子邮件：support@chainintelai.com
- 官方网站：https://chainintelai.com
