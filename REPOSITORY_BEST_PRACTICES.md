# GitHub 仓库最佳实践指南

> 本文档总结了在 GitHub 上安全有效地使用存储库的最佳实践。

## 📖 目录

1. [创建 README 文件](#创建-readme-文件)
2. [保护存储库](#保护存储库)
3. [优选分支而不是分叉](#优选分支而不是分叉)
4. [使用 Git 大型文件存储](#使用-git-大型文件存储)
5. [其他建议](#其他建议)

---

## 创建 README 文件

### 为什么需要 README？

README 文件是用户了解您项目的第一扇窗口。一个好的 README 能够：
- 快速传达项目的目的和价值
- 提供清晰的导航和使用说明
- 设定社区期望和行为准则
- 降低新贡献者的入门门槛

### README 应包含的内容

✅ **基本信息**
- 项目名称和简短描述
- 主要功能和特性
- 技术栈说明

✅ **快速开始**
- 安装步骤
- 基本使用示例
- 配置说明

✅ **项目结构**
- 目录组织
- 关键文件说明

✅ **贡献指南**
- 如何报告问题
- 如何提交代码
- 行为准则链接

✅ **许可证信息**
- 使用的许可证类型
- 版权声明

✅ **联系方式**
- 维护者信息
- 问题反馈渠道

📌 **参考文件**：[README.md](./README.md)

---

## 保护存储库

### 必选安全功能（公共仓库免费）

#### 1️⃣ Dependabot Alerts（依赖项警报）

**作用**：自动检测项目依赖中的安全漏洞

**启用方法**：
1. 进入仓库 → Settings → Security & analysis
2. 找到 "Dependabot alerts" 并启用
3. 可选：启用 "Dependabot security updates" 自动创建修复 PR

**优势**：
- ✅ 及时发现已知漏洞
- ✅ 提供修复版本建议
- ✅ 减少手动检查工作量

#### 2️⃣ Secret Scanning（密钥扫描）

**作用**：扫描仓库中的敏感信息（API 密钥、令牌等）

**启用方法**：
1. Settings → Security & analysis
2. 启用 "Secret scanning"
3. 启用 "Push protection" 阻止含机密的推送

**优势**：
- ✅ 防止密钥泄露
- ✅ 实时告警
- ✅ 支持自定义密钥模式

#### 3️⃣ Push Protection（推送保护）

**作用**：在推送时阻止包含受支持机密的代码

**启用方法**：
- 与 Secret Scanning 一同启用
- 当检测到机密时，推送会被拒绝并显示警告

**优势**：
- ✅ 从源头防止机密泄露
- ✅ 即时反馈给开发者
- ✅ 减少事后清理工作

#### 4️⃣ Code Scanning（代码扫描）

**作用**：识别代码中的漏洞和错误

**启用方法**：
1. Settings → Security & analysis
2. 启用 "Code scanning"
3. 选择 CodeQL 或其他分析工具
4. 配置扫描频率（推荐：每次推送或定期）

**优势**：
- ✅ 发现潜在安全问题
- ✅ 提高代码质量
- ✅ 符合安全编码规范

📌 **参考文件**：[SECURITY.md](./SECURITY.md)

### 推荐安全措施

#### 添加 SECURITY.md 文件

提供清晰的安全问题报告流程，鼓励负责任的披露。

**包含内容**：
- 如何报告漏洞
- 预期响应时间
- 披露政策
- 支持的安全版本

#### 启用私有漏洞报告

允许协作者和安全研究人员私下报告漏洞，避免公开披露带来的风险。

**启用方法**：
- Settings → Security & analysis → Private vulnerability reporting

---

## 优选分支而不是分叉

### 为什么选择分支工作流？

对于常规协作者，使用**分支**比**分叉**更高效：

| 对比项 | 分支 | 分叉 |
|--------|------|------|
| 协作效率 | ⭐⭐⭐⭐⭐ 高 | ⭐⭐ 低 |
| 代码审查 | 简单直接 | 需要跨仓库 |
| CI/CD 集成 | 自动化容易 | 配置复杂 |
| 适用场景 | 团队内部协作 | 开源外部贡献 |

### 分支工作流最佳实践

#### 1. 保护主分支

为 `main` 或 `master` 分支设置保护规则：

**推荐设置**：
- ✅ 要求拉取请求审查（至少 1-2 人）
- ✅ 要求状态检查通过（CI/CD）
- ✅ 要求分支保持最新
- ✅ 禁止强制推送
- ✅ 禁止删除分支

**配置方法**：
```
Settings → Branches → Add branch protection rule
```

#### 2. 使用功能分支

```bash
# 创建功能分支
git checkout -b feature/new-feature

# 开发完成后推送到远程
git push origin feature/new-feature

# 在 GitHub 上创建 Pull Request
```

#### 3. 分支命名规范

- `feature/*` - 新功能
- `fix/*` - Bug 修复
- `docs/*` - 文档更新
- `refactor/*` - 代码重构
- `test/*` - 测试相关

#### 4. 保持分支同步

```bash
# 定期从主分支合并最新代码
git checkout main
git pull origin main
git checkout feature/your-feature
git merge main
```

📌 **参考文件**：[CONTRIBUTING.md](./CONTRIBUTING.md)

---

## 使用 Git 大型文件存储

### 什么是 Git LFS？

Git Large File Storage (LFS) 是 Git 的扩展，用于更好地处理大文件。它将大文件存储在远程服务器，而在 Git 仓库中只保存指针。

### 何时使用 Git LFS？

GitHub 对文件大小有限制：
- 单个文件 > 100 MB：**必须**使用 Git LFS
- 单个文件 > 50 MB：**建议**使用 Git LFS
- 仓库总大小 > 1 GB：**强烈建议**使用 Git LFS

**适用文件类型**：
- 🖼️ 图片、视频、音频
- 📊 数据集、CSV 文件
- 📦 二进制文件、编译产物
- 🎮 游戏资源文件

### 安装和配置 Git LFS

#### 1. 安装 Git LFS

```bash
# macOS
brew install git-lfs

# Windows
winget install GitLFS

# Linux
sudo apt-get install git-lfs
```

#### 2. 初始化 Git LFS

```bash
git lfs install
```

#### 3. 跟踪大文件

```bash
# 跟踪特定类型的文件
git lfs track "*.psd"
git lfs track "*.mp4"
git lfs track "data/*.csv"

# 查看已跟踪的文件类型
git lfs ls-files
```

这会创建或更新 `.gitattributes` 文件。

#### 4. 正常提交

```bash
git add .
git commit -m "Add large files"
git push origin main
```

Git LFS 会自动处理大文件的上传。

### 注意事项

⚠️ **带宽限制**：GitHub 对 LFS 有带宽和存储限制（免费账户 1GB 存储 + 1GB/月带宽）

⚠️ **克隆时间**：使用 LFS 的文件在克隆时会下载，可能较慢

⚠️ **不可变**：一旦推送到 LFS，修改历史会很困难

📌 **最佳实践**：
- 只在必要时使用 LFS
- 考虑使用外部存储（如 AWS S3）存放超大文件
- 定期清理不需要的 LFS 文件

---

## 其他建议

### 📝 文档完整性

确保仓库包含以下文档：

| 文件 | 用途 | 必需性 |
|------|------|--------|
| README.md | 项目介绍 | ⭐⭐⭐⭐⭐ |
| LICENSE | 许可证 | ⭐⭐⭐⭐⭐ |
| CONTRIBUTING.md | 贡献指南 | ⭐⭐⭐⭐ |
| CODE_OF_CONDUCT.md | 行为准则 | ⭐⭐⭐⭐ |
| SECURITY.md | 安全策略 | ⭐⭐⭐⭐ |
| CHANGELOG.md | 变更日志 | ⭐⭐⭐ |

### 🔄 持续集成/持续部署

推荐使用 GitHub Actions：
- 自动运行测试
- 代码质量检查
- 自动部署
- 依赖更新

### 📊 项目管理

- 使用 Issues 跟踪问题和功能请求
- 使用 Projects 管理任务进度
- 使用 Milestones 规划版本发布
- 使用 Labels 分类问题

### 🏷️ 版本控制

遵循语义化版本（SemVer）：
- **MAJOR**：不兼容的 API 变更
- **MINOR**：向后兼容的功能新增
- **PATCH**：向后兼容的问题修正

### 🔍 代码审查

- 所有 PR 都需要审查
- 使用 Reviewers 功能指定审查人
- 使用 Draft PR 进行早期反馈
- 保持建设性和尊重的态度

### 📈 性能优化

- 压缩图片和资源文件
- 使用 .gitignore 排除不必要文件
- 定期清理构建产物
- 考虑使用 monorepo 管理相关项目

---

## 🎯 动手练习

要获得仓库管理的实际经验，建议完成以下练习：

1. 创建一个新仓库并添加所有必需文档
2. 启用所有安全功能（Dependabot、Secret Scanning 等）
3. 配置分支保护规则
4. 创建一个功能分支并提交 PR
5. 设置 GitHub Actions 工作流
6. 尝试使用 Git LFS 管理大文件
7. 邀请协作者并进行代码审查练习

---

## 📚 参考资料

- [GitHub 官方文档](https://docs.github.com/)
- [GitHub Skills](https://skills.github.com/)
- [Git LFS 文档](https://git-lfs.github.com/)
- [语义化版本规范](https://semver.org/)
- [Contributor Covenant](https://www.contributor-covenant.org/)
