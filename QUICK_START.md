# 仓库快速设置指南

本指南将帮助您快速配置和保护您的 GitHub 仓库。

## 🚀 快速开始清单

### 第一步：基础设置

- [x] ✅ README.md - 项目介绍已创建
- [x] ✅ LICENSE - MIT 许可证已添加
- [x] ✅ .gitignore - 忽略文件已配置

### 第二步：安全配置

按照以下步骤在 GitHub 上启用安全功能：

#### 1. 启用 Dependabot Alerts

```
1. 访问: https://github.com/jarodchen/jarodchen.github.io/settings/security_analysis
2. 找到 "Dependabot alerts"
3. 点击 "Enable" 按钮
4. （推荐）同时启用 "Dependabot security updates"
```

**作用**：自动检测依赖项中的安全漏洞

#### 2. 启用 Secret Scanning

```
1. 在同一页面找到 "Secret scanning"
2. 点击 "Enable" 按钮
3. 同时启用 "Push protection"
```

**作用**：防止 API 密钥、令牌等敏感信息泄露

#### 3. 启用 Code Scanning

```
1. 找到 "Code scanning"
2. 点击 "Set up" 按钮
3. 选择 "CodeQL Analysis"
4. 选择 "Basic" 或 "Extended" 配置
5. 点击 "Confirm" 保存
```

**作用**：自动扫描代码中的漏洞和错误

#### 4. 启用私有漏洞报告

```
1. 找到 "Private vulnerability reporting"
2. 点击 "Enable" 按钮
3. 选择允许的协作者
```

**作用**：允许安全研究人员私下报告漏洞

### 第三步：分支保护

#### 保护主分支

```
1. 访问: https://github.com/jarodchen/jarodchen.github.io/settings/branches
2. 点击 "Add branch protection rule"
3. Branch name pattern: main
4. 勾选以下选项：
   ✅ Require a pull request before merging
   ✅ Require approvals (设置为 1 或 2)
   ✅ Dismiss stale pull request approvals when new commits are pushed
   ✅ Require status checks to pass before merging
   ✅ Require branches to be up to date before merging
   ✅ Include administrators
5. 点击 "Create" 保存
```

### 第四步：验证设置

运行以下命令验证本地配置：

```bash
# 进入仓库目录
cd jarodchen

# 初始化 Git（如果还未初始化）
git init

# 添加所有文件
git add .

# 提交更改
git commit -m "initial commit: add repository best practices files"

# 添加远程仓库（替换为您的实际仓库地址）
git remote add origin https://github.com/jarodchen/jarodchen.github.io.git

# 推送到 GitHub
git push -u origin main
```

### 第五步：验证 CI/CD

推送后，GitHub Actions 会自动运行检查。

```
1. 访问: https://github.com/jarodchen/jarodchen.github.io/actions
2. 查看工作流运行状态
3. 确保所有检查都通过（绿色✅）
```

如果有任何失败，检查工作流日志并修复问题。

---

## 🔧 可选配置

### 1. 添加徽章到 README

将以下徽章添加到 `README.md` 顶部：

```
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![GitHub Actions](https://github.com/jarodchen/jarodchen.github.io/workflows/Security%20and%20Quality%20Checks/badge.svg)
```

### 2. 配置 GitHub Pages

```
1. 访问: https://github.com/jarodchen/jarodchen.github.io/settings/pages
2. Source: Deploy from a branch
3. Branch: main / root
4. 点击 "Save"
```

### 3. 添加项目主题

```
1. 访问: https://github.com/jarodchen/jarodchen.github.io/settings
2. 找到 "About" 部分
3. 添加主题标签，如：
   - github-pages
   - portfolio
   - documentation
   - best-practices
4. 添加网站链接（如果有）
```

### 4. 设置 Issue 模板

创建 `.github/ISSUE_TEMPLATE/` 目录并添加：
- `bug_report.md` - Bug 报告模板
- `feature_request.md` - 功能请求模板

### 5. 配置 PR 模板

创建 `.github/pull_request_template.md` 文件。

---

## ✅ 验证清单

完成以上步骤后，确认以下内容：

- [ ] 所有必需文件都已提交到仓库
- [ ] GitHub Actions 工作流正常运行
- [ ] 所有安全检查已启用
- [ ] 主分支已受到保护
- [ ] README.md 信息完整且准确
- [ ] 可以成功克隆和构建项目
- [ ] Issue 和 PR 功能正常

---

## 📚 下一步

完成基础设置后，您可以：

1. 📖 阅读 [REPOSITORY_BEST_PRACTICES.md](./REPOSITORY_BEST_PRACTICES.md) 了解更多最佳实践
2. 🎨 自定义 GitHub Pages 主题和布局
3. 📝 开始添加您的项目和内容
4. 🤝 邀请协作者并设置团队权限
5. 📊 配置 Projects 管理任务
6. 🔄 设置自动化部署流程

---

## 🆘 需要帮助？

如有任何问题，请参考：
- [GitHub 官方文档](https://docs.github.com/)
- [REPOSITORY_BEST_PRACTICES.md](./REPOSITORY_BEST_PRACTICES.md)
- 创建 [Issue](https://github.com/jarodchen/jarodchen.github.io/issues)
