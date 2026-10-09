---
layout: page
sidebar: true
outline: false
title: Tools
description: A collection of online tools and utilities
---

<script setup>
const tools = [
  {
    icon: '📊',
    name: 'ECharts Playground',
    desc: 'A Vue3 + ECharts interactive chart playground.',
    link: 'https://jarodchen.github.io/echarts-playground/',
    tags: ['Vue3', 'ECharts']
  },
  {
    icon: '🎵',
    name: 'ABC Playground',
    desc: 'An online staff-notation editor and previewer based on abc.js.',
    link: 'https://jarodchen.github.io/abc-playground/',
    tags: ['Vue3', 'abc.js']
  },
  {
    icon: '🤖',
    name: 'AI Chat Hub',
    desc: 'A Vue3 + Vite AI chat application.',
    link: 'https://jarodchen.github.io/ai-chat-hub/',
    tags: ['Vue3', 'AI']
  },
  {
    icon: '🛠️',
    name: 'Web Tools',
    desc: 'A collection of common online tools — encoding, conversion, calculation, and more.',
    link: 'https://jarodchen.github.io/web-tools/',
    tags: ['Toolkit', 'Utility']
  },
  {
    icon: '🔤',
    name: 'UUID Generator',
    desc: 'Generate UUID v1/v4 with batch generation and format conversion.',
    link: 'https://jarodchen.github.io/web-tools/#/string/uuid-tools',
    tags: ['Toolkit', 'Dev']
  },
  {
    icon: '🔄',
    name: 'Case Converter',
    desc: 'Convert text to upper case, lower case, title case, and more.',
    link: 'https://jarodchen.github.io/web-tools/#/transform/case-converter',
    tags: ['Toolkit', 'Text']
  },
  {
    icon: '🔐',
    name: 'Password Generator',
    desc: 'Generate strong random passwords with customizable length and character sets.',
    link: 'https://jarodchen.github.io/web-tools/#/string/password-generator',
    tags: ['Toolkit', 'Security']
  },
  {
    icon: '🌐',
    name: 'Public IP Lookup',
    desc: 'Look up your network\'s public IP address and location information.',
    link: 'https://jarodchen.github.io/web-tools/#/network/public-ip',
    tags: ['Toolkit', 'Network']
  },
  {
    icon: '🔍',
    name: 'Regex Tester',
    desc: 'Test and validate regular expressions online.',
    link: 'https://jarodchen.github.io/web-tools/#/string/regex-tester',
    tags: ['Toolkit', 'Dev']
  },
  {
    icon: '📊',
    name: 'Regex Visualizer',
    desc: 'Visualize a regular expression as a graph structure.',
    link: 'https://jarodchen.github.io/web-tools/#/string/regex-visualizer',
    tags: ['Toolkit', 'Dev']
  },
  {
    icon: '📋',
    name: 'JSON Formatter',
    desc: 'Format and prettify JSON data, with validation and collapsing.',
    link: 'https://jarodchen.github.io/web-tools/#/string/json-formatter',
    tags: ['Toolkit', 'Dev']
  }
]
</script>

<div class="tools-grid">
  <div v-for="tool in tools" :key="tool.name" class="tool-card">
    <div class="tool-icon">{{ tool.icon }}</div>
    <h3 class="tool-title">{{ tool.name }}</h3>
    <p class="tool-desc">{{ tool.desc }}</p>
    <div class="tool-tags">
      <span v-for="tag in tool.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    <a :href="tool.link" class="tool-link" target="_blank">Visit Tool →</a>
  </div>
</div>

<style scoped>

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  padding: 20px 0;
  margin: 20px 40px;
}

.tool-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.tool-card:hover {
  border-color: var(--vp-c-brand);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.tool-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.tool-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--vp-c-text-1);
}

.tool-desc {
  color: var(--vp-c-text-2);
  margin: 0 0 12px 0;
  line-height: 1.5;
  font-size: 13px;
  flex-grow: 1;
}

.tool-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.tag {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand);
  border-radius: 3px;
}

.tool-link {
  display: inline-block;
  padding: 6px 14px;
  background: var(--vp-c-brand);
  color: #fff !important;
  text-decoration: none !important;
  border-radius: 4px;
  font-weight: 500;
  font-size: 13px;
  transition: all 0.2s ease;
  align-self: flex-start;
}

.tool-link:hover {
  background: var(--vp-c-brand-dark);
  transform: translateX(4px);
}

@media (max-width: 768px) {
  .tools-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }
}
</style>
