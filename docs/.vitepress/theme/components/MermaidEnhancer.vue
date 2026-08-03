<script setup>
import { useMermaidPanZoom } from 'vitepress-plugin-mermaid-pan-zoom'

// 仅客户端加载：为页面内 Mermaid 图表启用平移 / 缩放 / 全屏
useMermaidPanZoom()
</script>

<template>
  <span style="display: none" aria-hidden="true"></span>
</template>
