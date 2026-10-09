---
title: Graph
description: Obsidian-style relationship graph — see how all English articles connect across the site at a glance
# Full-screen page: hide the sidebar and outline to give the graph maximum space
sidebar: false
aside: false
---

<ClientOnly>
  <GraphView data-file="/vault-data-en.json" />
</ClientOnly>

<style>
/* ── Unconstrain VitePress's narrowing of "no-sidebar" graph pages ──
   The default theme limits width for .VPDoc:not(.has-sidebar), and a graph
   page still reserves left space for the sidebar. We scope to pages that
   actually contain the graph component (.gv) and force full width + zero
   sidebar padding. Uses :has() so it only affects graph pages. */
.VPDoc:has(.gv) {
  padding: 12px 16px 0 !important;
}

.VPDoc:has(.gv) .VPContent {
  /* kill any reserved sidebar width */
  padding-left: 0 !important;
}

@media (min-width: 960px) {
  .VPDoc:has(.gv) .container,
  .VPDoc:has(.gv) .content {
    max-width: none !important;
  }
  .VPDoc:has(.gv) .content {
    padding: 0 !important;
  }
}

/* ── No page scroll: the page body is just the graph ── */
.VPDoc:has(.gv) .VPDocFooter {
  display: none !important;
}
body:has(.gv) .VPFooter {
  display: none !important;
}

/* Canvas height: viewport - navbar - padding, fills one screen with no vertical scroll */
.ayn-graph-container {
  height: calc(100vh - var(--vp-nav-height) - 32px);
  min-height: 420px;
}
</style>
