<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { withBase } from 'vitepress'
import { data } from '../recent.data'

const props = withDefaults(
  defineProps<{
    count?: number
    interval?: number
    variant?: 'image' | 'text'
    /** 自定义文章列表（如单分类文章），传入后覆盖 recent.data 全站最新 */
    posts?: { 
        title: string; 
        date?: string; 
        description?: string; 
        tags?: string[]; 
        banner?: string; 
        link: string 
    }[]
  }>(),
  {
    count: 3,
    interval: 5000,
    variant: 'image'
  }
)

const posts = computed(() =>
  (props.posts && props.posts.length ? props.posts : data).slice(0, Math.max(1, props.count))
)

const active = ref(0)
let timer: number | undefined

function next() {
  if (posts.value.length < 2) return
  active.value = (active.value + 1) % posts.value.length
}
function prev() {
  if (posts.value.length < 2) return
  active.value = (active.value - 1 + posts.value.length) % posts.value.length
}
function go(i: number) {
  active.value = i
}
function start() {
  stop()
  if (props.interval > 0 && posts.value.length > 1) {
    timer = window.setInterval(next, props.interval)
  }
}
function stop() {
  if (timer) {
    window.clearInterval(timer)
    timer = undefined
  }
}

onMounted(start)
onBeforeUnmount(stop)

function href(link: string) {
  return withBase(link)
}
function img(src: string) {
  return withBase(src)
}
</script>

<template>
  <div
    class="hcp"
    :class="`hcp--${variant}`"
    @mouseenter="stop"
    @mouseleave="start"
  >
    <div class="hcp-track" :style="{ transform: `translateX(-${active * 100}%)` }">
      <a
        v-for="p in posts"
        :key="p.link"
        class="hcp-slide"
        :href="href(p.link)"
      >
        <template v-if="variant === 'image'">
          <img
            v-if="p.banner"
            class="hcp-img"
            :src="img(p.banner)"
            :alt="p.title"
            loading="lazy"
          />
          <div v-else class="hcp-img hcp-img--ph">{{ p.title }}</div>
          <div class="hcp-cap">{{ p.title }}</div>
        </template>
        <template v-else>
          <div class="hcp-text">
            <div class="hcp-text-title">{{ p.title }}</div>
            <div v-if="p.date" class="hcp-text-date">{{ p.date }}</div>
            <p v-if="p.description" class="hcp-text-desc">{{ p.description }}</p>
            <!-- <span class="card-footer">
                <span v-if="p.tags && p.tags.length" class="hcp-tags">
                <span v-for="tag in p.tags" :key="tag" class="tag">{{ tag }}</span>
                </span>
            </span> -->
          </div>
        </template>
      </a>
    </div>

    <button
      v-if="posts.length > 1"
      class="hcp-arrow hcp-prev"
      type="button"
      @click.prevent="prev"
      aria-label="上一张"
    >
      ‹
    </button>
    <button
      v-if="posts.length > 1"
      class="hcp-arrow hcp-next"
      type="button"
      @click.prevent="next"
      aria-label="下一张"
    >
      ›
    </button>

    <div v-if="posts.length > 1" class="hcp-dots">
      <button
        v-for="(p, i) in posts"
        :key="p.link"
        class="hcp-dot"
        :class="{ active: i === active }"
        type="button"
        :aria-label="`第 ${i + 1} 张`"
        @click.prevent="go(i)"
      ></button>
    </div>
  </div>
</template>

<style scoped>
.hcp {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.hcp-track {
  display: flex;
  transition: transform 0.5s ease;
  will-change: transform;
}

.hcp-slide {
  flex: 0 0 100%;
  display: block;
  text-decoration: none;
  color: inherit;
  position: relative;
}

/* 封面图样式 */
.hcp--image .hcp-slide {
  aspect-ratio: 4 / 3;
}
.hcp-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.hcp-img--ph {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  text-align: center;
  color: #fff;
  background: linear-gradient(135deg, #6a8dff, #9b6bff);
  font-size: 15px;
}
.hcp-cap {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 28px 14px 12px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 文字卡片样式 */
.hcp--text .hcp-slide {
  min-height: 160px;
}
.hcp-text {
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}
.hcp-text-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--vp-c-brand);
  line-height: 1.4;
}
.hcp-text-date {
  font-size: 13px;
  color: var(--vp-c-text-3);
}
.hcp-text-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 箭头 */
.hcp-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.hcp:hover .hcp-arrow {
  opacity: 1;
}
.hcp-prev {
  left: 10px;
}
.hcp-next {
  right: 10px;
}
.hcp-arrow:hover {
  background: rgba(0, 0, 0, 0.65);
}

/* 圆点 */
.hcp-dots {
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 6px;
}
.hcp-dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  transition: background 0.2s ease, width 0.2s ease;
}
.hcp-dot.active {
  width: 18px;
  border-radius: 4px;
  background: #fff;
}
/* 文字卡片下圆点用深色，保证可见 */
.hcp--text .hcp-dot {
  background: var(--vp-c-text-3);
}
.hcp--text .hcp-dot.active {
  background: var(--vp-c-brand);
}

.hcp-tags {
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

</style>
