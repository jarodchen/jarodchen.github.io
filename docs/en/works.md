---
title: Works
description: A collection of deployed works — an admin dashboard site and multi-framework clients for the RustFS OOS enterprise drive
sidebar: true
---

# Works

A collection of my deployed, directly-accessible works. It includes standalone sites as well as one product implemented across different front-end frameworks.

<script setup>
const sites = [
  {
    icon: '🖥️',
    name: 'jarod-site',
    desc: 'A RuoYi-inspired, Vue 3 + Vite admin dashboard skeleton ready to use out of the box. It began as a RuoYi rewrite for learning and is now close to production-ready — the foundation for everything else in this works line.',
    tags: ['Vue 3', 'Vite', 'Element Plus', 'ECharts', 'Pinia'],
    links: [
      { text: 'Live Preview', href: 'https://jarodchen.github.io/jarod-site/' },
      { text: 'GitHub Repo', href: 'https://github.com/jarodchen/jarod-site' }
    ]
  }
]

const clients = [
  {
    icon: '⚛️',
    name: 'oos-client-react',
    desc: 'The React client for the RustFS enterprise drive. Built for enterprise file storage, sharing, and collaboration, with PWA support for desktop and mobile.',
    tags: ['React', 'TypeScript', 'Vite', 'PWA'],
    links: [
      { text: 'Live Preview', href: 'https://jarodchen.github.io/oos-client-react' },
      { text: 'GitHub Repo', href: 'https://github.com/jarodchen/oos-client-react' }
    ]
  },
  {
    icon: '💚',
    name: 'oos-client-vue',
    desc: 'The Vue client for the RustFS-OOS enterprise object-storage drive. Based on Ant Design Vue, with built-in theme guard and browser compatibility detection, and PWA support.',
    tags: ['Vue 3', 'Ant Design Vue', 'Vite', 'TanStack Query', 'PWA'],
    links: [
      { text: 'Live Preview', href: 'https://jarodchen.github.io/oos-client-vue/' },
      { text: 'GitHub Repo', href: 'https://github.com/jarodchen/oos-client-vue' }
    ]
  },
  {
    icon: '🅰️',
    name: 'oos-client-ng',
    desc: 'The Angular client for the RustFS OOS enterprise drive, focused on end-to-end encryption and real-time collaborative editing, built on Ant Design, with PWA support.',
    tags: ['Angular', 'TypeScript', 'Ant Design', 'PWA'],
    links: [
      { text: 'Live Preview', href: 'https://jarodchen.github.io/oos-client-ng/' },
      { text: 'GitHub Repo', href: 'https://github.com/jarodchen/oos-client-ng' }
    ]
  }
]
</script>

## 🏢 Sites

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

## 📦 RustFS OOS Enterprise Drive · Multi-framework Clients

The same **RustFS OOS enterprise object-storage drive** implemented separately with the three major front-end frameworks. Their features are aligned and interfaces consistent, so you can directly compare how each framework handles the same kind of business.

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
