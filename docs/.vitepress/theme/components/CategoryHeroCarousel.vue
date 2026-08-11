<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'

export interface CarouselPost {
  title: string
  date?: string
  description?: string
  tags?: string[]
  banner?: string
  link: string
}

const props = withDefaults(
  defineProps<{
    /** 本分类全部文章，组件内部取最近的 count 篇轮播 */
    posts: CarouselPost[]
    /** 轮播篇数，默认 5 */
    count?: number
    /** 自动轮播间隔（毫秒），0 关闭 */
    interval?: number
    /** 展示形态：image=封面图（默认） / text=文字 */
    variant?: 'image' | 'text'
  }>(),
  { count: 5, interval: 5000, variant: 'image' }
)

const isText = computed(() => props.variant === 'text')

const slides = computed(() =>
  [...props.posts]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, Math.max(1, props.count))
)

const active = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function next() {
  if (slides.value.length < 2) return
  active.value = (active.value + 1) % slides.value.length
}
function prev() {
  if (slides.value.length < 2) return
  active.value = (active.value - 1 + slides.value.length) % slides.value.length
}
function go(i: number) {
  active.value = i
}
function start() {
  stop()
  if (props.interval > 0 && slides.value.length > 1) {
    timer = setInterval(next, props.interval)
  }
}
function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
function replay() {
  stop()
  start()
}

const activePost = computed(() => slides.value[active.value])
function href(link: string) {
  return withBase(link)
}
function img(src: string) {
//   return withBase(src || '/images/placeholder.png')
    return withBase('/images/最近更新.webp') //目录详情页轮播由各个文章的横幅改为固定
}

onMounted(start)
onBeforeUnmount(stop)
</script>

<template>
  <a
    v-if="slides.length"
    class="card chc"
    :class="isText ? 'chc--text' : 'chc--image'"
    :href="href(activePost.link)"
    :aria-label="`查看 ${activePost.title}`"
    @mouseenter="stop"
    @mouseleave="replay"
  >
    <span class="chc-stack">
      <span
        v-for="(p, i) in slides"
        :key="p.link"
        class="chc-slide"
        :class="{ active: i === active }"
      >
        <!-- text 模式：渐变标题条 -->
        <span v-if="isText" class="chc-textbar">
          <span class="chc-textbar-cat">最近更新</span>
          <span class="chc-textbar-title">{{ p.title }}</span>
        </span>
        <!-- image 模式：封面图 -->
        <span v-else class="card-thumb">
          <img :src="img(p.banner || '')" :alt="p.title" loading="lazy" />
        </span>

        <span class="card-content">
          <span class="card-meta">
            <span class="card-date">{{ p.date }}</span>
            <span class="card-category">最近更新</span>
          </span>
          <span v-if="!isText" class="card-title">{{ p.title }}</span>
          <span v-if="p.description" class="card-desc">{{ p.description }}</span>
          <span class="card-footer">
            <span v-if="p.tags && p.tags.length" class="card-tags">
              <span v-for="tag in p.tags" :key="tag" class="tag">{{ tag }}</span>
            </span>
          </span>
        </span>
      </span>

      <button
        v-if="slides.length > 1"
        class="chc-arrow chc-prev"
        type="button"
        aria-label="上一篇"
        @click.prevent="prev"
      >‹</button>
      <button
        v-if="slides.length > 1"
        class="chc-arrow chc-next"
        type="button"
        aria-label="下一篇"
        @click.prevent="next"
      >›</button>

      <span v-if="slides.length > 1" class="chc-dots">
        <button
          v-for="(p, i) in slides"
          :key="p.link"
          class="chc-dot"
          type="button"
          :class="{ active: i === active }"
          :aria-label="`第 ${i + 1} 篇`"
          @click.prevent="go(i)"
        />
      </span>
    </span>
  </a>
</template>

<style scoped>
/* 复用详情页卡片的视觉尺寸，保证与相邻 card 等大 */
.chc {
  display: block;
  position: relative;
  min-height: 318px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  text-decoration: none;
  color: inherit;
  transition: all 0.25s ease;
}

.chc:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  border-color: var(--vp-c-brand);
}

.chc-stack {
  position: absolute;
  inset: 0;
  display: block;
}

.chc-slide {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
}

.chc-slide.active {
  opacity: 1;
  pointer-events: auto;
}

/* 与详情页 .card-thumb / .card-content 保持一致 */
.card-thumb {
  width: 100%;
  height: 160px;
  overflow: hidden;
  background: var(--vp-c-bg-alt);
}

.card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.chc:hover .card-thumb img {
  transform: scale(1.05);
}

/* text 模式：渐变标题条，高度与封面图一致，保证卡片等大 */
.chc-textbar {
  width: 100%;
  height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 6px;
  padding: 16px 18px;
  background: linear-gradient(135deg, var(--vp-c-brand) 0%, var(--vp-c-brand-2, var(--vp-c-brand)) 100%);
  color: #fff;
  overflow: hidden;
}

.chc-textbar-cat {
  font-size: 12px;
  opacity: 0.85;
}

.chc-textbar-title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.chc--text .card-content {
  padding-top: 14px;
}

.card-content {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.card-date {
  color: var(--vp-c-text-3);
}

.card-category {
  color: var(--vp-c-brand);
  background: var(--vp-c-brand-soft);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-desc {
  font-size: 13px;
  color: var(--vp-c-text-2);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  /* font-size: 11px;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-alt);
  padding: 1px 6px;
  border-radius: 3px; */

  color: var(--vp-c-brand);
  background: var(--vp-c-brand-soft);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.chc-arrow {
  position: absolute;
  top: 146px;
  bottom: 0;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  z-index: 2;
}

.chc:hover .chc-arrow {
  opacity: 0.9;
}

.chc-arrow:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.chc-prev {
  left: 8px;
}

.chc-next {
  right: 8px;
}

.chc-dots {
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 6px;
  z-index: 2;
}

.chc-dot {
  width: 6px;
  height: 6px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--vp-c-divider);
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.chc-dot.active {
  background: var(--vp-c-brand);
  transform: scale(1.3);
}
</style>
