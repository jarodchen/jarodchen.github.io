import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Jarod Chen's GitHub Pages",
  description: '技术学习历程、项目实践和知识分享',
  
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '关于我', link: '/about' },
      { text: '项目', link: '/projects' },
      { text: '知识库', link: '/knowledge-base' }
    ],
    
    sidebar: {
      '/': [
        {
          text: '概览',
          items: [
            { text: '首页', link: '/' },
            { text: '关于我', link: '/about' },
            { text: '项目导航', link: '/projects' },
            { text: '知识库', link: '/knowledge-base' }
          ]
        }
      ]
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/jarodchen' }
    ],
    
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Jarod Chen'
    },
    
    editLink: {
      pattern: 'https://github.com/jarodchen/jarodchen.github.io/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },
    
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },
    
    outline: {
      level: [2, 3],
      label: '页面导航'
    },
    
    search: {
      provider: 'local'
    }
  },
  
  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  },
  
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'keywords', content: 'Jarod Chen, GitHub Pages, Portfolio, .NET, JavaScript' }]
  ]
})
