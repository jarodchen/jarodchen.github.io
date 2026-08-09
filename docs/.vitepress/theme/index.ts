import DefaultTheme from 'vitepress/theme'
import type { EnhanceAppContext } from 'vitepress'
import Layout from './Layout.vue'
import HomeCarouselPosts from './components/HomeCarouselPosts.vue'
import 'vitepress-plugin-mermaid-pan-zoom/dist/style.css'

export default {
  ...DefaultTheme,
  Layout,
  enhanceApp({ app }: EnhanceAppContext) {
    // 供首页 markdown 通过 <HomeCarouselPosts /> 调用（封面图 / 文字两种 variant）
    app.component('HomeCarouselPosts', HomeCarouselPosts)
  }
}
