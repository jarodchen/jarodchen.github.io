/**
 * 首页「最新文章」数据加载器（VitePress 构建期数据）
 *
 * 同时提供中文与英文两份最新文章列表（分别读取 docs/blog 与 docs/en/blog），
 * 前端 HomeCarouselPosts 按当前语言（useData().lang）选择对应数据集。
 */
import { defineLoader } from 'vitepress'
import { getBlogPostsMetadata } from '../sidebar-generator'
import type { BlogPostMetadata } from '../sidebar-generator'

declare const data: { zh: BlogPostMetadata[]; en: BlogPostMetadata[] }
export { data }

export default defineLoader({
  watch: ['../blog/**/*.md', '../en/blog/**/*.md'],
  load() {
    return {
      zh: getBlogPostsMetadata(),
      en: getBlogPostsMetadata('en')
    }
  }
})
