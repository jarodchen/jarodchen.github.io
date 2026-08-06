<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import { computed, defineAsyncComponent } from 'vue'
import BackToTop from './components/BackToTop.vue'

const { Layout } = DefaultTheme
const { frontmatter } = useData()

// 仅博客文章页显示元信息（有 title + date 视为文章页）
const isPost = computed(
  () => !!frontmatter.value.date && frontmatter.value.layout !== 'home'
)

function tagLink(tag: string) {
  return `/blog/tags/${tag.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')}`
}

// Mermaid 平移缩放：该插件依赖 svg-pan-zoom（模块顶层引用 window / MutationObserver），
// 无法在 SSR 阶段执行，故通过 <ClientOnly> + 异步组件只在浏览器端加载。
const MermaidEnhancer = defineAsyncComponent(
  () => import('./components/MermaidEnhancer.vue')
)
</script>

<template>
  <DefaultTheme.Layout>
    <template #doc-before>
      <img
        v-if="frontmatter.banner"
        class="post-banner"
        :src="frontmatter.banner"
        :alt="'横幅：' + (frontmatter.title || '')"
      />
      <div v-if="isPost" class="post-meta">
        <span v-if="frontmatter.category" class="post-category">
          {{ frontmatter.category }}
        </span>
        <span v-if="frontmatter.date" class="post-date">{{ frontmatter.date }}</span>
      </div>
      <div v-if="isPost && frontmatter.tags && frontmatter.tags.length" class="post-tags">
        <a
          v-for="tag in frontmatter.tags"
          :key="tag"
          class="post-tag"
          :href="tagLink(tag)"
        >{{ tag }}</a>
      </div>
    </template>
  </DefaultTheme.Layout>

  <ClientOnly>
    <MermaidEnhancer />
  </ClientOnly>

  <BackToTop />
</template>

<style scoped>
.post-banner {
  display: block;
  width: 100%;
  max-height: 320px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 20px;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 13px;
}

.post-category {
  color: var(--vp-c-brand);
  background: var(--vp-c-brand-soft);
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.post-date {
  color: var(--vp-c-text-3);
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.post-tag {
  display: inline-block;
  padding: 3px 10px;
  font-size: 12px;
  color: var(--vp-c-brand);
  background: var(--vp-c-brand-soft);
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.post-tag:hover {
  background: var(--vp-c-brand);
  color: #fff;
}
</style>

<!-- 首页「文章分类」卡片样式 -->
<style>
.cat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin: 24px 0;
}

.cat-card {
  display: flex;
  flex-direction: column;
  padding: 16px 18px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}

.cat-card:hover {
  border-color: var(--vp-c-brand);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-3px);
}

.cat-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
}

.cat-card-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.cat-card-title:hover {
  color: var(--vp-c-brand);
}

.cat-card-count {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-brand);
  background: var(--vp-c-brand-soft);
  padding: 2px 8px;
  border-radius: 10px;
}

.cat-card-list {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 13px;
  line-height: 1.9;
}

.cat-card-list a {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: color 0.2s ease;
}

.cat-card-list a:hover {
  color: var(--vp-c-brand);
}

.cat-card-more {
  font-size: 12px;
}

.cat-foot {
  margin: 4px 0 0;
  text-align: center;
  color: var(--vp-c-text-2);
  font-size: 13px;
}
</style>

<!-- 全站滚动细化：细滚动条 + 平滑滚动 -->
<style>
html {
  scroll-behavior: smooth;
}

/* Firefox 细滚动条 */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--vp-c-divider) transparent;
}

/* WebKit（Chrome / Edge / Safari）细滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: var(--vp-c-divider);
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

::-webkit-scrollbar-thumb:hover {
  background-color: var(--vp-c-text-3);
}
</style>
