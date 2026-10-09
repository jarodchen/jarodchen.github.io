---
sidebar: true
---

# Projects

A collection of my main projects — practice work, learning exercises, and tooling.

<script setup>
const practiceProjects = [
  {
    icon: '🖥️',
    name: 'my-site',
    desc: 'A Vue 3 + Vite admin dashboard skeleton, RuoYi-inspired and ready to use out of the box. Started as a RuoYi rewrite for learning, it grew close to production-ready.',
    tags: ['Vue 3', 'Vite', 'Element Plus', 'VueUse', 'ECharts', 'Pinia'],
    links: [{
      text: 'GitHub Repo', href: 'https://github.com/jarodchen/jarod-site/',
    },{
      text: 'Preview', href: 'https://jarodchen.github.io/jarod-site/'
    }]
  },
  {
    icon: '📊',
    name: 'ECharts Performance Lab',
    desc: 'An interactive playground that compares ECharts chart performance before and after applying various optimization strategies. Two side-by-side charts use identical raw data, with real-time metrics (render time / FPS / memory) quantifying the gains.',
    tags: ['ECharts', 'Performance'],
    links: [{
      text: 'GitHub Repo', href: 'https://github.com/jarodchen/echarts-performance-lab/',
    },{
      text: 'Preview', href: 'https://jarodchen.github.io/echarts-performance-lab/'
    }]
  }
]

const studyProjects = [
  {
    icon: '🔗',
    name: 'C# LINQ Learning',
    desc: 'A deep dive into LINQ principles and practice, with complete operator docs and code examples.',
    tags: ['C#', '.NET', 'LINQ'],
    links: [
      { text: 'GitHub Repo', href: 'https://github.com/jarodchen/CSharp-LINQ-learn' }
    ]
  },
  {
    icon: '🧮',
    name: 'Algorithms (JavaScript)',
    desc: 'JavaScript implementations of common algorithms and data structures — sorting, searching, dynamic programming, and more.',
    tags: ['JavaScript', 'Mocha', 'Babel'],
    links: [
      { text: 'GitHub Repo', href: 'https://github.com/jarodchen/algo-js' }
    ]
  }
]

const toolProjects = [
  {
    icon: '📊',
    name: 'ECharts Playground',
    desc: 'A Vue3 + ECharts interactive chart playground with live editing, layout switching, and many chart types.',
    tags: ['Vue 3', 'ECharts', 'Vite', 'Monaco Editor'],
    links: [
      { text: 'Live Demo', href: 'https://jarodchen.github.io/echarts-playground/' },
      { text: 'GitHub Repo', href: 'https://github.com/jarodchen/echarts-playground' }
    ]
  },
  {
    icon: '🔊',
    name: 'Text to Speech',
    desc: 'An Edge TTS based text-to-speech tool with batch conversion and multiple voice options.',
    tags: ['Python', 'Edge TTS'],
    links: [
      { text: 'GitHub Repo', href: 'https://github.com/jarodchen/text_to_speech' }
    ]
  },
  {
    icon: '🤖',
    name: 'AI Chat Hub',
    desc: 'A Vue3 + Vite AI chat application.',
    tags: ['Vue3', 'AI'],
    links: [
      { text: 'Live Demo', href: 'https://jarodchen.github.io/ai-chat-hub/' }
    ]
  },
  {
    icon: '🛠️',
    name: 'Web Tools',
    desc: 'A collection of handy online tools — encoding, conversion, calculation, and more.',
    tags: ['Toolkit', 'Utility'],
    links: [
      { text: 'Live Demo', href: 'https://jarodchen.github.io/web-tools/' }
    ]
  }
]
</script>

## 🚀 Practice

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

## 💻 Study Projects

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

## 🛠️ Tool Projects

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

*Suggestions and contributions to any of these projects are always welcome!*
