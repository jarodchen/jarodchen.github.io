import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { generateBlogSidebar, updateArchivesPage, updateBlogIndexPage } from './blog-utils'
import { updateAllCategoryPages } from './category-generator'
import { updateAllTagPages } from './tag-generator'
import { updateVaultGraphData } from './graph-generator'
import { getBlogRewrites } from './sidebar-generator'
import { RssPlugin } from 'vitepress-plugin-rss'
import { BiDirectionalLinks } from '@nolebase/markdown-it-bi-directional-links' // [!code ++]
import callout from 'vitepress-plugin-callout'
import path from 'path'
import { includeBody } from './markdown-include'
// import { createRequire } from 'module'
// const require = createRequire(import.meta.url)
// const mdItObsidianCallouts = require('markdown-it-obsidian-callouts')

// 启动时自动生成博客首页、归档页面、分类页面和标签页面（仅执行一次，build 与 dev 均执行）
updateBlogIndexPage()
updateArchivesPage()
updateAllCategoryPages()
updateAllTagPages()
// 关系图谱数据（/graph 页面消费，写入 docs/public/vault-data.json）
updateVaultGraphData()

// RSS 配置
const rssOptions = {
  title: "Jarod Chen's Blog",
  baseUrl: "https://jarodchen.github.io",
  copyright: 'Copyright © 2026 Jarod Chen',
}

export default withMermaid(defineConfig({
  title: "Jarod's Tech",
  description: '技术学习历程、项目实践和知识分享',

  // 自定义 slug：每篇笔记 frontmatter 的 slug 字段覆盖默认文件路径路由；无则降级为原路径
  rewrites: getBlogRewrites(),

  // 多语言（英文模式）：默认中文在 docs/ 根，英文在 docs/en/
  // 注意：VitePress 读取 locale 主题配置的位置是 locales.<locale>.themeConfig
  //       （而非 themeConfig.locales），故各语言 nav/sidebar 放在此处。
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      title: "Jarod's Tech",
      description: '技术学习历程、项目实践和知识分享',
      themeConfig: {
        outline: { level: [2, 3], label: '页面导航' },
        editLink: {
          pattern: 'https://github.com/jarodchen/jarodchen.github.io/edit/main/docs/:path',
          text: '在 GitHub 上编辑此页'
        },
        lastUpdated: {
          text: '最后更新于',
          formatOptions: { dateStyle: 'short', timeStyle: 'medium' }
        },
        footer: { message: 'Released under the MIT License.', copyright: 'Copyright © 2026 Jarod Chen' }
      }
    },
    en: {
      label: 'English',
      lang: 'en-US',
      title: "Jarod's Tech",
      description: 'Tech learning, projects and knowledge sharing',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Blog', link: '/en/blog/' },
          { text: 'Graph', link: '/en/graph' },
          { text: 'Projects', link: '/en/projects' },
          { text: 'Works', link: '/en/works' },
          { text: 'Knowledge Base', link: '/en/knowledge-base' },
          { text: 'Tools', link: '/en/tools' },
          { text: 'flog', link: 'https://jarodchen.github.io/flog/', target: '_blank' },
          { text: 'About', link: '/en/about' },
        ],
        sidebar: {
          '/en/': [
            {
              text: 'Overview',
              items: [
                { text: 'Home', link: '/en/' },
                { text: 'Blog', link: '/en/blog/' },
                { text: 'Projects', link: '/en/projects' },
                { text: 'Works', link: '/en/works' },
                { text: 'Knowledge Base', link: '/en/knowledge-base' },
                { text: 'Graph', link: '/en/graph' },
                { text: 'flog', link: 'https://jarodchen.github.io/flog/', target: '_blank' },
                { text: 'Tools', link: '/en/tools' },
                { text: 'About', link: '/en/about' }
              ]
            }
          ],
          '/en/blog/': generateBlogSidebar('en')
        },
        outline: { level: [2, 3], label: 'On this page' },
        editLink: {
          pattern: 'https://github.com/jarodchen/jarodchen.github.io/edit/main/docs/:path',
          text: 'Edit this page on GitHub'
        },
        lastUpdated: {
          text: 'Last updated',
          formatOptions: { dateStyle: 'short', timeStyle: 'medium' }
        },
        footer: { message: 'Released under the MIT License.', copyright: 'Copyright © 2026 Jarod Chen' }
      }
    }
  },

  // Mermaid 图表配置（流程图、时序图、类图等）
  mermaid: {
    // 默认主题，可针对暗色模式在客户端进一步调整
    theme: 'default',
  },
  
  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/jarodchen' }
    ],

    // 将右侧的文章目录（页面导航）挪到左侧
    aside: 'right',

    search: {
      provider: 'local'
    },

    // 默认（中文 / root）导航与侧边栏；英文覆盖在顶层 locales.en.themeConfig 中
    nav: [
      { text: '首页', link: '/' },
      { text: '博客', link: '/blog/categories' },
      { text: '图谱', link: '/graph' },
      { text: '项目', link: '/projects' },
      { text: '作品', link: '/works' },
      { text: '知识库', link: '/knowledge-base' },
      { text: '工具箱', link: '/tools' },
      { text: 'flog', link: 'https://jarodchen.github.io/flog/', target: '_blank' },
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
            { text: '作品导航', link: '/works' },
            { text: '知识库', link: '/knowledge-base' },
            { text: '关系图谱', link: '/graph' },
            { text: 'flog', link: 'https://jarodchen.github.io/flog/', target: '_blank' },
            { text: '工具箱', link: '/tools' },
            { text: '关于我', link: '/about' }
          ]
        }
      ],
      '/blog/': generateBlogSidebar()
    },
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
      md.use(callout)
      // 英文页嵌入中文正文（自动剥 frontmatter），路径相对 docs 根
      includeBody(md, path.resolve(__dirname, '..'))
    }
  },
  
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'keywords', content: 'Jarod Chen, GitHub Pages, Portfolio, .NET, JavaScript' }]
  ],
  
  vite: {
    plugins: [RssPlugin(rssOptions)],
    optimizeDeps: {
      // 关系图谱组件（vitepress-allyouneed 的 <VaultGraph />）依赖 d3。
      // 这些包只有打开 /graph 时才会被浏览器请求到，Vite 首次发现时会中途
      // 重新预打包并强制整页刷新，控制台随之报
      // 「Failed to load module script: Expected a JavaScript module but the server
      // responded with a MIME type of text/html」（刷新前发出的模块请求被 SPA
      // 兜底成 index.html）。这里提前声明，启动即预打包，消掉这次重载。
      include: ['d3-selection', 'd3-force', 'd3-zoom', 'd3-drag']
    }
  }
}))

// Auto-update: 2026-04-28T13:57:02.459Z