---
sidebar: true
---

# 关于我

<div class="about-hero">
  <div class="avatar">👨‍💻</div>
  <p class="slogan">热爱技术的开发者，专注于构建高质量、可扩展的软件系统。</p>
  <a class="gh-btn" href="https://github.com/jarodchen" target="_blank" rel="noopener">
    <span class="vpi-social-github"></span> GitHub: @jarodchen
  </a>
</div>

<script setup>
const directions = [
  {
    icon: '⚙️',
    title: '后端开发',
    skills: ['C#','F#','.NET Core', 'ASP.NET Core', 'RESTful API', 
    'Nodejs', 'Nestjs', 'fastify', 'Python']
  },
  {
    icon: '🌐',
    title: '前端开发',
    skills: ['JavaScript', 'TypeScript', 'Vue.js', 'React']
  },
  {
    icon: '🗄️',
    title: '数据库',
    skills: ['SQL Server', 'PostgreSQL', 'MySQL', 'Redis', '性能优化', 'MongoDB', 'Elasticsearch']
  },
  {
    icon: '🚀',
    title: 'DevOps',
    skills: ['Docker', 'Kubernetes', 'GitHub Actions', 'CI/CD', 'Jekins']
  }
]

const principles = [
  { icon: '🎯', title: '深度优先', desc: '深入理解核心技术原理' },
  { icon: '🔧', title: '实践驱动', desc: '通过实际项目验证理论知识' },
  { icon: '📝', title: '持续分享', desc: '将学习成果整理成文档' }
]
</script>

## 技术方向

<div class="dir-grid">
  <div v-for="d in directions" :key="d.title" class="dir-card">
    <div class="dir-icon">{{ d.icon }}</div>
    <h3 class="dir-title">{{ d.title }}</h3>
    <div class="dir-tags">
      <span v-for="s in d.skills" :key="s" class="tag">{{ s }}</span>
    </div>
  </div>
</div>

## 学习理念

<div class="principles-grid">
  <div v-for="p in principles" :key="p.title" class="principle-card">
    <div class="principle-icon">{{ p.icon }}</div>
    <h3 class="principle-title">{{ p.title }}</h3>
    <p class="principle-desc">{{ p.desc }}</p>
  </div>
</div>

## 联系方式

<div class="contact">
  <a href="https://github.com/jarodchen" class="contact-btn" target="_blank" rel="noopener">
    <span class="vpi-social-github"></span> GitHub
  </a>
  <a href="mailto:498073544@163.com" class="contact-btn">✉️ 498073544@163.com</a>
  <a href="https://jarodchen.github.io/" class="contact-btn" target="_blank" rel="noopener">📝 技术博客</a>
</div>

<style scoped>
.about-hero {
  text-align: center;
  padding: 32px 20px 24px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  margin: 24px 0 32px;
}

.avatar {
  font-size: 64px;
  line-height: 1;
  margin-bottom: 12px;
}

.slogan {
  font-size: 17px;
  color: var(--vp-c-text-2);
  margin: 0 0 20px;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
}

.gh-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  background: var(--vp-c-brand);
  color: #fff !important;
  text-decoration: none !important;
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
}

.gh-btn:hover {
  background: var(--vp-c-brand-dark);
  transform: translateY(-1px);
}

.dir-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin: 20px 0;
}

.dir-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 20px;
  transition: all 0.3s ease;
}

.dir-card:hover {
  border-color: var(--vp-c-brand);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.dir-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.dir-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--vp-c-text-1);
}

.dir-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand);
  border-radius: 3px;
}

.principles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin: 20px 0;
}

.principle-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
}

.principle-card:hover {
  border-color: var(--vp-c-brand);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.principle-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.principle-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 6px;
  color: var(--vp-c-text-1);
}

.principle-desc {
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin: 0;
  line-height: 1.6;
}

.contact {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  margin: 24px 0;
}

.contact-btn {
  white-space: nowrap;
}

.contact-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: var(--vp-c-brand);
  color: #fff !important;
  text-decoration: none !important;
  border-radius: 6px;
  font-weight: 500;
  font-size: 15px;
  transition: all 0.2s ease;
}

.contact-btn:hover {
  background: var(--vp-c-brand-dark);
  transform: translateY(-1px);
}
</style>
