<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 滚动超过该高度后显示回到顶部按钮
const THRESHOLD = 300
const showBackTop = ref(false)
const showBackBottom = ref(false)

function onScroll() {
  const scrollY = window.scrollY
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight

  // 显示回到顶部按钮：滚动距离超过阈值
  showBackTop.value = scrollY > THRESHOLD

  // 显示滚动到底部按钮：距离底部超过窗口高度的一半
  const distanceToBottom = documentHeight - scrollY - windowHeight
  showBackBottom.value = distanceToBottom > windowHeight / 2
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function scrollToBottom() {
  window.scrollTo({
    top: document.documentElement.scrollHeight - document.documentElement.clientHeight,
    behavior: 'smooth'
  });
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <!-- 回到顶部按钮 -->
  <Transition name="back-top">
    <button
      v-if="showBackTop"
      class="back-top-btn"
      type="button"
      title="回到顶部"
      aria-label="回到顶部"
      @click="scrollToTop"
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
    </button>
  </Transition>

  <!-- 滚动到底部按钮 -->
  <Transition name="back-top">
    <button
      v-if="showBackBottom"
      class="back-bottom-btn"
      type="button"
      title="滚动到底部"
      aria-label="滚动到底部"
      @click="scrollToBottom"
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 5v14" />
        <path d="M5 12l7 7 7-7" />
      </svg>
    </button>
  </Transition>
</template>

<style scoped>
.back-top-btn,
.back-bottom-btn {
  position: fixed;
  right: 24px;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 50%;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
  transition: border-color 0.25s ease, color 0.25s ease, transform 0.25s ease;
}

.back-top-btn {
  bottom: 96px;
}

.back-bottom-btn {
  bottom: 48px;
}

.back-top-btn:hover,
.back-bottom-btn:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
  transform: translateY(-2px);
}

.back-top-enter-active,
.back-top-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.back-top-enter-from,
.back-top-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
