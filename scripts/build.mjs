#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

const root = process.cwd();
const dist = path.join(root, 'dist');
const contentDir = path.join(root, 'content');
const postsDir = path.join(contentDir, 'posts');
const publicDir = path.join(root, 'public');

const config = JSON.parse(await fs.readFile(path.join(root, 'site.config.json'), 'utf8'));
const siteUrl = config.url.replace(/\/$/, '');

const escapeHtml = (value = '') =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );

const isoDate = (date) => date.toISOString().slice(0, 10);
const href = (pathname) => `${siteUrl}${pathname}`;
const encoded = (slug) => encodeURI(slug);

async function listMarkdown(dir) {
  const files = [];
  async function walk(current) {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile() && /\.mdx?$/i.test(entry.name)) files.push(full);
    }
  }
  await walk(dir);
  return files;
}

function readDate(value, label) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) throw new Error(`${label}: frontmatter 的 date 无法解析`);
  return date;
}

async function loadPosts() {
  const posts = [];
  for (const file of await listMarkdown(postsDir)) {
    const relative = path.relative(postsDir, file).split(path.sep).join('/');
    const slug = relative.replace(/\.mdx?$/i, '');
    const raw = await fs.readFile(file, 'utf8');
    const { data, content } = matter(raw);
    if (!data.title) throw new Error(`${relative}: 缺少 frontmatter title`);
    if (!data.date) throw new Error(`${relative}: 缺少 frontmatter date`);
    posts.push({
      slug,
      title: String(data.title),
      description: data.description ? String(data.description) : '',
      date: readDate(data.date, relative),
      updated: data.updated ? readDate(data.updated, relative) : null,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      draft: data.draft === true,
      html: await marked.parse(content, { gfm: true }),
    });
  }
  posts.sort((a, b) => b.date.valueOf() - a.date.valueOf() || a.slug.localeCompare(b.slug));
  return posts;
}

function tagsHtml(tags) {
  if (tags.length === 0) return '';
  return `<span class="tags">${tags
    .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join('')}</span>`;
}

function layout({ title, description, pathname, body, active = '', type = 'website' }) {
  const canonical = href(pathname);
  const pageTitle = title ? `${title} · ${config.title}` : `${config.title} · ${config.tagline}`;
  const pageDescription = description || config.description;
  const navItem = (hrefPath, label, key) =>
    `<a href="${hrefPath}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`;

  return `<!doctype html>
<html lang="${config.language}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(pageDescription)}" />
    <link rel="canonical" href="${canonical}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="alternate" type="application/rss+xml" title="${escapeHtml(config.title)}" href="/rss.xml" />
    <link rel="stylesheet" href="/styles.css" />
    <meta name="theme-color" content="#faf9f7" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#141514" media="(prefers-color-scheme: dark)" />
    <meta property="og:title" content="${escapeHtml(pageTitle)}" />
    <meta property="og:description" content="${escapeHtml(pageDescription)}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:site_name" content="${escapeHtml(config.title)}" />
    <meta property="og:locale" content="zh_CN" />
    <meta name="twitter:card" content="summary" />
    <script>
      try {
        var storedTheme = localStorage.getItem('theme');
        if (storedTheme === 'light' || storedTheme === 'dark') {
          document.documentElement.setAttribute('data-theme', storedTheme);
        }
      } catch (error) {}
    </script>
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="/">${escapeHtml(config.title)}</a>
      <nav>
        ${navItem('/', '首页', 'home')}
        ${navItem('/about/', '关于', 'about')}
        <a href="/rss.xml">RSS</a>
        <button class="theme-toggle" id="theme-toggle" type="button" aria-label="切换深色模式" title="切换深色模式">◐</button>
      </nav>
    </header>
    <main>
${body}
    </main>
    <footer class="site-footer">
      <p>© ${new Date().getFullYear()} ${escapeHtml(config.author)} · <a href="https://github.com/${config.github}" rel="me">GitHub</a> · <a href="/rss.xml">RSS</a></p>
    </footer>
    <script>
      (function () {
        var button = document.getElementById('theme-toggle');
        if (!button) return;
        button.addEventListener('click', function () {
          var root = document.documentElement;
          var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          var current = root.getAttribute('data-theme') || (prefersDark ? 'dark' : 'light');
          var next = current === 'dark' ? 'light' : 'dark';
          root.setAttribute('data-theme', next);
          try {
            localStorage.setItem('theme', next);
          } catch (error) {}
        });
      })();
    </script>
  </body>
</html>
`;
}

function homePage(posts) {
  const items = posts
    .map(
      (post) => `        <article class="post-item">
          <h3><a href="/posts/${encoded(post.slug)}/">${escapeHtml(post.title)}</a></h3>
          <p class="meta"><time datetime="${post.date.toISOString()}">${isoDate(post.date)}</time>${tagsHtml(post.tags)}</p>${post.description ? `\n          <p class="desc">${escapeHtml(post.description)}</p>` : ''}
        </article>`,
    )
    .join('\n');

  return layout({
    pathname: '/',
    active: 'home',
    body: `      <section class="intro">
        <h1>你好，我是 ${escapeHtml(config.author)}。</h1>
        <p>这里记录技术、想法与日常。文章用 Markdown 写作，提交后由 GitHub Actions 构建并发布。</p>
      </section>

      <section class="post-list" aria-labelledby="posts-title">
        <h2 class="section-title" id="posts-title">文章</h2>
${items || '        <p class="desc">还没有文章。</p>'}
      </section>`,
  });
}

function postPage(post) {
  return layout({
    title: post.title,
    description: post.description,
    pathname: `/posts/${encoded(post.slug)}/`,
    type: 'article',
    body: `      <article class="post">
        <header class="post-header">
          <a class="back" href="/">← 返回首页</a>
          <h1>${escapeHtml(post.title)}</h1>
          <p class="meta">
            <time datetime="${post.date.toISOString()}">${isoDate(post.date)}</time>${tagsHtml(post.tags)}
          </p>
        </header>
        <div class="prose">
${post.html}
        </div>
      </article>`,
  });
}

function aboutPage(about) {
  return layout({
    title: about.title,
    description: about.description,
    pathname: '/about/',
    active: 'about',
    body: `      <article class="post">
        <header class="post-header">
          <a class="back" href="/">← 返回首页</a>
          <h1>${escapeHtml(about.title)}</h1>
        </header>
        <div class="prose">
${about.html}
        </div>
      </article>`,
  });
}

function notFoundPage() {
  return layout({
    title: '页面不存在',
    description: '这个页面不存在。',
    pathname: '/404.html',
    body: `      <section class="not-found">
        <p class="code">404</p>
        <h1>这个页面不存在</h1>
        <p><a href="/">返回首页</a></p>
      </section>`,
  });
}

function rssFeed(posts) {
  const items = posts
    .map(
      (post) => `    <item>
      <title>${escapeHtml(post.title)}</title>
      <link>${href(`/posts/${encoded(post.slug)}/`)}</link>
      <guid isPermaLink="true">${href(`/posts/${encoded(post.slug)}/`)}</guid>
      <description>${escapeHtml(post.description)}</description>
      <pubDate>${post.date.toUTCString()}</pubDate>
${post.tags.map((tag) => `      <category>${escapeHtml(tag)}</category>`).join('\n')}
    </item>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(config.title)}</title>
    <link>${href('/')}</link>
    <description>${escapeHtml(config.description)}</description>
    <language>zh-cn</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${href('/rss.xml')}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

function sitemap(posts) {
  const urls = [
    { loc: href('/'), lastmod: posts[0] ? isoDate(posts[0].date) : isoDate(new Date()) },
    { loc: href('/about/'), lastmod: posts[0] ? isoDate(posts[0].date) : isoDate(new Date()) },
    ...posts.map((post) => ({ loc: href(`/posts/${encoded(post.slug)}/`), lastmod: isoDate(post.updated ?? post.date) })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((entry) => `  <url><loc>${entry.loc}</loc><lastmod>${entry.lastmod}</lastmod></url>`).join('\n')}
</urlset>
`;
}

async function writeFile(relative, contents) {
  const target = path.join(dist, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, contents);
}

const posts = await loadPosts();
const published = posts.filter((post) => !post.draft);

await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(dist, { recursive: true });
await fs.cp(publicDir, dist, { recursive: true });

await writeFile('index.html', homePage(published));
for (const post of published) {
  await writeFile(path.join('posts', post.slug, 'index.html'), postPage(post));
}

const aboutSource = await fs.readFile(path.join(contentDir, 'about.md'), 'utf8');
const aboutData = matter(aboutSource);
const about = {
  title: aboutData.data.title ? String(aboutData.data.title) : '关于',
  description: aboutData.data.description ? String(aboutData.data.description) : '',
  html: await marked.parse(aboutData.content, { gfm: true }),
};
await writeFile(path.join('about', 'index.html'), aboutPage(about));

await writeFile('404.html', notFoundPage());
await writeFile('rss.xml', rssFeed(published));
await writeFile('sitemap.xml', sitemap(published));
await writeFile('.nojekyll', '');

console.log(`Built ${published.length} post(s) into dist/`);
