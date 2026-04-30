---
layout: home
sidebar: false
outline: false
title: 工具箱
description: 在线工具和实用程序集合
---

# 工具箱

这里收集了一些实用的在线工具和应用程序。

<script setup>
const tools = [
  {
    icon: '📊',
    name: 'ECharts Playground',
    desc: '基于 Vue3 + ECharts 的交互式图表演示平台',
    link: 'https://jarodchen.github.io/echarts-playground/',
    tags: ['Vue3', 'ECharts']
  },
  {
    icon: '🎵',
    name: 'ABC Playground',
    desc: '基于 abc.js 的在线五线谱编辑和预览工具',
    link: 'https://jarodchen.github.io/abc-playground/',
    tags: ['Vue3', 'abc.js']
  },
  {
    icon: '🤖',
    name: 'AI Chat Hub',
    desc: '基于 Vue3 + Vite 构建的 AI 聊天应用',
    link: 'https://jarodchen.github.io/ai-chat-hub/',
    tags: ['Vue3', 'AI']
  },
  {
    icon: '🛠️',
    name: 'Web Tools',
    desc: '常用在线工具集合，包含编码、转换、计算等实用功能',
    link: 'https://jarodchen.github.io/web-tools/',
    tags: ['工具集', '实用']
  },
  {
    icon: '🔤',
    name: 'UUID 生成器',
    desc: '生成 UUID v1/v4，支持批量生成和格式转换',
    link: 'https://jarodchen.github.io/web-tools/#/string/uuid-tools',
    tags: ['工具集', '开发']
  },
  {
    icon: '🔄',
    name: '大小写转换',
    desc: '转换文本为大写、小写、标题格式等',
    link: 'https://jarodchen.github.io/web-tools/#/transform/case-converter',
    tags: ['工具集', '文本']
  },
  {
    icon: '🔐',
    name: '密码生成器',
    desc: '生成高强度随机密码，支持自定义长度和字符类型',
    link: 'https://jarodchen.github.io/web-tools/#/string/password-generator',
    tags: ['工具集', '安全']
  },
  {
    icon: '🌐',
    name: '公网 IP 查询',
    desc: '查询当前网络的公网 IP 地址和位置信息',
    link: 'https://jarodchen.github.io/web-tools/#/network/public-ip',
    tags: ['工具集', '网络']
  },
  {
    icon: '🔍',
    name: '正则表达式测试',
    desc: '在线测试和验证正则表达式',
    link: 'https://jarodchen.github.io/web-tools/#/string/regex-tester',
    tags: ['工具集', '开发']
  },
  {
    icon: '📊',
    name: '正则可视化',
    desc: '将正则表达式可视化为图形结构',
    link: 'https://jarodchen.github.io/web-tools/#/string/regex-visualizer',
    tags: ['工具集', '开发']
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
    <a :href="tool.link" class="tool-link" target="_blank">访问工具 →</a>
  </div>
</div>

<style scoped>
.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  padding: 20px 0;
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

---

## 贡献

如果你有好的工具想法或建议，欢迎在 [GitHub](https://github.com/jarodchen/jarodchen.github.io) 上提出 Issue 或 Pull Request。
