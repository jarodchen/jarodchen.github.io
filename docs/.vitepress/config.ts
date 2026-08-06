import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { generateBlogSidebar, updateArchivesPage, updateBlogIndexPage } from './blog-utils'
import { RssPlugin } from 'vitepress-plugin-rss'
import { BiDirectionalLinks } from '@nolebase/markdown-it-bi-directional-links' // [!code ++]


// 启动时自动生成博客首页和归档页面（仅执行一次）
updateBlogIndexPage()
updateArchivesPage()

// RSS 配置
const rssOptions = {
  title: "Jarod Chen's Blog",
  baseUrl: "https://jarodchen.github.io",
  copyright: 'Copyright © 2026 Jarod Chen',
}

export default withMermaid(defineConfig({
  title: "Jarod Chen's GitHub Pages",
  description: '技术学习历程、项目实践和知识分享',

  // Mermaid 图表配置（流程图、时序图、类图等）
  mermaid: {
    // 默认主题，可针对暗色模式在客户端进一步调整
    theme: 'default',
  },
  
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '博客', link: '/blog/categories' },
      { text: '项目', link: '/projects' },
      { text: '知识库', link: '/knowledge-base' },
      { text: '工具箱', link: '/tools' },
      { text: 'flog', link: 'https://jarodchen.github.io/flog/', target: '_blank' },
      { text: '站点', link: 'https://jarodchen.github.io/jarod-site/', target: '_blank' },
      { text: '关于我', link: '/about' },
    ],
    
    sidebar: {
      '/': [
        {
          text: '概览',
          items: [
            { text: '首页', link: '/' },
            { text: '博客', link: '/blog/categories' },
            { text: '项目导航', link: '/projects' },
            { text: '知识库', link: '/knowledge-base' },
            { text: 'flog', link: 'https://jarodchen.github.io/flog/', target: '_blank' },
            { text: '工具箱', link: '/tools' },
            { text: '站点', link: 'https://jarodchen.github.io/jarod-site/', target: '_blank' },
            { text: '关于我', link: '/about' }
          ]
        }
      ],
      '/blog/': generateBlogSidebar()
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
    
    // 将右侧的文章目录（页面导航）挪到左侧
    aside: 'right',

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
    },
    config: (md) => {
      md.use(BiDirectionalLinks({
        dir: './docs',          // 链接解析的根目录，默认文档根目录
        includesPatterns: ['**/*.md'] // 匹配文件模式
      }) as any)
    }
  },
  
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'keywords', content: 'Jarod Chen, GitHub Pages, Portfolio, .NET, JavaScript' }]
  ],
  
  vite: {
    plugins: [RssPlugin(rssOptions)]
  }
}))

// Auto-update: 2026-04-28T13:57:02.459Z