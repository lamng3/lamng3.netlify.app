---
layout: post
title: "Compressed Sparse Row: From a Sparse Matrix to an Adjacency List"
description: A sparse matrix is mostly zeros, so store only the nonzeros — three small arrays holding the values, their column indices, and one pointer per row. That is CSR, and the same layout is exactly what makes a fast adjacency list.
date: 2026-09-08
last_updated: 2026-09-10 01:02:00
author: Nathan Nguyen
categories: [Data Structures]
tags: [CSR, Compressed Sparse Row, Sparse Matrix, Data Layout, Adjacency List, Graphs, Cache Locality, Competitive Programming]
toc:
  sidebar: right
---

A **sparse matrix** is a matrix that is almost all zeros. Storing it as a full 2D grid is wasteful: an $$n \times m$$ matrix costs $$nm$$ cells even if only a handful are nonzero. So we store only the nonzeros — but we still want to grab "row $$i$$" instantly, not scan the whole thing. **Compressed Sparse Row (CSR)** is the layout that does exactly that.

## Three arrays

Walk the nonzeros **row by row, left to right**, and record them in three arrays:

- **`values`** — each nonzero value, in that order.
- **`col`** — the column of each value (same length as `values`).
- **`row_ptr`** — one entry per row, plus one. `row_ptr[i]` is the position in `values`/`col` where row $$i$$'s nonzeros begin, so **row $$i$$ is the slice `[row_ptr[i], row_ptr[i+1])`**.

The name is the idea: instead of storing a row number for _every_ nonzero, we store just $$n+1$$ row pointers — we **compress the row information**.

## A worked example

Take this $$4 \times 4$$ matrix:

```
        col 0   col 1   col 2   col 3
row 0 [   10      0       0      12  ]
row 1 [    0      0      11       0  ]
row 2 [    0     16       0       0  ]
row 3 [    0      0       0      13  ]
```

Reading the nonzeros row by row — `10, 12` in row 0, `11` in row 1, `16` in row 2, `13` in row 3:

```
index:      0    1    2    3    4
values  = [ 10   12   11   16   13 ]
col     = [  0    3    2    1    3 ]

row_ptr = [  0    2    3    4    5 ]
row:        0    1    2    3   (end)
```

Read it back:

- **Row 2** is `values[row_ptr[2] .. row_ptr[3])` = `values[3..4)` = `[16]`, at columns `col[3..4)` = `[1]` — so $$M_{2,1} = 16$$, and the rest of row 2 is zero.
- **Nonzeros in row $$i$$** = `row_ptr[i+1] - row_ptr[i]` (row 0 has $$2 - 0 = 2$$).
- **Total nonzeros** = `row_ptr[n]` = `row_ptr[4]` = `5`.
- **Element $$(i, j)$$**: scan `col` over row $$i$$'s slice for $$j$$; if it appears at position $$k$$, the value is `values[k]`, otherwise the entry is zero.

## Why store it this way

- **Space.** CSR uses $$2 \cdot \text{nnz} + (n+1)$$ numbers instead of $$nm$$. On our tiny matrix that is barely a saving, but when nonzeros are rare it is the whole game: a $$10^5 \times 10^5$$ matrix with $$10^6$$ nonzeros needs $$\sim 2\times10^6$$ numbers, not $$10^{10}$$.
- **Fast rows.** Locating a row is $$O(1)$$ and scanning it is $$O(\text{nnz in that row})$$. That is exactly the access pattern of a matrix–vector product, where you dot each row against the vector.

## The competitive-programming case: adjacency lists

A graph _is_ a sparse matrix — its adjacency matrix, where $$A_{u,v} \ne 0$$ means an edge from $$u$$ to $$v$$. Row $$u$$'s nonzero columns are exactly the **neighbors of $$u$$**.

For an unweighted graph every nonzero is just $$1$$, so you can drop `values` entirely: `col` becomes the flat list of neighbors and `row_ptr` marks where each vertex's neighbors begin. That two-array CSR is a **fast adjacency list** — one contiguous block instead of $$n$$ separately heap-allocated `vector<int>`s. Neighbors of a vertex sit next to each other, so a traversal streams through memory instead of chasing pointers; on graph-heavy problems that is often a 2–3x speedup and a big memory saving. (Weighted graph? Keep `values` for the edge weights.)

Here it is as a reusable container. Two arrays carry the structure: **`offset`** is the row pointer (`offset[i]` marks where row `i`'s entries begin), and **`data`** is the flat, row-grouped payload — a neighbor (that is, a column index) for an unweighted graph, or a `{to, weight}` for a weighted one. You stage entries with `add(row, x)` in any order; `build()` groups them by row in one linear counting-sort pass (count each row's size, prefix-sum into `offset`, scatter into `data`). Reading a row is a plain pointer walk, so `for (int v : G[u])` has no indirection.

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
    vi offset;         // row offsets (row_ptr): after build, n+1 of them; row i = data[offset[i] .. offset[i+1])
    vi row;            // staged row of each entry (freed after build)
    vector<T> data;    // per-entry payload, grouped by row: a neighbor/column id, or {to, weight} when weighted

    CSR(int n = 0) : n(n) {}

    // stage entry x into row i; any order, any number of times
    void add(int i, const T& x) {
        assert(0 <= i && i < n && !built);
        row.pb(i), data.pb(x);
    }

    // group everything by row in one O(n + nnz) counting sort
    void build() {
        assert(!built);
        built = true;
        int m = sz(data);

        offset.assign(n + 1, 0);
        for (int i : row) offset[i + 1]++;          // 1) count entries per row
        FOR(i, 1, n) offset[i] += offset[i - 1];    // 2) prefix sums -> row starts

        vi cur = offset;                            // 3) scatter into each row's slice
        vector<T> tmp(m);
        REP(k, m) tmp[cur[row[k]]++] = data[k];

        swap(data, tmp);
        row.clear(), row.shrink_to_fit();
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
        // data.data() is the base pointer (element 0); + offset[i] reaches row i's start
        return range{data.data() + offset[i], data.data() + offset[i + 1]};
    }
};

// usage: undirected graph on V vertices, E edges
// CSR<int> G(V);
// REP(e, E) { int u, v; cin >> u >> v; G.add(u, v); G.add(v, u); }
// G.build();
// for (int v : G[u]) { /* visit neighbor v */ }
```

</details>

`operator[]` hands back a `range` — just the two pointers `first` and `last` that bound row `u`'s slice in `data`, exposed through `begin()` and `end()`. A range-based `for` desugars to exactly those two calls, and a raw pointer is already a valid iterator (it supports `*`, `++`, and `!=`), so `for (int v : G[u])` simply walks from `first` up to `last`, reading each neighbor straight out of `data` — no iterator class, no copy.

One caveat: a `range` holds raw pointers into `data`, so it is valid only while the CSR lives and is not rebuilt — fine for the usual `for (auto&& v : G[u])`, but do not stash one for later.

## A concrete benchmark

The payoff is easy to measure. [LeetCode 1971 — Find if Path Exists in Graph](https://leetcode.com/problems/find-if-path-exists-in-graph/) is a plain reachability BFS on an undirected graph (up to $$2 \times 10^5$$ vertices and edges). Solve it twice and change **only the adjacency storage** — a `vector<vector<int>>` versus the CSR container above. The BFS is identical.

<details markdown="1">
<summary>C++ — the same BFS over two adjacency storages</summary>

```cpp
// (1) vector-of-vectors adjacency
class Solution {
public:
    bool validPath(int n, vii& edges, int src, int dst) {
        vector<vi> G(n);
        for (auto& e : edges) { G[e[0]].pb(e[1]); G[e[1]].pb(e[0]); }

        queue<int> q; q.push(src);
        vi seen(n, 0); seen[src] = 1;
        while (!q.empty()) {
            int u = q.front(); q.pop();
            if (u == dst) return true;
            for (int v : G[u]) {
                if (seen[v]) continue;
                q.push(v);
                seen[v] = 1;
            }
        }
        return false;
    }
};

// (2) CSR adjacency (the container above) — the BFS below is byte-for-byte the same
class Solution {
public:
    bool validPath(int n, vii& edges, int src, int dst) {
        CSR<int> G(n);
        for (auto& e : edges) { G.add(e[0], e[1]); G.add(e[1], e[0]); }
        G.build();

        queue<int> q; q.push(src);
        vi seen(n, 0); seen[src] = 1;
        while (!q.empty()) {
            int u = q.front(); q.pop();
            if (u == dst) return true;
            for (int v : G[u]) {
                if (seen[v]) continue;
                q.push(v);
                seen[v] = 1;
            }
        }
        return false;
    }
};
```

</details>

Same input, same judge:

| adjacency             | runtime | memory   |
| --------------------- | ------- | -------- |
| `vector<vector<int>>` | 240 ms  | 267.8 MB |
| CSR                   | 42 ms   | 250.3 MB |

That is **more than 5x faster** ($$240 / 42 \approx 5.7$$) and **17.5 MB less** — about **6.5%** of the memory — for the exact same traversal. The whole difference is the layout: CSR's neighbors sit contiguously in one array, so the BFS streams through memory, while the vector-of-vectors chases $$n$$ separate heap allocations and eats a cache miss per vertex. (Submission links, LeetCode login may be needed: [CSR](https://leetcode.com/problems/find-if-path-exists-in-graph/submissions/2137238854/), [vector-of-vectors](https://leetcode.com/problems/find-if-path-exists-in-graph/submissions/2137237758/).)

## When to reach for it

Whenever you have many groups of variable size — matrix rows, or a graph's vertices — that you fill once and then scan repeatedly, don't allocate one container per group. Flatten everything into contiguous arrays indexed by a per-group pointer, the way CSR packs a matrix's rows or a graph's adjacency. One allocation, cache-friendly reads, and the group boundaries live in a single small `row_ptr` array.

## Docs worth reading

- [NVIDIA — CSR storage format](https://docs.nvidia.com/nvpl/latest/sparse/storage_format/sparse_matrix.html).
- [pnxguide — CSR: motivation and explanation](https://pnxguide.medium.com/compressed-sparse-row-motivation-and-explanation-cd92c71b7cfa).
- [GeeksforGeeks — Sparse matrix (CSR)](https://www.geeksforgeeks.org/dsa/sparse-matrix-representations-set-3-csr/).

## Practice

All take an edge list as input, so you build the adjacency (CSR fits directly) and traverse.

- [LeetCode 1971 — Find if Path Exists in Graph](https://leetcode.com/problems/find-if-path-exists-in-graph/)
- [LeetCode 210 — Course Schedule II](https://leetcode.com/problems/course-schedule-ii/)
- [LeetCode 1319 — Number of Operations to Make Network Connected](https://leetcode.com/problems/number-of-operations-to-make-network-connected/)
- [Codeforces 1092F — Tree with Maximum Cost](https://codeforces.com/problemset/problem/1092/F)
