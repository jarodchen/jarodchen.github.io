import DefaultTheme from 'vitepress/theme'
import type { EnhanceAppContext } from 'vitepress'
import { defineAsyncComponent } from 'vue'
import Layout from './Layout.vue'
import HomeCarouselPosts from './components/HomeCarouselPosts.vue'
import CategoryHeroCarousel from './components/CategoryHeroCarousel.vue'
import 'vitepress-plugin-mermaid-pan-zoom/dist/style.css'
import 'vitepress-allyouneed/theme/styles/index.css'

// 关系图谱组件。
// - VaultGraph：vitepress-allyouneed 自带的原版（仅全图 + 悬停高亮，无过滤 UI）
// - GraphView：基于 VaultGraph 的 d3 布局 fork 而来，额外带搜索 / 标签 / 分类
//   过滤、边类型开关（见 docs/.vitepress/theme/GraphView.vue）。/graph 页面使用它。
// 两者均依赖 d3（force / zoom / drag），只在浏览器端有意义，故用异步组件 +
// <ClientOnly> 加载，避免打进 SSR 包。
const VaultGraph = defineAsyncComponent(
  () => import('vitepress-allyouneed/theme/components/VaultGraph.vue')
)
const GraphView = defineAsyncComponent(() => import('./GraphView.vue'))

export default {
  ...DefaultTheme,
  Layout,
  enhanceApp({ app }: EnhanceAppContext) {
    // 供首页 markdown 通过 <HomeCarouselPosts /> 调用（封面图 / 文字两种 variant）
    app.component('HomeCarouselPosts', HomeCarouselPosts)
    // 供分类详情页 markdown 通过 <CategoryHeroCarousel /> 调用（网格首位的卡片式轮播）
    app.component('CategoryHeroCarousel', CategoryHeroCarousel)
    // 原版关系图谱（无过滤）
    app.component('VaultGraph', VaultGraph)
    // 增强版关系图谱（搜索 / 标签 / 分类过滤 + 边类型开关），/graph 页面使用
    app.component('GraphView', GraphView)
  }
}
