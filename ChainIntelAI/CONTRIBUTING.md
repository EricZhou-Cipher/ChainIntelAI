# Contributing to ChainIntelAI | 贡献指南

[English](#english) | [中文](#chinese)

---

<a name="english"></a>

## 🌐 English

Thank you for considering contributing to ChainIntelAI! This document outlines the process for contributing to the project and helps to make the contribution process easy and effective for everyone.

### Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

### How Can I Contribute?

#### Reporting Bugs

This section guides you through submitting a bug report. Following these guidelines helps maintainers understand your report, reproduce the issue, and find related reports.

Before creating bug reports, please check the issue tracker as you might find that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title** for the issue to identify the problem.
- **Describe the exact steps which reproduce the problem** in as many details as possible.
- **Provide specific examples to demonstrate the steps**. Include links to files or GitHub projects, or copy/pasteable snippets, which you use in those examples.
- **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior.
- **Explain which behavior you expected to see instead and why.**
- **Include screenshots and animated GIFs** which show you following the described steps and clearly demonstrate the problem.

#### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion, including completely new features and minor improvements to existing functionality.

- **Use a clear and descriptive title** for the issue to identify the suggestion.
- **Provide a step-by-step description of the suggested enhancement** in as many details as possible.
- **Provide specific examples to demonstrate the steps**. Include copy/pasteable snippets which you use in those examples.
- **Describe the current behavior** and **explain which behavior you expected to see instead** and why.
- **Include screenshots and animated GIFs** which help you demonstrate the steps or point out the part of ChainIntelAI which the suggestion is related to.
- **Explain why this enhancement would be useful** to most ChainIntelAI users.
- **List some other applications where this enhancement exists.**

#### Pull Requests

- Fill in the required template
- Do not include issue numbers in the PR title
- Include screenshots and animated GIFs in your pull request whenever possible
- Follow the JavaScript and TypeScript styleguides
- Include adequate tests
- Document new code based on the Documentation Styleguide
- End all files with a newline

### Development Workflow

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature-name`
7. Submit a pull request

### Styleguides

#### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
- Consider starting the commit message with an applicable emoji:
  - 🎨 `:art:` when improving the format/structure of the code
  - 🐎 `:racehorse:` when improving performance
  - 🚱 `:non-potable_water:` when plugging memory leaks
  - 📝 `:memo:` when writing docs
  - 🐛 `:bug:` when fixing a bug
  - 🔥 `:fire:` when removing code or files
  - 💚 `:green_heart:` when fixing the CI build
  - ✅ `:white_check_mark:` when adding tests
  - 🔒 `:lock:` when dealing with security
  - ⬆️ `:arrow_up:` when upgrading dependencies
  - ⬇️ `:arrow_down:` when downgrading dependencies

#### JavaScript Styleguide

All JavaScript code is linted with ESLint and formatted with Prettier. Run `npm run lint` to check your code.

#### Documentation Styleguide

- Use [Markdown](https://daringfireball.net/projects/markdown)
- Reference methods and classes in markdown with the custom `{@link Class#method}` syntax

### Additional Notes

#### Issue and Pull Request Labels

This section lists the labels we use to help us track and manage issues and pull requests.

- `bug` - Issues that are bugs
- `documentation` - Issues or PRs related to documentation
- `duplicate` - Issues that are duplicates of other issues
- `enhancement` - Issues that are feature requests
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `invalid` - Issues that are invalid or non-reproducible
- `question` - Issues that are questions
- `wontfix` - Issues that will not be worked on

---

<a name="chinese"></a>

## 🌐 中文

感谢您考虑为 ChainIntelAI 做出贡献！本文档概述了项目贡献流程，旨在使贡献过程对每个人都简单有效。

### 行为准则

参与本项目即表示您同意遵守我们的[行为准则](CODE_OF_CONDUCT.md)。请在贡献前阅读。

### 如何贡献？

#### 报告 Bug

本节指导您提交 Bug 报告。遵循这些指南有助于维护者理解您的报告，复现问题并找到相关报告。

在创建 Bug 报告之前，请检查问题跟踪器，因为您可能会发现不需要创建新的报告。创建 Bug 报告时，请尽可能包含更多详细信息：

- **使用清晰描述性的标题**来标识问题。
- **详细描述重现问题的确切步骤**。
- **提供具体示例来演示这些步骤**。包括您在这些示例中使用的文件链接、GitHub 项目或可复制粘贴的代码片段。
- **描述按照步骤后观察到的行为**，并指出该行为的确切问题所在。
- **解释您期望看到的行为以及原因**。
- **包括屏幕截图和动画 GIF**，展示您按照描述的步骤操作并清晰地演示问题。

#### 建议增强功能

本节指导您提交增强建议，包括全新功能和对现有功能的小改进。

- **使用清晰描述性的标题**来标识建议。
- **详细提供建议增强功能的逐步描述**。
- **提供具体示例来演示这些步骤**。包括您在这些示例中使用的可复制粘贴的代码片段。
- **描述当前行为**并**解释您期望看到的行为以及原因**。
- **包括屏幕截图和动画 GIF**，帮助您演示步骤或指出与建议相关的 ChainIntelAI 部分。
- **解释为什么这个增强功能对大多数 ChainIntelAI 用户有用**。
- **列出一些已存在此增强功能的其他应用程序**。

#### 拉取请求

- 填写必需的模板
- 不要在 PR 标题中包含问题编号
- 尽可能在拉取请求中包含屏幕截图和动画 GIF
- 遵循 JavaScript 和 TypeScript 风格指南
- 包含充分的测试
- 根据文档风格指南记录新代码
- 所有文件以换行符结束

### 开发工作流程

1. Fork 仓库
2. 创建新分支：`git checkout -b feature/your-feature-name`
3. 进行更改
4. 运行测试：`npm test`
5. 提交更改：`git commit -m '添加某功能'`
6. 推送到分支：`git push origin feature/your-feature-name`
7. 提交拉取请求

### 风格指南

#### Git 提交消息

- 使用现在时态（"Add feature"而非"Added feature"）
- 使用祈使语气（"Move cursor to..."而非"Moves cursor to..."）
- 第一行限制在 72 个字符或更少
- 第一行之后自由引用问题和拉取请求
- 考虑以适用的 emoji 开始提交消息：
  - 🎨 `:art:` 改进代码格式/结构时
  - 🐎 `:racehorse:` 提高性能时
  - 🚱 `:non-potable_water:` 修复内存泄漏时
  - 📝 `:memo:` 编写文档时
  - 🐛 `:bug:` 修复 bug 时
  - 🔥 `:fire:` 删除代码或文件时
  - 💚 `:green_heart:` 修复 CI 构建时
  - ✅ `:white_check_mark:` 添加测试时
  - 🔒 `:lock:` 处理安全问题时
  - ⬆️ `:arrow_up:` 升级依赖时
  - ⬇️ `:arrow_down:` 降级依赖时

#### JavaScript 风格指南

所有 JavaScript 代码都使用 ESLint 进行检查并用 Prettier 格式化。运行`npm run lint`检查您的代码。

#### 文档风格指南

- 使用[Markdown](https://daringfireball.net/projects/markdown)
- 在 markdown 中使用自定义`{@link Class#method}`语法引用方法和类

### 附加说明

#### 问题和拉取请求标签

本节列出了我们用于帮助跟踪和管理问题和拉取请求的标签。

- `bug` - 作为 bug 的问题
- `documentation` - 与文档相关的问题或 PR
- `duplicate` - 其他问题的重复问题
- `enhancement` - 功能请求问题
- `good first issue` - 适合新手的问题
- `help wanted` - 需要额外关注的问题
- `invalid` - 无效或不可复现的问题
- `question` - 作为问题的问题
- `wontfix` - 不会处理的问题

## 开发环境设置

请参考 [README.md](README.md) 中的开发指南部分，了解如何设置开发环境。

## 代码风格

本项目使用 ESLint 和 Prettier 来保持代码风格的一致性。在提交代码前，请确保运行以下命令：

```bash
yarn lint
```

## 测试

所有新功能和 bug 修复都应包含测试。请确保您的代码通过所有现有测试，并为新功能添加适当的测试。

运行测试：

```bash
yarn test
```

检查测试覆盖率：

```bash
yarn test:coverage
```

## 文档

如果您的更改影响了用户体验或 API，请更新相应的文档。文档位于 `docs/` 目录中。

## 分支策略

- `main`: 稳定版本分支，只接受经过充分测试的合并请求
- `develop`: 开发分支，新功能和 bug 修复应基于此分支创建
- `feature/*`: 特性分支，用于开发新功能
- `bugfix/*`: 修复分支，用于修复 bug
- `release/*`: 发布分支，用于准备新版本发布

## 版本控制

本项目遵循 [语义化版本控制](https://semver.org/lang/zh-CN/) 规范。

## 发布流程

1. 从 `develop` 分支创建 `release/x.y.z` 分支
2. 在发布分支上进行最终测试和修复
3. 将发布分支合并到 `main` 分支
4. 在 `main` 分支上创建版本标签
5. 将 `main` 分支的更改合并回 `develop` 分支

## 联系方式

如果您有任何问题或需要帮助，请通过以下方式联系我们：

- GitHub Issues
- 电子邮件：[your-email@example.com](mailto:your-email@example.com)

感谢您的贡献！
