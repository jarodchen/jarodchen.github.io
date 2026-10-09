import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getBlogPostsMetadata } from './sidebar-generator'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 生成标签索引页面（中文 /docs/blog/tags/，英文 /docs/en/blog/tags/）
 */
export function updateTagsIndexPage(locale = '') {
  try {
    const isEn = !!locale
    const t = (zh: string, en: string) => (isEn ? en : zh)
    const prefix = locale ? `/${locale}` : ''
    const outBase = locale ? `../${locale}/blog/tags` : '../blog/tags'

    const posts = getBlogPostsMetadata(locale)

    // 按标签分组
    const postsByTag: Record<string, typeof posts> = {}
    posts.forEach(post => {
      post.tags.forEach(tag => {
        if (!postsByTag[tag]) {
          postsByTag[tag] = []
        }
        postsByTag[tag].push(post)
      })
    })

    const tagNames = Object.keys(postsByTag).sort()

    let content = `---
title: ${t('标签索引', 'Tags')}
description: ${t('按标签浏览技术文章', 'Browse articles by tag')}
---

# 🏷️ ${t('标签索引', 'Tags')}

${t('按技术主题标签浏览文章，快速定位感兴趣的内容。', 'Browse articles by technical topic tags to quickly find what interests you.')}

<div class="tags-cloud">

`

    tagNames.forEach(tag => {
      const count = postsByTag[tag].length
      const tagLink = `${prefix}/blog/tags/${tag.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')}`
      content += `  <a class="tag-pill" href="${tagLink}"><span class="tag-name">${tag}</span><span class="tag-count">${count}</span></a>\n`
    })

    content += `
</div>

<style>
.tags-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 14px;
  margin: 28px 0 36px;
  padding: 20px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
}

.tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 22px;
  text-decoration: none;
  font-size: 14px;
  line-height: 1.4;
  color: var(--vp-c-text-1);
  transition: all 0.2s ease;
}

.tag-pill:hover {
  border-color: var(--vp-c-brand);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand);
  transform: translateY(-1px);
}

.tag-name {
  font-weight: 500;
}

.tag-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 12px;
  color: var(--vp-c-brand);
  background: var(--vp-c-brand-soft);
  border-radius: 10px;
}

.tag-pill:hover .tag-count {
  background: var(--vp-c-brand);
  color: #fff;
}
</style>

---

## ${t('统计信息', 'Statistics')}

- **${t('总标签数', 'Total tags')}**: ${tagNames.length} ${isEn ? 'tags' : '个'}
- **${t('总文章数', 'Total posts')}**: ${posts.length} ${isEn ? 'posts' : '篇'}

---

[← ${t('返回博客首页', 'Back to blog')}](../index.md)${isEn ? '' : ' | [查看所有文章归档](../archives.md)'}

<!--
  注意：此文件由 tag-generator.ts 自动生成，请勿手动编辑。
-->
`

    const outputPath = path.resolve(__dirname, `${outBase}/index.md`)

    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    fs.writeFileSync(outputPath, content, 'utf-8')

    console.log(`✅ 标签索引页已自动更新 (${locale || 'zh'}): ${tagNames.length} 个标签`)
  } catch (error) {
    console.error(`❌ 更新标签索引页失败 (${locale || 'zh'}):`, (error as Error).message)
  }
}

/**
 * 生成单个标签的详细页面（卡片网格 + 横幅缩略图）
 */
export function updateTagPage(tag: string, locale = '') {
  try {
    const isEn = !!locale
    const t = (zh: string, en: string) => (isEn ? en : zh)
    const prefix = locale ? `/${locale}` : ''
    const outBase = locale ? `../${locale}/blog/tags` : '../blog/tags'

    const posts = getBlogPostsMetadata(locale).filter(post => post.tags.includes(tag))

    if (!posts || posts.length === 0) {
      return
    }

    const tagJson = JSON.stringify(tag)

    // 序列化文章数据
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

    const content = `---
title: ${tag}
description: ${t(`浏览标签「${tag}」相关的所有技术文章`, `Browse all articles tagged with "${tag}"`)}
aside: false
---

# 🏷️ ${tag}

${t(`本标签共 ${posts.length} 篇文章。`, `This tag has ${posts.length} articles.`)}

<script setup>
const tagName = ${tagJson}
const posts = ${postsJson}
</script>

<div class="tag-posts">
  <a v-for="post in posts" :key="post.link" class="card" :href="post.link">
    <span class="card-thumb">
      <img :src="post.banner || '/images/placeholder.png'" :alt="post.title" loading="lazy" />
    </span>
    <span class="card-content">
      <span class="card-meta">
        <span class="card-date">{{ post.date }}</span>
        <span class="card-category">{{ tagName }}</span>
      </span>
      <span class="card-title">{{ post.title }}</span>
      <span v-if="post.description" class="card-desc">{{ post.description }}</span>
      <span class="card-footer">
        <span v-if="post.tags && post.tags.length" class="card-tags">
          <span v-for="tg in post.tags" :key="tg" class="tag">{{ tg }}</span>
        </span>
      </span>
    </span>
  </a>
</div>

<p class="posts-count">${t(`共 {{ posts.length }} 篇文章`, `{{ posts.length }} articles total`)}</p>

<style scoped>
.tag-posts {
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

[← ${t('返回标签索引', 'Back to tag index')}](./index.md) | [← ${t('返回博客首页', 'Back to blog')}](../index.md)

<!--
  注意：此文件由 tag-generator.ts 自动生成，请勿手动编辑。
-->
`

    const filename = tag.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-') + '.md'
    const outputPath = path.resolve(__dirname, `${outBase}/${filename}`)

    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    fs.writeFileSync(outputPath, content, 'utf-8')

    console.log(`✅ 标签页面已生成: ${tag} (${locale || 'zh'}) (${posts.length} 篇文章)`)
  } catch (error) {
    console.error(`❌ 生成标签页面失败 (${locale || 'zh'} ${tag}):`, (error as Error).message)
  }
}

/**
 * 生成所有标签页面（默认中英文都生成；传 locale 则只生成该语言）
 */
export function updateAllTagPages(locale?: string) {
  try {
    const locales = locale === undefined ? ['', 'en'] : [locale]
    console.log(`\n🏷️ 开始生成标签页面...`)
    for (const loc of locales) {
      const posts = getBlogPostsMetadata(loc)
      const tags = new Set<string>()
      posts.forEach(post => post.tags.forEach(tag => tags.add(tag)))

      updateTagsIndexPage(loc)

      ;[...tags].forEach(tag => {
        updateTagPage(tag, loc)
      })

      console.log(`✅ 所有标签页面已生成 (${loc || 'zh'}): ${tags.size} 个标签`)
    }
  } catch (error) {
    console.error('❌ 生成标签页面失败:', (error as Error).message)
  }
}
