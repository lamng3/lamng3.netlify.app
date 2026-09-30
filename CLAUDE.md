# Working notes

Lam Nguyen's site, hosted on Netlify. A one-page profile plus a blog. There is no profile photo.

## Pages

- `_pages/about.md` is the homepage (`permalink: /`).
- `_pages/blog.md` is a reverse-chronological list of post titles and dates. No category chips and no month sidebar.
- Posts use `layout: post`. The layout shows the title and the date.

## Blog posts (`_posts/`)

Write for readers who like math: derivation-first, clearly motivated, and readable.

```yaml
---
layout: post
title: "Some Title"
description: One or two sentences summarizing the post.
date: YYYY-MM-DD
author: Lam Nguyen
categories: [Data Structures]
tags: [Heap, LeetCode]
---
```

- Do not put `: ` (colon followed by a space) in an unquoted YAML value. Quote the value or reword it. An unquoted colon makes the post title blank and the page 404.
- `date:` is the creation date. It drives the filename and the blog order. Do not change it when editing a published post.
- Keep new posts in the existing categories: Segment Trees, Dynamic Programming, Combinatorics, Data Structures, Hashing, Number Theory, Trees & Graphs, Problem Sets.
