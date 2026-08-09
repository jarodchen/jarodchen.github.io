/**
 * 首页「最新文章」数据加载器（VitePress 构建期数据）
 *
 * 复用 sidebar-generator 的 getBlogPostsMetadata()，结果已按日期降序，
 * 构建期序列化进页面；前端 `import { data }` 即可拿到，运行时零请求。
 */
import { defineLoader } from 'vitepress'
import { getBlogPostsMetadata } from '../sidebar-generator'
import type { BlogPostMetadata } from '../sidebar-generator'

declare const data: BlogPostMetadata[]
export { data }

export default defineLoader({
  watch: ['../blog/**/*.md'],
  load(): BlogPostMetadata[] {
    return getBlogPostsMetadata()
  }
})
