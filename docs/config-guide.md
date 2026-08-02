---
title: 站点配置指南
description: 本站 VitePress 配置说明与常见问题
outline:
  level: [2, 3]
  label: 本页导航
---

# VitePress 站点配置指南

本站基于 [VitePress](https://vitepress.dev)（v1.6+）构建，本文档说明页面 frontmatter 配置、全局主题配置、卡片页面写法和常见问题，供维护时参考。

## 1. 页面 frontmatter 配置

每篇 Markdown 文件顶部用 `---` 包裹的 YAML 即为 frontmatter。常用配置项：

| 配置项 | 可选值 | 说明 |
| --- | --- | --- |
| `layout` | `doc` / `home` / `page` / `false` / 自定义组件 | 页面布局。`doc`（默认）带文档排版与目录；`home` 显示 hero/features；`page` 为裸容器（**无目录**） |
| `sidebar` | `true` / `false` / 对象 | 是否显示左侧边栏，`true` 时按 `themeConfig.sidebar` 路径规则匹配 |
| `outline` | `true` / 数字 / `[min,max]` / `{level,label}` / `'deep'` / `false` | 文章目录显示级别。**仅在 `doc` 布局生效** |
| `aside` | `true` / `false` / `'left'` / `'right'` | 页面级覆盖目录位置。例如 `aside: false` 隐藏目录 |
| `title` | 字符串 | 覆盖浏览器标签页标题，优先级高于站点标题 |
| `description` | 字符串 | 覆盖 meta description（SEO） |
| `editLink` | `true` / `false` | 是否显示"编辑此页"链接 |
| `lastUpdated` | `true` / `false` | 是否显示最后更新时间 |
| `pageClass` | 字符串 | 给当前页面 `<div>` 追加 class，便于自定义样式 |

### 本站页面示例

```md
---
layout: doc        # 或省略（默认 doc）
sidebar: false     # 本项目页、知识库页禁用侧边栏
outline: false     # 需要隐藏目录时
title: 页面标题
description: 页面描述
---
```

## 2. 全局主题配置（docs/.vitepress/config.ts）

```ts
export default defineConfig({
  title: "Jarod Chen's GitHub Pages",
  themeConfig: {
    nav: [...],             // 顶部导航
    sidebar: {...},         // 侧边栏（按路径匹配）
    aside: 'left',          // 目录全局放左侧
    outline: {              // 目录全局配置
      level: [2, 3],
      label: '页面导航'
    },
    socialLinks: [...],     // 社交链接
    footer: {...},          // 页脚
    editLink: {...},        // 编辑链接
    lastUpdated: {...},     // 更新时间
    search: { provider: 'local' }  // 本地搜索
  }
})
```

要点：

- **`aside: 'left'`**：将文章目录从右侧挪到左侧（VitePress 1.6 原生支持，无需额外 CSS）。单页可用 frontmatter `aside: 'right'` 恢复右侧，`aside: false` 隐藏。
- **`outline`**：`level: [2,3]` 表示目录只显示 `h2`/`h3`；`label` 为目录标题文字。
- **`sidebar` 路径匹配**：`'/'` 下的配置对所有非 `blog` 页面生效，`'/blog/'` 由 `generateBlogSidebar()` 自动生成文章列表。

## 3. 卡片页面写法

`projects.md`、`knowledge-base.md`、`tools.md` 均使用卡片式布局，结构如下：

```md
---
sidebar: false
---

# 页面标题

<script setup>
const items = [
  { icon: '📊', name: '示例', desc: '描述', tags: ['A', 'B'], link: 'https://example.com' }
]
</script>

## 分组标题（markdown，用于目录）

<div class="cards-grid">
  <div v-for="item in items" :key="item.name" class="card">
    <div class="card-icon">{{ item.icon }}</div>
    <h3 class="card-title">{{ item.name }}</h3>
    <p class="card-desc">{{ item.desc }}</p>
    <div class="card-tags">
      <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    <a :href="item.link" class="card-link" target="_blank" rel="noopener">访问 →</a>
  </div>
</div>

<style scoped>
.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.card { ... }
</style>
```

**必须遵守的规则**：

1. **HTML 模板内不能有空行**。markdown-it 的 HTML 块规则会在空行处中断，导致 `v-for` 容器被拆成未闭合标签，构建时报 `Element is missing end tag`。
2. **分组标题必须用 markdown `##` 而不是 Vue `<h2>`**。目录（outline）只在客户端从带锚点 `id` 的标题提取，手写 `<h2>` 没有自动 id 会被过滤，导致目录为空而整体隐藏。
3. 卡片样式统一使用主题 CSS 变量（`var(--vp-c-*)`），自适应浅色/深色模式。

## 4. 博客功能

- `docs/blog/` 下文章按年份分目录（如 `blog/2026/`）。
- `docs/.vitepress/blog-utils.ts` 启动/构建时自动生成：
  - `docs/index.md`（网站首页 = 博客页，最新文章 + 分类）
  - `docs/blog/index.md`（博客首页）
  - `docs/blog/archives.md`（归档）
- 新增文章只需在 `blog/<年份>/` 下新建 `.md` 文件，写入 frontmatter（`title` / `date` / `tags` / `category` / `description`），dev 监听或下次构建时自动更新首页、归档、分类页。

## 5. 常见问题（FAQ）

| 现象 | 原因 | 解决 |
| --- | --- | --- |
| 目录（页面导航）消失 | 页面是 `layout: home`/`page`；或标题是 Vue `<h2>` 无锚点 id；或 frontmatter `outline: false` | 改用 `doc` 布局；标题用 markdown `##`；去掉 `outline: false` |
| 构建报 `Element is missing end tag` | HTML 模板内出现空行，markdown-it 中断 HTML 块 | 删除模板内空行 |
| 页面仍有侧边栏 | 未在 frontmatter 设置 `sidebar: false` | 加 `sidebar: false` |
| 项目/知识库页无目录 | 分组标题曾用 Vue `<h2>` | 改回 markdown `##` |
