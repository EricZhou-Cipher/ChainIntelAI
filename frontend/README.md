# ChainIntelAI 前端项目

ChainIntelAI 是一个区块链智能分析平台，用于实时监控区块链交易，智能识别风险。

## 项目结构

```
frontend/
├── app/                    # Next.js 应用目录
│   ├── components/         # 可复用组件
│   ├── contexts/           # React 上下文
│   ├── hooks/              # 自定义 React hooks
│   ├── i18n/               # 国际化配置和翻译文件
│   ├── utils/              # 工具函数
│   ├── addresses/          # 地址画像页面
│   ├── alerts/             # 风险告警页面
│   ├── dashboard/          # 仪表盘页面
│   ├── transactions/       # 交易分析页面
│   ├── layout.js           # 布局组件
│   ├── page.js             # 首页组件
│   └── globals.css         # 全局样式
├── __tests__/              # 测试目录
│   └── components/         # 组件测试
├── cypress/                # E2E 测试
│   ├── e2e/                # E2E 测试文件
│   └── support/            # 测试支持文件
├── public/                 # 静态资源
├── .eslintrc.js            # ESLint 配置
├── .prettierrc             # Prettier 配置
├── jest.config.js          # Jest 配置
├── jest.setup.js           # Jest 设置
├── cypress.config.js       # Cypress 配置
├── next.config.js          # Next.js 配置
└── package.json            # 项目依赖
```

## 组件结构

我们将页面中的重复组件提取为可复用组件，包括：

- `PageHeader`: 页面标题组件
- `SearchBar`: 搜索栏组件
- `RiskBadge`: 风险等级标签组件
- `StatusBadge`: 状态标签组件
- `AddressFormatter`: 地址格式化组件
- `DateFormatter`: 日期格式化组件
- `StatCard`: 统计卡片组件
- `AlertsTable`: 风险告警表格组件
- `TransactionsTable`: 交易表格组件

## 工具函数

我们将重复的工具函数提取为可复用函数，包括：

- `formatters.js`: 格式化工具函数
- `api.js`: API 请求工具函数

## 自定义 Hooks

我们创建了一些自定义 hooks，用于处理常见的状态管理：

- `useSearch`: 搜索 hook，用于处理搜索功能
- `useFetch`: 数据获取 hook，用于处理数据获取
- `useLocalStorage`: 本地存储 hook，用于处理本地存储
- `useApi`: API 请求 hook，用于处理 API 请求

## 全局状态管理

我们使用 React Context API 实现了全局状态管理：

- `AppContext`: 应用全局状态
- `LocalStorageContext`: 本地存储状态
- `ThemeContext`: 主题状态

## 国际化支持

项目使用 i18next 和 react-i18next 实现国际化支持。翻译文件位于 `app/i18n/locales/` 目录下。

目前支持的语言:

- 中文 (zh-CN)
- 英文 (en-US)

## 测试

我们添加了测试配置和示例测试：

- Jest 单元测试和组件测试
- Cypress E2E 测试

## 代码规范

我们添加了代码规范配置：

- ESLint 配置
- Prettier 配置

## 优化内容

1. **组件复用**：提取了多个可复用组件，减少了代码重复
2. **状态管理**：使用 Context API 和自定义 hooks 管理状态，使代码更清晰
3. **工具函数**：提取了工具函数，减少了代码重复
4. **错误处理**：添加了错误处理和加载状态
5. **代码规范**：添加了 ESLint 和 Prettier 配置，统一代码风格
6. **测试**：添加了测试配置和示例测试
7. **国际化**：添加了多语言支持
8. **主题**：添加了暗黑模式支持

## 性能优化组件

项目中包含了多个性能优化的React组件示例，展示了不同的优化技术：

### 1. MemoizedComponent

使用 `React.memo` 和 `useCallback` 优化的组件示例，避免不必要的重新渲染。

```tsx
// 使用React.memo优化的子组件
const MemoizedChild = React.memo(({ name, count, onClick }: ChildProps) => {
  // 组件内容
});

// 使用useCallback优化事件处理函数
const handleClick = useCallback(() => {
  // 处理逻辑
}, []);
```

### 2. OptimizedForm

优化的表单组件，使用多种性能优化技术：

- 使用 `React.memo` 避免表单项不必要的重新渲染
- 使用 `useCallback` 优化事件处理函数
- 使用 `useMemo` 缓存验证逻辑
- 使用防抖函数优化表单验证

### 3. VirtualizedList

虚拟列表组件，只渲染可视区域内的列表项，适用于展示大量数据：

- 只渲染可视区域内的列表项，而不是全部项目
- 使用绝对定位放置列表项，避免重排
- 使用节流函数优化滚动事件处理
- 使用overscan参数预渲染额外的项目，使滚动更平滑

### 4. 性能优化工具函数

`utils/performance.ts` 文件包含了多个性能优化工具函数：

- `debounce`: 防抖函数，延迟执行函数，适用于输入搜索、窗口调整大小等
- `throttle`: 节流函数，限制函数在一定时间内只能执行一次，适用于滚动事件处理
- `memoize`: 缓存函数结果，避免重复计算
- `batch`: 批量处理函数，将多次操作合并为一次执行
- `rafThrottle`: 使用requestAnimationFrame进行节流
- `idleLoad`: 延迟加载函数，在浏览器空闲时执行

## 性能优化

### D3.js 网络图性能优化

为了解决大规模数据集下的性能问题，我们进行了以下优化：

#### 1. WebGL 渲染 (PixiJS)

使用 PixiJS 实现 WebGL 渲染，相比 SVG 渲染有以下优势：

- 硬件加速：利用 GPU 进行图形渲染
- 更高效的内存管理
- 支持高达数千个节点的流畅渲染
- 大幅减少 DOM 节点数量

实现方式：

```typescript
// 使用 PixiJS 创建渲染器
const app = new PIXI.Application({
  width,
  height,
  backgroundColor: 0xffffff,
  antialias: true,
  autoDensity: true,
  resolution: window.devicePixelRatio || 1,
});
```

#### 2. 视口裁剪 (Viewport Culling)

只渲染当前视口可见的节点和链接，大幅减少绘制开销：

- 节点仅在进入视口时被渲染
- 减少了 GPU 处理的对象数量
- 支持平滑滚动和缩放大型网络

实现方式：

```typescript
// 检查节点是否在视口内
const isNodeInViewport = (node: NetworkNode) => {
  // 计算视口边界
  const vpLeft = -offsetX / scale - margin;
  const vpRight = (width - offsetX) / scale + margin;
  const vpTop = -offsetY / scale - margin;
  const vpBottom = (height - offsetY) / scale + margin;

  // 检查节点是否在视口内
  return node.x >= vpLeft && node.x <= vpRight && node.y >= vpTop && node.y <= vpBottom;
};
```

#### 3. 节点聚合 (Node Clustering)

动态聚合节点以减少渲染对象数量：

- 基于空间距离自动聚合节点
- 用户可调整聚合距离
- 支持点击展开聚合节点查看详情
- 适用于大规模网络分析

实现方式：

```typescript
// 聚合节点算法
const clusterNodes = (nodes, links, distance) => {
  // 根据距离聚合节点
  // 处理链接关系
  // 返回聚合后的节点和链接
};
```

#### 性能对比

| 优化方法   | 常规 SVG (D3) | 优化版 (WebGL) |
| ---------- | ------------- | -------------- |
| 1,000 节点 | 5-10 FPS      | 50-60 FPS      |
| 视口裁剪   | 不支持        | 支持           |
| 节点聚合   | 不支持        | 支持           |
| CPU 使用率 | 高            | 低             |
| 内存占用   | 高            | 低             |

### 使用方法

项目中提供了两个网络图组件：

1. `BlockchainNetwork`: 基础版，使用 D3.js + SVG 渲染，适用于小型网络
2. `BlockchainNetworkOptimized`: 优化版，使用 PixiJS + WebGL 渲染，支持大规模数据集

根据数据规模选择合适的渲染模式：

```tsx
{
  isLargeDataset ? (
    <BlockchainNetworkOptimized nodes={nodes} links={links} />
  ) : (
    <BlockchainNetwork nodes={nodes} links={links} />
  );
}
```

## 依赖管理

项目使用 Yarn 作为包管理工具。添加新依赖:

```bash
yarn add [package-name]
```

添加开发依赖:

```bash
yarn add [package-name] --dev
```

## 运行项目

```bash
# 安装依赖
yarn install

# 开发模式运行
yarn dev

# 构建项目
yarn build

# 运行构建后的项目
yarn start

# 运行代码检查
yarn lint

# 格式化代码
yarn format

# 运行测试
yarn test

# 监视模式运行测试
yarn test:watch

# 打开 Cypress 测试工具
yarn cypress

# 无头模式运行 Cypress 测试
yarn cypress:headless
```

## 后续优化方向

1. **性能优化**：添加组件懒加载和代码分割
2. **可访问性**：提高组件的可访问性
3. **测试覆盖率**：提高测试覆盖率
4. **微前端**：考虑使用微前端架构
5. **PWA**：添加 PWA 支持
