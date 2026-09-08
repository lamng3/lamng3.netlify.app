# Working notes for Claude

This is Nathan Nguyen's personal blog (Jekyll + al-folio theme, hosted on Netlify). This file records how I like to work on it, so any session can pick up with the same conventions.

## Blog posts (`_posts/`)

Goal: **clean, clear, quality writing for interested readers who like math.** Match the style of the existing posts: mathematically rigorous and derivation-first, but always clearly motivated and readable — depth is welcome, gratuitous notation-density is not.

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

- **Two request flavors.** I'll either (a) hand you a specific problem to write up, or (b) name a **topic** to explain — a data structure, algorithm, layout, or concept (e.g. "write about Compressed Sparse Row"). For a topic, write an accessible explainer at the same bar: what it is, how it works step by step, why it beats the naive alternative, a worked usage, and the reusable pattern. If I paste template/library code, _study it_ and present a clean, easy-to-follow version **in my macro style** (`REP`/`FOR`/`vi`/`pb`/`sz`, not a foreign library's `vc`/`eb`/`len`), and it's fine to simplify a clever-but-cryptic step into a plainer one (say so).
- **Raw, direct, technical voice.** This is a math / CP / algorithms / database-CS blog. No cringy or clickbait headlines, no narrative/story openings, no cutesy metaphors ("in disguise", "wearing a costume", "quietly collapses", "a nice side effect").
- **Titles: lead with a memorable technique keyword, then a colon, then a short descriptor** — `Keyword: Descriptor`. Examples: `Digit DP: Choosing the Right State`, `Segment Tree Walk: Descending to the Answer`, `Hashing: Rolling and XOR`, `Reachability DP: Make the Prefix Sum the Variable`. The keyword is the searchable, rememberable technique name — a reader should be able to recall the post by it and find siblings that share it. Avoid clever standalone phrases with no leading keyword (`Make the Prefix Sum the Variable`, `Permutations, Parenthesizations, and Precision`). Never put the problem source in the title (no "Codeforces 1082E"); that goes in the description and intro.
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
- **I like math — lean into it.** Rigorous, derivation-first exposition is the default, not something to water down: prove the claims (bijections, degrees-of-freedom / counting arguments, inclusion-exclusion, invariants), _derive_ the formula rather than stating it, and back it with a concrete worked numeric example and a sanity check (e.g. an edge case that the formula must satisfy). Math is a feature of this blog.
- The above is not a license for gratuitous formalism. Very notation-dense cp-algorithms register (monoid algebra, potential-method proofs written out in full) stays **opt-in** — reach for it only when I ask. Default: mathematically rigorous but clearly motivated and readable.
- **For DP posts (especially digit DP), make state design the centerpiece.** Ask "what is the least we must remember?" and answer it explicitly: list each state dimension with its meaning, range, and _why_ it is needed, ideally in a small table. Call out the compression tricks that make the state small — carry a remainder $$\bmod\ k$$ instead of the whole number, a signed difference instead of two counts, etc. That reasoning is the lesson, more than the code.
- **Close by generalizing.** Before the Docs/Practice lists, end with a substantive section that lifts the specific solution into the reusable pattern(s) behind it: name the transferable move(s) with a concrete trigger ("when the objective is secretly a max-or-min, search feasibility"; "when a rule couples everything through a running total, make the total the variable"), generalize past this one problem, and cross-link sibling posts (`{% post_url … %}`) when the same instinct recurs. Write it as real prose — a few paragraphs, not a terse recap — and don't slap a meta-label on it (no "mental model", no "TL;DR").
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
