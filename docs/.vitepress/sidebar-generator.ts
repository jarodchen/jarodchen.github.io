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
  slug?: string | null
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
      collapsed: false,
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
        collapsed: false, // 年份默认展开
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
 * 从 frontmatter 中提取 slug（自定义文章路径）；无则返回 null。
 * 仅在文件开头的 --- 块内匹配，避免误抓正文里的 slug: 示例。
 * 自动清理前导斜杠与尾部 .md / .html。
 */
function extractSlug(content: string): string | null {
  const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(\r?\n|$)/)
  if (!fm) return null
  const m = fm[1].match(/^slug:\s*(.+?)\s*$/m)
  if (!m || !m[1]) return null
  const slug = m[1]
    .replace(/['"]/g, '')
    .trim()
    .replace(/^\/+/, '')
    .replace(/\.(md|html)$/i, '')
  return slug || null
}

/**
 * 递归收集目录下的所有 .md 文件（完整路径）
 * 自动跳过自动生成的 categories / tags 目录，以及 index.md
 */
function walkMarkdownFiles(dir: string): string[] {
  const results: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    // 跳过自动生成的分类 / 标签目录（其中的页面由脚本生成，不是文章）
    if (entry.isDirectory() && (entry.name === 'categories' || entry.name === 'tags')) {
      continue
    }
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkMarkdownFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'index.md') {
      results.push(fullPath)
    }
  }

  return results
}

/**
 * 获取所有博客文章的元数据（用于生成首页 / 归档页 / 侧边栏等）
 * 递归扫描 blog/ 下的【所有】子文件夹（不再局限于 YYYY 年份目录），
 * 因此放在任意子目录下的文章都能被正确收集。
 *
 * - 链接：基于文件相对 blog 根目录的真实路径生成（保留完整子目录层级）
 * - 年份：优先取 frontmatter 的 date，其次取路径中的 4 位年份段，都没有则为「未知」
 */
export function getBlogPostsMetadata(): BlogPostMetadata[] {
  const blogDir = path.resolve(__dirname, '../blog')
  const posts: BlogPostMetadata[] = []

  // 需要排除的非文章文件（自动生成或说明性文件）
  const excludedFiles = new Set(['archives.md', 'rss.md', 'README.md'])

  if (fs.existsSync(blogDir)) {
    const files = walkMarkdownFiles(blogDir)

    files.forEach(filePath => {
      const file = path.basename(filePath)
      if (excludedFiles.has(file)) return

      const content = fs.readFileSync(filePath, 'utf-8')
      // 相对于 blog 根目录的真实路径，保留完整子目录层级（用于生成链接）
      const relPath = path.relative(blogDir, filePath)
        .replace(/\\/g, '/')
        .replace(/\.md$/, '')

      // 年份推导：优先 frontmatter 的 date；否则路径中的 4 位年份段
      const date = extractDate(content)
      let year = '未知'
      if (date) {
        const d = new Date(date)
        if (!isNaN(d.getTime())) {
          year = String(d.getFullYear())
        }
      }
      if (year === '未知') {
        const yearSeg = relPath.split('/').find(seg => /^\d{4}$/.test(seg))
        if (yearSeg) year = yearSeg
      }

      const slug = extractSlug(content)
      const linkPath = slug ? `blog/${slug}` : `blog/${relPath}`
      const metadata = {
        year,
        filename: file,
        slug: slug ?? null,
        link: `/${linkPath}`,
        title: extractTitle(content, file),
        date,
        tags: extractTags(content),
        category: extractCategory(content),
        categories: extractCategories(content),
        description: extractDescription(content),
        banner: extractBanner(content)
      }

      posts.push(metadata)
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

/**
 * 构建 VitePress rewrites 映射：把真实文件路径路由改写为 frontmatter 的 slug。
 * 仅对配置了 slug 的笔记生效；无 slug 的笔记不出现在映射里（沿用原路径）。
 * from / to 均为相对 srcDir（docs）的路径，不带 .md；to 无前导斜杠（符合 VitePress rewrites 格式）。
 */
export function getBlogRewrites(): Record<string, string> {
  const blogDir = path.resolve(__dirname, '../blog')
  const rewrites: Record<string, string> = {}
  if (!fs.existsSync(blogDir)) return rewrites

  const excluded = new Set(['archives.md', 'rss.md', 'README.md'])
  const seen = new Map<string, string>()
  const files = walkMarkdownFiles(blogDir)

  for (const filePath of files) {
    const file = path.basename(filePath)
    if (excluded.has(file)) continue

    const content = fs.readFileSync(filePath, 'utf-8')
    const slug = extractSlug(content)
    if (!slug) continue

    const relPath = path
      .relative(blogDir, filePath)
      .replace(/\\/g, '/')
      .replace(/\.md$/, '')
    // VitePress rewrites 的 from / to 都要带 .md 扩展名（见官方 Routing 指南示例）
    const from = `blog/${relPath}.md`
    const to = `blog/${slug}.md`
    if (from === to) continue

    if (seen.has(to)) {
      console.warn(
        `[slug] 冲突：多篇笔记使用了相同 slug "${slug}"（${seen.get(to)} 与 ${from}），后写覆盖前写`
      )
    }
    seen.set(to, from)
    rewrites[from] = to
  }

  return rewrites
}
