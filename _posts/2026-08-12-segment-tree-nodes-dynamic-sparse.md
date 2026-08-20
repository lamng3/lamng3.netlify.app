---
layout: post
title: "Segment Trees, One Node at a Time"
description: A different way to think about segment trees — as a tree of nodes, each holding a small summary that merges from its children. Once you see it that way, the "store more per node" trick and the dynamic/sparse segment tree over a billion-wide range both fall out naturally.
date: 2026-08-12
author: Nathan Nguyen
categories: [Data Structures, Algorithms]
tags: [Segment Tree, Dynamic Segment Tree, Sparse Segment Tree, Lazy Propagation, Range Queries, Competitive Programming]
toc:
  sidebar: right
---

The segment tree is usually introduced as an array of size `4 * n` with `2*v+1` / `2*v+2` index arithmetic. A more useful view is a **tree of nodes**, where each node owns an interval and stores a small _summary_ of it. Everything else — storing richer data per node, or spanning a billion indices — is a variation on what a node holds and when it is created.

## The core idea: a node is a summary of its range

A segment tree over an array is a binary tree. The root covers the whole range $$[0, n)$$; each internal node splits its range in half and hands each half to a child; leaves cover a single index. A node stores whatever summary of its range you need — a sum, a min, a max — computed from its two children by a **merge** function.

Two operations, both $$O(\log n)$$:

- **Query** a range: walk down from the root, stopping at nodes whose range is fully inside the query, and merge their summaries.
- **Update** a position: change the leaf, then re-merge on the way back up so every ancestor's summary stays correct.

The whole design reduces to answering one question: **what does a node store, and how do two children merge into their parent?** Get that right and the tree writes itself.

## When a node stores more than a number

The merge function doesn't have to combine numbers. It can combine _structured_ summaries, which is where segment trees become more powerful.

Take [LeetCode 2213 — Longest Substring of One Repeating Character](https://leetcode.com/problems/longest-substring-of-one-repeating-character/). You have a string, you repeatedly overwrite one character, and after each update you must report the length of the longest run of a single repeated character. The runs can straddle any boundary, so a plain "max over a range" node isn't enough — merging two halves might _create_ a longer run across the seam.

The fix is to store three things per node, over its range:

- `mx` — the longest repeating run fully inside this range,
- `pref` — the length of the run starting at the left end,
- `suff` — the length of the run ending at the right end.

Now the merge is local and exact. The parent's best run is the better of its two children's best runs, _or_ — if the character at the seam matches — the left child's suffix joined to the right child's prefix. The prefix and suffix extend across the seam only when a child is entirely one repeated character:

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
#include <bits/stdc++.h>
using namespace std;

using ll = long long;
using vi = vector<int>;
using vii = vector<vector<int>>;
using pii = pair<int, int>;

#define REP(i, n) for (int i = 0; i < (n); i++)
#define FOR(i, a, b) for (int i = (a); i <= (b); i++)
#define FORD(i, a, b) for (int i = (a); i >= (b); i--)
#define RFOR(i, n) for (int i = (n) - 1; i >= 0; i--)

#define fi first
#define se second
#define pb push_back

const int INF = 1e9+7;
const int MOD = 1e9+7;

class SegmentTree {
private:
    struct Node {
        int pref = 1, suff = 1, mx = 1;
    };

    vector<Node> st;
    string S;
    int N;

public:
    SegmentTree(const string& s) : S(s), N(s.size()) {
        st.resize(4 * N);
        build(0, 0, N-1);
    }
    void combine(int v, int tl, int tr) {
        st[v].mx = max(st[v*2+1].mx, st[v*2+2].mx);
        st[v].pref = st[v*2+1].pref;
        st[v].suff = st[v*2+2].suff;
        int tm = tl + (tr - tl) / 2;
        if (S[tm] == S[tm+1]) {
            st[v].mx = max(st[v].mx, st[v*2+1].suff + st[v*2+2].pref);
            if (st[v*2+1].pref == tm - tl + 1) st[v].pref = st[v*2+1].pref + st[v*2+2].pref;
            if (st[v*2+2].suff == tr - tm) st[v].suff = st[v*2+2].suff + st[v*2+1].suff;
        }
    }
    void build(int v, int tl, int tr) {
        if (tl == tr) return;
        int tm = tl + (tr - tl) / 2;
        build(v*2+1, tl, tm);
        build(v*2+2, tm+1, tr);
        combine(v, tl, tr);
    }
    void update(int v, int tl, int tr, int i, char c) {
        if (tl == tr) {
            S[i] = c;
            return;
        }
        int tm = tl + (tr - tl) / 2;
        if (i <= tm) update(v*2+1, tl, tm, i, c);
        else update(v*2+2, tm+1, tr, i, c);
        combine(v, tl, tr);
    }
    int find_max() {
        return st[0].mx;
    }
};

class Solution {
public:
    vi longestRepeating(string s, string qc, vi& qid) {
        SegmentTree segtree(s);
        vi ans(qid.size());
        REP(i, qid.size()) {
            segtree.update(0, 0, s.size()-1, qid[i], qc[i]);
            ans[i] = segtree.find_max();
        }
        return ans;
    }
};
```

</details>

Notice we never even query a range here — the answer is always the root's `mx`, the whole-string summary. The segment tree is doing exactly one job: keeping that summary correct in $$O(\log n)$$ per update instead of rescanning the string in $$O(n)$$. This "store a small structured summary and merge it" pattern is the reusable idea; the same shape solves maximum-subarray-sum queries, counting bracket matches, and longest-alternating-run problems.

## When the range is a billion wide

The other axis you can push is the _range_. So far the tree has a leaf per index, which is fine for $$n = 10^5$$ but hopeless when indices run up to $$10^9$$ — allocating $$4 \times 10^9$$ nodes is out of the question.

Most of that range is empty, though. If you only ever touch a few thousand positions, you only need the handful of nodes on the paths to them. That's the **dynamic** (a.k.a. **sparse**) segment tree: don't pre-build anything; create a child node only the first time you descend into it.

Instead of `2*v+1` index arithmetic, each node stores explicit `left` and `right` child pointers (indices into a pool), initialized to `-1` for "doesn't exist yet." When a traversal needs a child that isn't there, we allocate it on the spot. The tree conceptually spans $$[0, 10^9]$$ but only ever materializes $$O(q \log C)$$ nodes for $$q$$ operations over a coordinate range of size $$C$$.

[LeetCode 732 — My Calendar III](https://leetcode.com/problems/my-calendar-iii/) is the perfect showcase. You book half-open intervals `[start, end)` one at a time, and after each booking you report the maximum number of events that overlap at any single point (the "$$k$$-booking"). Model each booking as **+1 over the range** `[start, end-1]`, and the answer is the **global maximum** over the whole line. That's a range-add / range-max structure — which needs lazy propagation — over a range far too wide to build eagerly. Dynamic segment tree it is.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
#include <bits/stdc++.h>
using namespace std;

using ll = long long;
using vi = vector<int>;
using vii = vector<vector<int>>;
using pii = pair<int, int>;

#define REP(i, n) for (int i = 0; i < (n); i++)
#define FOR(i, a, b) for (int i = (a); i <= (b); i++)
#define FORD(i, a, b) for (int i = (a); i >= (b); i--)
#define RFOR(i, n) for (int i = (n) - 1; i >= 0; i--)

#define fi first
#define se second
#define pb push_back

const int INF = 1e9+7;
const int MOD = 1e9+7;

const int MAX_N = 1e9+7;

struct SparseST {
    struct Node {
        int mx = 0, lazy = 0, left = -1, right = -1;
    };

    int N;
    vector<Node> tree;

    SparseST() {
        N = MAX_N;
        tree.pb(Node());
    }

    void apply(int v, int tl, int tr, int val) {
        tree[v].mx += val;
        tree[v].lazy += val;
    }

    void push(int v, int tl, int tr) {
        if (tree[v].left == -1) {
            tree[v].left = tree.size();
            tree.pb(Node());
        }
        if (tree[v].right == -1) {
            tree[v].right = tree.size();
            tree.pb(Node());
        }
        if (tree[v].lazy == 0) return;
        int tm = tl + (tr - tl) / 2;
        apply(tree[v].left, tl, tm, tree[v].lazy);
        apply(tree[v].right, tm+1, tr, tree[v].lazy);
        tree[v].lazy = 0;
    }

    void update(int v, int tl, int tr, int ql, int qr, int val) {
        if (ql > qr) return;
        if (ql == tl && tr == qr) {
            apply(v, tl, tr, val);
            return;
        }
        push(v, tl, tr);
        int tm = tl + (tr - tl) / 2;
        update(tree[v].left, tl, tm, ql, min(qr, tm), val);
        update(tree[v].right, tm+1, tr, max(ql, tm+1), qr, val);
        tree[v].mx = max(tree[tree[v].left].mx, tree[tree[v].right].mx);
    }

    int query(int v, int tl, int tr, int ql, int qr) {
        if (ql > qr) return 0;
        if (ql == tl && tr == qr) return tree[v].mx;
        push(v, tl, tr);
        int tm = tl + (tr - tl) / 2;
        int left = query(tree[v].left, tl, tm, ql, min(qr, tm));
        int right = query(tree[v].right, tm+1, tr, max(ql, tm+1), qr);
        return max(left, right);
    }

    void update(int ql, int qr, int val) {
        update(0, 0, N, ql, qr, val);
    }

    int query(int ql, int qr) {
        return query(0, 0, N, ql, qr);
    }

    int max_booking() {
        return tree[0].mx;
    }
};

class MyCalendarThree {
private:
    SparseST* segtree;

public:
    MyCalendarThree() {
        segtree = new SparseST();
    }

    int book(int startTime, int endTime) {
        segtree->update(startTime, endTime-1, 1);
        return segtree->max_booking();
    }
};

/**
 * Your MyCalendarThree object will be instantiated and called as such:
 * MyCalendarThree* obj = new MyCalendarThree();
 * int param_1 = obj->book(startTime,endTime);
 */
```

</details>

Two details make this work:

- **Lazy creation in `push`.** Before we descend, we make sure both children exist, allocating them if their pointer is still `-1`. Nodes come into being exactly when a traversal first needs them, and never sooner.
- **Lazy propagation** carries a pending range-add. When an update covers a node's whole range, we stamp the value into the node's `mx` and stash it in `lazy` rather than recursing to every leaf; `push` later flushes it down one level at a time. This is what keeps range-add at $$O(\log C)$$ instead of $$O(\text{range width})$$.

The answer to each `book` is just `tree[0].mx` — the root summary again, exactly like the previous problem. Same tree, same $$O(\log)$$ merge discipline; only _what a node stores_ and _when it exists_ changed.

> Heads up: `tm = tl + (tr - tl) / 2` (not `(tl + tr) / 2`) matters here — with `tr` near $$10^9$$, the naive midpoint overflows `int`. The half-open vs. closed interval bookkeeping is also where most bugs live; keep your convention consistent across `update`, `query`, and `push`.

## Coordinate compression: the usual alternative

Before reaching for a dynamic segment tree, it's worth knowing the common shortcut. If you can see all the queries up front (an _offline_ setting), you can **coordinate-compress**: collect every endpoint that ever appears, sort and dedupe them, and map the few thousand distinct coordinates down to a small dense range. Then an ordinary array-backed segment tree over that compressed range does the job.

The dynamic segment tree earns its keep when you _can't_ see everything in advance — an **online** problem like My Calendar III, where each answer must be produced before the next booking arrives — or when you want persistence (each update forking a new version by copying only the $$O(\log C)$$ nodes on its path, which is exactly how a persistent segment tree is built).

## Docs worth reading

- [CP-Algorithms — Segment Tree](https://cp-algorithms.com/data_structures/segment_tree.html): the definitive reference. Start here for the recursive formulation, then read the sections on storing more per node and on dynamic/implicit trees.
- [USACO Guide — Segment Trees](https://usaco.guide/gold/segtree-ext?lang=cpp) and its [sparse segment tree](https://usaco.guide/plat/sparse-segtree?lang=cpp) page.
- [Codeforces — Efficient and easy segment trees](https://codeforces.com/blog/entry/18051) (al.cash) for the iterative bottom-up variant once the recursive one clicks.

## Takeaways

- A segment tree is a tree of nodes; each node is a **summary** of its range, built by a **merge** of its children.
- To solve a new problem, decide **what a node stores** and **how children merge** — often that's the entire solution (the longest-repeating-run node).
- When the index space is huge, go **dynamic/sparse**: replace index arithmetic with child pointers and create nodes lazily, so you pay only for the paths you actually touch.
- **Lazy propagation** lets range updates stay $$O(\log)$$; coordinate compression is the offline alternative when you can see all queries ahead of time.

## Practice

- [LeetCode 2213 — Longest Substring of One Repeating Character](https://leetcode.com/problems/longest-substring-of-one-repeating-character/)
- [LeetCode 732 — My Calendar III](https://leetcode.com/problems/my-calendar-iii/)
- [LeetCode 715 — Range Module](https://leetcode.com/problems/range-module/)
- [CSES — Range Updates and Sums](https://cses.fi/problemset/task/1735)
