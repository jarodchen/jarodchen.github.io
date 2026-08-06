import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface SidebarItem {
  text: string
  link?: string
  items?: SidebarItem[]
  collapsed?: boolean
}

interface BlogPostMetadata {
  year: string
  filename: string
  link: string
  title: string
  date: string | null
  tags: string[]
  category: string | null
  description: string | null
  banner: string | null
  categories: string[]
}

/**
 * 自动生成博客侧边栏配置
 * 扫描 blog 目录下的所有文章，按年份组织
 */
export function generateBlogSidebar(): SidebarItem[] {
  const sidebarItems: SidebarItem[] = []


  // 添加博客首页和归档页
  sidebarItems.push({
    // text: '博客',
    items: [
      { text: '首页', link: '/blog/' },
      // { text: '文章归档', link: '/blog/archives' },
      { text: '分类索引', link: '/blog/categories/' },
      { text: '标签索引', link: '/blog/tags/' },
      // { text: 'RSS 订阅', link: '/blog/rss' }
    ]
  })


  // 获取所有文章并按分类分组（合并单值 category 与数组 categories）
  const posts = getBlogPostsMetadata()
  const postsByCategory: Record<string, typeof posts> = {}
  posts.forEach(post => {
    // 合并 category（单值）与 categories（数组），去重后作为该文章所属的全部分类
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
      if (!postsByCategory[category]) {
        postsByCategory[category] = []
      }
      postsByCategory[category].push(post)
    })
  })

  // 分类排序：文章多的在前，未分类放最后
  const categories = Object.keys(postsByCategory).sort((a, b) => {
    if (a === '未分类') return 1
    if (b === '未分类') return -1
    return postsByCategory[b].length - postsByCategory[a].length
  })

  // 将所有分类收拢到一个可折叠的「分类」分组下；
  // 分组只做目录折叠，点击具体分类跳转到对应分类索引页（不在侧边栏展开文章标题）
  const categoryItems = categories.map(category => ({
    text: `${category}（${postsByCategory[category].length}）`,
    link: `/blog/categories/${category.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')}`
  }))
  if (categoryItems.length) {
    sidebarItems.push({
      text: '分类',
      collapsed: true,
      items: categoryItems
    })
  }

  // 按年份分组（默认折叠，便于按时间浏览）
  const postsByYear: Record<string, typeof posts> = {}
  posts.forEach(post => {
    if (!postsByYear[post.year]) {
      postsByYear[post.year] = []
    }
    postsByYear[post.year].push(post)
  })

  Object.keys(postsByYear)
    .sort((a, b) => parseInt(b) - parseInt(a)) // 年份降序
    .forEach(year => {
      sidebarItems.push({
        text: `${year} 年`,
        collapsed: true, // 年份默认折叠
        items: postsByYear[year].map(post => ({
          text: post.title,
          link: post.link
        }))
      })
    })

  return sidebarItems
}

/**
 * 从 Markdown 文件中提取标题
 */
function extractTitle(content, filename) {
  // 尝试从 frontmatter 中提取 title
  const titleMatch = content.match(/^---[\s\S]*?title:\s*(.+?)\s*$/m)
  if (titleMatch && titleMatch[1]) {
    // 移除引号
    return titleMatch[1].replace(/['"]/g, '').trim()
  }

  // 如果没有 frontmatter，使用文件名
  return filename.replace('.md', '')
}

/**
 * 获取所有博客文章的元数据（用于生成归档页等）
 */
export function getBlogPostsMetadata(): BlogPostMetadata[] {
  const blogDir = path.resolve(__dirname, '../blog')
  const posts: BlogPostMetadata[] = []

  if (fs.existsSync(blogDir)) {
    const yearDirs = fs.readdirSync(blogDir)
      .filter(dir => /^\d{4}$/.test(dir))

    yearDirs.forEach(year => {
      const yearPath = path.join(blogDir, year)
      
      if (fs.statSync(yearPath).isDirectory()) {
        const files = fs.readdirSync(yearPath)
          .filter(file => file.endsWith('.md'))

        files.forEach(file => {
          const filePath = path.join(yearPath, file)
          const content = fs.readFileSync(filePath, 'utf-8')
          
          const metadata = {
            year,
            filename: file,
            link: `/blog/${year}/${file.replace('.md', '')}`,
            title: extractTitle(content, file),
            date: extractDate(content),
            tags: extractTags(content),
            category: extractCategory(content),
            categories: extractCategories(content),
            description: extractDescription(content),
            banner: extractBanner(content)
          }
          
          posts.push(metadata)
        })
      }
    })
  }

  // 按日期降序排列
  return posts.sort((a, b) => {
    if (!a.date || !b.date) return 0
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
}

/**
 * 从 frontmatter 中提取日期
 */
function extractDate(content) {
  const match = content.match(/^---[\s\S]*?date:\s*(.+?)\s*$/m)
  return match ? match[1].trim() : null
}

/**
 * 从 frontmatter 中提取标签（数组）
 * 支持行内写法 tags: [a, b, c] 与块级列表写法：
 *   tags:
 *     - a
 *     - b
 */
function extractTags(content) {
  const inline = content.match(/^---[\s\S]*?tags:\s*\[(.*?)\]\s*$/m)
  if (inline) {
    return inline[1]
      .split(',')
      .map(tag => tag.trim().replace(/['"]/g, ''))
      .filter(Boolean)
  }

  const blockMatch = content.match(/^---[\s\S]*?tags:\s*\n((?:\s*-\s*.+\s*\n?)+)/m)
  if (blockMatch) {
    return blockMatch[1]
      .split('\n')
      .map(line => line.match(/^\s*-\s*(.+?)\s*$/)?.[1]?.replace(/['"]/g, '').trim())
      .filter(Boolean)
  }

  return []
}

/**
 * 从 frontmatter 中提取分类
 */
function extractCategory(content) {
  const match = content.match(/^---[\s\S]*?category:\s*(.+?)\s*$/m)
  return match ? match[1].replace(/['"]/g, '').trim() : null
}

/**
 * 从 frontmatter 中提取多值分类（数组）
 * 支持行内写法 categories: [a, b, c] 与块级列表写法：
 *   categories:
 *     - a
 *     - b
 */
function extractCategories(content) {
  const inline = content.match(/^---[\s\S]*?categories:\s*\[(.*?)\]\s*$/m)
  if (inline) {
    return inline[1]
      .split(',')
      .map(c => c.trim().replace(/['"]/g, ''))
      .filter(Boolean)
  }

  const blockMatch = content.match(/^---[\s\S]*?categories:\s*\n((?:\s*-\s*.+\s*\n?)+)/m)
  if (blockMatch) {
    return blockMatch[1]
      .split('\n')
      .map(line => line.match(/^\s*-\s*(.+?)\s*$/)?.[1]?.replace(/['"]/g, '').trim())
      .filter(Boolean)
  }

  return []
}

/**
 * 从 frontmatter 中提取描述
 */
function extractDescription(content) {
  const match = content.match(/^---[\s\S]*?description:\s*(.+?)\s*$/m)
  return match ? match[1].replace(/['"]/g, '').trim() : null
}

/**
 * 从 frontmatter 中提取横幅图片
 */
function extractBanner(content) {
  const match = content.match(/^---[\s\S]*?banner:\s*(.+?)\s*$/m)
  return match ? match[1].replace(/['"]/g, '').trim() : null
}

/**
 * 获取所有标签及其文章数
 */
export function getAllTags(): Record<string, number> {
  const posts = getBlogPostsMetadata()
  const tags: Record<string, number> = {}

  posts.forEach(post => {
    post.tags.forEach(tag => {
      tags[tag] = (tags[tag] || 0) + 1
    })
  })

  return tags
}
