# 博客写作指南

本文档说明如何在 jarodchen.github.io 项目中添加和管理博客文章。

## 快速开始

### 1. 创建新文章

在 `docs/blog/YYYY/` 目录下创建新的 Markdown 文件：

```bash
# 例如：创建 2026 年的文章
docs/blog/2026/my-article.md
```

### 2. 填写 Front Matter

每篇文章必须在文件开头包含以下元数据：

```yaml
---
title: 文章标题
date: 2026-04-28
tags: [标签1, 标签2]
category: 分类名称
description: 文章的简短描述（1-2句话）
---
```

**字段说明：**
- `title` - 文章标题（必填）
- `date` - 发布日期，格式：YYYY-MM-DD（必填）
- `tags` - 标签数组，用于分类和搜索（必填）
- `category` - 文章分类，如".NET 开发"、"前端开发"等（必填）
- `description` - 文章简介，会在归档页显示（必填）

### 3. 编写内容

Front Matter 之后就是文章的正文内容，使用标准 Markdown 语法：

```markdown
# 主标题

## 二级标题

正文内容...

### 代码示例

```csharp
// C# 代码示例
public class Example { }
```

### 图片

添加图片到 `docs/public/images/` 目录后，使用以下语法引用：

```markdown
![图片描述](/images/your-image.png)
```

## 自动化特性

本项目采用完全自动化的博客管理系统，**无需手动维护任何配置文件**。

### ✅ 自动生成内容

以下文件在开发服务器启动时**自动生成和更新**：

- **博客首页** (`/blog/`) - 自动显示最新一年的文章列表和分类统计
- **归档页面** (`docs/blog/archives.md`) - 自动列出所有文章，包含完整的元数据和统计信息
- **侧边栏导航** - 自动按年份组织文章，从 frontmatter 提取标题
- **统计信息** - 自动计算文章数量、今年发布数、分类统计等

### 📝 手动维护的文件

只有文章文件需要手动创建和编辑：

```
docs/blog/YYYY/文章名.md  # 你的文章内容
```

### 🔄 工作流程

**添加新文章后：**
1. 保存 `.md` 文件
2. 重启开发服务器或等待热重载
3. 所有内容自动更新（首页、归档页、侧边栏、统计）

**无需执行任何额外命令！**

## 目录结构

```
docs/
└── blog/
    ├── index.md              # 博客首页（自动生成）
    ├── archives.md           # 归档页面（自动生成）
    └── YYYY/                 # 年份目录
        ├── article-1.md      # 文章文件
        ├── article-2.md
        └── ...
```

**重要说明：**
- `index.md` 和 `archives.md` 是自动生成的，**请勿手动编辑**
- 只需在 `YYYY/` 目录下创建文章文件即可

## 元数据字段说明

- `title` - 文章标题（必填）
- `date` - 发布日期，格式：YYYY-MM-DD（必填）
- `tags` - 标签数组，用于分类和搜索（必填）
- `category` - 文章分类（必填）
- `description` - 文章简介，会在归档页显示（必填）

## 最佳实践

### 1. 文件命名

使用有意义的英文文件名，用连字符分隔：

```bash
# ✅ 推荐
minimal-api-auth.md
ef-core-performance.md

# ❌ 避免
article1.md
my_post.md
```

### 2. 标签选择

选择 2-5 个相关标签，便于分类和搜索：

```yaml
tags: [.NET, Minimal API, Authentication, Authorization]
```

### 3. 内容质量

- 确保代码示例可以运行
- 提供完整的上下文说明
- 添加相关的参考链接
- 保持专业的写作风格

## 本地预览

启动开发服务器查看效果：

```bash
npm run dev
```

访问 `/blog/` 查看博客。

**注意：** 开发服务器启动时会自动生成 `index.md` 和 `archives.md` 文件。

## 常见问题

**Q: 文章发布后没有立即显示？**  
A: 重启开发服务器或等待热重载完成。

**Q: 如何修改已发布的文章？**  
A: 直接编辑对应的 `.md` 文件，保存后会自动更新。

**Q: 如何删除文章？**  
A: 删除对应的 `.md` 文件，相关内容会自动从首页、归档页和侧边栏中移除。

**Q: archives.md 需要手动运行命令生成吗？**  
A: 不需要。启动 `npm run dev` 时会自动生成 `index.md` 和 `archives.md`，无需额外命令。

**Q: 可以更改文章的日期吗？**  
A: 可以，修改 Front Matter 中的 `date` 字段即可。注意这会改变文章在列表中的排序。

## 技术实现

博客自动化由以下文件实现：

- `docs/.vitepress/blog-utils.ts` - 生成首页和归档页
- `docs/.vitepress/sidebar-generator.ts` - 生成侧边栏配置
- `docs/.vitepress/config.ts` - 集成自动化工具

如需修改生成逻辑，请编辑上述文件。

## 示例文章

参考现有文章了解写作规范：

- `docs/blog/2026/minimal-api-auth.md`
- `docs/blog/2026/ef-core-performance.md`
- `docs/blog/2026/vue3-composition-api.md`
