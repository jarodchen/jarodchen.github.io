// VitePress 配置扩展 - 自动更新博客侧边栏和归档页
import { generateBlogSidebar, getBlogPostsMetadata } from './sidebar-generator'
import { updateAllCategoryPages } from './category-generator'
import { updateAllTagPages } from './tag-generator'
import { updateVaultGraphData } from './graph-generator'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 防抖定时器，避免频繁触发
let updateTimer: NodeJS.Timeout | null = null;
let isUpdating = false;

// 仅在开发模式下启动文件监听器（避免阻塞 CI/CD 构建）
const isDevMode = process.env.NODE_ENV !== 'production' && !process.argv.includes('build')

if (isDevMode) {
  // 监听 blog 目录变化（中/英），自动重新生成（排除自动生成的文件）
  const watchDirs = [path.resolve(__dirname, '../blog'), path.resolve(__dirname, '../en/blog')]

  try {
    watchDirs.forEach(blogDir => {
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
          updateVaultGraphData();
          console.log('✨ 页面已自动更新\n');
          isUpdating = false;
        }
      }, 500);
      })
    })
    console.log('👀 正在监听博客文章变化（中/英）...（仅监听手动创建的文章文件）\n')
  } catch (error) {
    console.error('⚠️  文件监听失败:', error.message)
  }
}

// 重新导出函数供 config.ts 使用
export { generateBlogSidebar }

/**
 * 生成博客首页内容（中/英）
 * 同时更新网站首页（docs/index.md / docs/en/index.md）与博客首页（docs/blog/index.md / docs/en/blog/index.md）
 */
export function updateBlogIndexPage() {
  try {
    for (const locale of ['', 'en']) {
      generateIndexForLocale(locale)
    }
    console.log('✅ 网站首页(中/英)与博客首页已自动更新')
  } catch (error) {
    console.error('❌ 更新博客首页失败:', error.message)
  }
}

interface I18n {
  title: string
  description: string
  heroName: string
  heroTagline: string
  recentHeading: string
  yearSuffix: string
  categoriesHeading: string
  subscribeHeading: string
  githubText: string
  archivesText: string
  moreText: string
  catFootText: string
  noPosts: string
  moreLink: string
  archivesLink: string
  blogIntro: string
  browseByCategory: string
  blogBase: string
  catIndexLink: string
  tagIndexLink: string
  tagsHeading: string
}

function generateIndexForLocale(locale: string) {
  const isEn = locale === 'en'
  const posts = getBlogPostsMetadata(locale)

  const i18n: I18n = isEn
    ? {
        title: 'Blog',
        description: 'Tech sharing & learning notes',
        heroName: 'Jarod Chen',
        heroTagline: 'Looking up at the stars, head down in the grind.',
        recentHeading: 'Latest Articles',
        yearSuffix: '',
        categoriesHeading: 'Categories',
        subscribeHeading: 'Subscribe & Follow',
        githubText: 'GitHub: [@jarodchen](https://github.com/jarodchen)',
        archivesText: 'Archives',
        moreText: 'View all posts',
        catFootText: 'Click a category to view all its articles',
        noPosts: '*No posts yet*',
        moreLink: '/en/blog/',
        archivesLink: '/en/blog/archives',
        blogIntro: 'All articles, newest first.',
        browseByCategory: 'Browse by category',
        blogBase: '/en/blog',
        catIndexLink: '/en/blog/categories/',
        tagIndexLink: '/en/blog/tags/',
        tagsHeading: 'Tags'
      }
    : {
        title: '博客',
        description: '技术分享与学习心得',
        heroName: '白日梦想家',
        heroTagline: '仰望星空，低头滚粪，不掩饰无能，不停止嘲笑',
        recentHeading: '最新文章',
        yearSuffix: ' 年',
        categoriesHeading: '文章分类',
        subscribeHeading: '订阅与关注',
        githubText: '💻 GitHub：[@jarodchen](https://github.com/jarodchen)',
        archivesText: '文章归档',
        moreText: '查看更多历史文章',
        catFootText: '点击分类查看该领域的所有文章',
        noPosts: '*暂无文章*',
        moreLink: '/blog/',
        archivesLink: '/blog/archives',
        blogIntro: '全部文章，按时间倒序排列。',
        browseByCategory: '按分类浏览',
        blogBase: '/blog',
        catIndexLink: '/blog/categories/',
        tagIndexLink: '/blog/tags/',
        tagsHeading: '标签'
      }

  const postsByYear: Record<string, any[]> = {}
  posts.forEach(post => {
    if (!postsByYear[post.year]) postsByYear[post.year] = []
    postsByYear[post.year].push(post)
  })
  const numericYears = Object.keys(postsByYear).filter(y => /^\d{4}$/.test(y))
  const latestYear = numericYears.length
    ? numericYears.sort((a, b) => parseInt(b) - parseInt(a))[0]
    : Object.keys(postsByYear)[0]
  const recentPosts = postsByYear[latestYear] || []
  const displayPosts = recentPosts.slice(0, 5)
  const hasMorePosts = recentPosts.length > 5

  let body = `# ${i18n.recentHeading} {#recent}

<div class="recent-carousel">
<div class="rc-label"></div>
<HomeCarouselPosts :count="3" />
</div>

`

  if (displayPosts.length > 0) {
    body += isEn
      ? `### ${latestYear} (${recentPosts.length} posts, showing latest ${displayPosts.length})\n\n`
      : `### ${latestYear}${i18n.yearSuffix}（${recentPosts.length} 篇，显示最新 ${displayPosts.length} 篇）\n\n`
    displayPosts.forEach(post => {
      body += `- [${post.title}](${post.link})`
      if (post.date) body += ` <span style="color: #999; font-size: 0.9em;">${post.date}</span>`
      body += '\n'
    })
    if (hasMorePosts) {
      body += isEn
        ? `\n*${recentPosts.length - 5} more posts, see [${i18n.archivesText}](${i18n.moreLink})*\n\n`
        : `\n*还有 ${recentPosts.length - 5} 篇文章，请查看[${i18n.archivesText}](${i18n.moreLink})*\n\n`
    }
    body += `\n[📚 ${i18n.moreText} →](${i18n.moreLink})\n\n`
  } else {
    body += `${i18n.noPosts}\n\n`
  }

  body += `<div class="recent-clear"></div>

---

# ${i18n.categoriesHeading} {#categories}

<div class="cat-grid">

`

  const postsByCategory: Record<string, any[]> = {}
  posts.forEach(post => {
    const category = post.category || (isEn ? 'Uncategorized' : '未分类')
    if (!postsByCategory[category]) postsByCategory[category] = []
    postsByCategory[category].push(post)
  })

  const categoryIcons: Record<string, string> = {
    '.NET 开发': '🔧',
    '前端开发': '🌐',
    '算法与数据结构': '📊',
    '数据库': '🗄️',
    '.NET Core': '🔧',
    'DevOps': '⚙️'
  }

  Object.keys(postsByCategory).forEach(category => {
    const icon = categoryIcons[category] || '📁'
    const categoryPosts = postsByCategory[category]
    const categoryLink = `${i18n.blogBase}/categories/${category.replace(/[^a-zA-Z0-9一-龥]/g, '-')}`
    const catCountText = isEn
      ? `${categoryPosts.length} ${categoryPosts.length === 1 ? 'post' : 'posts'}`
      : `${categoryPosts.length} 篇`
    body += `<div class="cat-card">
  <h4 class="cat-card-head">
    <a href="${categoryLink}" class="cat-card-title">${icon} ${category}</a>
    <span class="cat-card-count">${catCountText}</span>
  </h4>
  <ul class="cat-card-list">
`
    const recentCat = categoryPosts.slice(0, 3)
    recentCat.forEach(post => {
      body += `    <li><a href="${post.link}">${post.title}</a></li>\n`
    })
    if (categoryPosts.length > 3) {
      const moreCatText = isEn
        ? `... ${categoryPosts.length - 3} more`
        : `... ${i18n.moreText} (${categoryPosts.length - 3} 篇)`
      body += `    <li><a href="${categoryLink}" class="cat-card-more">${moreCatText}</a></li>\n`
    }
    body += `  </ul>
</div>

`
  })

  body += `</div>

<p class="cat-foot">
  👆 ${i18n.catFootText} |
  <a href="${i18n.catIndexLink}">${isEn ? 'View full category index' : '查看完整分类索引'}</a>
</p>

---

# ${i18n.subscribeHeading}

- ${i18n.githubText}
- 📋 [${i18n.archivesText}](${i18n.archivesLink}) - ${isEn ? 'View all historical articles' : '查看所有历史文章'}

<!--
  注意：此文件由 blog-utils.ts 自动生成，请勿手动编辑。
-->
`

  // 网站首页：完整 hero + 正文
  const homeContent = `---
layout: home
title: ${i18n.title}
description: ${i18n.description}
sidebar: false
hero:
  name: ${i18n.heroName}
  tagline: ${i18n.heroTagline}
---

${body}`

  // 博客首页：全部文章列表（真正的文章清单，与站点首页的 hero 摘要区分开）
  // 注意：博客首页必须保留侧边栏（不能 sidebar: false），
  // 否则 config.ts 里 '/blog/' / '/en/blog/' 挂的博客导航（分类索引 / 标签索引 / 分类分组）会整块消失
  let blogContent = `---
title: ${i18n.title}
description: ${i18n.description}
---

# ${i18n.title}

${i18n.blogIntro}

📂 [${i18n.categoriesHeading}](${i18n.catIndexLink}) · 🏷️ [${i18n.tagsHeading}](${i18n.tagIndexLink}) · 📋 [${i18n.archivesText}](${i18n.archivesLink})

`

  const allYears = Object.keys(postsByYear)
    .filter(y => /^\d{4}$/.test(y))
    .sort((a, b) => parseInt(b) - parseInt(a))

  if (allYears.length === 0) {
    blogContent += `${i18n.noPosts}\n\n`
  } else {
    allYears.forEach(year => {
      const yearPosts = postsByYear[year]
      blogContent += isEn
        ? `## ${year} (${yearPosts.length} ${yearPosts.length === 1 ? 'post' : 'posts'})\n\n`
        : `## ${year}${i18n.yearSuffix}（${yearPosts.length} 篇）\n\n`
      yearPosts.forEach(post => {
        blogContent += `- [${post.title}](${post.link})`
        if (post.date) blogContent += ` <span style="color: #999; font-size: 0.9em;">${post.date}</span>`
        if (post.category) blogContent += ` <span style="color: var(--vp-c-brand); font-size: 0.85em;">[${post.category}]</span>`
        blogContent += '\n'
      })
      blogContent += '\n'
    })
  }

  blogContent += `
<!--
  注意：此文件由 blog-utils.ts 自动生成，请勿手动编辑。
-->
`

  const homeOutputPath = locale
    ? path.resolve(__dirname, `../${locale}/index.md`)
    : path.resolve(__dirname, '../index.md')
  fs.writeFileSync(homeOutputPath, homeContent, 'utf-8')

  const blogDir = locale ? path.resolve(__dirname, `../${locale}/blog`) : path.resolve(__dirname, '../blog')
  fs.mkdirSync(blogDir, { recursive: true })
  fs.writeFileSync(path.join(blogDir, 'index.md'), blogContent, 'utf-8')
}

/**
 * 生成归档页面内容（默认中英文都生成；传 locale 则只生成该语言）
 */
export function updateArchivesPage(locale?: string) {
  try {
    const locales = locale === undefined ? ['', 'en'] : [locale]
    for (const loc of locales) {
      generateArchivesForLocale(loc)
    }
    console.log('✅ 归档页面已自动更新（中/英）')
  } catch (error) {
    console.error('❌ 更新归档页面失败:', error.message)
  }
}

function generateArchivesForLocale(locale: string) {
  const isEn = locale === 'en'
  const posts = getBlogPostsMetadata(locale)

  const i18n = isEn
    ? {
        title: 'Archives',
        description: 'Browse all English articles in chronological order',
        heading: 'Archives',
        intro: 'Browse all articles in chronological order.',
        statHeading: 'Statistics',
        totalText: 'Total posts',
        thisYearText: 'Published this year',
        latestText: 'Latest post',
        backText: 'Back to blog',
        noPostsText: 'No posts yet'
      }
    : {
        title: '文章归档',
        description: '按时间顺序浏览所有技术文章',
        heading: '文章归档',
        intro: '按时间顺序查看所有技术文章，方便快速定位和回顾。',
        statHeading: '统计信息',
        totalText: '总文章数',
        thisYearText: '今年发布',
        latestText: '最近一篇',
        backText: '返回博客首页',
        noPostsText: '暂无'
      }

  // 按年份分组
  const postsByYear: Record<string, any[]> = {}
  posts.forEach(post => {
    if (!postsByYear[post.year]) postsByYear[post.year] = []
    postsByYear[post.year].push(post)
  })

  let content = `---
title: ${i18n.title}
description: ${i18n.description}
---

# ${i18n.heading}

${i18n.intro}

`

  Object.keys(postsByYear)
    .sort((a, b) => parseInt(b) - parseInt(a))
    .forEach(year => {
      const yearPosts = postsByYear[year]
      content += `## ${year} ${isEn ? '' : '年'}（${yearPosts.length} ${isEn ? 'posts' : '篇'}）\n\n`

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

  content += `## ${i18n.statHeading}

- **${i18n.totalText}**: ${totalPosts} ${isEn ? 'posts' : '篇'}
- **${i18n.thisYearText}**: ${thisYearPosts} ${isEn ? 'posts' : '篇'}
- **${i18n.latestText}**: ${latestPost?.date || i18n.noPostsText}

---

[← ${i18n.backText}](./index.md)

<!--
  注意：此文件由 blog-utils.ts 自动生成，请勿手动编辑。
  如需修改，请更新 docs/.vitepress/blog-utils.ts 中的 generateArchivesForLocale() 函数。
-->
`

  const outputPath = locale
    ? path.resolve(__dirname, `../${locale}/blog/archives.md`)
    : path.resolve(__dirname, '../blog/archives.md')
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, content, 'utf-8')

  console.log(`✅ 归档页面已自动更新 (${locale || 'zh'}): ${totalPosts} 篇文章`)
}
