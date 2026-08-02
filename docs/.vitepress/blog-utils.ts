// VitePress 配置扩展 - 自动更新博客侧边栏和归档页
import { generateBlogSidebar, getBlogPostsMetadata } from './sidebar-generator'
import { updateAllCategoryPages } from './category-generator'
import { updateAllTagPages } from './tag-generator'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 防抖定时器，避免频繁触发
let updateTimer: NodeJS.Timeout | null = null;
let isUpdating = false;

// 启动时自动生成博客首页、归档页面、分类页面和标签页面（仅执行一次）
try {
  updateBlogIndexPage();
  updateArchivesPage();
  updateAllCategoryPages();
  updateAllTagPages();
} catch (error) {
  console.error('⚠️  初始化生成页面失败:', error.message);
}

// 仅在开发模式下启动文件监听器（避免阻塞 CI/CD 构建）
const isDevMode = process.env.NODE_ENV !== 'production' && !process.argv.includes('build')

if (isDevMode) {
  // 监听 blog 目录变化，自动重新生成（排除自动生成的文件）
  const blogDir = path.resolve(__dirname, '../blog')

  try {
    fs.watch(blogDir, { recursive: true }, (eventType, filename) => {
      if (!filename || !filename.endsWith('.md')) return;
      
      // 排除自动生成的文件，避免循环触发
      const excludedFiles = ['index.md', 'archives.md'];
      
      // 检查是否在自动生成目录中（categories / tags）
      if (
        filename.includes('categories\\') || filename.includes('categories/') ||
        filename.includes('tags\\') || filename.includes('tags/')
      ) {
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
          updateAllTagPages();
          console.log('✨ 页面已自动更新\n');
          isUpdating = false;
        }
      }, 500);
    })
    console.log('👀 正在监听博客文章变化...（仅监听手动创建的文章文件）\n')
  } catch (error) {
    console.error('⚠️  文件监听失败:', error.message)
  }
}

// 重新导出函数供 config.ts 使用
export { generateBlogSidebar }

/**
 * 生成博客首页内容
 * 同时更新网站首页（docs/index.md）与博客首页（docs/blog/index.md）
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
  name: 白日梦想家
  tagline: 仰望星空，低头滚粪，不掩饰无能，不停止嘲笑
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



---
# 文章分类 {#categories}

<div class="cat-grid">

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
      
      content += `<div class="cat-card">
  <h4 class="cat-card-head">
    <a href="${categoryLink}" class="cat-card-title">${icon} ${category}</a>
    <span class="cat-card-count">${categoryPosts.length} 篇</span>
  </h4>
  <ul class="cat-card-list">
`

      // 显示最新的 3 篇文章
      const recentPosts = categoryPosts.slice(0, 3)
      recentPosts.forEach(post => {
        content += `    <li><a href="${post.link}">${post.title}</a></li>\n`
      })

      if (categoryPosts.length > 3) {
        content += `    <li><a href="${categoryLink}" class="cat-card-more">... 查看更多 (${categoryPosts.length - 3} 篇)</a></li>\n`
      }

      content += `  </ul>
</div>

`
    })

    content += `</div>

<p class="cat-foot">
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

    // 博客首页（docs/blog/index.md）：保留博客侧边栏
    const blogOutputPath = path.resolve(__dirname, '../blog/index.md')
    fs.writeFileSync(blogOutputPath, content, 'utf-8')

    // 网站首页（docs/index.md）：禁用侧边栏，锚点与站内链接改为指向首页自身
    const homeContent = content
      .replace('link: /blog/#recent', 'link: /#recent')
      .replace('link: /blog/#categories', 'link: /#categories')
      .replace('title: 博客\ndescription: 技术分享与学习心得\nhero:', 'title: 博客\ndescription: 技术分享与学习心得\nsidebar: false\nhero:')
      .replaceAll('./archives.md', '/blog/archives')

    const homeOutputPath = path.resolve(__dirname, '../index.md')
    fs.writeFileSync(homeOutputPath, homeContent, 'utf-8')
    
    console.log(`✅ 网站首页与博客首页已自动更新 (${posts.length} 篇文章)`)
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


