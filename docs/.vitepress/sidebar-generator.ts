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
}

/**
 * 自动生成博客侧边栏配置
 * 扫描 blog 目录下的所有文章，按年份组织
 */
export function generateBlogSidebar(): SidebarItem[] {
  const blogDir = path.resolve(__dirname, '../blog')
  const sidebarItems: SidebarItem[] = []

  // 添加博客首页和归档页
  sidebarItems.push({
    text: '博客',
    items: [
      { text: '首页', link: '/blog/' },
      { text: '文章归档', link: '/blog/archives' },
      { text: '分类索引', link: '/blog/categories/' },
      { text: 'RSS 订阅', link: '/blog/rss' }
    ]
  })

  // 扫描年份目录
  if (fs.existsSync(blogDir)) {
    const yearDirs = fs.readdirSync(blogDir)
      .filter(dir => /^\d{4}$/.test(dir)) // 匹配年份格式（如 2026）
      .sort((a, b) => parseInt(b) - parseInt(a)) // 按年份降序排列

    yearDirs.forEach(year => {
      const yearPath = path.join(blogDir, year)
      
      if (fs.statSync(yearPath).isDirectory()) {
        const articles = []
        
        // 扫描该年份下的所有 Markdown 文件
        const files = fs.readdirSync(yearPath)
          .filter(file => file.endsWith('.md'))
          .sort((a, b) => {
            // 尝试从文件名或 frontmatter 中提取日期进行排序
            const statA = fs.statSync(path.join(yearPath, a))
            const statB = fs.statSync(path.join(yearPath, b))
            return statB.mtime.getTime() - statA.mtime.getTime() // 按修改时间降序
          })

        const articleItems: SidebarItem[] = []

        files.forEach(file => {
          const filePath = path.join(yearPath, file)
          const content = fs.readFileSync(filePath, 'utf-8')
          
          // 提取 title（从 frontmatter 或文件名）
          let title = extractTitle(content, file)
          
          // 转换为 VitePress 链接格式
          const link = `/blog/${year}/${file.replace('.md', '')}`
          
          articleItems.push({
            text: title,
            link: link
          })
        })

        if (articleItems.length > 0) {
          sidebarItems.push({
            text: `${year} 年`,
            collapsed: false, // 默认展开当年文章
            items: articleItems
          })
        }
      }
    })
  }

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
            description: extractDescription(content)
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
 * 从 frontmatter 中提取标签
 */
function extractTags(content) {
  const match = content.match(/^---[\s\S]*?tags:\s*\[(.*?)\]\s*$/m)
  if (match && match[1]) {
    return match[1].split(',').map(tag => tag.trim().replace(/['"]/g, ''))
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
 * 从 frontmatter 中提取描述
 */
function extractDescription(content) {
  const match = content.match(/^---[\s\S]*?description:\s*(.+?)\s*$/m)
  return match ? match[1].replace(/['"]/g, '').trim() : null
}
