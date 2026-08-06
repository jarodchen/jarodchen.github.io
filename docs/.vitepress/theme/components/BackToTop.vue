<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 滚动超过该高度后显示按钮
const THRESHOLD = 300
const visible = ref(false)

function onScroll() {
  visible.value = window.scrollY > THRESHOLD
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
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
  <Transition name="back-top">
    <button
      v-if="visible"
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
</template>

<style scoped>
.back-top-btn {
  position: fixed;
  right: 24px;
  bottom: 48px;
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

.back-top-btn:hover {
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
