# filek

filek 的个人博客：记录技术、想法与日常。

- 站点：<https://filek-mu.github.io>
- 技术栈：Node.js 静态生成器（marked + gray-matter）+ GitHub Pages + GitHub Actions
- 文章：`content/posts/*.md`，提交到 `main` 自动发布

## 本地开发

```bash
npm install
npm run build    # 生成 dist/
npm run dev      # 构建后用 http://localhost:4321 预览（需先 build）
npm run preview  # 同上，显式指定 dist/
```

## 写文章

在 `content/posts/` 新建 Markdown 文件：

```md
---
title: 标题
description: 一句话摘要，会显示在列表和 RSS 里
date: 2026-11-22
tags: [标签]
---

正文。
```

可选字段：`updated`（更新时间）、`draft: true`（草稿，不发布）。

文件名就是 URL：`hello.md` → `/posts/hello/`，子目录会保留在路径里。

## 页面

- `content/about.md`：关于页
- `scripts/build.mjs`：构建脚本，生成首页、文章页、关于页、404、RSS、sitemap
- `public/`：静态资源（`styles.css`、`favicon.svg`、`robots.txt`）
- `site.config.json`：站点标题、描述、URL、GitHub 用户名

## 发布

推送到 `main` 后，GitHub Actions 会执行 `npm ci && npm run build`，再通过 `actions/deploy-pages` 发布。仓库的 Pages Source 必须设为 **GitHub Actions**。

## 目录结构

```text
content/
  about.md
  posts/                 Markdown 文章
public/                  CSS、favicon、robots
scripts/
  build.mjs              静态生成
  serve.mjs              本地预览服务器
site.config.json         站点配置
.github/workflows/       构建与发布
```
