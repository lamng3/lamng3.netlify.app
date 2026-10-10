---
layout: post
title: "Databases"
description: "Ideas from competitive programming that show up inside database systems: keeping old versions around (persistence, MVCC, copy-on-write B-trees), laying sparse data out for fast scans (compressed sparse row), answering membership in little memory (filters and sketches), keeping a sorted table in memory (skip lists), and deciding what stays in a full cache (eviction)."
permalink: /blog/databases/
last_updated: 2026-10-10
author: Lam Nguyen
toc:
  sidebar: right
---

Ideas from competitive programming that show up inside database systems: keeping old versions around (persistence, MVCC, copy-on-write B-trees), laying sparse data out for fast scans (compressed sparse row), answering membership in little memory (filters and sketches), keeping a sorted table in memory (skip lists), and deciding what stays in a full cache (eviction).

<details markdown="1">
<summary>C++ template used by every implementation on this page</summary>

Each implementation below starts after this header. A snippet that needs a different modulus defines its own `MOD` in place of this one.

```cpp
#include <bits/stdc++.h>
using namespace std;

using ll = long long;
using ull = unsigned long long;
using u32 = uint32_t;
using u64 = uint64_t;
using i64 = int64_t;
using i128 = __int128;
using u128 = unsigned __int128;

using vi = vector<int>;
using vii = vector<vector<int>>;
using pii = pair<int, int>;

#define REP(i, n) for (int i = 0; i < (n); i++)
#define FOR(i, a, b) for (int i = (a); i <= (b); i++)
#define FORD(i, a, b) for (int i = (a); i >= (b); i--)
#define RFOR(i, n) for (int i = (n) - 1; i >= 0; i--)

#define all(x) (x).begin(), (x).end()
#define sz(x) (int)((x).size())

#define fi first
#define se second
#define pb push_back

const int INF = 1e9+7;
const int MOD = 1e9+7;

mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());
```
</details>

## Persistence {#persistence}

A **persistent** data structure keeps its old versions: every update produces a new version, and every earlier version stays queryable. An ordinary structure overwrites in place, so its past states are lost.

The mechanism is copy-on-write — each update creates new nodes instead of mutating existing ones, so earlier versions stay intact, the same principle as a `git` commit.

### The trick: don't copy everything

The naive way to keep old versions is to copy the whole structure on every update. That's $$O(n)$$ per update — far too slow.

The real trick is **path copying**: when you change one element, you only copy the nodes on the path from the root to that element, and _reuse_ everything else. In a balanced tree of height $$O(\log n)$$, that's only $$O(\log n)$$ new nodes per update. Each version is just a different root pointing into a mostly-shared tree.

That single idea — _share what didn't change, copy only what did_ — is the core of every persistent structure below.

### Snapshot Array

[LeetCode 1146 — Snapshot Array](https://leetcode.com/problems/snapshot-array/) is the simplest example of persistence. You have an array with three operations: `set(i, val)`, `snap()` (freeze the current state and return an id), and `get(i, snap_id)` (read an old snapshot).

You don't need a fancy tree here. Just keep, for each index, a list of `(snap_id, value)` events. `set` appends to the list; `get` binary-searches for the right snapshot. Old snapshots stay valid because you never erase past events.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
class SnapshotArray {
private:
    int time;
    vector<vector<pii>> snapshot;

public:
    SnapshotArray(int n) {
        time = 0;
        snapshot.resize(n);
        REP(i, n) set(i, 0);
    }

    void set(int i, int val) {
        if (!snapshot[i].empty() && snapshot[i].back().fi == time) {
            snapshot[i].back().se = val;
        }
        else snapshot[i].pb({time, val});
    }

    int snap() {
        return time++;
    }

    int get(int i, int snap_id) {
        auto& history = snapshot[i];
        int left = 0, right = history.size();
        while (left < right) {
            int mid = left + (right - left) / 2;
            if (history[mid].fi == snap_id) return history[mid].se;
            if (history[mid].fi < snap_id) left = mid+1;
            else right = mid;
        }
        return history[left-1].se;
    }
};

/**
 * Your SnapshotArray object will be instantiated and called as such:
 * SnapshotArray* obj = new SnapshotArray(length);
 * obj->set(index,val);
 * int param_2 = obj->snap();
 * int param_3 = obj->get(index,snap_id);
 */
```

</details>

Memory is $$O(\text{number of sets})$$ and each `get` is $$O(\log m)$$. No cloning, no trees — just a per-index history.

### Persistent Segment Tree

**Why do we need this?** A plain segment tree is great at _range queries_ — the sum, minimum, or count over some range $$[l, r]$$ — in $$O(\log n)$$. But it only ever knows the _current_ array. The moment you update it, the old array is gone.

Sometimes the question isn't "what is the range sum _now_," but "what was the range sum _back at version 5_?" Think of an array that changes over time where you still need to answer range queries against any past state: an audit query on yesterday's data, a "k-th smallest in a range" query built from historical prefixes, or simply a problem that lets you branch off old copies. A plain segment tree can't do this; a **persistent segment tree** can, because it keeps every version cheaply and lets you run the same $$O(\log n)$$ range query against any root you like.

It's a normal segment tree, but each update path-copies $$O(\log n)$$ nodes and returns a new root. Keep a list of roots and every past version stays queryable.

The classic problem is [CSES — Range Queries and Copies](https://cses.fi/problemset/task/1737): update a position, sum over a range, and _copy_ an array. A copy is basically free — it's just a new root pointing at the same tree.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
const int MAX_N = 2e5+5;

struct PersistentST {
    struct Node {
        ll sum = 0;
        int left = 0, right = 0;
    };

    int N;
    vi A;
    vector<Node> tree;

    PersistentST(int n, vi& a) : N(n), A(a) {
        tree.reserve(MAX_N);
        tree.pb(Node());
    }

    int join(int l, int r) {
        tree.pb({tree[l].sum + tree[r].sum, l, r});
        return tree.size()-1;
    }

    int build(int v, int tl, int tr) {
        if (tl == tr) {
            tree.pb({A[tl], 0, 0});
            return tree.size()-1;
        }
        int tm = tl + (tr - tl) / 2;
        return join(build(tree[v].left, tl, tm), build(tree[v].right, tm+1, tr));
    }

    int update(int v, int tl, int tr, int pos, int val) {
        if (tl == tr) {
            tree.pb({val, 0, 0});
            return tree.size()-1;
        }
        int tm = tl + (tr - tl) / 2;
        int lc = (v == 0) ? 0 : tree[v].left;
        int rc = (v == 0) ? 0 : tree[v].right;
        if (pos <= tm) return join(update(lc, tl, tm, pos, val), rc);
        else return join(lc, update(rc, tm+1, tr, pos, val));
    }

    int copy(int v) {
        tree.pb(tree[v]);
        return tree.size()-1;
    }

    ll query(int v, int tl, int tr, int ql, int qr) {
        if (v == 0 || ql > qr) return 0;
        if (ql == tl && tr == qr) return tree[v].sum;
        int tm = tl + (tr - tl) / 2;
        ll left = query(tree[v].left, tl, tm, ql, min(tm, qr));
        ll right = query(tree[v].right, tm+1, tr, max(tm+1, ql), qr);
        return left + right;
    }
};

void solve() {
    int n, q; cin >> n >> q;
    vi a(n);
    REP(i, n) cin >> a[i];

    PersistentST segtree(n, a);
    vi roots = {segtree.build(0, 0, n-1)};

    REP(i, q) {
        int type, k; cin >> type >> k;
        k--;

        if (type == 1) {
            int pos, val; cin >> pos >> val;
            pos--;
            roots[k] = segtree.update(roots[k], 0, n-1, pos, val);
        } else if (type == 2) {
            int l, r; cin >> l >> r;
            l--, r--;
            cout << segtree.query(roots[k], 0, n-1, l, r) << '\n';
        } else if (type == 3) {
            roots.pb(segtree.copy(roots[k]));
        }
    }
}

int main() {
    // freopen("name.in", "r", stdin);
    // freopen("name.out", "w", stdout);
    ios::sync_with_stdio(0);
    cin.tie(0);
    int tt = 1;
    // cin >> tt;
    while (tt--) solve();
    return 0;
}
```

</details>

The key detail: nodes are never mutated — `update` and `join` only ever push new nodes, so old roots keep working forever. That gives $$O(\log n)$$ per update and query, and $$O((n + q)\log n)$$ total memory.

For a proper walkthrough with pictures, the [USACO Guide's persistence section](https://usaco.guide/adv/persistent?lang=cpp#persistent-segment-tree) is the best CP resource, and [SecondThread's video](https://www.youtube.com/watch?v=m3uEG4NgJx8) is a great visual intro.

> Heads up: persistent segment trees almost never show up on LeetCode. They're a competitive-programming (Codeforces / CSES) thing. On LeetCode, Snapshot Array is about as far as persistence goes.

### Persistent Queue

Persistence isn't just about trees. SecondThread's video also walks through the **persistent queue** — a queue where every `push` and `pop` returns a _new_ queue, leaving the old one intact and still usable.

The trick is a classic: represent the queue as two stacks, a `front` and a `back`. You push onto `back`; you pop from `front`, and when `front` runs empty you reverse `back` into it. Stacks are the easiest structure to make persistent — a stack is just an immutable singly linked list, so `push`/`pop` are $$O(1)$$ and every intermediate list is automatically a version. Build the queue out of two persistent stacks and you get a queue whose whole history stays alive, which is exactly what you need when different versions branch off and each has to keep enqueueing and dequeuing independently.

(Getting _worst-case_ $$O(1)$$ per operation under heavy persistent branching needs Okasaki's real-time queues with lazy evaluation, but the two-stack idea is the intuition.)

### The same idea in databases: MVCC and copy-on-write B-trees

Persistence isn't only a competitive-programming technique; databases rely on it constantly.

When many transactions read and write at once, a database can't just overwrite a row: a reader might be halfway through a query that expects the old value. So instead of overwriting, the database _keeps the old version_ and writes a new one. Each version is tagged with the transaction that created it, and every reader sees the version that was current when its transaction began.

This is **MVCC — Multi-Version Concurrency Control**, used by Postgres, MySQL's InnoDB, and Oracle. If you've read _Database Internals_, this is the "readers don't block writers, writers don't block readers" story: everyone gets a consistent **snapshot** without waiting on locks, because old versions are still lying around to read from.

But MVCC raises a question: how do you organize all those versions on disk so a snapshot stays consistent? One elegant answer is the **copy-on-write (CoW) B-tree**, used by storage engines like LMDB and WiredTiger. When you modify a page, you don't overwrite it — you copy that page, apply the change, and then copy every page along the path up to the root, producing a _new root_. The old root still points at a fully intact old tree; the new root is the new version.

If that sounds familiar, it should: **a copy-on-write B-tree is a persistent segment tree scaled up to disk pages.** Same path copying, same structural sharing, same "each version is just a different root." The payoff is atomic, crash-consistent snapshots — a reader following the old root sees a coherent old database even while a writer is busy building the new one, and the switch to the new version is a single pointer swap.

So the recurring lesson holds at every scale:

- **Snapshot Array** keeps old `(snap_id, value)` entries per index.
- **Persistent segment tree** path-copies to give each version its own root.
- **MVCC** keeps old versions per row, and **CoW B-trees** path-copy pages to give each snapshot its own root.

_Never overwrite; keep the old version and point new readers at the new one._

## Compressed Sparse Row {#compressed-sparse-row}

Persistence is about keeping versions. Layout is the other half of storage: how the data sits in memory decides how fast it scans.

A **sparse matrix** is a matrix that is almost all zeros. Storing it as a full 2D grid is wasteful: an $$n \times m$$ matrix costs $$nm$$ cells even if only a handful are nonzero. So we store only the nonzeros — but we still want to grab "row $$i$$" instantly, not scan the whole thing. **Compressed Sparse Row (CSR)** is the layout that does exactly that.

### Three arrays

Walk the nonzeros **row by row, left to right**, and record them in three arrays:

- **`values`** — each nonzero value, in that order.
- **`col`** — the column of each value (same length as `values`).
- **`row_ptr`** — one entry per row, plus one. `row_ptr[i]` is the position in `values`/`col` where row $$i$$'s nonzeros begin, so **row $$i$$ is the slice `[row_ptr[i], row_ptr[i+1])`**.

The name is the idea: instead of storing a row number for _every_ nonzero, we store just $$n+1$$ row pointers — we **compress the row information**.

### A worked example

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

### Why store it this way

- **Space.** CSR uses $$2 \cdot \text{nnz} + (n+1)$$ numbers instead of $$nm$$. On our tiny matrix that is barely a saving, but when nonzeros are rare it is the whole game: a $$10^5 \times 10^5$$ matrix with $$10^6$$ nonzeros needs $$\sim 2\times10^6$$ numbers, not $$10^{10}$$.
- **Fast rows.** Locating a row is $$O(1)$$ and scanning it is $$O(\text{nnz in that row})$$. That is exactly the access pattern of a matrix–vector product, where you dot each row against the vector.

### The competitive-programming case: adjacency lists

A graph _is_ a sparse matrix — its adjacency matrix, where $$A_{u,v} \ne 0$$ means an edge from $$u$$ to $$v$$. Row $$u$$'s nonzero columns are exactly the **neighbors of $$u$$**.

For an unweighted graph every nonzero is just $$1$$, so you can drop `values` entirely: `col` becomes the flat list of neighbors and `row_ptr` marks where each vertex's neighbors begin. That two-array CSR is a **fast adjacency list** — one contiguous block instead of $$n$$ separately heap-allocated `vector<int>`s. Neighbors of a vertex sit next to each other, so a traversal streams through memory instead of chasing pointers; on graph-heavy problems that is often a 2–3x speedup and a big memory saving. (Weighted graph? Keep `values` for the edge weights.)

Here it is as a reusable container. Two arrays carry the structure: **`offset`** is the row pointer (`offset[i]` marks where row `i`'s entries begin), and **`data`** is the flat, row-grouped payload — a neighbor (that is, a column index) for an unweighted graph, or a `{to, weight}` for a weighted one. You stage entries with `add(row, x)` in any order; `build()` groups them by row in one linear counting-sort pass (count each row's size, prefix-sum into `offset`, scatter into `data`). Reading a row is a plain pointer walk, so `for (int v : G[u])` has no indirection.

<details markdown="1">
<summary>C++ implementation (in the CP template style)</summary>

```cpp
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

### Example: multiplying two sparse matrices

This is the use CSR was invented for. [LeetCode 311 — Sparse Matrix Multiplication](https://leetcode.com/problems/sparse-matrix-multiplication/) (premium) asks for the product $$C = A B$$ of a sparse $$m \times k$$ matrix and a sparse $$k \times n$$ matrix. The textbook triple loop is $$O(mkn)$$ and spends almost all of it adding $$0 \cdot 0$$.

But $$C_{ij} = \sum_{t} A_{it} B_{tj}$$, and a term contributes only when **both** $$A_{it}$$ and $$B_{tj}$$ are nonzero. So store each matrix in CSR — now the per-entry payload is the full nonzero, a `{column, value}` pair (the `values` and `col` from the top, carried together) — and iterate only over nonzeros: for each nonzero $$A_{it} = a$$ in row $$i$$, and each nonzero $$B_{tj} = b$$ in row $$t$$ of $$B$$, add $$a \cdot b$$ to $$C_{ij}$$. The work is proportional to the number of nonzero products, not $$mkn$$.

<details markdown="1">
<summary>C++ implementation (uses the CSR container above)</summary>

```cpp
struct Info { int idx, val; };   // one nonzero: its column (idx) and value

class Solution {
public:
    vii multiply(vii& mat1, vii& mat2) {
        int m = sz(mat1), k = sz(mat1[0]), n = sz(mat2[0]);

        CSR<Info> A(m), B(k);                       // A stored by its rows, B by its rows
        REP(i, m) REP(t, k) if (mat1[i][t]) A.add(i, {t, mat1[i][t]});
        REP(t, k) REP(j, n) if (mat2[t][j]) B.add(t, {j, mat2[t][j]});
        A.build(), B.build();

        vii C(m, vi(n, 0));
        REP(i, m)
            for (auto& [t, a] : A[i])               // nonzeros of row i of A
                for (auto& [j, b] : B[t])           // nonzeros of row t of B
                    C[i][j] += a * b;
        return C;
    }
};
```

</details>

Here the payload `T` is `Info{column, value}` — exactly the `values` and `col` of the sparse matrix from the start, carried together per nonzero — and the nested loops walk only the nonzeros CSR grouped by row.

### A concrete benchmark

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

### When to reach for it

Whenever you have many groups of variable size — matrix rows, or a graph's vertices — that you fill once and then scan repeatedly, don't allocate one container per group. Flatten everything into contiguous arrays indexed by a per-group pointer, the way CSR packs a matrix's rows or a graph's adjacency. One allocation, cache-friendly reads, and the group boundaries live in a single small `row_ptr` array.

## Filters and Sketches {#filters}

Persistence keeps old versions, and CSR keeps data compact for scans. The next question a storage engine asks is cheaper still: _is this key here at all?_ If the answer lives on disk, asking it costs a read. A filter answers it from memory, using far less space than the set itself, by allowing one kind of mistake.

### Start from a hash set, then give up the keys

A hash set answers membership exactly, but it stores every key. Suppose we only store a few bits per key and forget the keys themselves. What can we still promise?

A **Bloom filter** is the simplest answer. Keep an array of $$m$$ bits, all zero, and $$k$$ hash functions. To add a key, set the $$k$$ bits it hashes to. To look one up, check those $$k$$ bits:

- any bit is $$0$$: the key was **definitely never added**, since adding it would have set that bit;
- all bits are $$1$$: the key was **probably added**, or other keys happened to set the same bits.

So false negatives are impossible and false positives are the price. That asymmetry is exactly what a database wants in front of disk: a "no" skips the read for free, and a wrong "yes" only costs the read we would have done anyway. A log-structured merge tree keeps one Bloom filter per sorted run, so a point lookup opens only the runs whose filter says yes.

### How wrong is "probably"?

After $$n$$ insertions with $$k$$ hashes, a given bit is still $$0$$ with probability $$\left(1 - \tfrac{1}{m}\right)^{kn} \approx e^{-kn/m}$$. A false positive needs all $$k$$ probed bits set:

$$
p \approx \left(1 - e^{-kn/m}\right)^{k}.
$$

More hashes set more bits per key (bad) but demand more coincidences per lookup (good). The two balance at $$k = \tfrac{m}{n} \ln 2$$, where about half the bits are set. At that point roughly $$9.6$$ bits per key buys a $$1\%$$ false-positive rate, whatever the keys are.

My notebook's [`bloomfilter.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/databases/data_structures/bloomfilter.h) uses two fixed hashes, a base-31 polynomial hash and DJB2. Getting to $$k$$ hashes does not need $$k$$ independent functions: [`hash.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/databases/data_structures/utils/hash.h) builds them from two, as $$g_i(x) = h_1(x) + i \cdot h_2(x)$$ (Kirsch and Mitzenmacher), without raising the asymptotic false-positive rate.

### What a Bloom filter cannot do: delete

Clearing a key's bits would also clear bits that other keys rely on, and those keys would start returning "definitely absent". That is a false negative, the one mistake we promised never to make. So the next question: can we keep a filter's memory footprint and still delete?

### Cuckoo filter: store a fingerprint, not bits

A **cuckoo filter** stores a short **fingerprint** of each key (8 bits in my notebook) in a hash table with buckets of $$4$$ slots. Each key has two candidate buckets, and its fingerprint sits in one of them. Lookup checks two buckets; delete removes one matching fingerprint. Deletion works because each key owns a slot of its own instead of sharing bits.

The interesting part is relocation. When both buckets are full, insertion evicts a resident fingerprint and moves it to _its_ other bucket, which may evict another, and so on: cuckoo hashing. But we stored only the fingerprint, not the key. How does an evicted fingerprint find its other bucket without the key?

The trick is to define the second bucket from the fingerprint alone:

$$
i_2 = i_1 \oplus \text{hash}(f).
$$

XOR is its own inverse, so from either bucket, the other is $$i \oplus \text{hash}(f)$$. Both directions use only $$f$$. This is why [`cuckoofilter.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/databases/data_structures/cuckoofilter.h) rounds the table size $$N$$ up to a power of two: reducing $$\bmod N$$ keeps the low bits, and XOR commutes with keeping low bits, so $$\big((i_1 \oplus h) \bmod N\big) \oplus (h \bmod N) = i_1$$ still holds after the reduction.

```cpp
size_t i1 = hash(x) % N;
size_t i2 = (i1 ^ hash(to_string(f))) % N;
```

Two details in the notebook version are worth keeping. The kick loop is capped at `MAX_NUM_KICKS`, because a full enough table can cycle forever. And when the cap is hit, the swaps are undone in reverse, so a failed insert never loses a fingerprint that was already stored.

Deletes come with one rule: only delete keys you inserted. Deleting a key that was never added can remove a different key that shares its fingerprint and bucket.

### Counting instead of membership: count-min sketch

The same idea, hashing into a small table and accepting one-sided error, also estimates **how often** a key appeared. A **count-min sketch** keeps $$d$$ rows of $$w$$ counters, each row with its own hash. An insert adds $$1$$ to one counter per row. An estimate reads those $$d$$ counters and takes the **minimum**.

Why the minimum? Every counter a key touches holds its true count plus whatever collided into it, and collisions only ever add. So every row overestimates, and the least overestimated row is the best guess. With $$w = \lceil e / \varepsilon \rceil$$ and $$d = \lceil \ln(1/\delta) \rceil$$, the estimate exceeds the true count by more than $$\varepsilon N$$ (out of $$N$$ total insertions) with probability at most $$\delta$$.

[`countminsketch.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/databases/data_structures/countminsketch.h) seeds each row's hash separately with SplitMix64. Two sketches built with the **same seeds** can be merged by adding their counter tables cell by cell, which is how sketches from different machines combine into one. With different seeds the cells mean different things, so `merge` refuses them.

## Skip List {#skip-list}

Filters answer "is it here?". A memtable has to answer "what comes next in sorted order?", and keep answering while writes stream in. A balanced binary search tree does that, at the cost of rotations on every insert. Is there something simpler with the same $$O(\log n)$$?

### Start from a sorted linked list

A sorted linked list inserts in $$O(1)$$ once you know where, but finding where takes $$O(n)$$ because you can only walk one step at a time. Add a second, sparser list on top that contains every other node: now you walk the top lane until the next step would overshoot, drop down, and walk at most one more step. Each extra lane halves the work again, and with $$\log_2 n$$ lanes a search is logarithmic.

Keeping "exactly every other node" under inserts and deletes is as hard as balancing a tree. The skip list's move is to stop insisting on it: when a node is inserted, **flip a coin** for each level, and promote it while the coin says heads. On average half the nodes reach level $$1$$, a quarter reach level $$2$$, and so on. No rebalancing ever happens, and search, insert, and delete take $$O(\log n)$$ expected time, with about $$2n$$ pointers in total.

### The part that is easy to get wrong: the left neighbors

Insert walks down from the top level exactly like search. At each level it remembers the last node it stood on before dropping, the node that will sit to the **left** of the new one at that level:

```cpp
for (int i = curr_mx_lvl; i >= 0; i--) {
    while (curr->next[i] != nullptr && curr->next[i]->key < key) {
        curr = curr->next[i];
    }
    left[i] = curr;
}
```

Then the new node is spliced in after `left[i]` on every level it reached. My first instinct was to splice using only the final `curr`, and that is wrong above level $$0$$: the left neighbor at a high level is usually a different node, further back. A node is one object referenced from many levels, not one copy per level, so every level needs its own left pointer. If the coin flips the new node above the current top level, its left neighbor up there is the head.

Delete uses the same `left` array, unlinking the target level by level and stopping at the first level where it does not appear. [`skiplist.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/databases/data_structures/skiplist.h) caps the height at $$16$$ levels, enough for about $$2^{16}$$ keys at full speed.

### Where it shows up

That simplicity is why in-memory sorted tables reach for skip lists. LevelDB and RocksDB keep their memtables in one before flushing to sorted runs on disk (the runs that the Bloom filters above guard), and Redis implements sorted sets with one.

## Cache Eviction {#cache-eviction}

A cache is full the moment it is useful, so the real design question is not what to store, but **who leaves** when something new arrives. Every policy is a guess about the future from the past. My notebook puts them behind one interface, [`eviction_cache.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/databases/eviction/eviction_cache.h): `get` counts as an access, and `put` returns the page it evicted, if any, so policies can be compared on the same trace.

### FIFO: the oldest insert leaves

The first guess is the simplest: whatever arrived first has had its chance. [`fifo.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/databases/eviction/fifo.h) keeps a queue of arrivals and a hash map for lookups. Note that `get` does not touch the queue: in FIFO, using a page buys it nothing. That is exactly its weakness, since a page read on every request is evicted on schedule anyway.

### LRU: the least recently used leaves

So let use count. LRU evicts the page untouched for longest, betting that recent use predicts the next use. The question is how to make "touch" and "evict the oldest" both $$O(1)$$. A hash map finds a page in $$O(1)$$, and a doubly linked list ordered by recency moves any node to the front in $$O(1)$$ once you hold a pointer to it, so use both: the map stores pointers into the list. [`lru.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/databases/eviction/lru.h) moves a page to the head on every `get` and `put`, and evicts from the tail, using sentinel head and tail nodes so eviction never has to special-case an empty end of the list.

LRU has its own blind spot. One long scan, such as a query reading a whole table once, touches every page exactly once, and each of those pages becomes "most recent" in turn. The scan flushes the hot set, even though none of the scanned pages will be read again.

### LFU: the least frequently used leaves

Counting uses instead of timing the last one fixes the scan: a page read once cannot outrank a page read a thousand times. The cost is the opposite blind spot: a page that was hot an hour ago keeps its high count and lingers. An $$O(1)$$ LFU keeps a list of pages per frequency and a pointer to the smallest non-empty frequency. That design is the next one to write; [`lfu.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/databases/eviction/lfu.h) is a stub for now.

### 2Q: make a page earn its place

2Q (Johnson and Shasha) keeps LRU's recency and adds a probation period, so that touching a page once is not enough to enter the hot set. It uses three queues, as in [`lru-2q.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/databases/eviction/lru-2q.h):

- **A1in**, a FIFO for pages seen for the first time. Reading them again does not reorder them.
- **A1out**, a ghost FIFO that stores **only the keys** of pages that aged out of A1in, no data.
- **Am**, an LRU for hot pages.

A new page enters A1in. If it ages out without anyone caring, its key passes through A1out and is forgotten. If it is requested again while its key is still in A1out, that second request is the evidence 2Q was waiting for, and the page enters Am. A scan now churns through A1in and A1out and never reaches Am, so the hot set survives it. The ghost queue is what makes this cheap: remembering that a page was seen costs one key, not a page.

### The same question in agent memory

A database buffer pool makes this choice for disk pages. An agent with a bounded context makes it for facts, tool results, and past turns: what to keep, what to drop, and what to remember only by name, like A1out, so it can be fetched again if it turns out to matter.

## From the Notebook {#notebook}

Implementations from my [competitive programming notebook](https://github.com/lamng3/competitive-programming-notebook), tagged with their [USACO Guide](https://usaco.guide/) level where they have one.

- **Persistent segment tree** (advanced). [`PersistentSegmentTree.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/data_structures/rurq/PersistentSegmentTree.h): Persistent sparse segment tree.
- **Compressed sparse row** (silver). [`CSR.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/data_structures/compress/CSR.h): Adjacency stored as offsets and edges.
- **Filters** (advanced). [`bloomfilter.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/databases/data_structures/bloomfilter.h): Bloom filter. [`BloomFilter.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/databases/data_structures/BloomFilter.py): The same filter in Python. [`countminsketch.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/databases/data_structures/countminsketch.h): Count-min sketch with seeded hashes, merge, and top k. [`CountMinSketch.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/databases/data_structures/CountMinSketch.py): The same sketch in Python. [`cuckoofilter.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/databases/data_structures/cuckoofilter.h): Cuckoo filter with fingerprints, kicks, and deletes. [`CuckooFilter.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/databases/data_structures/CuckooFilter.py): The same filter in Python.
- **Hash** (advanced). [`hash.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/databases/data_structures/utils/hash.h): String hashes, mixers, and a rolling hash. [`hash.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/databases/data_structures/utils/hash.py): The string hashes in Python.
- **Skip list** (advanced). [`skiplist.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/databases/data_structures/skiplist.h): Skip list. [`Skiplist.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/databases/data_structures/Skiplist.py): The same structure in Python.
- **Caches** (advanced). [`fifo.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/databases/eviction/fifo.h): FIFO eviction. [`lru.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/databases/eviction/lru.h): LRU eviction. [`lfu.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/databases/eviction/lfu.h): LFU eviction. [`lru-2q.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/databases/eviction/lru-2q.h): LRU-2Q eviction.

## Practice {#practice}

**Persistence**

- [LeetCode 1146 — Snapshot Array](https://leetcode.com/problems/snapshot-array/) (persistence, easy)
- [CSES — Range Queries and Copies](https://cses.fi/problemset/task/1737) (persistent segment tree)

**Compressed Sparse Row**

All take an edge list and need real traversal over the adjacency — topological order, shortest paths, DFS, tree DP — the repeated neighbor iteration where CSR pays off. (Pure connectivity, like "does a path exist," is cleaner with union-find and doesn't exercise CSR.)

- [LeetCode 210 — Course Schedule II](https://leetcode.com/problems/course-schedule-ii/)
- [LeetCode 743 — Network Delay Time](https://leetcode.com/problems/network-delay-time/)
- [LeetCode 1192 — Critical Connections in a Network](https://leetcode.com/problems/critical-connections-in-a-network/)
- [Codeforces 1092F — Tree with Maximum Cost](https://codeforces.com/problemset/problem/1092/F)

**Skip List**

- [LeetCode 1206 — Design Skiplist](https://leetcode.com/problems/design-skiplist/)

**Cache Eviction**

- [LeetCode 146 — LRU Cache](https://leetcode.com/problems/lru-cache/)
- [LeetCode 460 — LFU Cache](https://leetcode.com/problems/lfu-cache/)

## Further reading {#further-reading}

**Compressed Sparse Row**

- [NVIDIA — CSR storage format](https://docs.nvidia.com/nvpl/latest/sparse/storage_format/sparse_matrix.html).
- [pnxguide — CSR: motivation and explanation](https://pnxguide.medium.com/compressed-sparse-row-motivation-and-explanation-cd92c71b7cfa).
- [GeeksforGeeks — Sparse matrix (CSR)](https://www.geeksforgeeks.org/dsa/sparse-matrix-representations-set-3-csr/).
