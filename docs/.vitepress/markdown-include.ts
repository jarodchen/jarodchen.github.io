import fs from 'fs'
import path from 'path'

/**
 * 极简 include 插件：在「英文界面」页面里嵌入「中文原文件」的正文（自动剥掉
 * frontmatter），实现「英文 UI + 中文正文、单一内容源」。语法：
 *
 *   <!-- @include-body: blog/2026/xxx.md -->
 *
 * 路径相对于 docs 根目录（srcDir）；被包含文件只取 frontmatter 之后的正文。
 * 仅做一层包含（不满足嵌套包含），PoC 足够。
 */
export function includeBody(md: any, rootDir: string) {
  const originalRender = md.render.bind(md)
  md.render = (src: string, env?: unknown) => {
    const processed = src.replace(
      /<!--\s*@include-body:\s*([^\s]+)\s*-->/g,
      (_match, relPath: string) => {
        const abs = path.resolve(rootDir, relPath)
        if (!fs.existsSync(abs)) return `> [include 失败：找不到 ${relPath}]`
        let content = fs.readFileSync(abs, 'utf-8')
        // 去掉开头的 --- ... --- frontmatter 块，只保留正文
        content = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
        return content
      }
    )
    return originalRender(processed, env as any)
  }
}
