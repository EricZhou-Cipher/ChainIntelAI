# 贡献指南

感谢您对 ChainIntelAI 项目的关注！我们非常欢迎社区成员的贡献，无论是修复错误、改进文档还是添加新功能。本指南将帮助您了解如何参与项目开发。

## 行为准则

参与本项目的所有贡献者都需要遵守我们的[行为准则](CODE_OF_CONDUCT.md)。请确保您的所有互动都尊重他人并符合这些准则。

## 如何贡献

### 报告问题

如果您发现了问题或有功能请求，请通过以下步骤提交：

1. 检查 [Issues](https://github.com/yourusername/chainintelai/issues) 页面，确保该问题尚未被报告
2. 使用相应的模板创建新的 issue
3. 提供尽可能详细的信息，包括：
   - 问题的清晰描述
   - 复现步骤
   - 预期行为与实际行为
   - 相关的日志或截图
   - 您的环境信息（操作系统、浏览器版本等）

### 提交代码

1. Fork 项目仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m '添加了一些很棒的功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建一个 Pull Request

### Pull Request 指南

为了确保您的 PR 能够被顺利接受，请遵循以下准则：

1. 确保您的代码符合项目的代码风格和质量标准
2. 为您的更改添加适当的测试
3. 更新相关文档
4. 保持 PR 的专注性，每个 PR 只解决一个问题或添加一个功能
5. 在 PR 描述中清晰地说明您的更改内容和目的

## 开发设置

### 前端开发

1. 克隆仓库

   ```bash
   git clone https://github.com/yourusername/chainintelai.git
   cd chainintelai
   ```

2. 安装依赖

   ```bash
   cd frontend
   yarn install
   ```

3. 启动开发服务器
   ```bash
   yarn dev
   ```

### 后端开发

1. 安装依赖

   ```bash
   cd backend
   npm install
   ```

2. 设置环境变量

   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填入必要的配置
   ```

3. 启动开发服务器
   ```bash
   npm run dev
   ```

## 代码规范

### JavaScript/TypeScript

- 使用 ESLint 和 Prettier 进行代码格式化
- 遵循项目中已有的代码风格
- 使用有意义的变量和函数名
- 添加适当的注释，特别是对于复杂的逻辑

### CSS/SCSS

- 使用 TailwindCSS 类名
- 对于自定义样式，使用 BEM 命名约定
- 保持样式的模块化和可重用性

### 测试

- 为所有新功能和修复添加测试
- 确保所有测试都能通过
- 使用有意义的测试描述

## 分支策略

- `main`: 稳定的生产版本
- `develop`: 开发分支，所有功能分支都应该从这里分出
- `feature/*`: 新功能开发
- `bugfix/*`: 错误修复
- `hotfix/*`: 紧急修复，直接从 `main` 分支创建

## 版本控制

我们使用 [语义化版本控制](https://semver.org/lang/zh-CN/)。版本格式为：`主版本号.次版本号.修订号`。

## 文档

- 更新 README.md 和其他相关文档以反映您的更改
- 为新功能添加用户文档
- 为复杂的代码添加代码注释

## 许可证

通过贡献您的代码，您同意您的贡献将根据项目的 [MIT 许可证](LICENSE) 进行许可。
