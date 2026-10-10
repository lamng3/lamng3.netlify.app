# Working notes

Lam Nguyen's site, hosted on Netlify. A one-page profile plus a blog. There is no profile photo.

## Pages

- `_pages/about.md` is the homepage (`permalink: /`).
- `_pages/blog.md` is the blog index: one flat list of topics with their last-updated dates, in the order of `_data/topics.yml`. Topic names stay generic, like cp-algorithms or the USACO Guide (Binary Search, Range Queries, Hashing), so each one can hold many techniques.
- `_pages/leetcode.md` is Selected LeetCode Problems. Each row's topic links into a topic page.
- Topic pages use `layout: post`. With no `date`, the layout shows "Updated" and `last_updated`.

## Topic pages (`_pages/topics/`)

The blog is grouped by technique, like cp-algorithms. One page per topic, at `/blog/<slug>/`. There are no dated posts.

Write for readers who like math: derivation-first, clearly motivated, and readable. Follow the thought process: the first instinct, why it fails, and the question that unblocks it.

```yaml
---
layout: post
title: "Topic Name"
description: "One or two sentences about the topic."
permalink: /blog/<slug>/
last_updated: YYYY-MM-DD
author: Lam Nguyen
toc:
  sidebar: right
---
```

- Each technique is one `## Title {#id}` section. Its subsections are `###`, so the table of contents lists techniques and their parts.
- The `{#id}` is a public link target. Do not rename it. `_redirects` and `_pages/leetcode.md` point at these ids.
- To add a technique: add a section to the topic page, bump `last_updated`, and add `{id, title}` under that topic in `_data/topics.yml`. A new topic needs a new page and a new entry in `_data/topics.yml`.
- Link between techniques with `/blog/<slug>/#<id>`, or `#<id>` within the same page.
- Quote `title` and `description`. A `: ` inside an unquoted YAML value breaks the page.
- `_redirects` maps the old dated post URLs (`/blog/2026/<slug>/`) to their sections. Keep it.
