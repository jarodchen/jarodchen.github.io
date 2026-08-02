---
sidebar: true
---

# 知识库

系统化、结构化的技术知识库集合。

<script setup>
const dotnetKb = [
  {
    icon: '🗄️',
    name: 'EF Core 知识库',
    desc: 'Entity Framework Core 从基础到企业级实践的完整指南。',
    tags: ['DbContext', '关系映射', '查询优化', '迁移管理', '性能调优', '并发控制'],
    link: 'https://jarodchen.github.io/ef-core-kb/'
  },
  {
    icon: '📨',
    name: 'MediatR 知识库',
    desc: 'MediatR 从基础到源码级别的系统化学习指南。',
    tags: ['CQRS 模式', '管道行为', '事件驱动', '性能优化', '源码解析'],
    link: 'https://jarodchen.github.io/mediatr-kb/'
  }
]

const dbKb = [
  {
    icon: '🔒',
    name: '数据库锁知识库',
    desc: '数据库锁机制的系统化技术文档，按多维度分类组织内容。',
    tags: ['锁粒度', '锁模式', '锁算法', '乐观/悲观锁', '特殊锁类型'],
    link: 'https://jarodchen.github.io/database-lock-kb/'
  },
  {
    icon: '📖',
    name: '数据库术语知识库',
    desc: '数据库核心术语与技术概念的系统化整理。',
    tags: ['索引与查询优化', '存储结构', '事务并发', '日志持久化', '架构设计'],
    link: 'https://jarodchen.github.io/database-term-kb/'
  }
]

const archKb = [
  {
    icon: '🔁',
    name: '幂等性设计知识库',
    desc: '幂等性设计的系统化技术文档，包含理论基础与实战方案。',
    tags: ['Token 机制', '唯一索引', '乐观锁', '分布式锁', '多技术栈实践'],
    link: 'https://jarodchen.github.io/Idempotency-kb/'
  }
]

const frontendKb = [
  {
    icon: '📊',
    name: 'ECharts 知识库',
    desc: 'ECharts 数据可视化库的系统化学习指南。',
    tags: ['基础图表', '高级定制', '交互设计', '性能优化', '实战案例'],
    link: 'https://jarodchen.github.io/echarts-kb/'
  }
]
</script>

## ⚙️ .NET 生态

<div class="cards-grid">
  <div v-for="kb in dotnetKb" :key="kb.name" class="card">
    <div class="card-icon">{{ kb.icon }}</div>
    <h3 class="card-title">{{ kb.name }}</h3>
    <p class="card-desc">{{ kb.desc }}</p>
    <div class="card-tags">
      <span v-for="tag in kb.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    <a :href="kb.link" class="card-link" target="_blank" rel="noopener">访问知识库 →</a>
  </div>
</div>

## 🗄️ 数据库技术

<div class="cards-grid">
  <div v-for="kb in dbKb" :key="kb.name" class="card">
    <div class="card-icon">{{ kb.icon }}</div>
    <h3 class="card-title">{{ kb.name }}</h3>
    <p class="card-desc">{{ kb.desc }}</p>
    <div class="card-tags">
      <span v-for="tag in kb.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    <a :href="kb.link" class="card-link" target="_blank" rel="noopener">访问知识库 →</a>
  </div>
</div>

## 🏗️ 架构设计

<div class="cards-grid">
  <div v-for="kb in archKb" :key="kb.name" class="card">
    <div class="card-icon">{{ kb.icon }}</div>
    <h3 class="card-title">{{ kb.name }}</h3>
    <p class="card-desc">{{ kb.desc }}</p>
    <div class="card-tags">
      <span v-for="tag in kb.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    <a :href="kb.link" class="card-link" target="_blank" rel="noopener">访问知识库 →</a>
  </div>
</div>

## 📈 前端可视化

<div class="cards-grid">
  <div v-for="kb in frontendKb" :key="kb.name" class="card">
    <div class="card-icon">{{ kb.icon }}</div>
    <h3 class="card-title">{{ kb.name }}</h3>
    <p class="card-desc">{{ kb.desc }}</p>
    <div class="card-tags">
      <span v-for="tag in kb.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    <a :href="kb.link" class="card-link" target="_blank" rel="noopener">访问知识库 →</a>
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
  align-self: flex-start;
}

.card-link:hover {
  background: var(--vp-c-brand-dark);
  transform: translateX(2px);
}
</style>

---

*欢迎查阅、学习和贡献！*
