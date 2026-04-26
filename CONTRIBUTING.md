# 贡献指南

感谢您对本项目的关注！我们欢迎各种形式的贡献，包括代码改进、文档完善、问题报告等。

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发流程](#开发流程)
- [提交 Pull Request](#提交-pull-request)
- [代码规范](#代码规范)
- [联系方式](#联系方式)

## 行为准则

本项目采用 [Contributor Covenant](https://www.contributor-covenant.org/) 行为准则。参与本项目的每个人都应尊重此准则，确保社区友好、包容和专业。

## 如何贡献

### 报告问题

如果您发现了 bug 或有新功能建议：

1. 首先查看 [Issues](https://github.com/jarodchen/jarodchen.github.io/issues) 是否已有类似问题
2. 如果没有，创建一个新的 Issue，请包含：
   - 清晰的问题描述
   - 复现步骤（如果是 bug）
   - 预期行为和实际行为
   - 环境信息（操作系统、浏览器版本等）
   - 截图或错误日志（如果适用）

### 提交代码

我们推荐使用**分支工作流**而非 fork（适用于常规协作者）：

1. **Fork 仓库**（仅首次贡献时）
2. **克隆仓库**到本地
3. **创建分支**：`git checkout -b feature/your-feature-name`
4. **进行修改**
5. **提交更改**：`git commit -m "feat: add new feature"`
6. **推送到远程**：`git push origin feature/your-feature-name`
7. **创建 Pull Request**

### 改进文档

文档同样重要！欢迎：
- 修正拼写或语法错误
- 改进文档结构和可读性
- 添加示例和教程
- 翻译文档

## 开发流程

### 前置要求

- Git
- 文本编辑器（推荐 VS Code）
- Node.js（如果需要运行前端项目）

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/jarodchen/jarodchen.github.io.git
cd jarodchen.github.io

# 安装依赖（如果需要）
npm install

# 启动开发服务器（如果需要）
npm run dev
```

### 测试

在提交 PR 之前，请确保：
- 代码能够正常运行
- 添加了必要的测试（如果适用）
- 所有测试通过

## 提交 Pull Request

### PR 检查清单

提交 PR 前，请确认：

- [ ] 代码遵循项目的代码规范
- [ ] 已添加适当的注释
- [ ] 已更新相关文档
- [ ] 通过了所有测试
- [ ] PR 描述清晰，说明了更改内容和原因
- [ ] 关联了相关的 Issue（如果有）

### PR 标题规范

使用语义化提交信息：
- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

示例：`feat: add dark mode support`

### 审查流程

1. 至少需要一位维护者审查
2. 根据反馈进行修改
3. 审查通过后合并到主分支

## 代码规范

### 通用规范

- 使用有意义的变量和函数名
- 保持代码简洁，避免重复
- 添加必要的注释解释复杂逻辑
- 遵循各语言的官方风格指南

### JavaScript/TypeScript

- 使用 ESLint 进行代码检查
- 优先使用 const 和 let，避免使用 var
- 使用箭头函数（除非需要 this 上下文）

### Markdown

- 使用 ATX 风格的标题（# 而不是 =）
- 列表项后保留空行
- 代码块指定语言类型
- 链接和图片使用 alt 文本

### Git 提交

- 提交信息清晰简洁
- 一个提交只做一件事
- 使用祈使语气："Add feature" 而非 "Added feature"

## 分支策略

- `main` - 主分支，始终保持稳定
- `feature/*` - 功能分支
- `fix/*` - 修复分支
- `docs/*` - 文档分支

受保护的分支需要：
- 至少一次代码审查
- 通过所有 CI 检查
- 最新的分支状态

## 发布流程

1. 更新版本号
2. 生成变更日志
3. 创建 Git Tag
4. 部署到 GitHub Pages

## 常见问题

### Q: 我的 PR 多久会被审查？
A: 我们尽量在 3-5 个工作日内审查所有 PR。

### Q: 如何请求成为维护者？
A: 持续贡献并展示您的能力和热情，我们会主动邀请您！

### Q: 可以贡献与项目无关的功能吗？
A: 请先创建 Issue 讨论，确保新功能符合项目目标。

## 联系方式

如有任何问题，欢迎：
- 创建 [Issue](https://github.com/jarodchen/jarodchen.github.io/issues)

---

再次感谢您的贡献！
