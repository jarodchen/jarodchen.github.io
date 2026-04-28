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
    const category = post.category || '未分类'
    if (!categories[category]) {
      categories[category] = []
    }
    categories[category].push(post)
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
 * 生成单个分类的详细页面
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

    let content = `---
title: ${category}
description: 浏览${category}相关的所有技术文章
---

# ${icon} ${category}

本分类共 ${posts.length} 篇文章

---

`

    // 按年份分组显示
    const postsByYear: Record<string, typeof posts> = {}
    posts.forEach(post => {
      if (!postsByYear[post.year]) {
        postsByYear[post.year] = []
      }
      postsByYear[post.year].push(post)
    })

    Object.keys(postsByYear)
      .sort((a, b) => parseInt(b) - parseInt(a))
      .forEach(year => {
        const yearPosts = postsByYear[year]
        content += `## ${year} 年（${yearPosts.length} 篇）\n\n`

        yearPosts.forEach(post => {
          content += `- [${post.title}](${post.link})`
          if (post.date) {
            content += ` <span style="color: #999; font-size: 0.9em;">${post.date}</span>`
          }
          content += '\n'
          
          if (post.description) {
            content += `  - ${post.description}\n`
          }
          
          if (post.tags && post.tags.length > 0) {
            content += `  - 标签: ${post.tags.join(', ')}\n`
          }
          
          content += '\n'
        })

        content += '---\n\n'
      })

    content += `[← 返回分类索引](./index.md) | [查看所有文章归档](../archives.md)

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
