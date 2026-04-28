import { getBlogPostsMetadata } from './sidebar-generator'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 自动生成博客归档页面
 */
export function generateArchivesPage() {
  const posts = getBlogPostsMetadata()
  
  // 按年份分组
  const postsByYear: Record<string, typeof posts> = {}
  posts.forEach(post => {
    if (!postsByYear[post.year]) {
      postsByYear[post.year] = []
    }
    postsByYear[post.year].push(post)
  })

  // 生成归档页面内容
  let content = `---
title: 文章归档
description: 按时间顺序浏览所有技术文章
---

# 文章归档

按时间顺序查看所有技术文章，方便快速定位和回顾。

`

  // 添加每年的文章
  Object.keys(postsByYear)
    .sort((a, b) => parseInt(b) - parseInt(a))
    .forEach(year => {
      const yearPosts = postsByYear[year]
      content += `## 📅 ${year} 年（${yearPosts.length} 篇）\n\n`

      // 按月份分组
      const postsByMonth: Record<string, typeof posts> = {}
      yearPosts.forEach(post => {
        if (post.date) {
          const month = post.date.substring(5, 7) // 提取 MM
          if (!postsByMonth[month]) {
            postsByMonth[month] = []
          }
          postsByMonth[month].push(post)
        }
      })

      // 输出每个月的文章
      Object.keys(postsByMonth)
        .sort((a, b) => parseInt(b) - parseInt(a))
        .forEach(month => {
          const monthNum = parseInt(month)
          content += `### ${monthNum} 月 (${postsByMonth[month].length} 篇)\n\n`
          
          postsByMonth[month].forEach(post => {
            const day = post.date ? post.date.substring(8, 10) : '??'
            content += `- **${day} 日** - [${post.title}](${post.link})\n`
            
            if (post.tags && post.tags.length > 0) {
              content += `  - *标签*: ${post.tags.join(', ')}\n`
            }
            
            if (post.description) {
              content += `  - *简介*: ${post.description}\n`
            }
            
            content += '\n'
          })
        })

      content += '---\n\n'
    })

  // 添加统计信息
  const totalPosts = posts.length
  const currentYear = new Date().getFullYear().toString()
  const thisYearPosts = postsByYear[currentYear]?.length || 0
  const latestPost = posts[0]

  content += `## 📊 统计信息

- **总文章数**: ${totalPosts} 篇
- **今年发布**: ${thisYearPosts} 篇
- **最近一篇**: ${latestPost?.date || '暂无'}

---

## 🔍 按分类查看

`

  // 按分类分组
  const postsByCategory: Record<string, typeof posts> = {}
  posts.forEach(post => {
    const category = post.category || '未分类'
    if (!postsByCategory[category]) {
      postsByCategory[category] = []
    }
    postsByCategory[category].push(post)
  })

  Object.keys(postsByCategory).forEach(category => {
    const categoryPosts = postsByCategory[category]
    content += `### ${category} (${categoryPosts.length} 篇)\n`
    categoryPosts.forEach(post => {
      content += `- ${post.title}\n`
    })
    content += '\n'
  })

  content += `---

[← 返回博客首页](./index.md)
`

  // 写入文件
  const outputPath = path.resolve(__dirname, '../blog/archives.md')
  fs.writeFileSync(outputPath, content, 'utf-8')
  
  console.log(`✅ 归档页面已生成: ${outputPath}`)
  console.log(`   共 ${totalPosts} 篇文章`)
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  generateArchivesPage()
}
