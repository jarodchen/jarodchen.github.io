---
sidebar: true
---

# Knowledge Base

A systematic, structured collection of technical knowledge bases.

<script setup>
const dotnetKb = [
  {
    icon: '🗄️',
    name: 'EF Core Knowledge Base',
    desc: 'A complete guide to Entity Framework Core, from fundamentals to enterprise practice.',
    tags: ['DbContext', 'Relational Mapping', 'Query Tuning', 'Migration', 'Performance', 'Concurrency'],
    link: 'https://jarodchen.github.io/ef-core-kb/'
  },
  {
    icon: '📨',
    name: 'MediatR Knowledge Base',
    desc: 'A systematic learning guide to MediatR, from fundamentals to source-code level.',
    tags: ['CQRS', 'Pipeline Behavior', 'Event-Driven', 'Performance', 'Source Analysis'],
    link: 'https://jarodchen.github.io/mediatr-kb/'
  }
]

const dbKb = [
  {
    icon: '🔒',
    name: 'Database Locks Knowledge Base',
    desc: 'A systematic technical reference on database locking mechanisms, organized across multiple dimensions.',
    tags: ['Lock Granularity', 'Lock Modes', 'Lock Algorithms', 'Optimistic/Pessimistic', 'Special Locks'],
    link: 'https://jarodchen.github.io/database-lock-kb/'
  },
  {
    icon: '📖',
    name: 'Database Terms Knowledge Base',
    desc: 'A systematic compilation of core database terms and technical concepts.',
    tags: ['Index & Query Tuning', 'Storage Structures', 'Transactions & Concurrency', 'Log & Durability', 'Architecture'],
    link: 'https://jarodchen.github.io/database-term-kb/'
  }
]

const archKb = [
  {
    icon: '🔁',
    name: 'Idempotency Design Knowledge Base',
    desc: 'A systematic technical reference on idempotent design, covering theory and hands-on solutions.',
    tags: ['Token Mechanism', 'Unique Index', 'Optimistic Lock', 'Distributed Lock', 'Multi-stack Practice'],
    link: 'https://jarodchen.github.io/Idempotency-kb/'
  }
]

const frontendKb = [
  {
    icon: '📊',
    name: 'ECharts Knowledge Base',
    desc: 'A systematic learning guide to the ECharts data-visualization library.',
    tags: ['Basic Charts', 'Advanced Customization', 'Interaction', 'Performance', 'Real Cases'],
    link: 'https://jarodchen.github.io/echarts-kb/'
  }
]
</script>

## ⚙️ .NET Ecosystem

<div class="cards-grid">
  <div v-for="kb in dotnetKb" :key="kb.name" class="card">
    <div class="card-icon">{{ kb.icon }}</div>
    <h3 class="card-title">{{ kb.name }}</h3>
    <p class="card-desc">{{ kb.desc }}</p>
    <div class="card-tags">
      <span v-for="tag in kb.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    <a :href="kb.link" class="card-link" target="_blank" rel="noopener">Visit Knowledge Base →</a>
  </div>
</div>

## 🗄️ Database Tech

<div class="cards-grid">
  <div v-for="kb in dbKb" :key="kb.name" class="card">
    <div class="card-icon">{{ kb.icon }}</div>
    <h3 class="card-title">{{ kb.name }}</h3>
    <p class="card-desc">{{ kb.desc }}</p>
    <div class="card-tags">
      <span v-for="tag in kb.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    <a :href="kb.link" class="card-link" target="_blank" rel="noopener">Visit Knowledge Base →</a>
  </div>
</div>

## 🏗️ Architecture

<div class="cards-grid">
  <div v-for="kb in archKb" :key="kb.name" class="card">
    <div class="card-icon">{{ kb.icon }}</div>
    <h3 class="card-title">{{ kb.name }}</h3>
    <p class="card-desc">{{ kb.desc }}</p>
    <div class="card-tags">
      <span v-for="tag in kb.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    <a :href="kb.link" class="card-link" target="_blank" rel="noopener">Visit Knowledge Base →</a>
  </div>
</div>

## 📈 Front-end Visualization

<div class="cards-grid">
  <div v-for="kb in frontendKb" :key="kb.name" class="card">
    <div class="card-icon">{{ kb.icon }}</div>
    <h3 class="card-title">{{ kb.name }}</h3>
    <p class="card-desc">{{ kb.desc }}</p>
    <div class="card-tags">
      <span v-for="tag in kb.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    <a :href="kb.link" class="card-link" target="_blank" rel="noopener">Visit Knowledge Base →</a>
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

*Welcome to explore, learn, and contribute!*
