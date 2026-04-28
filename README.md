# Jarod Chen's GitHub Pages

个人网站、技术博客和知识库集合。

## 🌐 在线访问

**[https://jarodchen.github.io/](https://jarodchen.github.io/)**

## 📦 本地开发

```bash
npm install
npm run dev
```

访问 http://localhost:5173/ 查看网站。

## 📁 项目结构

```
jarodchen.github.io/
├── docs/                    # VitePress 文档
│   ├── .vitepress/          # 配置文件
│   │   ├── config.ts        # 主配置
│   │   ├── blog-utils.ts    # 博客自动生成工具
│   │   └── sidebar-generator.ts  # 侧边栏生成器
│   ├── blog/                # 博客文章
│   │   ├── index.md         # 博客首页（自动生成）
│   │   ├── archives.md      # 归档页（自动生成）
│   │   └── YYYY/            # 按年份组织的文章
│   ├── index.md             # 网站首页
│   ├── about.md             # 关于我
│   ├── projects.md          # 项目导航
│   ├── knowledge-base.md    # 知识库导航
│   └── BLOG_GUIDE.md        # 博客写作指南
├── .github/workflows/       # CI/CD 配置
└── package.json
```

## ✍️ 博客写作

查看 [博客写作指南](./docs/BLOG_GUIDE.md) 了解如何添加和管理博客文章。

**快速开始：**

1. 在 `docs/blog/YYYY/` 创建新文件
2. 填写 Front Matter（标题、日期、标签、分类、描述）
3. 编写 Markdown 内容
4. 保存后自动更新首页、归档页和侧边栏

## 🚀 部署

项目使用 GitHub Actions 自动部署到 GitHub Pages。

推送代码到 main 分支后，会自动触发构建和部署流程。

## 🔗 相关链接

- [GitHub Profile](https://github.com/jarodchen)
- [个人网站](https://jarodchen.github.io/)
