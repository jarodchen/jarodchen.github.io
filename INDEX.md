# Jarod Chen GitHub Pages - 项目索引

欢迎！这是 `jarodchen` 仓库的完整文档索引。

## 📂 目录结构

```
jarodchen/
├── 📄 README.md                          # 项目介绍和导航（从这里开始）
├── 📄 QUICK_START.md                     # 快速设置指南
├── 📄 REPOSITORY_BEST_PRACTICES.md       # 仓库最佳实践指南
├── 📄 CONTRIBUTING.md                    # 贡献指南
├── 📄 CODE_OF_CONDUCT.md                 # 行为准则
├── 📄 SECURITY.md                        # 安全策略
├── 📄 CHANGELOG.md                       # 变更日志
├── 📄 LICENSE                            # MIT 许可证
├── 📄 .gitignore                         # Git 忽略配置
│
├── .github/
│   ├── workflows/
│   │   └── ci.yml                       # CI/CD 工作流配置
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md                # Bug 报告模板
│   │   ├── feature_request.md           # 功能请求模板
│   │   └── docs_improvement.md          # 文档改进模板
│   ├── mlc-config.json                  # Markdown 链接检查配置
│   └── pull_request_template.md         # PR 模板
│
└── （其他项目文件和目录）
```

## 🚀 快速导航

### 👤 新用户？从这里开始

1. **[README.md](./README.md)** - 了解项目概况
2. **[QUICK_START.md](./QUICK_START.md)** - 快速设置仓库
3. **[REPOSITORY_BEST_PRACTICES.md](./REPOSITORY_BEST_PRACTICES.md)** - 学习最佳实践

### 🤝 想要贡献代码？

1. **[CONTRIBUTING.md](./CONTRIBUTING.md)** - 了解如何贡献
2. **[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)** - 阅读行为准则
3. **创建 Issue** - 使用我们的 [Issue 模板](./.github/ISSUE_TEMPLATE/)
4. **提交 PR** - 使用我们的 [PR 模板](./.github/pull_request_template.md)

### 🔒 关注安全？

1. **[SECURITY.md](./SECURITY.md)** - 了解安全策略
2. 报告漏洞 - 按照安全策略中的说明操作

### 📋 查看变更？

- **[CHANGELOG.md](./CHANGELOG.md)** - 查看所有版本更新

## 📚 核心文档详解

### 1️⃣ README.md
**用途**：项目门面，第一印象  
**包含**：
- 项目简介
- 功能特性
- 快速开始指南
- 项目导航
- 联系方式

**适合人群**：所有访问者

---

### 2️⃣ QUICK_START.md
**用途**：5分钟快速上手指南  
**包含**：
- 基础设置步骤
- 安全配置教程
- 分支保护设置
- 验证清单

**适合人群**：仓库维护者、新协作者

---

### 3️⃣ REPOSITORY_BEST_PRACTICES.md
**用途**：GitHub 仓库管理完整指南  
**包含**：
- README 编写指南
- 安全功能详解（Dependabot、Secret Scanning、Code Scanning）
- 分支 vs 分叉策略
- Git LFS 使用指南
- 其他建议和练习

**适合人群**：所有开发者、仓库管理员

**重点章节**：
- [创建 README 文件](./REPOSITORY_BEST_PRACTICES.md#创建-readme-文件)
- [保护存储库](./REPOSITORY_BEST_PRACTICES.md#保护存储库)
- [优选分支而不是分叉](./REPOSITORY_BEST_PRACTICES.md#优选分支而不是分叉)
- [使用 Git 大型文件存储](./REPOSITORY_BEST_PRACTICES.md#使用-git-大型文件存储)

---

### 4️⃣ CONTRIBUTING.md
**用途**：贡献完全指南  
**包含**：
- 如何报告问题
- 如何提交代码
- 开发流程
- PR 提交流程
- 代码规范
- 常见问题

**适合人群**：所有贡献者

---

### 5️⃣ CODE_OF_CONDUCT.md
**用途**：社区行为准则  
**包含**：
- 承诺和标准
- 积极/消极行为示例
- 责任和义务
- 执行机制

**适合人群**：所有社区成员

---

### 6️⃣ SECURITY.md
**用途**：安全策略和报告流程  
**包含**：
- 漏洞报告流程
- 响应时间承诺
- 安全措施说明
- 最佳实践建议

**适合人群**：安全研究人员、关心安全的用户

---

### 7️⃣ CHANGELOG.md
**用途**：版本变更记录  
**包含**：
- 每个版本的详细变更
- 新增、修改、修复、安全等内容分类
- 版本日期

**适合人群**：所有用户、升级决策者

---

## 🛠️ 自动化工具

### GitHub Actions 工作流

**文件**：`.github/workflows/ci.yml`

**自动化检查**：
- ✅ 依赖项安全审查
- ✅ 代码质量检查
- ✅ 文档验证
- ✅ 拼写检查
- ✅ 许可证兼容性检查

**触发条件**：
- 推送到 main 分支
- 创建 Pull Request
- 每周一凌晨定时运行

---

## 📝 模板文件

### Issue 模板

| 模板 | 用途 | 使用时机 |
|------|------|---------|
| [bug_report.md](./.github/ISSUE_TEMPLATE/bug_report.md) | 报告 Bug | 发现问题时 |
| [feature_request.md](./.github/ISSUE_TEMPLATE/feature_request.md) | 请求新功能 | 有新想法时 |
| [docs_improvement.md](./.github/ISSUE_TEMPLATE/docs_improvement.md) | 改进文档 | 发现文档问题时 |

### PR 模板

**文件**：[pull_request_template.md](./.github/pull_request_template.md)

**包含**：
- 更改描述
- 相关 Issue 链接
- 更改类型选择
- 测试说明
- 检查清单

---

## 🎯 使用场景指南

### 场景 1：我是仓库维护者

**必读文档**：
1. QUICK_START.md - 完成初始设置
2. REPOSITORY_BEST_PRACTICES.md - 深入学习最佳实践
3. SECURITY.md - 了解安全管理

**待办事项**：
- [ ] 按照 QUICK_START.md 启用所有安全功能
- [ ] 配置分支保护规则
- [ ] 设置 GitHub Pages
- [ ] 定期检查 Dependabot 警报

---

### 场景 2：我想贡献代码

**必读文档**：
1. CONTRIBUTING.md - 了解贡献流程
2. CODE_OF_CONDUCT.md - 遵守行为准则
3. REPOSITORY_BEST_PRACTICES.md - 学习分支策略

**操作步骤**：
1. Fork 仓库或创建分支
2. 进行开发
3. 使用 PR 模板创建 Pull Request
4. 等待审查

---

### 场景 3：我发现了安全问题

**操作步骤**：
1. 阅读 SECURITY.md
2. **不要**创建公开 Issue
3. 通过私有方式报告（邮件或私有漏洞报告功能）

---

### 场景 4：我只是想了解项目

**阅读顺序**：
1. README.md - 快速了解
2. CHANGELOG.md - 查看最近更新
3. 浏览其他感兴趣的项目

---

## 📊 项目状态

- **当前版本**：1.0.0
- **许可证**：MIT
- **状态**：活跃维护中

---

## 🔗 外部资源

- [GitHub 官方文档](https://docs.github.com/)
- [Git LFS 文档](https://git-lfs.github.com/)
- [语义化版本规范](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Contributor Covenant](https://www.contributor-covenant.org/)

---

## 💡 提示和技巧

### 💡 提示 1：使用 GitHub CLI

```bash
# 安装 GitHub CLI
brew install gh  # macOS
winget install GitHub.cli  # Windows

# 克隆仓库
gh repo clone jarodchen/jarodchen.github.io

# 创建 Issue
gh issue create --title "Title" --body "Description"

# 创建 PR
gh pr create --title "Title" --body "Description"
```

### 💡 提示 2：订阅通知

点击仓库右上角的 "Watch" 按钮，选择通知级别：
- **All Activity** - 所有活动
- **Custom** - 自定义（推荐：Releases、Security advisories）
- **Ignoring** - 不接收通知

### 💡 提示 3：使用键盘快捷键

在 GitHub 上按 `?` 查看键盘快捷键列表，提高操作效率。

### 💡 提示 4：定期更新依赖

```bash
# 检查过时依赖
npm outdated

# 更新依赖
npm update

# 或使用 Dependabot 自动更新
```

---

## ❓ 常见问题

**Q: 我应该先读哪个文档？**  
A: 从 README.md 开始，然后根据您的需求选择其他文档。

**Q: 如何快速设置仓库？**  
A: 按照 QUICK_START.md 的步骤操作，约需 25 分钟。

**Q: 可以修改这些模板吗？**  
A: 当然可以！根据项目需求自定义它们。

**Q: 这些文档是必需的吗？**  
A: README.md 和 LICENSE 是必需的，其他文档强烈推荐。

**Q: 如何保持文档更新？**  
A: 每次重大变更时更新相关文档，并在 CHANGELOG.md 中记录。

---

## 📞 需要帮助？

- 📧 创建 [Issue](https://github.com/jarodchen/jarodchen.github.io/issues)
- 📖 查阅 [GitHub 文档](https://docs.github.com/)
