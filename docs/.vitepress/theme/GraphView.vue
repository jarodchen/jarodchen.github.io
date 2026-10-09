<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'
import { useRouter, useData, withBase } from 'vitepress'
import * as d3 from 'd3-selection'
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceRadial,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom'
import { drag as d3drag } from 'd3-drag'

const router = useRouter()

/** 数据文件：默认中文 /vault-data.json；英文页传 /vault-data-en.json */
const props = defineProps<{ dataFile?: string }>()

/** 当前语言：英文页（lang 以 en 开头，或路由在 /en/ 下）切换英文 UI 文案 */
const { lang } = useData()
const isEn = computed(() =>
  (lang.value || '').toLowerCase().startsWith('en') || router.route.path.startsWith('/en/'),
)
/** 模板/文案双语切换：t('中文', 'English') */
const t = (zh: string, en: string) => (isEn.value ? en : zh)

/** 节点种类：笔记 / 标签 / 分类（标签与分类是二分图里的「概念节点」） */
type NodeKind = 'note' | 'tag' | 'category'
/** 边：正文真实链接 / 笔记归属于标签 / 笔记归属于分类 */
type EdgeKind = 'wikilink' | 'tag' | 'category'

interface RawNode {
  id: string
  title: string
  url: string
  kind: NodeKind
  /** 标签 / 分类节点下的笔记数 */
  count: number
  tags: string[]
  categories: string[]
  mtime: number
}
interface RawLink {
  source: string
  target: string
  type: EdgeKind
}

// ── 数据加载（自带 fetch，不依赖插件内部 composable，避免 exports 限制）──
const data = ref<{ nodes: RawNode[]; edges: RawLink[] } | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const res = await fetch(withBase(props.dataFile ?? '/vault-data.json'), { cache: 'no-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const parsed = (await res.json()) as { nodes: RawNode[]; edges: RawLink[] }
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      throw new Error(t('vault-data.json 字段缺失', 'vault-data.json missing fields'))
    }
    data.value = parsed
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
    data.value = null
  } finally {
    loading.value = false
  }
}

// ── 过滤状态 ────────────────────────────────────────────────
const search = ref('')
const selectedTags = ref<string[]>([])
const selectedCats = ref<string[]>([])
const showWikilink = ref(true)
/** 是否显示「笔记 → 标签」归属边 */
const showTagLinks = ref(true)
/** 是否显示「笔记 → 分类」归属边 */
const showCategoryLinks = ref(true)
/** 说明弹窗（原来铺在页面下方的说明文字，收进这里避免挤压画布） */
const showHelp = ref(false)

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') showHelp.value = false
}

/** 笔记总数（不含标签 / 分类概念节点） */
const totalNodes = computed(
  () => (data.value?.nodes ?? []).filter((n) => n.kind === 'note').length,
)

const allTags = computed<{ t: string; c: number }[]>(() => {
  const m = new Map<string, number>()
  for (const n of data.value?.nodes ?? []) {
    if (n.kind !== 'note') continue
    for (const t of n.tags ?? []) m.set(t, (m.get(t) ?? 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([t, c]) => ({ t, c }))
})

const allCats = computed<{ c: string; n: number }[]>(() => {
  const m = new Map<string, number>()
  for (const n of data.value?.nodes ?? []) {
    if (n.kind !== 'note') continue
    for (const x of n.categories ?? []) m.set(x, (m.get(x) ?? 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([c, n]) => ({ c, n }))
})

/**
 * 深度：0 = 不限；1/2/3 = 从锚点向外展开 N「层」。
 * 二分图里笔记之间必然隔着一个概念节点（笔记→标签→笔记），所以
 * 1 层 = 2 跳 = 共享标签 / 分类的笔记；N 层 = 2N 跳。
 */
const depth = ref(0)
/** 焦点节点（单击画布里的笔记节点设定），为空则用属性筛选命中的节点当多锚点 */
const focusId = ref<string | null>(null)

/** 属性筛选（搜索 / 标签 / 分类）命中的「笔记」 —— 深度的输入之一 */
const propertyIds = computed<Set<string>>(() => {
  const q = search.value.trim().toLowerCase()
  const ids = new Set<string>()
  for (const n of data.value?.nodes ?? []) {
    if (n.kind !== 'note') continue
    if (q && !n.title.toLowerCase().includes(q)) continue
    if (selectedTags.value.length && !(n.tags ?? []).some((t) => selectedTags.value.includes(t))) continue
    if (selectedCats.value.length && !(n.categories ?? []).some((c) => selectedCats.value.includes(c))) continue
    ids.add(n.id)
  }
  return ids
})

/** 概念节点（标签 / 分类）只要还有至少一个可见笔记连着它，就保留 */
const conceptIds = computed<Set<string>>(() => {
  const ids = new Set<string>()
  for (const e of data.value?.edges ?? []) {
    if (e.type === 'tag') {
      if (!showTagLinks.value) continue
      if (propertyIds.value.has(e.source)) ids.add(e.target)
    } else if (e.type === 'category') {
      if (!showCategoryLinks.value) continue
      if (propertyIds.value.has(e.source)) ids.add(e.target)
    }
  }
  return ids
})

const hasPropertyFilter = computed(
  () =>
    !!search.value.trim() || selectedTags.value.length > 0 || selectedCats.value.length > 0,
)

/** BFS 用的邻接表（只含当前启用的边类型） */
const adjacency = computed<Map<string, Set<string>>>(() => {
  const m = new Map<string, Set<string>>()
  for (const n of data.value?.nodes ?? []) m.set(n.id, new Set())
  for (const e of data.value?.edges ?? []) {
    if (e.type === 'wikilink' && !showWikilink.value) continue
    if (e.type === 'tag' && !showTagLinks.value) continue
    if (e.type === 'category' && !showCategoryLinks.value) continue
    m.get(e.source)?.add(e.target)
    m.get(e.target)?.add(e.source)
  }
  return m
})

/** 没有任何锚点时，自动选「连接数最高的笔记」当锚点，保证深度档位一定有可见效果 */
const autoSeedId = computed<string | null>(() => {
  if (!data.value) return null
  const deg = new Map<string, number>()
  for (const e of data.value.edges) {
    if (e.type === 'wikilink' && !showWikilink.value) continue
    if (e.type === 'tag' && !showTagLinks.value) continue
    if (e.type === 'category' && !showCategoryLinks.value) continue
    deg.set(e.source, (deg.get(e.source) ?? 0) + 1)
    deg.set(e.target, (deg.get(e.target) ?? 0) + 1)
  }
  let best: string | null = null
  let bestDeg = -1
  for (const [id, d] of deg) {
    const node = data.value.nodes.find((n) => n.id === id)
    if (!node || node.kind !== 'note') continue
    if (d > bestDeg) {
      bestDeg = d
      best = id
    }
  }
  return best
})

/** 锚点：优先焦点节点，否则用属性筛选命中的节点（多锚点），都没有则自动挑最高连接笔记 */
const seedIds = computed<string[]>(() => {
  if (focusId.value) return [focusId.value]
  if (hasPropertyFilter.value) return [...propertyIds.value]
  return autoSeedId.value ? [autoSeedId.value] : []
})

/** 深度档位是否可用：只要有可见笔记就能用（无锚点时自动选锚点兜底） */
const canDepth = computed(() => totalNodes.value > 0)

/** 是否有锚点（焦点节点，或属性筛选命中的节点）—— 没有锚点时深度无从展开 */
const hasAnchor = computed(() => seedIds.value.length > 0)

/** 深度是否生效：设了深度且有锚点 */
const depthActive = computed(() => depth.value > 0 && hasAnchor.value)

/** 从锚点 BFS，返回 depth 跳以内可达的节点；深度未生效时返回 null */
const depthIds = computed<Set<string> | null>(() => {
  if (!depthActive.value) return null
  const dist = new Map<string, number>()
  const queue: string[] = []
  for (const s of seedIds.value) {
    if (dist.has(s)) continue
    dist.set(s, 0)
    queue.push(s)
  }
  // 二分图里笔记之间隔着一个概念节点，1 层 = 2 跳
  const maxHops = depth.value * 2
  while (queue.length) {
    const cur = queue.shift()!
    const d = dist.get(cur)!
    if (d >= maxHops) continue
    for (const nb of adjacency.value.get(cur) ?? []) {
      if (dist.has(nb)) continue
      dist.set(nb, d + 1)
      queue.push(nb)
    }
  }
  return new Set(dist.keys())
})

/** 最终显示的节点 = (可见笔记 ∩ 深度范围) ∪ 仍挂着可见笔记的概念节点 */
const visibleNodeIds = computed<Set<string>>(() => {
  const limit = depthIds.value
  const out = new Set<string>()

  for (const id of propertyIds.value) {
    if (!limit || limit.has(id)) out.add(id)
  }
  // 焦点节点本身始终保留，否则设了焦点却把自己筛没了
  if (focusId.value) out.add(focusId.value)

  // 概念节点：有可见笔记连着就留下（深度限制时也要检查它自身在范围内）
  for (const id of conceptIds.value) {
    if (!limit || limit.has(id)) out.add(id)
  }
  return out
})

/** 可见的笔记数（用于右上角计数，不把标签 / 分类算进去） */
const visibleNoteCount = computed(() => {
  let n = 0
  for (const id of visibleNodeIds.value) {
    const node = data.value?.nodes.find((x) => x.id === id)
    if (node?.kind === 'note') n++
  }
  return n
})

const focusTitle = computed(() => {
  if (!focusId.value) return ''
  return data.value?.nodes.find((n) => n.id === focusId.value)?.title ?? ''
})

const resetFilters = (): void => {
  search.value = ''
  selectedTags.value = []
  selectedCats.value = []
  showWikilink.value = true
  showTagLinks.value = true
  showCategoryLinks.value = true
  depth.value = 0
  focusId.value = null
}

// ── 喂给 d3 的节点 / 边（基于过滤结果）──────────────────────
interface GraphNode extends SimulationNodeDatum {
  id: string
  title: string
  url: string
  kind: NodeKind
  count: number
  /** 连接数（无向），决定笔记节点大小 */
  inDegree: number
  /** 环形扇区布局给出的初始半径，用作径向锚定（力导向时不越出所属环带） */
  r0?: number
}
interface GraphLink extends SimulationLinkDatum<GraphNode> {
  type: EdgeKind
}

const nodes = computed<GraphNode[]>(() => {
  if (!data.value) return []
  const list: GraphNode[] = data.value.nodes
    .filter((n) => visibleNodeIds.value.has(n.id))
    .map((n) => ({
      id: n.id,
      title: n.title,
      url: n.url,
      kind: n.kind,
      count: n.count ?? 0,
      inDegree: 0,
    }))

  // 连接数必须在这里算好：之前放在 links 里累加，而 build() 是「先拷贝 nodes、
  // 再访问 links.value」，导致拷进 d3 的连接数恒为 0 —— 节点大小失去区分度。
  const ids = new Set(list.map((n) => n.id))
  const byId = new Map(list.map((n) => [n.id, n]))
  for (const e of data.value.edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) continue
    if (e.type === 'wikilink' && !showWikilink.value) continue
    if (e.type === 'tag' && !showTagLinks.value) continue
    if (e.type === 'category' && !showCategoryLinks.value) continue
    const s = byId.get(e.source)
    if (s) s.inDegree++
    const t = byId.get(e.target)
    if (t) t.inDegree++
  }
  return list
})

const links = computed<GraphLink[]>(() => {
  if (!data.value) return []
  const ids = new Set(nodes.value.map((n) => n.id))
  const out: GraphLink[] = []
  for (const e of data.value.edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) continue
    if (e.type === 'wikilink' && !showWikilink.value) continue
    if (e.type === 'tag' && !showTagLinks.value) continue
    if (e.type === 'category' && !showCategoryLinks.value) continue
    out.push({ source: e.source, target: e.target, type: e.type })
  }
  return out
})

const neighborsMap = computed<Map<string, Set<string>>>(() => {
  const m = new Map<string, Set<string>>()
  for (const n of nodes.value) m.set(n.id, new Set([n.id]))
  for (const e of links.value) {
    const s = (e.source as GraphNode).id ?? (e.source as unknown as string)
    const t = (e.target as GraphNode).id ?? (e.target as unknown as string)
    m.get(s)?.add(t)
    m.get(t)?.add(s)
  }
  return m
})

/** 标签最多显示多少个字符，超出截断为「……」（完整标题放 hover 提示） */
const LABEL_MAX = 14
/** 「枢纽」模式下，连接数达到多少才算枢纽节点、才显示标签（与说明文案「被关联 ≥3 次」一致） */
const HUB_IN_DEGREE = 3

function truncateLabel(title: string): string {
  const chars = [...title]
  return chars.length <= LABEL_MAX ? title : chars.slice(0, LABEL_MAX - 1).join('') + '…'
}

/** 标签显示模式：全部 / 仅枢纽 / 隐藏 */
const labelMode = ref<'all' | 'hub' | 'none'>('all')

const MAX_NODES_DEFAULT = 500
const maxNodes = computed(() => MAX_NODES_DEFAULT)
const tooHeavy = computed(() => nodes.value.length > maxNodes.value)

// ── d3 渲染（移植自 vitepress-allyouneed 的 VaultGraph，附过滤能力）──
const svgRef = ref<SVGSVGElement | null>(null)
let simulation: Simulation<GraphNode, GraphLink> | null = null
let resizeObserver: ResizeObserver | null = null
let zoomBehavior: ZoomBehavior<SVGSVGElement, unknown> | null = null
let fitTimer: ReturnType<typeof setTimeout> | null = null
let resizeRaf = 0
let rafId = 0
let lastW = 0
let lastH = 0
/** 当前参与布局的节点副本，供「复位视图」重新 fit 用（避免整图重排） */
let currentSimNodes: GraphNode[] = []
/** 上一轮的节点选择集，用于不改布局地更新样式类（焦点 / 标签显隐） */
let nodeSelRef: d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown> | null = null

/** 只更新样式类，不重跑力导向（避免切换标签模式时整图跳动）。
 *  直接从 DOM 重新选择，不依赖缓存的 nodeSelRef —— 后者可能在 destroy() 后失效。 */
function applyNodeClasses(): void {
  const svgEl = svgRef.value
  if (!svgEl) return
  const sel = d3.select(svgEl).selectAll<SVGGElement, GraphNode>('g.ayn-graph-node')
  sel
    .classed('is-focused', (d) => d.id === focusId.value)
    .classed(
      'is-label-hidden',
      (d) =>
        labelMode.value === 'none' ||
        (labelMode.value === 'hub' && (d.inDegree ?? 0) < HUB_IN_DEGREE),
    )
}

/**
 * 环形「扇区」初始布局。
 *
 * 纯力导向在这种二分归属图上必然把概念枢纽挤在中心、笔记连线从四面八方射向
 * 中心，交叉成一张网。这里改用业界常用的环形扇区：标签 / 分类（概念）占内环，
 * 它们的笔记按「归属」铺进各自扇区、扇区角度按笔记数分配 —— 这样绝大多数连线
 * 都留在本扇区内，交叉极少、层次一眼可读。函数只负责给出初始坐标，随后的力导向
 * 仅做轻度松弛（去重叠），不会破坏这个结构。
 */
function applyRadialSectorLayout(
  simNodes: GraphNode[],
  simLinks: GraphLink[],
  cx: number,
  cy: number,
  width: number,
  height: number,
): void {
  const simById = new Map(simNodes.map((n) => [n.id, n]))
  const noteList = simNodes.filter((n) => n.kind === 'note')
  const conceptList = simNodes.filter((n) => n.kind !== 'note')
  const TAU = Math.PI * 2

  const R = Math.max(Math.min(width, height) / 2, 140)
  const innerR = R * 0.40
  const outerR = R * 0.95
  // 起始角加一点随机，避免每次「重排」都一模一样
  const startAngle = -Math.PI / 2 + Math.random() * 0.6

  // 概念 → 归属它的笔记（只认「归属边」，正文互链不决定扇区归属）
  const conceptNotes = new Map<string, string[]>()
  for (const c of conceptList) conceptNotes.set(c.id, [])
  const noteConcepts = new Map<string, string[]>()
  for (const l of simLinks) {
    if (l.type === 'wikilink') continue
    const sn = simById.get(l.source as string)
    const tn = simById.get(l.target as string)
    if (!sn || !tn) continue
    const note = sn.kind === 'note' ? sn : tn
    const con = sn.kind === 'note' ? tn : sn
    if (!note || !con || note.kind !== 'note' || con.kind === 'note') continue
    conceptNotes.get(con.id)!.push(note.id)
    if (!noteConcepts.has(note.id)) noteConcepts.set(note.id, [])
    noteConcepts.get(note.id)!.push(con.id)
  }

  // 一篇笔记挂多个概念时，主归属取「规模最大」的那个（笔记排在最大扇区里最稳）
  const notePrimary = new Map<string, string>()
  for (const [nid, cons] of noteConcepts) {
    let best = cons[0]
    for (const c of cons) {
      const bc = simById.get(best)!
      const cc = simById.get(c)!
      if ((cc.count || 0) > (bc.count || 0)) best = c
    }
    notePrimary.set(nid, best)
  }

  // 按主归属把笔记分组成扇区；概念按扇区大小从大到小排（确定性，便于重排稳定）
  const sectorNotes = new Map<string, string[]>()
  for (const c of conceptList) sectorNotes.set(c.id, [])
  for (const [nid, cid] of notePrimary) sectorNotes.get(cid)?.push(nid)

  const orderedConcepts = [...conceptList].sort((a, b) => {
    const na = sectorNotes.get(a.id)?.length ?? 0
    const nb = sectorNotes.get(b.id)?.length ?? 0
    return nb - na || b.count - a.count || a.id.localeCompare(b.id)
  })

  const totalNotes = noteList.length || 1
  let angle = startAngle
  let usedArc = 0
  for (const c of orderedConcepts) {
    const ns = sectorNotes.get(c.id) ?? []
    if (ns.length === 0) continue // 无笔记的概念最后单独安置
    const sector = (ns.length / totalNotes) * TAU
    const centerA = angle + sector / 2
    c.x = cx + Math.cos(centerA) * innerR
    c.y = cy + Math.sin(centerA) * innerR
    // 笔记沿半径由内向外铺满扇区（不用单环，避免外环拥挤重叠）
    ns.forEach((nid, i) => {
      const n = simById.get(nid)!
      const frac = (i + 0.5) / ns.length
      const r = innerR + (outerR - innerR) * Math.pow(frac, 0.75)
      const a = angle + sector * (frac - 0.5) * 0.9 + (Math.random() - 0.5) * 0.03
      n.x = cx + Math.cos(a) * r
      n.y = cy + Math.sin(a) * r
    })
    angle += sector
    usedArc += sector
  }

  // 剩余空隙：安置「无归属」的笔记（只有正文互链）和「无笔记」的概念
  const leftoverArc = Math.max(TAU - usedArc, 0.001)
  const orphans = noteList.filter((n) => !notePrimary.has(n.id))
  const emptyConcepts = orderedConcepts.filter(
    (c) => (sectorNotes.get(c.id)?.length ?? 0) === 0,
  )
  const slots = orphans.length + emptyConcepts.length
  if (slots > 0) {
    const step = leftoverArc / slots
    let k = 0
    for (const n of orphans) {
      const a = angle + step * (k + 0.5)
      const r = outerR * (0.72 + 0.26 * Math.random())
      n.x = cx + Math.cos(a) * r
      n.y = cy + Math.sin(a) * r
      k++
    }
    for (const c of emptyConcepts) {
      const a = angle + step * (k + 0.5)
      c.x = cx + Math.cos(a) * innerR
      c.y = cy + Math.sin(a) * innerR
      k++
    }
  }

  // 记录初始半径 + 清零速度，供径向锚定与稳定起始使用
  for (const n of simNodes) {
    if (n.x === undefined || n.y === undefined) {
      const a = Math.random() * TAU
      const r = innerR + Math.random() * (outerR - innerR)
      n.x = cx + Math.cos(a) * r
      n.y = cy + Math.sin(a) * r
    }
    n.r0 = Math.hypot((n.x ?? cx) - cx, (n.y ?? cy) - cy)
    n.vx = 0
    n.vy = 0
  }
}

function build(): void {
  const svgEl = svgRef.value
  if (!svgEl || !data.value) return
  if (tooHeavy.value) return

  simulation?.stop()
  if (fitTimer !== null) {
    clearTimeout(fitTimer)
    fitTimer = null
  }
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }

  const simNodes: GraphNode[] = nodes.value.map((n) => ({ ...n }))
  currentSimNodes = simNodes
  const simLinks: GraphLink[] = links.value.map((l) => ({
    source: (l.source as GraphNode).id ?? (l.source as unknown as string),
    target: (l.target as GraphNode).id ?? (l.target as unknown as string),
    type: l.type,
  }))

  const svg = d3.select(svgEl)
  svg.selectAll('*').remove()

  const rect = svgEl.getBoundingClientRect()
  const width = Math.max(rect.width, 320)
  const height = Math.max(rect.height, 320)
  svg.attr('viewBox', `0 0 ${width} ${height}`)

  const g = svg.append('g').attr('class', 'ayn-graph-zoom-group')

  const linkSel = g
    .append('g')
    .attr('class', 'ayn-graph-edges')
    .selectAll<SVGLineElement, GraphLink>('line')
    .data(simLinks)
    .join('line')
    .attr('class', (d) =>
      d.type === 'category'
        ? 'ayn-graph-edge ayn-graph-edge--category'
        : d.type === 'tag'
          ? 'ayn-graph-edge ayn-graph-edge--tag'
          : 'ayn-graph-edge',
    )

  // hover 提示：这条边代表什么关系
  linkSel
    .append('title')
    .text((d) =>
      d.type === 'tag'
        ? t('属于该标签', 'Belongs to tag')
        : d.type === 'category'
          ? t('属于该分类', 'Belongs to category')
          : t('正文链接', 'Wiki link'),
    )

  const nodeSel = g
    .append('g')
    .attr('class', 'ayn-graph-nodes')
    .selectAll<SVGGElement, GraphNode>('g')
    .data(simNodes, (d) => d.id)
    .join('g')
    .attr('class', (d) =>
      d.kind === 'note' ? 'ayn-graph-node' : `ayn-graph-node is-${d.kind}`,
    )

  // 笔记按连接数定大小；标签 / 分类按它底下挂了多少篇笔记定大小（天然是 hub）
  const nodeR = (d: GraphNode): number =>
    d.kind === 'note' ? 4 + Math.min(d.inDegree, 8) : 6 + Math.min(d.count, 14)
  nodeSel.append('circle').attr('class', 'ayn-graph-hit').attr('r', (d) => Math.max(nodeR(d) + 8, 12))
  nodeSel.append('circle').attr('class', 'ayn-graph-dot').attr('r', nodeR)
  nodeSel
    .append('text')
    .attr('class', 'ayn-graph-label')
    .attr('dy', (d) => nodeR(d) + 11)
    .attr('text-anchor', 'middle')
    .text((d) => truncateLabel(d.title))

  // 完整标题放 hover 提示（标签已截断，靠这个看全名）
  nodeSel.append('title').text((d) =>
    d.kind === 'note' ? d.title : `${d.kind === 'tag' ? '标签' : '分类'}：${d.title}（${d.count} 篇）`,
  )

  nodeSelRef = nodeSel
  applyNodeClasses()

  let dragMoved = false
  nodeSel
    // 单击 = 设为焦点（作为深度的锚点）；双击 = 打开文章
    .on('click', (evt: PointerEvent, d) => {
      if (dragMoved) return
      evt.stopPropagation()
      // 概念节点：点击 = 按它筛选；笔记节点：点击 = 设为焦点（深度锚点）
      if (d.kind === 'tag') toggleTag(d.title)
      else if (d.kind === 'category') toggleCat(d.title)
      else focusId.value = d.id
    })
    .on('dblclick', (evt: PointerEvent, d) => {
      evt.stopPropagation()
      if (d.kind !== 'note') return
      const href = withBase(d.url)
      try {
        router.go(href)
      } catch {
        if (typeof window !== 'undefined') window.location.href = href
      }
    })
    .on('mouseenter', (_evt, d) => applyFocus(d.id, nodeSel, linkSel))
    .on('mouseleave', () => clearFocus(nodeSel, linkSel))
    .call(
      d3drag<SVGGElement, GraphNode>()
        // clickDistance：允许鼠标按下到松开之间最多 8px 的位移仍被当作「单击」，
        // 否则默认 0px 会让任何微小移动被判定为拖拽，导致单击设置焦点的逻辑被跳过、
        // 深度锚点永远设不上（表现为「深度档位没区别」）。
        .clickDistance(8)
        .on('start', (_event, d) => {
          dragMoved = false
          if (!_event.active) simulation?.alphaTarget(0.3).restart()
          kickRender()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          dragMoved = true
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation?.alphaTarget(0)
          d.fx = null
          d.fy = null
        }),
    )

  const LABEL_FULL = 1.1
  const LABEL_FADE_START = 0.55
  const labelSel = g.selectAll<SVGTextElement, GraphNode>('text.ayn-graph-label')
  const applyLabelZoom = (k: number): void => {
    let t: number
    if (k >= LABEL_FULL) t = 1
    else if (k <= LABEL_FADE_START) t = 0
    else {
      const x = (k - LABEL_FADE_START) / (LABEL_FULL - LABEL_FADE_START)
      t = x * x * (3 - 2 * x)
    }
    g.style('--ayn-label-zoom', t.toFixed(3))
    if (t < 0.05) labelSel.style('pointer-events', 'none')
    else labelSel.style('pointer-events', null)
  }

  zoomBehavior = d3zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.15, 6])
    .wheelDelta((event) => -event.deltaY * (event.deltaMode === 1 ? 0.025 : 0.0015))
    .on('zoom', (event) => {
      const k = event.transform.k as number
      g.attr('transform', event.transform.toString())
      applyLabelZoom(k)
    })
  svg.call(zoomBehavior).call(zoomBehavior.transform, zoomIdentity)
  applyLabelZoom(1)

  const N = simNodes.length
  const isHeavy = N > 200
  const isVeryHeavy = N > 500
  const collideR = isVeryHeavy ? 8 : isHeavy ? 12 : 15
  const cx0 = width / 2
  const cy0 = height / 2

  // 环形扇区初始布局：先把节点摆到「概念内环 + 笔记按归属铺扇区」的结构上，
  // 随后的力导向只做轻度松弛（去重叠、微调），不会把结构重新搅乱。
  applyRadialSectorLayout(simNodes, simLinks, cx0, cy0, width, height)

  // 更丝滑：alphaDecay 更小（收敛更慢、位移更连贯），velocityDecay 略高（阻尼更强、少抖动）
  simulation = forceSimulation<GraphNode>(simNodes)
    .alphaDecay(isVeryHeavy ? 0.03 : isHeavy ? 0.028 : 0.024)
    .alphaMin(0.001)
    .velocityDecay(isVeryHeavy ? 0.5 : isHeavy ? 0.48 : 0.45)
    .force(
      'link',
      forceLink<GraphNode, GraphLink>(simLinks)
        .id((d) => d.id)
        // 归属边保持较短（笔记就在所属概念的扇区里）；正文真实链接可以长一点
        .distance((l) => (l.type === 'wikilink' ? 90 : 60))
        // 归属边很弱（只做轻微吸附），避免把笔记从扇区结构里拽走
        .strength((l) => (l.type === 'wikilink' ? 0.25 : 0.06)),
    )
    .force(
      'charge',
      forceManyBody()
        // 斥力温和：只负责分开重叠的节点，不制造放射状交叉
        .strength(isVeryHeavy ? -40 : isHeavy ? -50 : -60)
        .distanceMax(isHeavy ? 300 : 420)
        .theta(0.9),
    )
    // 径向锚定：把每个节点拉回它所属的环带半径，防止力导向把结构拉塌
    .force(
      'radial',
      forceRadial<GraphNode>((d) => d.r0 ?? 0, cx0, cy0).strength(
        isVeryHeavy ? 0.3 : 0.45,
      ),
    )
    .force(
      'collide',
      forceCollide<GraphNode>()
        .radius((d) => collideR + Math.min(d.inDegree, 6) * 0.6)
        .strength(0.9)
        .iterations(isVeryHeavy ? 1 : 3),
    )

  let dirty = false
  const paint = (): void => {
    linkSel
      .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
      .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
      .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
      .attr('y2', (d) => (d.target as GraphNode).y ?? 0)
    nodeSel.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
  }
  const frame = (): void => {
    if (simulation === null) {
      rafId = 0
      return
    }
    if (dirty) {
      dirty = false
      paint()
    }
    rafId = requestAnimationFrame(frame)
  }
  const kickRender = (): void => {
    if (!rafId) rafId = requestAnimationFrame(frame)
  }
  simulation
    .on('tick', () => {
      dirty = true
    })
    .on('end', () => {
      paint()
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = 0
      }
      fitToView(svg, simNodes, width, height)
    })
  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(frame)

  fitTimer = setTimeout(() => {
    fitTimer = null
    fitToView(svg, simNodes, width, height)
  }, 2000)
}

function fitToView(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  simNodes: GraphNode[],
  width: number,
  height: number,
  animate = true,
): void {
  if (!zoomBehavior || simNodes.length === 0) return
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const n of simNodes) {
    const x = n.x ?? 0
    const y = n.y ?? 0
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  const padding = 60
  const w = maxX - minX + padding * 2
  const h = maxY - minY + padding * 2
  if (w <= 0 || h <= 0) return
  const scale = Math.min(width / w, height / h, 1.5)
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const tx = width / 2 - cx * scale
  const ty = height / 2 - cy * scale
  const t = zoomIdentity.translate(tx, ty).scale(scale)
  if (!animate) {
    // resize 拖拽过程中用：直接落位，避免连续 700ms 动画堆积
    svg.call(zoomBehavior.transform, t)
    return
  }
  // 适配动画拉长 + 缓动，观感更顺（原来是 450ms 线性）
  svg
    .transition()
    .duration(700)
    .ease((k) => 1 - Math.pow(1 - k, 3))
    .call(zoomBehavior.transform, t)
}

/**
 * 容器尺寸变化（窗口缩放 / 全屏切换）时只「重新适配视图」：
 * 更新 viewBox 并重新 fit，保留当前节点位置。
 * 刻意不调 build()——build() 会重跑环形扇区初始布局（含随机起始角），
 * 会让整张图在每次缩放时重新洗牌。
 */
function refitView(): void {
  const svgEl = svgRef.value
  if (!svgEl || currentSimNodes.length === 0) return
  const rect = svgEl.getBoundingClientRect()
  const width = Math.max(rect.width, 320)
  const height = Math.max(rect.height, 320)
  const svg = d3.select(svgEl)
  svg.attr('viewBox', `0 0 ${width} ${height}`)
  fitToView(svg, currentSimNodes, width, height, false)
}

/**
 * 挂载尺寸观察器。
 * 注意：<svg> 在 loading 结束、v-else 分支渲染后才存在，onMounted 时 svgRef 仍为
 * null，所以必须等 svgRef 真正有值再挂（见下面的 watch(svgRef)），否则观察器永远装不上。
 */
function setupResizeObserver(): void {
  const el = svgRef.value
  if (!el || resizeObserver) return
  if (typeof ResizeObserver === 'undefined') return
  const rect = el.getBoundingClientRect()
  lastW = rect.width
  lastH = rect.height
  resizeObserver = new ResizeObserver((entries) => {
    const cr = entries[0]?.contentRect
    if (!cr) return
    // 尺寸没变就跳过，避免重复触发 700ms 的 fit 动画
    if (Math.abs(cr.width - lastW) < 1 && Math.abs(cr.height - lastH) < 1) return
    lastW = cr.width
    lastH = cr.height
    if (resizeRaf) cancelAnimationFrame(resizeRaf)
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0
      refitView()
    })
  })
  resizeObserver.observe(el)
}

function applyFocus(
  hoveredId: string,
  nodeSel: d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown>,
  linkSel: d3.Selection<SVGLineElement, GraphLink, SVGGElement, unknown>,
): void {
  const neighbors = neighborsMap.value.get(hoveredId) ?? new Set([hoveredId])
  nodeSel
    .classed('is-active', (n) => n.id === hoveredId)
    .classed('is-related', (n) => n.id !== hoveredId && neighbors.has(n.id))
    .classed('is-dimmed', (n) => !neighbors.has(n.id))
  linkSel.classed('is-dimmed', (e) => {
    const s = (e.source as GraphNode).id ?? (e.source as unknown as string)
    const t = (e.target as GraphNode).id ?? (e.target as unknown as string)
    return !(s === hoveredId || t === hoveredId)
  })
}

function clearFocus(
  nodeSel: d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown>,
  linkSel: d3.Selection<SVGLineElement, GraphLink, SVGGElement, unknown>,
): void {
  nodeSel.classed('is-active', false).classed('is-related', false).classed('is-dimmed', false)
  linkSel.classed('is-dimmed', false)
}

function destroy(): void {
  simulation?.stop()
  simulation = null
  zoomBehavior = null
  if (fitTimer !== null) {
    clearTimeout(fitTimer)
    fitTimer = null
  }
  if (resizeRaf) {
    cancelAnimationFrame(resizeRaf)
    resizeRaf = 0
  }
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
  if (svgRef.value) d3.select(svgRef.value).selectAll('*').remove()
}

function toggleTag(t: string): void {
  const i = selectedTags.value.indexOf(t)
  const next = [...selectedTags.value]
  if (i >= 0) next.splice(i, 1)
  else next.push(t)
  selectedTags.value = next
}
function toggleCat(c: string): void {
  const i = selectedCats.value.indexOf(c)
  const next = [...selectedCats.value]
  if (i >= 0) next.splice(i, 1)
  else next.push(c)
  selectedCats.value = next
}

// ── 画布工具条 ────────────────────────────────────────────
const canvasRef = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)

/** 全屏 / 退出全屏（浏览器 Fullscreen API，库本身不提供） */
function toggleFullscreen(): void {
  const el = canvasRef.value
  if (!el || typeof document === 'undefined') return
  if (document.fullscreenElement) void document.exitFullscreen()
  else void el.requestFullscreen?.()
}

function onFullscreenChange(): void {
  isFullscreen.value =
    typeof document !== 'undefined' && !!document.fullscreenElement
}

/** 重排：重新跑一遍力导向布局 */
function relayout(): void {
  if (!data.value) return
  destroy()
  nextTick(() => build())
}

/** 复位视图：只把缩放/平移拉回「整图适配」，不动节点位置 */
function resetView(): void {
  const svgEl = svgRef.value
  if (!svgEl || !zoomBehavior || currentSimNodes.length === 0) return
  const rect = svgEl.getBoundingClientRect()
  fitToView(
    d3.select(svgEl),
    currentSimNodes,
    Math.max(rect.width, 320),
    Math.max(rect.height, 320),
  )
}

onMounted(() => {
  load()
  if (typeof window !== 'undefined') window.addEventListener('keydown', onKeydown)
  if (typeof document !== 'undefined') {
    document.addEventListener('fullscreenchange', onFullscreenChange)
  }
})

onBeforeUnmount(() => {
  destroy()
  if (typeof window !== 'undefined') window.removeEventListener('keydown', onKeydown)
  if (typeof document !== 'undefined') {
    document.removeEventListener('fullscreenchange', onFullscreenChange)
  }
  resizeObserver?.disconnect()
  resizeObserver = null
})

// <svg> 是 v-else 分支渲染的，loading 结束前不存在 → 等它真正挂上再装尺寸观察器
watch(svgRef, () => setupResizeObserver())

// 数据加载完成 → 首次构建
watch(
  () => data.value,
  (d) => {
    if (!d) return
    destroy()
    nextTick(() => build())
  },
  { flush: 'post' },
)

// 属性 / 边类型 / 深度变化 → 重建（filtered 子集重新布局）
watch(
  [search, selectedTags, selectedCats, showWikilink, showTagLinks, showCategoryLinks, depth, focusId],
  () => {
    if (!data.value) return
    destroy()
    nextTick(() => build())
  },
  { flush: 'post' },
)

// 标签显示模式：只切样式类，不重跑布局，避免整图跳动
watch(
  labelMode,
  () => {
    nextTick(applyNodeClasses)
  },
  { flush: 'post' },
)
</script>

<template>
  <div class="gv">
    <div v-if="loading" class="gv-loading">{{ t('加载中…', 'Loading…') }}</div>
    <div v-else-if="error" class="gv-error">{{ t('图谱数据加载失败：', 'Graph data failed to load: ') }}{{ error }}</div>
    <div v-else-if="tooHeavy" class="gv-empty">
      {{ t('当前筛选下仍有', 'Current filter still has') }} {{ nodes.length }} {{ t('个节点（上限', 'nodes (limit') }} {{ maxNodes }}{{ t('），请继续增加筛选条件。', '). Please add more filters.') }}
    </div>
    <div v-else class="gv-body">
      <!-- 左侧：过滤面板（独立滚动，不再占用画布的纵向空间） -->
      <aside class="gv-panel">
        <input v-model="search" type="search" class="gv-search" :placeholder="t('🔍 搜索标题…', '🔍 Search titles…')" />

        <div class="gv-toggles">
          <label class="gv-toggle"><input v-model="showWikilink" type="checkbox" /> {{ t('正文链接', 'Wiki links') }}</label>
          <label class="gv-toggle"><input v-model="showTagLinks" type="checkbox" /> {{ t('标签归属', 'Tag links') }}</label>
          <label class="gv-toggle"><input v-model="showCategoryLinks" type="checkbox" /> {{ t('分类归属', 'Category links') }}</label>
        </div>

        <div class="gv-actions">
          <button class="gv-reset" type="button" @click="resetFilters">{{ t('重置', 'Reset') }}</button>
          <button class="gv-help" type="button" @click="showHelp = true">{{ t('说明', 'Help') }}</button>
          <span class="gv-count">{{ visibleNoteCount }} / {{ totalNodes }} {{ t('篇', 'posts') }}</span>
        </div>

        <!-- 深度：从「焦点节点」或「当前筛选命中的节点」向外展开 N 跳（无锚点时自动选最高连接笔记兜底） -->
        <div class="gv-field">
          <div class="gv-field-head">
            <span class="gv-field-label">{{ t('深度', 'Depth') }}</span>
            <span
              class="gv-info"
              tabindex="0"
              :title="t('深度围绕一个锚点展开：优先用你点击选中的焦点节点，其次是搜索 / 标签 / 分类命中的笔记；都没有时自动以连接数最高的笔记为起点', 'Depth expands from an anchor: your clicked focus node first, then notes matched by search / tag / category; if none, the highest-degree note is used as the start.')"
            >
              <span class="gv-info-icon">ⓘ</span>
              <span class="gv-info-tip">
                {{ t('深度围绕一个锚点展开：优先用你点击选中的焦点节点，其次是搜索 / 标签 / 分类命中的笔记；都没有时自动以连接数最高的笔记为起点', 'Depth expands from an anchor: your clicked focus node first, then notes matched by search / tag / category; if none, the highest-degree note is used as the start.') }}
              </span>
            </span>
          </div>
          <div class="gv-seg">
            <button
              v-for="d in [0, 1, 2, 3]"
              :key="d"
              type="button"
              class="gv-seg-btn"
              :class="{ active: depth === d }"
              :disabled="d > 0 && !canDepth"
              :title="d > 0 && !canDepth ? t('需要图谱中存在笔记节点', 'Graph must contain note nodes') : ''"
              @click="depth = d"
            >
              {{ d === 0 ? t('不限', 'All') : d }}
            </button>
          </div>
        </div>

        <!-- 标签显示：标题普遍很长（中位 24 字），可截断或只留枢纽节点 -->
        <div class="gv-field">
          <span class="gv-field-label">{{ t('标签', 'Labels') }}</span>
          <div class="gv-seg">
            <button
              v-for="m in (['all', 'hub', 'none'] as const)"
              :key="m"
              type="button"
              class="gv-seg-btn"
              :class="{ active: labelMode === m }"
              @click="labelMode = m"
            >
              {{ m === 'all' ? t('全部', 'All') : m === 'hub' ? t('枢纽', 'Hub') : t('隐藏', 'Hidden') }}
            </button>
          </div>
        </div>

        <div v-if="focusId" class="gv-focus">
          <span class="gv-focus-label">{{ t('焦点', 'Focus') }}</span>
          <span class="gv-focus-title" :title="focusTitle">{{ focusTitle }}</span>
          <button class="gv-focus-clear" type="button" aria-label="清除焦点" @click="focusId = null">
            ×
          </button>
        </div>

        <div v-if="allTags.length || allCats.length" class="gv-filters">
          <details class="gv-group" open>
            <summary>{{ t('标签', 'Tags') }}（{{ t('已选', 'selected') }} {{ selectedTags.length }} / {{ t('共', 'of') }} {{ allTags.length }}）</summary>
            <div class="gv-chips">
              <button
                v-for="tg in allTags"
                :key="tg.t"
                type="button"
                class="gv-chip"
                :class="{ active: selectedTags.includes(tg.t) }"
                @click="toggleTag(tg.t)"
              >
                {{ tg.t }}<i>{{ tg.c }}</i>
              </button>
            </div>
          </details>
          <details v-if="allCats.length" class="gv-group">
            <summary>{{ t('分类', 'Categories') }}（{{ t('已选', 'selected') }} {{ selectedCats.length }} / {{ t('共', 'of') }} {{ allCats.length }}）</summary>
            <div class="gv-chips">
              <button
                v-for="cg in allCats"
                :key="cg.c"
                type="button"
                class="gv-chip gv-chip--cat"
                :class="{ active: selectedCats.includes(cg.c) }"
                @click="toggleCat(cg.c)"
              >
                {{ cg.c }}<i>{{ cg.n }}</i>
              </button>
            </div>
          </details>
        </div>
      </aside>

      <!-- 右侧：图谱画布 -->
      <div ref="canvasRef" class="gv-canvas">
        <div class="gv-canvas-tools">
          <button class="gv-tool" type="button" :title="t('重排布局', 'Relayout')" @click="relayout">{{ t('重排', 'Relayout') }}</button>
          <button class="gv-tool" type="button" :title="t('复位视图', 'Reset view')" @click="resetView">{{ t('复位', 'Reset') }}</button>
          <button class="gv-tool" type="button" :title="t('全屏 / 退出全屏', 'Fullscreen / exit fullscreen')" @click="toggleFullscreen">
            {{ isFullscreen ? t('退出全屏', 'Exit fullscreen') : t('全屏', 'Fullscreen') }}
          </button>
        </div>
        <div class="ayn-graph-container">
          <svg ref="svgRef" class="ayn-graph-svg" />
        </div>
      </div>
    </div>

    <!-- 说明弹窗：原页面下方的说明文字收在这里，点遮罩 / 关闭 / Esc 均可关闭 -->
    <div
      v-if="showHelp"
      class="gv-modal"
      role="dialog"
      aria-modal="true"
      :aria-label="t('图谱说明', 'Graph help')"
      @click.self="showHelp = false"
    >
      <div class="gv-modal-box">
        <div class="gv-modal-head">
          <h3 class="gv-modal-title">{{ t('图谱说明', 'Graph help') }}</h3>
          <button class="gv-modal-close" type="button" aria-label="关闭" @click="showHelp = false">
            ×
          </button>
        </div>

        <div class="gv-modal-body">
          <p class="gv-modal-lead">
            🕸️ <b>{{ t('关系图谱', 'Relationship graph') }}</b>：{{ t('左侧面板按', 'Filter on the left by') }}<b>{{ t('搜索 / 标签 / 分类', 'search / tag / category') }}</b>{{ t('筛选，右侧是图谱画布。', ', the canvas is on the right.') }}
          </p>

          <h4>🔎 {{ t('过滤', 'Filter') }}</h4>
          <ul>
            <li><b>{{ t('搜索框', 'Search box') }}</b>：{{ t('按标题实时模糊匹配，只保留命中的文章。', 'Real-time fuzzy match on titles; only matched articles remain.') }}</li>
            <li><b>{{ t('标签', 'Tags') }}</b>：{{ t('点选标签 chip（括号里是该标签下的文章数）。同时选多个是「或」关系 —— 只要文章带其中任意一个标签就留下。', 'Click a tag chip (the number in parentheses is its article count). Selecting several is an OR relationship — an article stays if it has any of the chosen tags.') }}</li>
            <li><b>{{ t('分类', 'Categories') }}</b>：{{ t('同上，按', 'Same as above, filtered by') }} <code>category</code> / <code>categories</code> {{ t('过滤。', '.') }}</li>
            <li><b>{{ t('边类型开关', 'Edge-type toggles') }}</b>：<code>{{ t('真实链接', 'Real links') }}</code>（{{ t('正文里的站内链接，实线', 'in-body internal links, solid') }}）、<code>{{ t('标签/分类关联', 'tag/category links') }}</code>（{{ t('虚线', 'dashed') }}）{{ t('可分别隐藏。', 'can be hidden independently.') }}</li>
            <li><b>{{ t('重置', 'Reset') }}</b>：{{ t('一键清空所有筛选条件。', 'Clears all filters in one click.') }}</li>
          </ul>
          <p>{{ t('筛选后图谱会对「留下的这部分」重新跑力导向布局，右侧实时显示', 'After filtering, the graph re-runs the force layout on the remaining subset, and the right side shows live') }} <code>{{ t('当前篇数 / 总篇数', 'current / total') }}</code>。</p>

          <h4>🏷️ {{ t('标签显示', 'Label display') }}</h4>
          <ul>
            <li>{{ t('标题普遍很长（中位 24 字、最长 58 字），所以标签默认', 'Titles are often long (median 24, max 58 chars), so labels are by default') }}<b>{{ t('截断到 14 字', 'truncated to 14 chars') }}</b>{{ t('，鼠标悬停节点会显示完整标题。', '; hovering a node shows the full title.') }}</li>
            <li><b>{{ t('全部', 'All') }}</b>：{{ t('所有节点都显示（截断后）。', 'Show all nodes (truncated).') }}</li>
            <li><b>{{ t('枢纽', 'Hub') }}</b>：{{ t('只给「被关联 ≥3 次」的节点显示，画面最干净。', 'Show labels only for nodes linked ≥3 times — cleanest view.') }}</li>
            <li><b>{{ t('隐藏', 'Hidden') }}</b>：{{ t('完全不显示标签，只看点与线（悬停仍可看到标题）。', 'Hide all labels; dots and lines only (hover still shows titles).') }}</li>
          </ul>

          <h4>🎯 {{ t('深度', 'Depth') }}</h4>
          <ul>
            <li>{{ t('按「层」展开：笔记之间必然隔着一个概念节点（笔记 → 标签 → 笔记），所以', 'Expands by "hops": notes are always separated by a concept node (note → tag → note), so') }} <b>1 {{ t('层', 'hop') }} = {{ t('共享标签 / 分类的笔记', 'notes sharing a tag / category') }}</b>{{ t('，2 层再往外扩一圈。选「不限」则忽略深度。', ', 2 hops goes one ring further. "All" ignores depth.') }}</li>
            <li><b>{{ t('锚点', 'Anchor') }}</b>{{ t('优先用', 'prefers the') }}<b>{{ t('焦点节点', 'focus node') }}</b>（{{ t('单击笔记设定', 'set by clicking a note') }}）；{{ t('没有焦点时，用当前搜索 / 标签 / 分类命中的', 'with no focus, uses all notes matched by the current search / tag / category as') }}<b>{{ t('所有笔记', 'multiple anchors') }}</b>{{ t('作为多锚点；两者都没有时，自动以', '; if none of those exist, it automatically starts from the') }}<b>{{ t('连接数最高的笔记', 'highest-degree note') }}</b>{{ t('为起点，保证深度档位一定能看到变化。', ', so the depth control always has a visible effect.') }}</li>
            <li>{{ t('焦点笔记会在图上描边标出，面板底部显示它的标题，点', 'The focus note is outlined on the graph and its title is shown at the bottom of the panel; click') }} <code>×</code> {{ t('可清除。', 'to clear it.') }}</li>
          </ul>

          <h4>🖱️ {{ t('操作方式', 'Interactions') }}</h4>
          <ul>
            <li><b>{{ t('滚轮 / 触控板', 'Wheel / trackpad') }}</b>：{{ t('缩放（放大后节点标题会逐渐浮现，和 Obsidian 一致）', 'Zoom (node titles fade in as you zoom in, like Obsidian)') }}</li>
            <li><b>{{ t('按住拖拽', 'Drag') }}</b>：{{ t('平移画布；拖动单个节点可调整布局', 'Pan the canvas; drag a single node to adjust the layout') }}</li>
            <li><b>{{ t('悬停节点', 'Hover a node') }}</b>：{{ t('高亮该节点与它的邻居，其余淡出', 'Highlights it and its neighbors, fading the rest') }}</li>
            <li><b>{{ t('单击笔记节点', 'Click a note node') }}</b>：{{ t('设为焦点（深度的锚点）', 'Sets it as the focus (depth anchor)') }}</li>
            <li><b>{{ t('双击笔记节点', 'Double-click a note node') }}</b>：{{ t('打开对应文章', 'Opens the article') }}</li>
            <li><b>{{ t('单击标签 / 分类节点', 'Click a tag / category node') }}</b>：{{ t('按它筛选（再点一次取消）', 'Filters by it (click again to cancel)') }}</li>
            <li><b>{{ t('双击空白处', 'Double-click empty space') }}</b>：{{ t('复位视图', 'Resets the view') }}</li>
            <li><b>{{ t('画布右上工具条', 'Top-right toolbar') }}</b>：{{ t('重排布局 / 复位视图 / 全屏切换', 'Relayout / Reset view / Fullscreen') }}</li>
          </ul>

          <h4>📖 {{ t('图谱怎么读（二分图）', 'How to read the graph (bipartite)') }}</h4>
          <p>
            {{ t('这是', 'This is a') }}<b>{{ t('笔记 + 概念', 'note + concept') }}</b>{{ t('的二分图：笔记之间不直接互连，而是通过它们', 'bipartite graph: notes are not linked directly, but related through the') }}<b>{{ t('共同所属的标签 / 分类', 'tags / categories they share') }}</b>{{ t('发生关系。', ' they belong to.') }}
            {{ t('之前是「共享标签就连线」，k 篇共标签会炸出 k(k−1)/2 条边（如「DDIA」20 篇 → 190 条），只能靠一堆阈值硬压；现在标签 / 分类本身就是节点，中心点回归概念，团爆炸自然消失。', 'Previously "shared tag = edge" blew up into k(k−1)/2 edges for k co-tagged notes (e.g. 20 notes → 190 edges) and needed lots of thresholds to suppress; now tags / categories are nodes themselves, the hub returns to concepts, and clique explosions vanish naturally.') }}
          </p>
          <ul>
            <li><b>{{ t('实心小圆', 'Small filled circle') }}</b>：{{ t('一篇笔记，大小 = 连接数。', 'A note; size = degree.') }}</li>
            <li><b>{{ t('实心大圆（brand 色）', 'Large filled circle (brand color)') }}</b>：<b>{{ t('标签', 'tag') }}</b>{{ t('节点，大小 = 该标签下的笔记数。', ' node; size = number of notes under it.') }}</li>
            <li><b>{{ t('空心大圆（粗边）', 'Large hollow circle (thick border)') }}</b>：<b>{{ t('分类', 'category') }}</b>{{ t('节点，大小 = 该分类下的笔记数。', ' node; size = number of notes under it.') }}</li>
            <li>{{ t('只收录被', 'Only tags used by') }} <b>≥3 {{ t('篇', 'notes') }}</b>{{ t('笔记使用的标签、被', ' and categories used by') }} <b>≥2 {{ t('篇', 'notes') }}</b>{{ t('使用的分类 —— 长尾里 179 个标签只用了一次，当节点没有意义。', ' are kept — in the long tail 179 tags are used only once and are not worth showing as nodes.') }}</li>
          </ul>

          <div class="gv-legend">
            <span class="gv-legend-item"><i class="gv-legend-line"></i>{{ t('正文链接', 'Wiki link') }}</span>
            <span class="gv-legend-item">
              <i class="gv-legend-line gv-legend-line--tag"></i>{{ t('标签归属', 'Tag link') }}
            </span>
            <span class="gv-legend-item">
              <i class="gv-legend-line gv-legend-line--category"></i>{{ t('分类归属', 'Category link') }}
            </span>
          </div>

          <h4>⚙️ {{ t('数据从哪来', 'Where the data comes from') }}</h4>
          <p>
            {{ t('图谱不是手工维护的，而是在启动 / 构建时由', 'The graph is not hand-maintained; at startup / build time') }} <code>docs/.vitepress/graph-generator.ts</code>
            {{ t('扫描', 'scans all Markdown under') }} <code>docs/</code> {{ t('下所有 Markdown 自动生成，写入', 'and generates the data, writing it to') }}
            <code>{{ props.dataFile ?? 'vault-data.json' }}</code>{{ t('，页面加载时读取。', ', which is read when the page loads.') }}
          </p>
          <ul>
            <li><b>{{ t('节点', 'Nodes') }}</b> = {{ t('内容页（自动排除首页、归档、分类 / 标签索引等派生页面）', 'content pages (derived pages like home, archives, category / tag indexes are auto-excluded)') }}</li>
            <li><b>{{ t('边', 'Edges') }}</b> = {{ t('正文中的站内链接（含 Obsidian 双链', 'in-body internal links (including Obsidian') }} <code>[[...]]</code>{{ t('）+ 共享标签 / 同分类关联', ') + shared-tag / same-category associations') }}</li>
            <li><b>{{ t('标题 / 标签 / 分类', 'Title / tags / category') }}</b> {{ t('取自各页 frontmatter 的', 'come from each page\'s frontmatter') }} <code>title</code> / <code>tags</code> / <code>category(categories)</code></li>
          </ul>
          <p>{{ t('新增文章只要带上', 'Any new article that carries a') }} <code>tags</code> {{ t('或', 'or') }} <code>category</code>{{ t('，图谱会自动把它接进来，无需改动任何配置。', ' is automatically wired into the graph — no config change needed.') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.gv {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.gv-loading,
.gv-error,
.gv-empty {
  padding: 40px 0;
  text-align: center;
  color: var(--vp-c-text-2);
}
.gv-error {
  color: var(--vp-c-danger-1);
}

/* 横向主布局：左侧过滤面板 + 右侧画布 */
.gv-body {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.gv-panel {
  flex: 0 0 236px;
  width: 236px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* 与右侧画布等高，内容超出时面板内部滚动（与 .ayn-graph-container 保持一致） */
  height: calc(100vh - var(--vp-nav-height) - 32px);
  min-height: 420px;
  max-height: none;
  overflow-y: auto;
  padding-right: 2px;
}
.gv-canvas {
  flex: 1 1 auto;
  min-width: 0;
}
.gv-search {
  flex: 0 0 auto;
  width: 100%;
  padding: 7px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 14px;
  outline: none;
}
.gv-search:focus {
  border-color: var(--vp-c-brand-1);
}
.gv-toggles {
  display: flex;
  flex-direction: row;
  gap: 8px;
}
.gv-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  user-select: none;
}
.gv-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.gv-reset {
  padding: 6px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 13px;
  cursor: pointer;
}
.gv-reset:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.gv-count {
  margin-left: auto;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.gv-filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.gv-group {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}
.gv-group > summary {
  cursor: pointer;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  user-select: none;
}
.gv-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 12px 12px;
  max-height: 220px;
  overflow: auto;
}
.gv-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-size: 12px;
  line-height: 1.6;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.gv-chip i {
  font-style: normal;
  font-size: 11px;
  opacity: 0.6;
}
.gv-chip:hover {
  border-color: var(--vp-c-brand-2);
  color: var(--vp-c-text-1);
}
.gv-chip.active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}
.gv-chip--cat.active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

/* ── 深度 / 焦点 ── */
.gv-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.gv-field-label {
  font-size: 12px;
  color: var(--vp-c-text-3);
}
.gv-seg {
  display: flex;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}
.gv-seg-btn {
  flex: 1 1 0;
  padding: 5px 0;
  border: none;
  border-right: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 12px;
  cursor: pointer;
}
.gv-seg-btn:last-child {
  border-right: none;
}
.gv-seg-btn:hover:not(:disabled) {
  color: var(--vp-c-text-1);
}
.gv-seg-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
/* 标题旁的提示图标（ⓘ）：hover / 键盘聚焦弹出气泡，title 属性作兜底 */
.gv-field-head {
  display: flex;
  align-items: center;
  gap: 6px;
}
.gv-info {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: help;
  outline: none;
}
.gv-info-icon {
  font-size: 12px;
  line-height: 1;
  color: var(--vp-c-text-3);
}
.gv-info:hover .gv-info-icon,
.gv-info:focus .gv-info-icon {
  color: var(--vp-c-brand-1);
}
.gv-info-tip {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 20;
  width: 200px;
  padding: 8px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 11px;
  line-height: 1.6;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-2px);
  transition: opacity 0.15s ease, transform 0.15s ease;
  pointer-events: none;
}
.gv-info:hover .gv-info-tip,
.gv-info:focus .gv-info-tip {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
.gv-seg-btn.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
.gv-focus {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 8px;
  background: var(--vp-c-brand-soft);
  font-size: 12px;
}
.gv-focus-label {
  flex: 0 0 auto;
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
.gv-focus-title {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--vp-c-text-1);
}
.gv-focus-clear {
  flex: 0 0 auto;
  border: none;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}
.gv-focus-clear:hover {
  color: var(--vp-c-brand-1);
}

/* 焦点节点描边 */
.ayn-graph-node.is-focused .ayn-graph-dot {
  stroke: var(--vp-c-brand-1);
  stroke-width: 3px;
}

/* 标签隐藏（「枢纽」模式下非枢纽节点，或「隐藏」模式） */
.ayn-graph-node.is-label-hidden .ayn-graph-label {
  display: none;
}

/* ── 二分图：标签 / 分类概念节点 ── */
.ayn-graph-node.is-tag .ayn-graph-dot {
  fill: var(--vp-c-brand-1);
  stroke: var(--vp-c-brand-2);
  stroke-width: 2px;
}
.ayn-graph-node.is-category .ayn-graph-dot {
  fill: var(--vp-c-bg);
  stroke: var(--vp-c-brand-1);
  stroke-width: 3px;
}
/* 概念节点名字短且是图的骨架，始终显示、加粗 */
.ayn-graph-node.is-tag .ayn-graph-label,
.ayn-graph-node.is-category .ayn-graph-label {
  font-weight: 600;
  --ayn-label-state: 1;
}
.ayn-graph-node.is-tag .ayn-graph-label {
  fill: var(--vp-c-brand-1);
}
.ayn-graph-node.is-category .ayn-graph-label {
  fill: var(--vp-c-brand-1);
}
/* 概念节点不接受「枢纽 / 隐藏」标签规则的影响之外，还要保证不被淡出 */
.ayn-graph-node.is-tag.is-label-hidden .ayn-graph-label,
.ayn-graph-node.is-category.is-label-hidden .ayn-graph-label {
  display: block;
}

/* ── 三类边的视觉区分 ──
   正文真实链接最实（数量少、是骨架）；标签 / 分类归属边数量庞大（占绝大多数），
   画得太实会把整张图糊成一片，所以刻意压低不透明度、只作背景结构。 */
.ayn-graph-edge {
  stroke-opacity: 0.62;
}
.ayn-graph-edge--tag {
  stroke: var(--vp-c-brand-2);
  stroke-opacity: 0.22;
}
.ayn-graph-edge--category {
  stroke: var(--vp-c-brand-1);
  stroke-opacity: 0.16;
  stroke-dasharray: 3 4;
}

/* ── 画布工具条 ── */
.gv-canvas {
  position: relative;
}
.gv-canvas-tools {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 5;
  display: flex;
  gap: 8px;
}
.gv-tool {
  padding: 5px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 12px;
  cursor: pointer;
  backdrop-filter: blur(4px);
}
.gv-tool:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

/* 全屏：铺满屏幕，画布随之占满（ResizeObserver 会自动重建） */
.gv-canvas:fullscreen {
  width: 100vw;
  height: 100vh;
  padding: 8px;
  background: var(--vp-c-bg);
}
.gv-canvas:fullscreen .ayn-graph-container {
  height: calc(100vh - 16px);
  min-height: 0;
}

/* ── 说明按钮 ── */
.gv-help {
  padding: 6px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 13px;
  cursor: pointer;
}
.gv-help:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

/* ── 说明弹窗 ── */
.gv-modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.45);
}
.gv-modal-box {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 640px;
  max-height: 80vh;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}
.gv-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--vp-c-divider);
}
.gv-modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}
.gv-modal-close {
  border: none;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}
.gv-modal-close:hover {
  color: var(--vp-c-brand-1);
}
.gv-modal-body {
  padding: 14px 18px 20px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.75;
  color: var(--vp-c-text-2);
}
.gv-modal-body h4 {
  margin: 18px 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}
.gv-modal-body h4:first-child {
  margin-top: 0;
}
.gv-modal-body ul {
  margin: 6px 0;
  padding-left: 20px;
}
.gv-modal-body li {
  margin: 4px 0;
}
.gv-modal-body p {
  margin: 8px 0;
}
.gv-modal-lead {
  margin: 0 0 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  font-size: 13px;
}
.gv-modal-body code {
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  font-size: 12px;
}

/* 弹窗内的图例 */
.gv-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin: 12px 0 0;
  font-size: 13px;
}
.gv-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.gv-legend-line {
  display: inline-block;
  width: 28px;
  height: 0;
  border-top: 1px solid var(--vp-c-divider);
}
.gv-legend-line--tag {
  border-top-color: var(--vp-c-brand-2);
}
.gv-legend-line--category {
  border-top-style: dashed;
  border-top-color: var(--vp-c-brand-1);
}

/* 窄屏：面板回到顶部横向排布，避免挤占画布宽度 */
@media (max-width: 860px) {
  .gv-body {
    flex-direction: column;
  }
  .gv-panel {
    flex: 1 1 auto;
    width: 100%;
    height: auto;
    min-height: 0;
    max-height: none;
    overflow: visible;
  }
  .gv-toggles {
    flex-direction: row;
    gap: 18px;
  }
}
</style>
