---
sidebar: true
---

# 项目

这里列出了我的主要项目，涵盖实践项目，学习项目和工具开发。

<script setup>
const practiceProjects = [
  {
    icon: '🖥️',
    name: 'my-site',
    desc: '一套仿ruoyi的基于 Vue 3 + Vite 开箱即用的管理后台骨架。一开始重写ruoyi用来学习的, 越做越接近已经可用',
    tags: ['Vue 3', 'Vite', 'Element Plus', 'VueUse', 'ECharts', 'Pinia'],
    links: {text: '预览', href: 'https://jarodchen.github.io/jarod-site/'}
  }
]

const studyProjects = [
  {
    icon: '🔗',
    name: 'C# LINQ 学习',
    desc: '深入理解 LINQ 的原理与实践，包含完整的操作符文档和代码示例。',
    tags: ['C#', '.NET', 'LINQ'],
    links: [
      { text: 'GitHub 仓库', href: 'https://github.com/jarodchen/CSharp-LINQ-learn' }
    ]
  },
  {
    icon: '🧮',
    name: '算法实现 (JavaScript)',
    desc: '常见算法与数据结构的 JavaScript 实现，包含排序、搜索、动态规划等。',
    tags: ['JavaScript', 'Mocha', 'Babel'],
    links: [
      { text: 'GitHub 仓库', href: 'https://github.com/jarodchen/algo-js' }
    ]
  }
]

const toolProjects = [
  {
    icon: '📊',
    name: 'ECharts 在线演示',
    desc: '基于 Vue3 + ECharts 的交互式图表演示平台，支持实时编辑、布局切换和多种图表类型。',
    tags: ['Vue 3', 'ECharts', 'Vite', 'Monaco Editor'],
    links: [
      { text: '在线演示', href: 'https://jarodchen.github.io/echarts-playground/' },
      { text: 'GitHub 仓库', href: 'https://github.com/jarodchen/echarts-playground' }
    ]
  },
  {
    icon: '🔊',
    name: '文本转语音工具',
    desc: '基于 Edge TTS 的文本转语音工具，支持批量转换和多种语音选项。',
    tags: ['Python', 'Edge TTS'],
    links: [
      { text: 'GitHub 仓库', href: 'https://github.com/jarodchen/text_to_speech' }
    ]
  },
  {
    icon: '🤖',
    name: 'AI Chat Hub',
    desc: '基于 Vue3 + Vite 构建的 AI 聊天应用',
    tags: ['Vue3', 'AI'],
    links: [
      { text: '在线演示', href: 'https://jarodchen.github.io/ai-chat-hub/' }
    ]
  },
  {
    icon: '🛠️',
    name: 'Web Tools',
    desc: '常用在线工具集合，包含编码、转换、计算等实用功能',
    tags: ['工具集', '实用'],
    links: [
      { text: '在线演示', href: 'https://jarodchen.github.io/web-tools/' }
    ]
  }
]
</script>

## 🚀 实践

<div class="cards-grid">
  <div v-for="project in practiceProjects" :key="project.name" class="card">
    <div class="card-icon">{{ project.icon }}</div>
    <h3 class="card-title">{{ project.name }}</h3>
    <p class="card-desc">{{ project.desc }}</p>
    <div class="card-tags">
      <span v-for="tag in project.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    <div v-if="project.links && project.links.length" class="card-links">
      <a
        v-for="link in project.links"
        :key="link.text"
        :href="link.href"
        class="card-link"
        target="_blank"
        rel="noopener"
      >{{ link.text }} →</a>
    </div>
  </div>
</div>

## 💻 学习项目

<div class="cards-grid">
  <div v-for="project in studyProjects" :key="project.name" class="card">
    <div class="card-icon">{{ project.icon }}</div>
    <h3 class="card-title">{{ project.name }}</h3>
    <p class="card-desc">{{ project.desc }}</p>
    <div class="card-tags">
      <span v-for="tag in project.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    <div v-if="project.links && project.links.length" class="card-links">
      <a
        v-for="link in project.links"
        :key="link.text"
        :href="link.href"
        class="card-link"
        target="_blank"
        rel="noopener"
      >{{ link.text }} →</a>
    </div>
  </div>
</div>

## 🛠️ 工具项目

<div class="cards-grid">
  <div v-for="project in toolProjects" :key="project.name" class="card">
    <div class="card-icon">{{ project.icon }}</div>
    <h3 class="card-title">{{ project.name }}</h3>
    <p class="card-desc">{{ project.desc }}</p>
    <div class="card-tags">
      <span v-for="tag in project.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    <div v-if="project.links && project.links.length" class="card-links">
      <a
        v-for="link in project.links"
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

---

*对所有项目都欢迎提出建议和贡献！*
