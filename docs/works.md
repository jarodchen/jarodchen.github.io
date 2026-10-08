---
title: 作品导航
description: 已部署上线的作品集合：管理后台站点与 RustFS OOS 企业网盘的多框架客户端
sidebar: true
---

# 作品导航

这里收录了我已部署上线、可以直接访问的作品。既包含独立站点，也包含同一个产品在不同前端框架下的实现。

<script setup>
const sites = [
  {
    icon: '🖥️',
    name: 'jarod-site',
    desc: '一套仿 RuoYi 的、基于 Vue 3 + Vite 开箱即用的管理后台骨架。最初是为了重写 RuoYi 而动手学习，如今已经接近可用状态，是整个作品线里其它项目的地基。',
    tags: ['Vue 3', 'Vite', 'Element Plus', 'ECharts', 'Pinia'],
    links: [
      { text: '在线预览', href: 'https://jarodchen.github.io/jarod-site/' },
      { text: 'GitHub 仓库', href: 'https://github.com/jarodchen/jarod-site' }
    ]
  }
]

const clients = [
  {
    icon: '⚛️',
    name: 'oos-client-react',
    desc: 'RustFS 企业网盘的 React 客户端。面向企业级文件存储、分享与协作场景，支持 PWA，可安装到桌面与移动端。',
    tags: ['React', 'TypeScript', 'Vite', 'PWA'],
    links: [
      { text: '在线预览', href: 'https://jarodchen.github.io/oos-client-react' },
      { text: 'GitHub 仓库', href: 'https://github.com/jarodchen/oos-client-react' }
    ]
  },
  {
    icon: '💚',
    name: 'oos-client-vue',
    desc: 'RustFS-OOS 企业级对象存储网盘系统的 Vue 客户端。基于 Ant Design Vue 组件体系，内置主题守卫与浏览器兼容检测，支持 PWA。',
    tags: ['Vue 3', 'Ant Design Vue', 'Vite', 'TanStack Query', 'PWA'],
    links: [
      { text: '在线预览', href: 'https://jarodchen.github.io/oos-client-vue/' },
      { text: 'GitHub 仓库', href: 'https://github.com/jarodchen/oos-client-vue' }
    ]
  },
  {
    icon: '🅰️',
    name: 'oos-client-ng',
    desc: 'RustFS OOS 企业网盘的 Angular 客户端，主打端到端加密与实时协同编辑，组件层基于 Ant Design，支持 PWA。',
    tags: ['Angular', 'TypeScript', 'Ant Design', 'PWA'],
    links: [
      { text: '在线预览', href: 'https://jarodchen.github.io/oos-client-ng/' },
      { text: 'GitHub 仓库', href: 'https://github.com/jarodchen/oos-client-ng' }
    ]
  }
]
</script>

## 🏢 站点

<div class="cards-grid">
  <div v-for="site in sites" :key="site.name" class="card">
    <div class="card-icon">{{ site.icon }}</div>
    <h3 class="card-title">{{ site.name }}</h3>
    <p class="card-desc">{{ site.desc }}</p>
    <div class="card-tags">
      <span v-for="tag in site.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    <div v-if="site.links && site.links.length" class="card-links">
      <a
        v-for="link in site.links"
        :key="link.text"
        :href="link.href"
        class="card-link"
        target="_blank"
        rel="noopener"
      >{{ link.text }} →</a>
    </div>
  </div>
</div>

## 📦 RustFS OOS 企业网盘 · 多框架客户端

同一个 **RustFS OOS 企业级对象存储网盘系统**，分别用三大前端框架各实现了一遍客户端。它们功能对齐、接口一致，可以直接横向对比三种框架在同类业务下的实现差异。

<div class="cards-grid">
  <div v-for="c in clients" :key="c.name" class="card">
    <div class="card-icon">{{ c.icon }}</div>
    <h3 class="card-title">{{ c.name }}</h3>
    <p class="card-desc">{{ c.desc }}</p>
    <div class="card-tags">
      <span v-for="tag in c.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    <div v-if="c.links && c.links.length" class="card-links">
      <a
        v-for="link in c.links"
        :key="link.text"
        :href="link.href"
        class="card-link"
        target="_blank"
        rel="noopener"
      >{{ link.text }} →</a>
    </div>
  </div>
</div>

<style scoped>
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin: 20px 0;
}

.card {
  display: flex;
  flex-direction: column;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
}

.card:hover {
  border-color: var(--vp-c-brand);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.card-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--vp-c-text-1);
}

.card-desc {
  color: var(--vp-c-text-2);
  margin: 0 0 12px 0;
  line-height: 1.6;
  font-size: 13px;
  flex-grow: 1;
}

.card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.tag {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand);
  border-radius: 3px;
}

.card-links {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.card-link {
  display: inline-block;
  padding: 6px 14px;
  background: var(--vp-c-brand);
  color: #fff !important;
  text-decoration: none !important;
  border-radius: 4px;
  font-weight: 500;
  font-size: 13px;
  transition: all 0.2s ease;
}

.card-link:hover {
  background: var(--vp-c-brand-dark);
  transform: translateX(2px);
}
</style>
