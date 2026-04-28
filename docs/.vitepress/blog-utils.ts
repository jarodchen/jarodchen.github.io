// VitePress 配置扩展 - 自动更新博客侧边栏和归档页
import { generateBlogSidebar, getBlogPostsMetadata } from './sidebar-generator'
import { updateAllCategoryPages } from './category-generator'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 防抖定时器，避免频繁触发
let updateTimer: NodeJS.Timeout | null = null;
let isUpdating = false;

// 启动时自动生成博客首页、归档页面和分类页面（仅执行一次）
try {
  updateBlogIndexPage();
  updateArchivesPage();
  updateAllCategoryPages();
} catch (error) {
  console.error('⚠️  初始化生成页面失败:', error.message);
}

// 监听 blog 目录变化，自动重新生成（排除自动生成的文件）
const blogDir = path.resolve(__dirname, '../blog')

try {
  fs.watch(blogDir, { recursive: true }, (eventType, filename) => {
    if (!filename || !filename.endsWith('.md')) return;
    
    // 排除自动生成的文件，避免循环触发
    const excludedFiles = ['index.md', 'archives.md'];
    
    // 检查是否在 categories 目录中（自动生成的）
    if (filename.includes('categories\\') || filename.includes('categories/')) {
      return;
    }
    
    // 检查是否是排除的文件（自动生成的）
    if (excludedFiles.includes(filename)) {
      return;
    }
    
    console.log(`\n📝 检测到博客文章变化: ${filename}`);
    
    // 使用防抖，500ms 后再执行更新，避免频繁触发
    if (updateTimer) {
      clearTimeout(updateTimer);
    }
    
    updateTimer = setTimeout(() => {
      if (!isUpdating) {
        isUpdating = true;
        updateBlogIndexPage();
        updateArchivesPage();
        updateAllCategoryPages();
        console.log('✨ 页面已自动更新\n');
        isUpdating = false;
      }
    }, 500);
  })
  console.log('👀 正在监听博客文章变化...（仅监听手动创建的文章文件）\n')
} catch (error) {
  console.error('⚠️  文件监听失败:', error.message)
}

// 重新导出函数供 config.ts 使用
export { generateBlogSidebar }

/**
 * 生成博客首页内容
 */
export function updateBlogIndexPage() {
  try {
    const posts = getBlogPostsMetadata()
    
    // 按年份分组
    const postsByYear = {}
    posts.forEach(post => {
      if (!postsByYear[post.year]) {
        postsByYear[post.year] = []
      }
      postsByYear[post.year].push(post)
    })

    // 获取最新的文章（最多显示最近一年的最新 5 篇）
    const latestYear = Object.keys(postsByYear).sort((a, b) => parseInt(b) - parseInt(a))[0]
    const recentPosts = postsByYear[latestYear] || []
    
    // 限制首页只显示最新 5 篇文章
    const displayPosts = recentPosts.slice(0, 5)
    const hasMorePosts = recentPosts.length > 5

    let content = `---
layout: home
title: 博客
description: 技术分享与学习心得
hero:
  name: 技术博客
  text: 记录学习历程，分享技术心得
  tagline: 专注于 .NET、前端开发、算法与数据结构
  actions:
    - theme: brand
      text: 浏览文章
      link: /blog/#recent
    - theme: alt
      text: 查看分类
      link: /blog/#categories
features:
  - icon: 📝
    title: 技术分享
    details: 分享在 .NET、前端、数据库等领域的实践经验
  - icon: 💡
    title: 学习心得
    details: 记录学习新技术的历程和心得体会
  - icon: 🔍
    title: 深度解析
    details: 深入分析技术原理和最佳实践
---

# 最新文章 {#recent}

`

    if (displayPosts.length > 0) {
      content += `### ${latestYear} 年（${recentPosts.length} 篇，显示最新 ${displayPosts.length} 篇）\n\n`
      
      displayPosts.forEach(post => {
        content += `- [${post.title}](${post.link})`
        if (post.date) {
          content += ` <span style="color: #999; font-size: 0.9em;">${post.date}</span>`
        }
        content += '\n'
      })

      if (hasMorePosts) {
        content += `\n*还有 ${recentPosts.length - 5} 篇文章，请查看[归档页面](./archives.md)*\n\n`
      }

      content += `\n[📚 查看更多历史文章 →](./archives.md)\n\n`
    } else {
      content += '*暂无文章*\n\n'
    }

    content += `---

# 文章分类 {#categories}

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 30px 0;">

`

    // 按分类分组
    const postsByCategory = {}
    posts.forEach(post => {
      const category = post.category || '未分类'
      if (!postsByCategory[category]) {
        postsByCategory[category] = []
      }
      postsByCategory[category].push(post)
    })

    const categoryIcons = {
      '.NET 开发': '🔧',
      '前端开发': '🌐',
      '算法与数据结构': '📊',
      '数据库': '🗄️'
    }

    Object.keys(postsByCategory).forEach(category => {
      const icon = categoryIcons[category] || '📁'
      const categoryPosts = postsByCategory[category]
      const categoryLink = `/blog/categories/${category.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')}`
      
      content += `<div style="border: 1px solid var(--vp-c-divider); border-radius: 8px; padding: 16px; transition: all 0.2s ease;" onmouseover="this.style.borderColor='var(--vp-c-brand)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)'" onmouseout="this.style.borderColor='var(--vp-c-divider)'; this.style.boxShadow='none'">
  <h4 style="margin: 0 0 12px 0; font-size: 1em; display: flex; justify-content: space-between; align-items: center;">
    <a href="${categoryLink}" style="text-decoration: none; color: inherit;">
      ${icon} ${category}
    </a>
    <span style="font-size: 0.8em; color: var(--vp-c-text-3); font-weight: normal;">${categoryPosts.length} 篇</span>
  </h4>
  <ul style="margin: 0; padding-left: 18px; font-size: 0.9em; line-height: 1.8;">
`
      
      // 显示最新的 3 篇文章
      const recentPosts = categoryPosts.slice(0, 3)
      recentPosts.forEach(post => {
        content += `    <li><a href="${post.link}" style="color: var(--vp-c-text-1); text-decoration: none;">${post.title}</a></li>\n`
      })
      
      if (categoryPosts.length > 3) {
        content += `    <li><a href="${categoryLink}" style="color: var(--vp-c-brand); text-decoration: none;">... 查看更多 (${categoryPosts.length - 3} 篇)</a></li>\n`
      }
      
      content += `  </ul>
</div>

`
    })

    content += `</div>

<p style="text-align: center; color: var(--vp-c-text-2); font-size: 0.9em;">
  👆 点击分类查看该领域的所有文章 | 
  <a href="/blog/categories/">查看完整分类索引</a>
</p>

---

# 订阅与关注

- 💻 GitHub：[@jarodchen](https://github.com/jarodchen)
- 📋 [文章归档](./archives.md) - 查看所有历史文章

<!--
  注意：此文件由 blog-utils.ts 自动生成，请勿手动编辑。
  如需修改，请更新 docs/.vitepress/blog-utils.ts 中的 updateBlogIndexPage() 函数。
-->
`

    const outputPath = path.resolve(__dirname, '../blog/index.md')
    fs.writeFileSync(outputPath, content, 'utf-8')
    
    console.log(`✅ 博客首页已自动更新 (${posts.length} 篇文章)`)
  } catch (error) {
    console.error('❌ 更新博客首页失败:', error.message)
  }
}

/**
 * 生成归档页面内容
 */
export function updateArchivesPage() {
  try {
    const posts = getBlogPostsMetadata()
    
    // 按年份分组
    const postsByYear = {}
    posts.forEach(post => {
      if (!postsByYear[post.year]) {
        postsByYear[post.year] = []
      }
      postsByYear[post.year].push(post)
    })

    let content = `---
title: 文章归档
description: 按时间顺序浏览所有技术文章
---

# 文章归档

按时间顺序查看所有技术文章，方便快速定位和回顾。

`

    Object.keys(postsByYear)
      .sort((a, b) => parseInt(b) - parseInt(a))
      .forEach(year => {
        const yearPosts = postsByYear[year]
        content += `## ${year} 年（${yearPosts.length} 篇）\n\n`

        yearPosts.forEach(post => {
          content += `- [${post.title}](${post.link})`
          if (post.date) {
            content += ` <span style="color: #999; font-size: 0.85em;">${post.date}</span>`
          }
          
          // 只在有分类时显示
          if (post.category) {
            content += ` <span style="color: var(--vp-c-brand); font-size: 0.85em;">[${post.category}]</span>`
          }
          
          content += '\n'
        })

        content += '---\n\n'
      })

    const totalPosts = posts.length
    const currentYear = new Date().getFullYear().toString()
    const thisYearPosts = postsByYear[currentYear]?.length || 0
    const latestPost = posts[0]

    content += `## 统计信息

- **总文章数**: ${totalPosts} 篇
- **今年发布**: ${thisYearPosts} 篇
- **最近一篇**: ${latestPost?.date || '暂无'}

---

[← 返回博客首页](./index.md)

<!--
  注意：此文件由 blog-utils.ts 自动生成，请勿手动编辑。
  如需修改，请更新 docs/.vitepress/blog-utils.ts 中的 updateArchivesPage() 函数。
-->
`

    const outputPath = path.resolve(__dirname, '../blog/archives.md')
    fs.writeFileSync(outputPath, content, 'utf-8')
    
    console.log(`✅ 归档页面已自动更新 (${totalPosts} 篇文章)`)
  } catch (error) {
    console.error('❌ 更新归档页面失败:', error.message)
  }
}


