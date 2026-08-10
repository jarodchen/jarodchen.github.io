import DefaultTheme from 'vitepress/theme'
import type { EnhanceAppContext } from 'vitepress'
import Layout from './Layout.vue'
import HomeCarouselPosts from './components/HomeCarouselPosts.vue'
import CategoryHeroCarousel from './components/CategoryHeroCarousel.vue'
import 'vitepress-plugin-mermaid-pan-zoom/dist/style.css'

export default {
  ...DefaultTheme,
  Layout,
  enhanceApp({ app }: EnhanceAppContext) {
    // 供首页 markdown 通过 <HomeCarouselPosts /> 调用（封面图 / 文字两种 variant）
    app.component('HomeCarouselPosts', HomeCarouselPosts)
    // 供分类详情页 markdown 通过 <CategoryHeroCarousel /> 调用（网格首位的卡片式轮播）
    app.component('CategoryHeroCarousel', CategoryHeroCarousel)
  }
}
