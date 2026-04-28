---
title: Vue 3 组合式 API 实战指南
date: 2026-04-15
tags: [Vue 3, JavaScript, Composition API, Frontend]
category: 前端开发
description: 深入理解 Vue 3 Composition API，掌握现代 Vue 开发模式
---

# Vue 3 组合式 API 实战指南

Vue 3 引入的组合式 API（Composition API）彻底改变了我们组织组件逻辑的方式。本文将通过实际案例，展示如何充分利用这一强大特性。

## 为什么选择组合式 API？

### 选项式 API 的局限性

```javascript
// ❌ 传统选项式 API：相关逻辑分散
export default {
  data() {
    return {
      searchQuery: '',
      posts: [],
      loading: false,
      error: null
    }
  },
  computed: {
    filteredPosts() {
      // 搜索逻辑
    }
  },
  methods: {
    fetchPosts() {
      // 数据获取逻辑
    },
    handleSearch() {
      // 搜索处理逻辑
    }
  },
  mounted() {
    this.fetchPosts()
  }
}
```

### 组合式 API 的优势

```javascript
// ✅ 组合式 API：按功能组织代码
import { ref, computed, onMounted } from 'vue'

export default {
  setup() {
    // 搜索功能
    const searchQuery = ref('')
    const filteredPosts = computed(() => {
      return posts.value.filter(post => 
        post.title.includes(searchQuery.value)
      )
    })
    
    // 数据获取功能
    const posts = ref([])
    const loading = ref(false)
    const error = ref(null)
    
    const fetchPosts = async () => {
      loading.value = true
      try {
        const response = await fetch('/api/posts')
        posts.value = await response.json()
      } catch (e) {
        error.value = e
      } finally {
        loading.value = false
      }
    }
    
    onMounted(() => {
      fetchPosts()
    })
    
    return {
      searchQuery,
      filteredPosts,
      posts,
      loading,
      error,
      fetchPosts
    }
  }
}
```

## 核心概念解析

### 1. reactive vs ref

```javascript
import { ref, reactive } from 'vue'

// ref：适用于基本类型
const count = ref(0)
const name = ref('Vue')

// reactive：适用于对象
const state = reactive({
  user: {
    name: 'John',
    age: 30
  },
  settings: {
    theme: 'dark',
    language: 'zh-CN'
  }
})

// 访问方式
console.log(count.value)      // 需要 .value
console.log(state.user.name)  // 不需要 .value
```

### 2. computed 计算属性

```javascript
import { ref, computed } from 'vue'

const price = ref(100)
const quantity = ref(2)
const taxRate = ref(0.1)

// 只读计算属性
const total = computed(() => {
  return price.value * quantity.value * (1 + taxRate.value)
})

// 可写计算属性
const discount = computed({
  get() {
    return total.value > 500 ? 0.2 : 0.1
  },
  set(value) {
    // 根据折扣反推价格
    price.value = 500 / (quantity.value * (1 - value))
  }
})
```

### 3. watch 与 watchEffect

```javascript
import { ref, watch, watchEffect } from 'vue'

const searchQuery = ref('')
const debouncedResults = ref([])

// watch：监听特定数据源
watch(searchQuery, (newQuery, oldQuery) => {
  console.log(`Search changed from "${oldQuery}" to "${newQuery}"`)
  // 执行防抖搜索
  debounceSearch(newQuery)
})

// watchEffect：自动追踪依赖
watchEffect(async () => {
  if (searchQuery.value) {
    const results = await fetchSearchResults(searchQuery.value)
    debouncedResults.value = results
  }
})
```

## 实战案例：Todo 应用

### 完整的 Todo 管理组件

```vue
<template>
  <div class="todo-app">
    <h1>Todo List</h1>
    
    <!-- 添加 Todo -->
    <form @submit.prevent="addTodo">
      <input v-model="newTodo" placeholder="添加新任务..." />
      <button type="submit">添加</button>
    </form>
    
    <!-- 过滤器 -->
    <div class="filters">
      <button 
        v-for="filter in filters" 
        :key="filter"
        :class="{ active: currentFilter === filter }"
        @click="currentFilter = filter"
      >
        {{ filter }}
      </button>
    </div>
    
    <!-- Todo 列表 -->
    <ul>
      <li v-for="todo in filteredTodos" :key="todo.id">
        <input 
          type="checkbox" 
          :checked="todo.completed"
          @change="toggleTodo(todo.id)"
        />
        <span :class="{ completed: todo.completed }">
          {{ todo.text }}
        </span>
        <button @click="deleteTodo(todo.id)">删除</button>
      </li>
    </ul>
    
    <!-- 统计信息 -->
    <p>
      总计: {{ todos.length }} | 
      已完成: {{ completedCount }} | 
      未完成: {{ remainingCount }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useLocalStorage } from './composables/useLocalStorage'

// 状态管理
const todos = useLocalStorage('todos', [])
const newTodo = ref('')
const currentFilter = ref('all')
const filters = ['all', 'active', 'completed']

// 计算属性
const filteredTodos = computed(() => {
  switch (currentFilter.value) {
    case 'active':
      return todos.value.filter(t => !t.completed)
    case 'completed':
      return todos.value.filter(t => t.completed)
    default:
      return todos.value
  }
})

const completedCount = computed(() => {
  return todos.value.filter(t => t.completed).length
})

const remainingCount = computed(() => {
  return todos.value.filter(t => !t.completed).length
})

// 方法
const addTodo = () => {
  if (newTodo.value.trim()) {
    todos.value.push({
      id: Date.now(),
      text: newTodo.value.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    })
    newTodo.value = ''
  }
}

const toggleTodo = (id) => {
  const todo = todos.value.find(t => t.id === id)
  if (todo) {
    todo.completed = !todo.completed
  }
}

const deleteTodo = (id) => {
  const index = todos.value.findIndex(t => t.id === id)
  if (index !== -1) {
    todos.value.splice(index, 1)
  }
}

// 监听器：自动保存
watch(todos, (newTodos) => {
  console.log('Todos updated:', newTodos.length)
}, { deep: true })
</script>

<style scoped>
.todo-app {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.filters {
  margin: 20px 0;
}

.filters button {
  margin-right: 10px;
}

.filters button.active {
  background-color: #42b983;
  color: white;
}

.completed {
  text-decoration: line-through;
  color: #999;
}
</style>
```

## 自定义 Composables

### 提取可复用逻辑

```javascript
// composables/useFetch.js
import { ref, watch } from 'vue'

export function useFetch(url) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(false)
  
  const fetchData = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      data.value = await response.json()
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }
  
  // 当 URL 变化时自动重新获取
  watch(() => url, fetchData, { immediate: true })
  
  return {
    data,
    error,
    loading,
    refetch: fetchData
  }
}
```

### 使用自定义 Composable

```vue
<script setup>
import { useFetch } from './composables/useFetch'

const { data: posts, loading, error, refetch } = useFetch('/api/posts')

const refreshPosts = async () => {
  await refetch()
}
</script>

<template>
  <div>
    <button @click="refreshPosts" :disabled="loading">
      {{ loading ? '加载中...' : '刷新' }}
    </button>
    
    <div v-if="error">错误: {{ error.message }}</div>
    
    <ul v-if="posts">
      <li v-for="post in posts" :key="post.id">
        {{ post.title }}
      </li>
    </ul>
  </div>
</template>
```

## 最佳实践

### 1. 合理组织代码结构

```
src/
├── components/       # UI 组件
├── composables/      # 可复用逻辑
│   ├── useFetch.js
│   ├── useForm.js
│   └── useAuth.js
├── stores/          # 全局状态
├── utils/           # 工具函数
└── views/           # 页面组件
```

### 2. 避免过度拆分

```javascript
// ❌ 不要为每个小功能创建单独的 composable
const { x, y } = useMouse()
const { width, height } = useWindowSize()
const { scrollY } = useScroll()

// ✅ 相关的状态放在一起
const uiState = reactive({
  mouse: { x: 0, y: 0 },
  window: { width: 0, height: 0 },
  scroll: { y: 0 }
})
```

### 3. 正确使用生命周期

```javascript
import { onMounted, onUnmounted } from 'vue'

let timer = null

onMounted(() => {
  timer = setInterval(() => {
    console.log('Tick')
  }, 1000)
})

onUnmounted(() => {
  clearInterval(timer) // 清理定时器
})
```

## 性能优化技巧

### 1. 使用 shallowRef 减少响应式开销

```javascript
import { shallowRef, triggerRef } from 'vue'

// 对于大型对象或第三方库实例
const largeData = shallowRef({ /* 大量数据 */ })

// 手动触发更新
largeData.value = newData
triggerRef(largeData)
```

### 2. 合理使用 markRaw

```javascript
import { reactive, markRaw } from 'vue'

const state = reactive({
  // 普通响应式数据
  user: { name: 'John' },
  
  // 不需要响应式的对象（如第三方库实例）
  chart: markRaw(new Chart(...))
})
```

## 总结

组合式 API 提供了更灵活的代码组织方式，特别适合：

- ✅ 大型组件的逻辑复用
- ✅ 复杂的状态管理
- ✅ TypeScript 类型推导
- ✅ 单元测试和逻辑提取

记住：**不要为了使用而使用**，根据项目规模和团队熟悉度选择合适的方案。

---

**相关资源：**
- [Vue 3 官方文档](https://vuejs.org/)
- [ECharts 在线演示](https://jarodchen.github.io/echarts-playground/)
- [项目仓库](https://github.com/jarodchen/algo-js)
