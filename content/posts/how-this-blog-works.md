---
title: 这个博客是怎么搭起来的
description: 一个几百行的 Node.js 静态生成器、GitHub Pages，和从 Markdown 到发布的完整流程。
date: 2026-11-22
tags: [技术, Node.js]
---

这个站点是纯静态的：一个几百行的 Node.js 脚本把 Markdown 变成 HTML，GitHub Actions 负责构建，GitHub Pages 负责托管。

## 目录结构

| 路径 | 作用 |
| --- | --- |
| `content/posts/` | Markdown 文章 |
| `content/about.md` | 关于页 |
| `scripts/build.mjs` | 静态生成器 |
| `public/` | CSS、favicon、robots.txt |
| `.github/workflows/deploy.yml` | 构建与发布 |

## 为什么不用现成框架

试过 Astro，但这台 Windows 机器启用了应用控制策略，Rollup 和 esbuild 的原生二进制会被直接拦掉，本地构建跑不起来。与其把验证推到 CI 上，不如换成一个我能完全看懂、在本地随时能跑通的生成器。

现在的依赖只有两个：`marked` 负责 Markdown，`gray-matter` 负责 frontmatter。都是纯 JavaScript，没有原生模块。

## 写一篇新文章

在 `content/posts/` 新建一个 `.md` 文件：

```md
---
title: 标题
description: 一句话摘要
date: 2026-11-22
tags: [标签]
---

正文。
```

提交到 `main` 分支后，Actions 会自动构建并部署，通常一两分钟就能在站点上看到。文件名就是 URL，`hello.md` 会变成 `/posts/hello/`。

## 构建流程

`scripts/build.mjs` 做四件事：

1. 扫描 `content/posts/` 下的 Markdown，解析 frontmatter，过滤草稿
2. 按日期倒序生成首页列表
3. 为每篇文章、关于页和 404 页套上同一个布局
4. 生成 RSS、sitemap，并把 `public/` 里的静态资源复制到 `dist/`

没有增量构建，也没有插件系统。文章数量上来以后如果变慢，再考虑缓存。
