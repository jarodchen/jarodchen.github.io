import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getBlogPostsMetadata } from './sidebar-generator'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 获取所有分类及其文章列表
 */
export function getCategories() {
  const posts = getBlogPostsMetadata()
  const categories: Record<string, typeof posts> = {}

  posts.forEach(post => {
    // 合并单值 category 与数组 categories，去重后作为该文章所属的全部分类
    const postCategories = new Set<string>()
    if (post.category) {
      postCategories.add(post.category)
    }
    if (Array.isArray(post.categories)) {
      post.categories.forEach(c => postCategories.add(c))
    }
    // 都没有则归入「未分类」
    if (postCategories.size === 0) {
      postCategories.add('未分类')
    }

    postCategories.forEach(category => {
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push(post)
    })
  })

  return categories
}

/**
 * 生成分类索引页面
 */
export function updateCategoriesIndexPage() {
  try {
    const categories = getCategories()
    const categoryNames = Object.keys(categories).sort()

    let content = `---
title: 分类索引
description: 按分类浏览技术文章
---

# 分类索引

按技术领域分类浏览文章，快速定位感兴趣的内容。

`

    // 生成分类卡片网格
    content += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin: 32px 0;">\n\n`

    const categoryIcons: Record<string, string> = {
      '.NET 开发': '🔧',
      '前端开发': '🌐',
      '算法与数据结构': '📊',
      '数据库': '🗄️',
      'DevOps': '🚀',
      '工具使用': '🛠️',
      '学习笔记': '📝',
      '未分类': '📁'
    }

    categoryNames.forEach(category => {
      const icon = categoryIcons[category] || '📁'
      const posts = categories[category]
      const count = posts.length
      // 生成友好的 URL 路径
      const filename = category.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')
      const link = `/blog/categories/${filename}`

      content += `<div style="border: 1px solid var(--vp-c-divider); border-radius: 8px; padding: 20px; transition: all 0.2s ease;" onmouseover="this.style.borderColor='var(--vp-c-brand)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)'" onmouseout="this.style.borderColor='var(--vp-c-divider)'; this.style.boxShadow='none'">
  <h3 style="margin: 0 0 12px 0; font-size: 1.1em; display: flex; justify-content: space-between; align-items: center;">
    <a href="${link}" style="text-decoration: none; color: inherit;">
      ${icon} ${category}
    </a>
    <span style="font-size: 0.85em; color: var(--vp-c-text-3); font-weight: normal;">${count} 篇</span>
  </h3>
  <ul style="margin: 0; padding-left: 20px; font-size: 0.9em; line-height: 1.8; color: var(--vp-c-text-2);">
`

      // 显示最新的 3 篇文章标题
      posts.slice(0, 3).forEach(post => {
        content += `    <li><a href="${post.link}" style="color: var(--vp-c-text-1); text-decoration: none;">${post.title}</a></li>\n`
      })

      if (count > 3) {
        content += `    <li><a href="${link}" style="color: var(--vp-c-brand); text-decoration: none;">... 查看更多 (${count - 3} 篇)</a></li>\n`
      }

      content += `  </ul>
</div>

`
    })

    content += `</div>

---

## 统计信息

- **总分类数**: ${categoryNames.length} 个
- **总文章数**: ${Object.values(categories).reduce((sum, posts) => sum + posts.length, 0)} 篇

---

[← 返回博客首页](../index.md) | [查看所有文章归档](../archives.md)

<!--
  注意：此文件由 blog-utils.ts 自动生成，请勿手动编辑。
-->
`

    const outputPath = path.resolve(__dirname, '../blog/categories/index.md')

    // 确保目录存在
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    fs.writeFileSync(outputPath, content, 'utf-8')

    console.log(`✅ 分类索引页已自动更新 (${categoryNames.length} 个分类)`)
  } catch (error) {
    console.error('❌ 更新分类索引页失败:', error.message)
  }
}

/**
 * 生成单个分类的详细页面（卡片网格，响应式布局，全部展示无需分页）
 */
export function updateCategoryPage(category: string) {
  try {
    const categories = getCategories()
    const posts = categories[category]

    if (!posts || posts.length === 0) {
      return
    }

    const categoryIcons: Record<string, string> = {
      '.NET 开发': '🔧',
      '前端开发': '🌐',
      '算法与数据结构': '📊',
      '数据库': '🗄️',
      'DevOps': '🚀',
      '工具使用': '🛠️',
      '学习笔记': '📝',
      '未分类': '📁'
    }

    const icon = categoryIcons[category] || '📁'

    // 序列化文章数据（转义 < 防止闭合 script 标签）
    const postsData = posts.map(post => ({
      title: post.title,
      date: post.date || '',
      description: post.description || '',
      tags: post.tags || [],
      banner: post.banner || '',
      link: post.link
    }))
    const postsJson = JSON.stringify(postsData)
      .replace(/</g, '\\u003c')
      .replace(/\$\{/g, '\\u0024\\u007b')
    const categoryJson = JSON.stringify(category)

    const content = `---
title: ${category}
description: 浏览${category}相关的所有技术文章
aside: false
---

# ${icon} ${category}

本分类共 ${posts.length} 篇文章。

<script setup>
const categoryName = ${categoryJson}
const posts = ${postsJson}
</script>

<div class="category-posts">
  <a v-for="post in posts" :key="post.link" class="card" :href="post.link">
    <span class="card-thumb">
      <img :src="post.banner || '/images/placeholder.png'" :alt="post.title" loading="lazy" />
    </span>
    <span class="card-content">
      <span class="card-meta">
        <span class="card-date">{{ post.date }}</span>
        <span class="card-category">{{ categoryName }}</span>
      </span>
      <span class="card-title">{{ post.title }}</span>
      <span v-if="post.description" class="card-desc">{{ post.description }}</span>
      <span class="card-footer">
        <span v-if="post.tags && post.tags.length" class="card-tags">
          <span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span>
        </span>
      </span>
    </span>
  </a>
</div>

<p class="posts-count">共 {{ posts.length }} 篇文章</p>

<style scoped>
.category-posts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 18px;
  margin: 20px 0;
}

.card {
  display: flex;
  flex-direction: column;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  overflow: hidden;
  color: inherit;
  text-decoration: none;
  transition: all 0.3s ease;
}

.card:hover {
  border-color: var(--vp-c-brand);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.card-thumb {
  display: block;
  width: 100%;
  height: 160px;
  overflow: hidden;
}

.card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.card:hover .card-thumb img {
  transform: scale(1.05);
}

.card-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 16px 18px 18px;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
}

.card-date {
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.card-category {
  color: var(--vp-c-brand);
  background: var(--vp-c-brand-soft);
  padding: 1px 8px;
  border-radius: 3px;
  font-size: 11px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 8px 0;
  line-height: 1.5;
  color: var(--vp-c-text-1);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card:hover .card-title {
  color: var(--vp-c-brand);
}

.card-desc {
  color: var(--vp-c-text-2);
  margin: 0 0 12px 0;
  line-height: 1.6;
  font-size: 13px;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: auto;
}

.card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  min-width: 0;
}

.tag {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand);
  border-radius: 3px;
}

.posts-count {
  text-align: center;
  color: var(--vp-c-text-3);
  font-size: 13px;
  margin: 32px 0;
}
</style>

[← 返回分类索引](./index.md) | [查看所有文章归档](../archives.md)

<!--
  注意：此文件由 blog-utils.ts 自动生成，请勿手动编辑。
-->
`

    const filename = category.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-') + '.md'
    const outputPath = path.resolve(__dirname, `../blog/categories/${filename}`)

    // 确保目录存在
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    fs.writeFileSync(outputPath, content, 'utf-8')

    console.log(`✅ 分类页面已生成: ${category} (${posts.length} 篇文章)`)
  } catch (error) {
    console.error(`❌ 生成分类页面失败 (${category}):`, error.message)
  }
}

/**
 * 生成所有分类页面
 */
export function updateAllCategoryPages() {
  try {
    const categories = getCategories()
    const categoryNames = Object.keys(categories)

    console.log(`\n📂 开始生成分类页面...`)

    // 生成分类索引页
    updateCategoriesIndexPage()

    // 为每个分类生成详细页面
    categoryNames.forEach(category => {
      updateCategoryPage(category)
    })

    console.log(`✅ 所有分类页面已生成 (${categoryNames.length} 个分类)\n`)
  } catch (error) {
    console.error('❌ 生成分类页面失败:', error.message)
  }
}
