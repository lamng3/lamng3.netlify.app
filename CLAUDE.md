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

- **Raw, direct, technical voice.** This is a math / CP / algorithms / database-CS blog. No cringy or clickbait headlines, no narrative/story openings, no cutesy metaphors ("in disguise", "wearing a costume", "quietly collapses", "a nice side effect").
- **Titles name the technique/idea, not the problem source.** The reusable, searchable thing is the concept — nobody searches "Codeforces 1082E". Use e.g. `From Range Update to Maximum Subarray`, not `Increasing Frequency (Codeforces 1082E)` and not `A Maximum Subarray in Disguise`. Put the specific problem name/number in the description and intro, not the title.
- State the result or reduction up front, then derive it. Motivation is fine; framing gimmicks are not.
- Short, descriptive section headers.
- Use `$$...$$` for MathJax (display and inline). Two confirmed gotchas on this site's MathJax:
  - **Never put a raw pipe `|` inside math** — kramdown reads it as a table delimiter and the formula renders broken.
  - **Use `\vert` for bars/cardinality, NOT `\lvert` / `\rvert`** — the latter are undefined in this site's MathJax config and error out the whole span. `\vert p \vert`, `\vert s \vert`, etc. (`\left\vert … \right\vert` for tall bars.)
  - Also avoid a bare `\*`; write `^{*}` for a star superscript so prettier doesn't escape it.
- Put C++ solutions in collapsible blocks:
  ```
  <details markdown="1">
  <summary>C++ implementation</summary>
  ...code...
  </details>
  ```
  Use my competitive-programming template (`#include <bits/stdc++.h>` + `REP`/`ll`/`vi` macros; the `preprocess()`/`solve()`/`main()` with `int tt = 1` structure).
- **Keep my implementation as-written.** When I supply code, preserve its structure, helper functions (e.g. a `kadane()` lambda), variable names, and inline `//` comments. Only strip top-of-function scratch `/* ... */` blocks — don't rewrite or inline my code into a "cleaner" version.
- Keep it light and readable by default. Heavy, formal cp-algorithms-style math (monoid formalism, potential-method proofs, etc.) is **opt-in** — only when I ask for that register.
- End with a **Practice** section: a bare list of problem links, no ratings or spoilers inline unless I ask.
- **Docs / references sections stay short** — terse one-line pointers, not sentence-long descriptions.

### Quality bar

- **Technically sound and written for students.** Every claim, formula, complexity bound, and code path must be correct — check them, don't hand-wave. Prefer precise statements over loose ones ("more than ten times the previous", not "grows geometrically"). Define terms on first use, spell out edge cases (e.g. the $$L=1$$ / block-0 case), and make sure any worked example actually computes to the stated result. Assume a motivated student reader: rigorous but approachable, no unexplained jumps.
- After drafting, do a **prose-polish pass** for smooth, natural English. I care about this.
- **Verify every external URL** (fetch it) before including it. Don't guess plausible-looking slugs — I've caught fabricated links before.

### Workflow

1. Write the post at `_posts/YYYY-MM-DD-slug.md`.
2. Run `npx prettier _posts/<file>.md --write`.
3. Commit **only** the post file. NOTE: the working tree carries unrelated tracked-file deletions — never stage or sweep those into a commit.
4. **Commit and push by default** after writing or editing a post (I want this without being asked each time).
5. Netlify auto-deploys on push; a new post takes a couple minutes to appear at the top of `/blog/` (it sorts newest-first). If it seems missing, it's almost always the deploy lag, not the post.

### Last updated

- `date:` in the front matter is the creation date (shown as "Created on …" in the header) and drives the file name and blog ordering — **never change it** on an edit.
- To show a "Last updated on …" line at the end of a post, add `last_updated` to its front matter. The layout (`_layouts/post.liquid`) renders it after the article body; if the field is absent, nothing shows.
- **Date only** (`last_updated: 2026-08-21`) renders just the date. **Date + time** (`last_updated: 2026-08-21 14:05:00`) also renders the clock time and timezone, e.g. "Last updated on August 21, 2026 at 2:05 PM PDT". The layout shows the time only when it isn't midnight. Prefer the timestamped form on edits.
- The timezone label comes from `timezone: America/Los_Angeles` in `_config.yml`; write the `last_updated` time as a naive local time and it renders in that zone (PDT/PST). Get the current time with `date "+%Y-%m-%d %H:%M:%S"`.
- When making a **substantive** edit to an already-published post, set/bump `last_updated` to the current date-time. Skip it for trivial fixes (typos, a broken link) unless asked.

## Git

- Commit messages end with the `Co-Authored-By: Claude` trailer.
- Don't commit the standing working-tree deletions unless I explicitly ask.
