---
layout: post
title: "Compressed Sparse Row: A Flat Adjacency List"
description: CSR is a data layout, not an algorithm — the standard flat way to store n groups of variable size in one contiguous array plus an offset table. Its build is a counting sort, it replaces vector<vector<int>> for a 2-3x speedup on graph-heavy problems, and the whole thing is O(n + m).
date: 2026-09-08
author: Nathan Nguyen
categories: [Data Structures, Algorithms]
tags: [CSR, Compressed Sparse Row, Data Layout, Counting Sort, Adjacency List, Graphs, Cache Locality, Competitive Programming]
toc:
  sidebar: right
---

Almost every graph problem opens the same way: read the edges, and store for each vertex the list of its neighbors. The reflex in C++ is `vector<vector<int>>` — one inner vector per vertex, `g[u].push_back(v)` for each edge. It is correct, and it is what everyone writes first.

It also quietly does a lot of work. Each of the $$n$$ inner vectors is its own heap allocation that reallocates as you push into it, and those vectors end up scattered across memory. Later, when you walk a vertex's neighbors — which a traversal does constantly — you follow a pointer to some far-off block, take a cache miss, read a few integers, then jump somewhere else for the next vertex. On a graph with millions of edges and a tight time limit, that pointer-chasing is often the whole difference between passing and timing out.

The nagging part is that we do not actually _need_ $$n$$ separate containers. The neighbor lists never change once the graph is read; we only ever scan them. So the question is: **can we store "a variable-length list per vertex" in a way that is compact and streams through memory in order?**

**Compressed Sparse Row (CSR)** is the answer. It is not an algorithm; it is a **data layout** — the standard flat way to hold a bucketed collection: $$n$$ groups, each with a variable number of values, filled once and then read many times. Adjacency lists are the headline use, but the same layout groups records by a key, or stores the rows of a sparse matrix (where the name comes from). Where a segment tree is the answer to "range queries on a changing array," CSR is the answer to "many fixed groups, scanned over and over."

## The layout

Keep two arrays:

- `dat` — every element, with the groups laid out back to back in one flat array.
- `ptr` — an array of $$n+1$$ offsets marking where each group begins.

Group $$i$$ is then the contiguous slice

$$
\text{dat}\bigl[\,\text{ptr}[i]\ ..\ \text{ptr}[i+1]\,\bigr).
$$

That is the entire idea. Instead of $$n$$ separate heap allocations (one per inner vector), there is a single `dat` array and a single `ptr` array, and reading group $$i$$ is just walking a pointer from `ptr[i]` to `ptr[i+1]`.

## Two phases: stage, then group

You cannot know a group's size until you have seen all its elements, so CSR is built in two phases.

- **`add(i, x)`** stages one element: it appends the pair "value `x` belongs to group `i`" into two parallel arrays, unsorted, in whatever order you call it. Nothing is grouped yet.
- **`build()`** does all the grouping in a single pass, then frees the staging data. A `built` flag enforces the discipline: no `add` after `build`, no reads before it.

## `build` is a counting sort

This is the part worth actually knowing. `build` sorts the staged elements by their group id, and it does it in $$O(n + m)$$ (with $$m$$ the number of elements) using **counting sort** — count, prefix-sum, scatter.

1. **Count each group's size, written one slot to the right.** Zero out `ptr` (size $$n+1$$) and, for every staged element in group $$i$$, do `ptr[i+1]++`. After this, `ptr[i+1]` holds the size of group $$i$$ and `ptr[0]` is $$0$$. The deliberate off-by-one is what makes the next step land correctly.
2. **Prefix-sum the counts into start offsets.** Running `ptr[i] += ptr[i-1]` turns each `ptr[i]` into the total size of all earlier groups — which is exactly where group $$i$$ _starts_. Now `ptr[i]` is the start of group $$i$$ and `ptr[i+1]` its end, so the slice invariant holds.
3. **Scatter each element into its group.** Copy the start offsets into a moving cursor `cur`, then walk the staged elements in insertion order and write element $$k$$ to `tmp[cur[group of k]++]`. The post-increment advances that group's cursor, so a group's elements pack in consecutively; because we visit them in insertion order, their relative order inside the group is preserved — the sort is **stable**.

Swap `tmp` into `dat`, drop the staging array, and you are done. `ptr` still holds the start offsets (we advanced the _copy_ `cur`, not `ptr`).

> maspy's original does step 3 slightly differently: it advances `ptr` itself during the scatter, which leaves `ptr` shifted one slot too far, then rotates it back with a `pop_back` and an `insert(begin, 0)`. Correct and clever, but the extra cursor array above reads more plainly for the cost of one $$O(n)$$ scratch array.

## Reading a group

A group is exposed as a tiny view — two raw pointers with `begin`/`end` — so `for (int v : G[u])` compiles to a plain pointer walk with no indirection:

```cpp
struct range {
    T *first, *last;
    T* begin() const { return first; }
    T* end()   const { return last; }
    int size() const { return int(last - first); }
    bool empty() const { return first == last; }
};
```

<details markdown="1">
<summary>C++ implementation (in the CP template style)</summary>

```cpp
#include <bits/stdc++.h>
using namespace std;

using ll = long long;
using vi = vector<int>;
using pii = pair<int, int>;

#define REP(i, n) for (int i = 0; i < (n); i++)
#define FOR(i, a, b) for (int i = (a); i <= (b); i++)
#define pb push_back
#define sz(x) (int)((x).size())

template <typename T>
struct CSR {
    int n;
    bool built = false;
    vi ptr;          // after build: n+1 offsets, group i = dat[ptr[i] .. ptr[i+1])
    vi grp;          // staged group id of each element (freed after build)
    vector<T> dat;   // the elements, flat

    CSR(int n = 0) : n(n) {}

    // stage x into group i; any order, any number of times
    void add(int i, const T& x) {
        assert(0 <= i && i < n && !built);
        grp.pb(i), dat.pb(x);
    }

    // group everything in one O(n + m) counting sort
    void build() {
        assert(!built);
        built = true;
        int m = sz(dat);

        // 1) count each group's size, one slot to the right
        ptr.assign(n + 1, 0);
        for (int i : grp) ptr[i + 1]++;

        // 2) prefix sums: ptr[i] becomes the start offset of group i
        FOR(i, 1, n) ptr[i] += ptr[i - 1];

        // 3) scatter into place, stable within a group
        vi cur = ptr;                 // moving write cursor per group
        vector<T> tmp(m);
        REP(k, m) tmp[cur[grp[k]]++] = dat[k];

        swap(dat, tmp);
        grp.clear(), grp.shrink_to_fit();
    }

    struct range {
        T *first, *last;
        T* begin() const { return first; }
        T* end()   const { return last; }
        int size() const { return int(last - first); }
        bool empty() const { return first == last; }
    };

    range operator[](int i) {
        assert(built);
        return range{dat.data() + ptr[i], dat.data() + ptr[i + 1]};
    }
};

// usage: undirected graph on V vertices, E edges
// CSR<int> G(V);
// REP(e, E) { int u, v; cin >> u >> v; G.add(u, v); G.add(v, u); }
// G.build();
// for (int v : G[u]) { /* visit neighbor v */ }
```

</details>

## Why bother, over `vector<vector<int>>`

- **One allocation instead of $$n+1$$.** A `vector<vector<int>>` heap-allocates every inner vector.
- **Cache locality.** A vertex's neighbors sit contiguously, and adjacent vertices' neighbors sit nearby, so a traversal streams through memory instead of chasing pointers. On graph-heavy problems this is often a 2–3x speedup.
- **Memory.** The overhead drops from ~24 bytes per inner vector (pointer, size, capacity) to 4 bytes per group (its `ptr` entry).

The tradeoff is that CSR is **build-once**: after `build` you cannot add edges. And one sharp edge — a `range` holds raw pointers into `dat`, so it is valid only while the CSR outlives it and is not rebuilt. Fine for the usual `for (auto&& v : G[u])`; dangerous if you stash a `range` and use it later.

## Where the same idea shows up

CSR is the general answer to a recurring shape: **you have $$n$$ groups whose sizes you only learn after collecting every item, you will read the groups many times, and you never mutate them once built.** When that description fits, do not reach for $$n$$ little containers — flatten everything into one array plus an offset table with a counting sort, and index by offsets.

The reusable core is the three-line move at the heart of `build`: **count, prefix-sum, scatter.** That is exactly counting sort (and one digit of radix sort), and it turns "bucket these items by key in linear time" into a rote operation. The same layout stores graph adjacency, groups records by a key, buckets offline queries by the position that will answer them, and — where the name comes from — packs the nonzero entries of a sparse matrix row by row. Whenever you catch yourself about to allocate a vector-of-vectors that you fill once and scan repeatedly, that is CSR asking to be used.

## Docs worth reading

- [Sparse matrix (Wikipedia)](https://en.wikipedia.org/wiki/Sparse_matrix) — see the "Compressed sparse row" section for the original context and the offset invariant.
- [maspy's competitive library](https://github.com/maspypy/library) — where this container lives as `ds/csr.hpp`.

## Practice

- [LeetCode 210 — Course Schedule II](https://leetcode.com/problems/course-schedule-ii/) (build an adjacency list, then traverse — CSR is the storage)
- [LeetCode 1122 — Relative Sort Array](https://leetcode.com/problems/relative-sort-array/) (counting sort — the exact count/prefix/scatter of `build`)
- [Codeforces 1092F — Tree with Maximum Cost](https://codeforces.com/problemset/problem/1092/F) (a large tree DP where a flat adjacency list earns its speedup)
