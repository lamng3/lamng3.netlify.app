---
layout: post
title: "Segment Tree Walk and Amortized Allocation"
description: A cp-algorithms-style deep dive into Booking Concert Tickets in Groups — modeling seat allocation as a sum/max monoid on a segment tree, replacing a binary-searched range-max with an O(log n) descent (the "segment tree walk"), and proving the greedy scatter is O(log n) amortized via a potential argument on a monotone head pointer.
date: 2026-08-14
author: Nathan Nguyen
categories: [Data Structures, Algorithms]
tags: [Segment Tree, Segment Tree Walk, Binary Search on Tree, Amortized Analysis, Potential Method, Range Queries, Competitive Programming]
toc:
  sidebar: right
---

Range querying combined with a stateful greedy is a recurring olympiad motif. A naive scan answers each operation in $$O(n)$$; the lazy reflex — binary search wrapped around a logarithmic range query — gives $$O(\log^2 n)$$. Both leave performance on the table. By pairing a **segment tree walk** (descending the tree to find a boundary in one pass) with an **amortized potential argument**, we get $$O(\log n)$$ worst-case for one operation and $$O(\log n)$$ amortized for the other.

The vehicle is [LeetCode 2286 — Booking Concert Tickets in Groups](https://leetcode.com/problems/booking-concert-tickets-in-groups/), a genuinely instructive problem. If segment trees as _nodes-holding-summaries_ are new to you, my earlier post [Segment Trees, One Node at a Time]({% post_url 2026-08-12-segment-tree-nodes-dynamic-sparse %}) sets up the mental model this one leans on.

## Formal problem statement

We are given a hall of $$n$$ rows and $$m$$ seats per row, rows indexed $$R \in [0, n-1]$$ and seats $$C \in [0, m-1]$$. Seats in a row fill strictly left to right, so the state of row $$i$$ is captured by a single number $$r_i \in [0, m]$$ — the count of **remaining (free) seats**:

- allocated prefix: $$[0,\; m - r_i - 1]$$,
- free suffix: $$[m - r_i,\; m - 1]$$.

We maintain the vector $$R = (r_0, r_1, \dots, r_{n-1})$$ under two online operations:

1. **`gather(k, maxRow)`** — find the minimum index $$i \in [0, \text{maxRow}]$$ with $$r_i \ge k$$. If it exists, seat the group together: return $$(i,\; m - r_i)$$ and set $$r_i \leftarrow r_i - k$$. Otherwise return $$\varnothing$$ with no state change.
2. **`scatter(k, maxRow)`** — if $$\sum_{i=0}^{\text{maxRow}} r_i \ge k$$, greedily fill rows from the smallest index upward until $$k$$ seats are placed, then return `true`; otherwise return `false` with no state change.

Up to $$5 \cdot 10^4$$ calls are made, with $$n \le 5 \cdot 10^4$$ and $$m, k \le 10^9$$.

## The monoid on the tree

Build a segment tree over the row domain $$[0, n-1]$$. Each segment $$[l, r]$$ stores a pair

$$\mathcal{N}_{[l,r]} = \bigl(S_{[l,r]},\; M_{[l,r]}\bigr), \qquad S_{[l,r]} = \sum_{i=l}^{r} r_i, \quad M_{[l,r]} = \max_{i=l}^{r} r_i.$$

The sum $$S$$ answers "are there enough seats total?" for `scatter`; the max $$M$$ answers "does any single row fit the group?" for `gather`. Their merge is the componentwise monoid on $$\mathcal{U} = \mathbb{Z}_{\ge 0} \times \mathbb{Z}_{\ge 0}$$:

$$(S_L, M_L) \oplus (S_R, M_R) = \bigl(S_L + S_R,\; \max(M_L, M_R)\bigr),$$

with identity $$e = (0, 0)$$. Associativity is inherited from $$+$$ and $$\max$$, so $$(\mathcal{U}, \oplus)$$ is a monoid and the tree supports point update and range query in $$O(\log n)$$. Both operations here are **point** updates (one row changes at a time), so no lazy propagation is needed — a pleasant simplification.

## `gather`: the segment tree walk

The obvious route to the smallest valid row is to binary search the answer $$i^\*$$ and test each candidate prefix with a range-max query — $$O(\log n)$$ tests, each $$O(\log n)$$, giving $$O(\log^2 n)$$. We can do better by folding the search _into_ the tree descent. This technique goes by several names: **segment tree walk**, **descent**, or **binary search on the segment tree**.

The idea: the max stored at each node already tells us which half can contain a feasible row, so we never need a separate search. Starting at the root, at a node $$v$$ over $$[tl, tr]$$ with $$tm = tl + \lfloor (tr - tl)/2 \rfloor$$:

1. **Prune.** If $$tl > \text{maxRow}$$ or $$M_{[tl,tr]} < k$$, no leaf in this subtree qualifies — return $$-1$$.
2. **Base.** If $$tl = tr$$, this leaf is the answer — return $$tl$$.
3. **Branch.** If the _left_ child has $$M \ge k$$, the smallest valid index lies there; recurse left. Otherwise recurse right.

The branch rule is what makes it correct: because we want the **minimum** index, we always prefer the left child whenever it contains any feasible row, and only fall through to the right when the left cannot help.

```
                    [0, n-1]        M ≥ k ?
                    /       \
        M_left ≥ k /         \  else
                [0, tm]     [tm+1, n-1]
                /   \
              ...   ...        →  descend to a single leaf
```

Each step drops one level, so the walk touches exactly one node per level: $$O(\log n)$$.

### On the `maxRow` bound

One subtlety: the pruning check `tl > maxRow` only rejects a subtree when its _entire_ range starts past `maxRow`. A node straddling `maxRow` is still entered, and the descent may walk into its right child — potentially returning a leaf index $$> \text{maxRow}$$. In this problem that never produces a wrong answer, because the branch rule only goes right when the left child has no row with $$r_i \ge k$$; if a valid row $$\le \text{maxRow}$$ existed, the walk would already have committed left before ever crossing the boundary. The clean mental model: _the walk finds the global smallest row with $$r_i \ge k$$, and `maxRow` only has to gate the final answer._ If the returned leaf exceeds `maxRow`, treat it as failure. (For a stricter variant, carry `maxRow` into the recursion and clamp the right-child call.)

## `scatter`: greedy consumption, amortized

`scatter` has a cheap feasibility gate and a greedy body.

**Feasibility.** Query $$S_{[0, \text{maxRow}]}$$. If it is $$< k$$, reject in $$O(\log n)$$ — no state touched.

**Greedy fill.** Otherwise seat the group from the lowest rows up. The danger is re-scanning rows that are already full ($$r_i = 0$$) on every call, which would be $$O(n)$$ per operation. The fix is a single **monotone pointer**

$$\text{head} = \min\{\, i \in [0, n-1] \mid r_i > 0 \,\}$$

that never moves backward. Each call resumes from `head`, consumes whole rows as it goes, and stops mid-row when the group is exhausted:

```cpp
while (k > 0) {
    ll rem = query_sum(head, head);   // free seats in row `head`
    if (rem == 0) { head++; continue; }
    ll take = min((ll)k, rem);
    update(head, take);               // r_head -= take
    k -= take;
    if (take == rem) head++;          // row saturated, advance
}
```

### Why this is $$O(\log n)$$ amortized

Define the potential $$\Phi$$ as the number of non-empty rows,

$$\Phi = \sum_{i=0}^{n-1} [\, r_i > 0 \,], \qquad \Phi_0 = n, \qquad \Phi \ge 0.$$

Consider one `scatter` that spreads across $$t$$ rows. Exactly $$t - 1$$ of them are drained to $$r_i = 0$$ (each fully saturated row advances `head` by one and drops $$\Phi$$ by one), and at most one row is left partially full. Since `head` is non-decreasing and bounded above by $$n$$, the total number of saturating steps across the _entire_ run of queries telescopes:

$$\sum_{\text{all calls}} (t - 1) \;\le\; \Phi_0 \;=\; n.$$

Each saturating step costs one $$O(\log n)$$ point update, and each call independently pays $$O(\log n)$$ for its feasibility query plus its final partial update. Over $$Q$$ queries:

$$\mathcal{T}_{\text{total}} = O\!\Bigl(Q \log n + \textstyle\sum (t-1)\,\log n\Bigr) = O\bigl((Q + n)\log n\bigr),$$

so `scatter` is $$O(\log n)$$ **amortized**. The `head` pointer is doing exactly the work a potential function is meant to bill: expensive multi-row calls are paid for by the rows they permanently retire.

## Complexity summary

| Resource     | Complexity               | Justification                                        |
| ------------ | ------------------------ | ---------------------------------------------------- |
| Construction | $$O(n)$$                 | linear build over $$4n$$ nodes                       |
| `gather`     | $$O(\log n)$$ worst case | one root-to-leaf walk                                |
| `scatter`    | $$O(\log n)$$ amortized  | $$O(\log n)$$ query + $$O(1)$$ amortized saturations |
| Space        | $$O(n)$$                 | $$4n$$ nodes, two aggregates each                    |

### A 64-bit warning

The largest possible range sum is $$n \cdot m = 5\cdot10^4 \times 10^9 = 5 \cdot 10^{13}$$, well past $$2^{31} - 1$$. Every sum aggregate, feasibility total, and `take`/`rem` counter must be 64-bit (`long long`). The per-row maximum stays within $$m \le 10^9$$, but keeping the whole node in `long long` avoids a class of overflow bugs for free.

## Implementation

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
        ll sum = 0, mx = 0;
    };
    vector<Node> st;
    int N, M;

    void pull(int v) {
        st[v].sum = st[v*2+1].sum + st[v*2+2].sum;
        st[v].mx  = max(st[v*2+1].mx, st[v*2+2].mx);
    }
    void build(int v, int tl, int tr) {
        if (tl == tr) { st[v] = {M, M}; return; }
        int tm = tl + (tr - tl) / 2;
        build(v*2+1, tl, tm);
        build(v*2+2, tm+1, tr);
        pull(v);
    }

public:
    SegmentTree(int n, int m) : N(n), M(m) {
        st.resize(4*N);
        build(0, 0, N-1);
    }

    void update(int v, int tl, int tr, int idx, int x) {
        if (tl == tr) { st[v].sum -= x; st[v].mx -= x; return; }
        int tm = tl + (tr - tl) / 2;
        if (idx <= tm) update(v*2+1, tl, tm, idx, x);
        else           update(v*2+2, tm+1, tr, idx, x);
        pull(v);
    }

    ll query(int v, int tl, int tr, int ql, int qr) {
        if (ql > qr) return 0;
        if (ql <= tl && tr <= qr) return st[v].sum;
        int tm = tl + (tr - tl) / 2;
        return query(v*2+1, tl, tm, ql, min(tm, qr)) +
               query(v*2+2, tm+1, tr, max(tm+1, ql), qr);
    }

    // segment tree walk: smallest leaf with mx >= k, gated by maxRow
    int walk(int v, int tl, int tr, int k, int mxr) {
        if (st[v].mx < k || tl > mxr) return -1;
        if (tl == tr) return tl;
        int tm = tl + (tr - tl) / 2;
        if (st[v*2+1].mx >= k) return walk(v*2+1, tl, tm, k, mxr);
        return walk(v*2+2, tm+1, tr, k, mxr);
    }
};

class BookMyShow {
private:
    SegmentTree* segtree;
    int N, M, head;

public:
    BookMyShow(int n, int m) : N(n), M(m), head(0) {
        segtree = new SegmentTree(n, m);
    }

    vi gather(int k, int maxRow) {
        int r = segtree->walk(0, 0, N-1, k, maxRow);
        if (r == -1) return {};
        int c = M - (int)segtree->query(0, 0, N-1, r, r);
        segtree->update(0, 0, N-1, r, k);
        return {r, c};
    }

    bool scatter(int k, int maxRow) {
        ll rem = segtree->query(0, 0, N-1, 0, maxRow);
        if (rem < k) return false;
        while (k > 0) {
            ll remi = segtree->query(0, 0, N-1, head, head);
            if (remi == 0) { head++; continue; }
            ll take = min((ll)k, remi);
            segtree->update(0, 0, N-1, head, (int)take);
            k -= take;
            if (take == remi) head++;
        }
        return true;
    }
};

/**
 * Your BookMyShow object will be instantiated and called as such:
 * BookMyShow* obj = new BookMyShow(n, m);
 * vector<int> param_1 = obj->gather(k, maxRow);
 * bool param_2 = obj->scatter(k, maxRow);
 */
```

</details>

## Docs worth reading

- [CP-Algorithms — Segment Tree](https://cp-algorithms.com/data_structures/segment_tree.html), especially the "Searching for the first element greater than a given amount" section — that is the segment tree walk in its purest form.
- [USACO Guide — More Applications of Segment Tree](https://usaco.guide/plat/segtree-ext?lang=cpp), whose "Walking on a Segment Tree" section covers exactly this descent and several variants.
- [Potential method (Wikipedia)](https://en.wikipedia.org/wiki/Potential_method) for the amortized-analysis framing behind the `head` pointer — the same telescoping argument as the multi-pop stack and dynamic array.

## Takeaways

- Model each row by its free-seat count $$r_i$$; the tree stores a $$(\text{sum}, \max)$$ monoid — sum gates `scatter`, max gates `gather`.
- A **segment tree walk** turns "smallest index whose max $$\ge k$$" from $$O(\log^2 n)$$ into a single $$O(\log n)$$ descent by branching on the child aggregates.
- A **monotone `head` pointer** plus a potential $$\Phi = \#\{r_i > 0\}$$ proves the greedy `scatter` is $$O(\log n)$$ amortized: each expensive multi-row call is paid for by the rows it retires forever.
- Sums reach $$5 \cdot 10^{13}$$ — use 64-bit integers throughout.

## Practice

- [LeetCode 2286 — Booking Concert Tickets in Groups](https://leetcode.com/problems/booking-concert-tickets-in-groups/)
- [CSES — Prefix Sum Queries](https://cses.fi/problemset/task/2166) (segment tree walk / max-prefix descent)
- [LeetCode 715 — Range Module](https://leetcode.com/problems/range-module/)
- [Codeforces EDU — Segment Tree, Part 1 & 2](https://codeforces.com/edu/course/2/lesson/4) (descent exercises)
