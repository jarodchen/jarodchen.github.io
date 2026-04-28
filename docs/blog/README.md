# 博客使用指南

## 添加新文章

### 1. 创建文件

在 `docs/blog/YYYY/` 目录下创建 Markdown 文件：

```
docs/blog/2026/my-article.md
```

### 2. 填写元数据

文件开头必须包含：

```markdown
---
title: 文章标题
date: 2026-04-28
tags: [标签1, 标签2]
category: 分类名称
description: 简短描述
---

正文内容...
```

### 3. 完成

保存后自动更新：
- 博客首页最新文章列表
- 归档页面完整列表
- 侧边栏导航
- 统计信息

无需手动维护任何配置文件。

## 查看效果

```bash
npm run dev
```

访问 `/blog/`

## 文件位置

- **博客首页**: `/blog/`（自动生成）
- **归档页面**: `docs/blog/archives.md`（自动生成）
- **文章文件**: `docs/blog/YYYY/文章名.md`

## 注意事项

- 日期格式：YYYY-MM-DD
- 文件名用英文和连字符
- 分类建议：.NET 开发、前端开发、算法与数据结构、数据库
