---
title: 关系图谱
description: Obsidian 式关系图谱：一眼看清全站文章之间的关联与脉络
# 本页独占整屏：隐藏左侧导航与右侧大纲，给图谱最大可视区域
sidebar: false
aside: false
---

<ClientOnly>
  <GraphView />
</ClientOnly>

<style>
/* ── 解除 VitePress 对「无侧边栏页面」的收窄 ──
   默认主题 VPDoc.vue 里对 .VPDoc:not(.has-sidebar) 主动限宽
   （container 1104px / content 784px），比有侧边栏时还窄 —— 这正是
   「关掉侧边栏后可视区没变大」的原因，必须显式解除。
   该规则是 scoped（带属性选择器），这里用 !important 覆盖；
   并用 :has() 限定只作用于本页（markdown 里的 <style> 是全局的，防止污染其他页）。 */
.VPDoc:has(.vp-doc._graph) {
  padding: 12px 16px 0 !important;
}

@media (min-width: 960px) {
  .VPDoc:not(.has-sidebar):has(.vp-doc._graph) .container {
    max-width: none !important;
  }
  .VPDoc:not(.has-sidebar):has(.vp-doc._graph) .content {
    max-width: none !important;
  }
  .VPDoc:has(.vp-doc._graph) .content {
    padding: 0 !important;
  }
}

@media (min-width: 1440px) {
  .VPDoc:not(.has-sidebar):has(.vp-doc._graph) .container {
    max-width: none !important;
  }
  .VPDoc:not(.has-sidebar):has(.vp-doc._graph) .content {
    max-width: none !important;
  }
}

/* ── 整屏不滚动 ──
   页面正文只剩图谱，说明文字已收进面板的「说明」弹窗。
   底部「上下篇导航」和站点页脚会把页面撑出滚动条，本页一并隐藏。 */
.VPDoc:has(.vp-doc._graph) .VPDocFooter {
  display: none !important;
}
body:has(.vp-doc._graph) .VPFooter {
  display: none !important;
}

/* 画布高度：视口高度 - 导航栏 - 页面留白，正好铺满一屏不再产生纵向滚动 */
.ayn-graph-container {
  height: calc(100vh - var(--vp-nav-height) - 32px);
  min-height: 420px;
}
</style>
