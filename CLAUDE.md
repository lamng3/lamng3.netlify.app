# Working notes for Claude

This is Nathan Nguyen's personal blog (Jekyll + al-folio theme, hosted on Netlify). This file records how I like to work on it, so any session can pick up with the same conventions.

## Blog posts (`_posts/`)

Goal: **clean, clear, quality writing for interested readers.** Match the style of the existing posts; don't drift into dense or over-formal prose unless I explicitly ask for it.

### Front matter

Every post uses this shape:

```yaml
---
layout: post
title: "Some Title"
description: One or two sentences summarizing the post.
date: YYYY-MM-DD
author: Nathan Nguyen
categories: [Category, Category]
tags: [Tag, Tag, Tag]
toc:
  sidebar: right
---
```

### Structure & voice

- Open with intuition/motivation before formalism.
- Short, descriptive section headers.
- Use `$$...$$` for MathJax (display and inline).
- Put C++ solutions in collapsible blocks:
  ```
  <details markdown="1">
  <summary>C++ implementation</summary>
  ...code...
  </details>
  ```
  Use my competitive-programming template (`#include <bits/stdc++.h>` + `REP`/`ll`/`vi` macros). Strip any scratch/comment blocks out of pasted code before publishing.
- Keep it light and readable by default. Heavy, formal cp-algorithms-style math (monoid formalism, potential-method proofs, etc.) is **opt-in** — only when I ask for that register.
- End with a **Practice** section: a bare list of problem links, no ratings or spoilers inline unless I ask.
- **Docs / references sections stay short** — terse one-line pointers, not sentence-long descriptions.

### Quality bar

- After drafting, do a **prose-polish pass** for smooth, natural English. I care about this.
- **Verify every external URL** (fetch it) before including it. Don't guess plausible-looking slugs — I've caught fabricated links before.

### Workflow

1. Write the post at `_posts/YYYY-MM-DD-slug.md`.
2. Run `npx prettier _posts/<file>.md --write`.
3. Commit **only** the post file. NOTE: the working tree carries unrelated tracked-file deletions — never stage or sweep those into a commit.
4. **Commit and push by default** after writing or editing a post (I want this without being asked each time).
5. Netlify auto-deploys on push; a new post takes a couple minutes to appear at the top of `/blog/` (it sorts newest-first). If it seems missing, it's almost always the deploy lag, not the post.

## Git

- Commit messages end with the `Co-Authored-By: Claude` trailer.
- Don't commit the standing working-tree deletions unless I explicitly ask.
