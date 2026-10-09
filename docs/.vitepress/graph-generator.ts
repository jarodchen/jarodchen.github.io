import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 生成关系图谱数据（docs/public/vault-data.json）
 *
 * 图谱视图由 vitepress-allyouneed 的 <VaultGraph /> 组件渲染，它通过 fetch
 * 读取 `/vault-data.json`。本文件负责生成这份数据：
 *
 * - 节点：docs/ 下所有「内容页」（排除自动生成的索引 / 分类 / 标签页）
 * - 实线边（wikilink）：正文中真实的站内链接（markdown 链接、html href、Obsidian 双链）
 * - 虚线边（transclusion）：同标签 / 同分类的关联关系（博客正文之间互相引用很少，
 *   只靠真实链接图谱会散成一团「孤岛」，因此用标签与分类补足结构，页面上会明确说明）
 */

const docsDir = path.resolve(__dirname, '..')
const outputFile = path.join(docsDir, 'public', 'vault-data.json')

/** 不参与图谱的自动生成页面（相对 docs/，POSIX 风格） */
const EXCLUDED_FILES = new Set(['index.md', 'blog/index.md', 'blog/archives.md', 'graph.md'])

/** 不参与扫描的目录（相对 docs/，POSIX 风格） */
const EXCLUDED_DIRS = new Set(['.vitepress', 'public', 'categories', 'tags'])

/**
 * 图谱采用**二分图**模型：节点 = 笔记 + 标签 + 分类，边 = 「归属」关系
 * （笔记 → 它所属的标签 / 分类），外加少量笔记之间的真实正文链接。
 *
 * 之前是「笔记 ↔ 笔记，因共享标签而连」，把一个天然的二分结构压成直接边，
 * 于是 k 篇共标签就会炸出 k(k-1)/2 条边（如「DDIA」20 篇 → 190 条），
 * 只能靠度上限、共享标签数下限等参数硬压 —— 那些参数全是为这个错误建模打的补丁。
 * 改成标签 / 分类直接当节点后，中心点回归标签本身，团爆炸也自然消失。
 */
/** 至少被这么多篇笔记使用，标签才作为一个节点出现（长尾里 179 个标签只用了一次） */
const TAG_MIN_COUNT = 3
/** 至少被这么多篇笔记使用，分类才作为一个节点出现 */
const CAT_MIN_COUNT = 2

interface Frontmatter {
  title?: string
  date?: string
  slug?: string
  tags: string[]
  categories: string[]
}

/** 节点种类：笔记 / 标签 / 分类（标签与分类是二分图里的「概念节点」） */
type NodeKind = 'note' | 'tag' | 'category'

interface GraphNode {
  id: string
  title: string
  url: string
  kind: NodeKind
  /** 标签 / 分类节点下的笔记数；笔记节点为 0 */
  count: number
  tags: string[]
  categories: string[]
  mtime: number
}

interface GraphEdge {
  source: string
  target: string
  /** wikilink = 正文真实链接；tag / category = 笔记归属于某个标签 / 分类 */
  type: 'wikilink' | 'tag' | 'category'
  /** 虚线关联的理由：共享的标签 / 分类（或「同目录」兜底），用于 hover 提示 */
  shared?: string[]
}

const unquote = (value: string): string => value.trim().replace(/^['"]|['"]$/g, '').trim()

/** 解析行内数组写法：[a, b, c] */
function parseInlineList(value: string): string[] {
  const inner = value.replace(/^\[/, '').replace(/\]$/, '')
  if (!inner.trim()) return []
  return inner
    .split(',')
    .map(item => unquote(item))
    .filter(Boolean)
}

/**
 * 解析 frontmatter（只认文件开头的 --- 块）
 */
function parseFrontmatter(content: string): { data: Frontmatter; body: string } {
  const matched = content.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(\r?\n|$)/)
  const data: Frontmatter = { tags: [], categories: [] }
  if (!matched) return { data, body: content }

  const lines = matched[1].split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([A-Za-z0-9_-]+):[ \t]*(.*)$/)
    if (!kv) continue

    const key = kv[1].toLowerCase()
    const value = kv[2].trim()
    const isBlockList = value === '' || value === 'null' || value === '~'

    if (isBlockList) {
      // 块级列表写法：tags:\n  - A\n  - B
      const items: string[] = []
      let cursor = i + 1
      for (; cursor < lines.length; cursor++) {
        const item = lines[cursor].match(/^[ \t]*-[ \t]*(.+?)[ \t]*$/)
        if (!item) break
        items.push(unquote(item[1]))
      }
      if (key === 'tags') data.tags.push(...items)
      else if (key === 'category' || key === 'categories') data.categories.push(...items)
      if (items.length) i = cursor - 1
      continue
    }

    if (key === 'title') data.title = unquote(value)
    else if (key === 'date') data.date = unquote(value)
    else if (key === 'tags') data.tags.push(...parseInlineList(value))
    else if (key === 'category') data.categories.push(unquote(value))
    else if (key === 'categories') data.categories.push(...parseInlineList(value))
    else if (key === 'slug') data.slug = unquote(value)
  }

  return { data, body: content.slice(matched[0].length) }
}

/** 取正文里第一个 H1 作为标题兜底（去掉 {#custom-id} 与行内标记） */
function extractH1(body: string): string | null {
  const matched = body.match(/^#[ \t]+(.+?)[ \t]*$/m)
  if (!matched) return null
  return matched[1]
    .replace(/\{#[^}]*\}/g, '')
    .replace(/[*_`]/g, '')
    .trim()
}

/** 去掉代码块与行内代码，避免把示例代码里的路径当成链接 */
function stripCode(body: string): string {
  return body
    .replace(/^```[\s\S]*?^```/gm, '')
    .replace(/^~~~[\s\S]*?^~~~/gm, '')
    .replace(/`[^`\n]*`/g, '')
}

/** 收集所有 .md 文件（排除自动生成页与资源目录） */
function collectMarkdownFiles(dir: string, relBase = ''): string[] {
  const results: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const relPath = relBase ? `${relBase}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue
      results.push(...collectMarkdownFiles(path.join(dir, entry.name), relPath))
      continue
    }

    if (!entry.isFile() || !entry.name.endsWith('.md')) continue
    if (EXCLUDED_FILES.has(relPath)) continue
    if (EXCLUDED_DIRS.has(entry.name)) continue
    results.push(relPath)
  }

  return results
}

/** 相对路径 → VitePress 路由（cleanUrls 未开启，产物为 .html） */
function toUrl(relPath: string): string {
  return '/' + relPath.replace(/\.md$/, '.html')
}

function isExternal(href: string): boolean {
  return (
    href.startsWith('//') ||
    href.startsWith('#') ||
    /^[a-z][a-z0-9+.-]*:/i.test(href) ||
    href.includes('{{')
  )
}

/** 统一成相对 docs/ 的 POSIX 路径 */
function normalizeRelative(target: string): string {
  const unified = target.replace(/\\/g, '/')
  const normalized = path.posix.normalize(unified)
  return normalized.replace(/^\.\//, '')
}

/**
 * 把链接目标解析成图谱节点 id（相对 docs/ 的 .md 路径），解析不到返回 null
 */
function resolveTarget(
  rawHref: string,
  fromRelPath: string,
  byRelPath: Map<string, GraphNode>,
  byBasename: Map<string, GraphNode[]>
): string | null {
  let href = rawHref.trim()
  if (!href) return null

  try {
    href = decodeURIComponent(href)
  } catch {
    /* 保留原始字符串即可 */
  }

  href = href.split('#')[0].split('?')[0].trim()
  if (!href || isExternal(href)) return null

  // Obsidian 双链：按文件名（可含路径）匹配
  if (href.startsWith('[[') || href.startsWith('![[')) return null

  const fromDir = path.posix.dirname(fromRelPath)
  const candidates: string[] = []

  const push = (value: string) => {
    const normalized = normalizeRelative(value)
    if (normalized && !normalized.startsWith('..')) candidates.push(normalized)
  }

  if (href.startsWith('/')) {
    // 站点绝对路径：/blog/2026/xxx(.html)
    const base = href.slice(1)
    if (base.endsWith('.html')) push(base.replace(/\.html$/, '.md'))
    push(base)
    push(`${base}.md`)
    push(`${base.replace(/\/$/, '')}/index.md`)
  } else if (href.startsWith('./') || href.startsWith('../') || href.includes('/')) {
    // 相对路径：相对当前文件所在目录
    const joined = normalizeRelative(path.posix.join(fromDir === '.' ? '' : fromDir, href))
    if (joined.endsWith('.html')) push(joined.replace(/\.html$/, '.md'))
    push(joined)
    push(`${joined}.md`)
    push(`${joined.replace(/\/$/, '')}/index.md`)
  } else {
    // 裸文件名：先按当前目录找，再按全站同名文件找
    push(path.posix.join(fromDir === '.' ? '' : fromDir, href))
    push(href)
    push(`${href}.md`)
  }

  for (const candidate of candidates) {
    if (byRelPath.has(candidate)) return candidate
  }

  // 退化：按文件名匹配（处理裸文件名 / 省略后缀 / 中文 URL 编码不一致的情况）
  const fallbackName = path.posix
    .basename((href.startsWith('/') ? href.slice(1) : href).replace(/\/$/, ''))
    .replace(/\.(md|html)$/i, '')
    .toLowerCase()
  if (!fallbackName) return null
  const matched = byBasename.get(fallbackName)
  return matched && matched.length === 1 ? matched[0].id : null
}

/** 收集正文里的站内链接目标（markdown 链接 + html href） */
function extractLinkTargets(body: string): string[] {
  const targets: string[] = []
  const patterns = [
    /!?\[[^\]\n]*\]\([ \t]*([^)\s]+)(?:[ \t]+["'][^"']*["'])?[ \t]*\)/g,
    /href=["']([^"']+)["']/g
  ]

  for (const pattern of patterns) {
    for (const matched of body.matchAll(pattern)) {
      const href = matched[1]
      if (href && !isExternal(href)) targets.push(href)
    }
  }

  return targets
}

/** 收集 Obsidian 双链目标 */
function extractWikilinkTargets(body: string): string[] {
  const targets: string[] = []
  for (const matched of body.matchAll(/!?\[\[([^\]\n]+)\]\]/g)) {
    const raw = matched[1].split('|')[0].split('#')[0].trim()
    if (raw) targets.push(raw)
  }
  return targets
}

function countAssets(dir: string): number {
  if (!fs.existsSync(dir)) return 0
  let total = 0
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) total += countAssets(path.join(dir, entry.name))
    else if (entry.isFile()) total += 1
  }
  return total
}

/**
 * 生成关系图谱数据并写入 docs/public/vault-data.json
 * 内容无变化时不写盘，避免 dev 下触发无意义的整页刷新
 */
export function updateVaultGraphData() {
  try {
    const relPaths = collectMarkdownFiles(docsDir)

    // ── 节点 ──────────────────────────────────────────────
    const nodes: GraphNode[] = []
    const bodies = new Map<string, string>()
    const categoriesOf = new Map<string, string[]>()

    for (const relPath of relPaths) {
      const absPath = path.join(docsDir, relPath)
      const content = fs.readFileSync(absPath, 'utf-8')
      const { data, body } = parseFrontmatter(content)

      const title = data.title || extractH1(body) || path.basename(relPath, '.md')
      const node: GraphNode = {
        id: relPath,
        title,
        url: data.slug
          ? `/blog/${data.slug.replace(/^\/+/, '').replace(/\.(md|html)$/i, '')}.html`
          : toUrl(relPath),
        kind: 'note',
        count: 0,
        tags: [...new Set(data.tags)].filter(Boolean),
        categories: [...new Set(data.categories)].filter(Boolean),
        mtime: fs.statSync(absPath).mtimeMs
      }

      nodes.push(node)
      bodies.set(relPath, stripCode(body))
      categoriesOf.set(relPath, [...new Set(data.categories)].filter(Boolean))
    }

    const byRelPath = new Map(nodes.map(node => [node.id, node]))
    const byBasename = new Map<string, GraphNode[]>()
    for (const node of nodes) {
      const key = path.posix.basename(node.id, '.md').toLowerCase()
      const bucket = byBasename.get(key)
      if (bucket) bucket.push(node)
      else byBasename.set(key, [node])
    }

    // ── 边：真实站内链接（实线） ──────────────────────────
    const edges = new Map<string, GraphEdge>()
    const connected = new Set<string>()
    const linkCount = { total: 0 }

    const addEdge = (
      source: string,
      target: string,
      type: GraphEdge['type'],
      shared?: string[],
    ) => {
      if (source === target) return
      if (!byRelPath.has(source) || !byRelPath.has(target)) return
      connected.add(source)
      connected.add(target)
      const key = source < target ? `${source}\0${target}` : `${target}\0${source}`
      const existing = edges.get(key)
      // 真实链接优先于「同标签 / 同分类」关联
      if (existing) {
        if (existing.type === 'wikilink' || type === 'transclusion') return
        edges.set(key, { source, target, type, shared })
        return
      }
      edges.set(key, { source, target, type, shared })
    }

    for (const node of nodes) {
      const body = bodies.get(node.id) || ''
      const targets = [...extractLinkTargets(body), ...extractWikilinkTargets(body)]
      for (const target of targets) {
        const resolved = resolveTarget(target, node.id, byRelPath, byBasename)
        if (!resolved) continue
        addEdge(node.id, resolved, 'wikilink')
        linkCount.total += 1
      }
    }

    // ── 边：同标签 / 同分类关联（虚线） ───────────────────
    const tagIndex = new Map<string, GraphNode[]>()
    for (const node of nodes) {
      for (const tag of node.tags) {
        const bucket = tagIndex.get(tag)
        if (bucket) bucket.push(node)
        else tagIndex.set(tag, [node])
      }
    }

    const categoryIndex = new Map<string, GraphNode[]>()
    for (const node of nodes) {
      for (const category of categoriesOf.get(node.id) || []) {
        const bucket = categoryIndex.get(category)
        if (bucket) bucket.push(node)
        else categoryIndex.set(category, [node])
      }
    }

    const byMtimeDesc = (a: GraphNode, b: GraphNode) => b.mtime - a.mtime

    // ── 二分图：把标签 / 分类提升为节点，笔记按「归属」连到它们 ──
    // 标签 id 加 `tag:` / `cat:` 前缀，避免与笔记路径或彼此撞名。
    const keptTags = [...tagIndex.entries()]
      .filter(([, items]) => items.length >= TAG_MIN_COUNT)
      .sort((a, b) => b[1].length - a[1].length)

    const keptCats = [...categoryIndex.entries()]
      .filter(([, items]) => items.length >= CAT_MIN_COUNT)
      .sort((a, b) => b[1].length - a[1].length)

    // 注意：addEdge 会校验两端都在 byRelPath 里，所以概念节点必须先登记再连边，
    // 否则归属边会被静默丢弃。
    for (const [tag, items] of keptTags) {
      const id = `tag:${tag}`
      const node: GraphNode = {
        id,
        title: tag,
        url: '',
        kind: 'tag',
        count: items.length,
        tags: [],
        categories: [],
        mtime: 0,
      }
      nodes.push(node)
      byRelPath.set(id, node)
      for (const item of items) addEdge(item.id, id, 'tag')
    }

    for (const [cat, items] of keptCats) {
      const id = `cat:${cat}`
      const node: GraphNode = {
        id,
        title: cat,
        url: '',
        kind: 'category',
        count: items.length,
        tags: [],
        categories: [],
        mtime: 0,
      }
      nodes.push(node)
      byRelPath.set(id, node)
      for (const item of items) addEdge(item.id, id, 'category')
    }

    // ── 标签视图数据（结构对齐 vitepress-allyouneed 的 VaultData） ──
    const tagEntries: Record<string, { count: number; files: unknown[] }> = {}
    const sortedTags = [...tagIndex.entries()].sort((a, b) => b[1].length - a[1].length)
    for (const [tag, items] of sortedTags) {
      tagEntries[tag] = {
        count: items.length,
        files: [...items]
          .sort(byMtimeDesc)
          .map(item => ({
            id: item.id,
            url: item.url,
            title: item.title,
            mtime: item.mtime,
            path: item.id,
            otherTags: item.tags.filter(other => other !== tag)
          }))
      }
    }

    // 统计口径只算「笔记」节点，不含标签 / 分类概念节点
    const noteNodes = nodes.filter(node => node.kind === 'note')

    const payload = {
      nodes,
      edges: [...edges.values()],
      tags: tagEntries,
      stats: {
        totalFiles: noteNodes.length,
        totalAssets: countAssets(path.join(docsDir, 'public')),
        totalWikilinks: linkCount.total,
        totalTags: tagIndex.size,
        totalWarnings: 0,
        mostRecent: [...noteNodes]
          .sort(byMtimeDesc)
          .slice(0, 5)
          .map(({ id, url, title, mtime }) => ({ id, url, title, mtime }))
      }
    }

    // 内容无变化就不写盘：dev 下 public/ 目录被改动会触发整页刷新，
    // 所以比对时忽略 meta.generatedAt（只有时间戳不同不算变化）
    if (fs.existsSync(outputFile)) {
      try {
        const previous = JSON.parse(fs.readFileSync(outputFile, 'utf-8'))
        const stable = JSON.stringify(payload)
        const previousStable = JSON.stringify({
          nodes: previous.nodes,
          edges: previous.edges,
          tags: previous.tags,
          stats: previous.stats
        })
        if (stable === previousStable) return
      } catch {
        /* 数据文件损坏时直接重写 */
      }
    }

    const output = {
      ...payload,
      meta: {
        generatedAt: Date.now(),
        pluginVersion: 'vitepress-allyouneed/0.5.6 + graph-generator'
      }
    }

    fs.mkdirSync(path.dirname(outputFile), { recursive: true })
    fs.writeFileSync(outputFile, JSON.stringify(output), 'utf-8')
    console.log(
      `✅ 关系图谱数据已更新 (${nodes.length} 个节点 / ${payload.edges.length} 条关联 / ${tagIndex.size} 个标签)`
    )
  } catch (error) {
    console.error('❌ 生成关系图谱数据失败:', (error as Error).message)
  }
}
