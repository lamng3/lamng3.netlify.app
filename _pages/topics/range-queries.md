---
layout: post
title: "Range Queries"
description: "Answering questions about a range of an array while the array changes. A segment tree stores a summary per node, a walk descends it to find a position, and a Fenwick tree does prefix sums in less code once the values are compressed to ranks."
permalink: /blog/range-queries/
last_updated: 2026-10-10
author: Lam Nguyen
toc:
  sidebar: right
---

Answering questions about a range of an array while the array changes. A segment tree stores a summary per node, a walk descends it to find a position, and a Fenwick tree does prefix sums in less code once the values are compressed to ranks.

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

## Segment Tree {#segment-tree}

The segment tree is usually introduced as an array of size `4 * n` with `2*v+1` / `2*v+2` index arithmetic. A more useful view is a **tree of nodes**, where each node owns an interval and stores a small _summary_ of it. Everything else — storing richer data per node, or spanning a billion indices — is a variation on what a node holds and when it is created.

### The core idea: a node is a summary of its range

A segment tree over an array is a binary tree. The root covers the whole range $$[0, n)$$; each internal node splits its range in half and hands each half to a child; leaves cover a single index. A node stores whatever summary of its range you need — a sum, a min, a max — computed from its two children by a **merge** function.

Two operations, both $$O(\log n)$$:

- **Query** a range: walk down from the root, stopping at nodes whose range is fully inside the query, and merge their summaries.
- **Update** a position: change the leaf, then re-merge on the way back up so every ancestor's summary stays correct.

The whole design reduces to answering one question: **what does a node store, and how do two children merge into their parent?** Get that right and the tree writes itself.

### When a node stores more than a number

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

### When the range is a billion wide

The other axis you can push is the _range_. So far the tree has a leaf per index, which is fine for $$n = 10^5$$ but hopeless when indices run up to $$10^9$$ — allocating $$4 \times 10^9$$ nodes is out of the question.

Most of that range is empty, though. If you only ever touch a few thousand positions, you only need the handful of nodes on the paths to them. That's the **dynamic** (a.k.a. **sparse**) segment tree: don't pre-build anything; create a child node only the first time you descend into it.

Instead of `2*v+1` index arithmetic, each node stores explicit `left` and `right` child pointers (indices into a pool), initialized to `-1` for "doesn't exist yet." When a traversal needs a child that isn't there, we allocate it on the spot. The tree conceptually spans $$[0, 10^9]$$ but only ever materializes $$O(q \log C)$$ nodes for $$q$$ operations over a coordinate range of size $$C$$.

[LeetCode 732 — My Calendar III](https://leetcode.com/problems/my-calendar-iii/) is the perfect showcase. You book half-open intervals `[start, end)` one at a time, and after each booking you report the maximum number of events that overlap at any single point (the "$$k$$-booking"). Model each booking as **+1 over the range** `[start, end-1]`, and the answer is the **global maximum** over the whole line. That's a range-add / range-max structure — which needs lazy propagation — over a range far too wide to build eagerly. Dynamic segment tree it is.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
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

### Coordinate compression: the usual alternative

Before reaching for a dynamic segment tree, it's worth knowing the common shortcut. If you can see all the queries up front (an _offline_ setting), you can **coordinate-compress**: collect every endpoint that ever appears, sort and dedupe them, and map the few thousand distinct coordinates down to a small dense range. Then an ordinary array-backed segment tree over that compressed range does the job.

The dynamic segment tree earns its keep when you _can't_ see everything in advance — an **online** problem like My Calendar III, where each answer must be produced before the next booking arrives — or when you want persistence (each update forking a new version by copying only the $$O(\log C)$$ nodes on its path, which is exactly how a persistent segment tree is built).

### Takeaways

- A segment tree is a tree of nodes; each node is a **summary** of its range, built by a **merge** of its children.
- To solve a new problem, decide **what a node stores** and **how children merge** — often that's the entire solution (the longest-repeating-run node).
- When the index space is huge, go **dynamic/sparse**: replace index arithmetic with child pointers and create nodes lazily, so you pay only for the paths you actually touch.
- **Lazy propagation** lets range updates stay $$O(\log)$$; coordinate compression is the offline alternative when you can see all queries ahead of time.

## Segment Tree Walk {#segment-tree-walk}

The node view says what a segment tree stores. The next question is how to use it to _find_ something: the first position where a condition holds, in one descent instead of a binary search wrapped around range queries.

Range queries mixed with a stateful greedy are a recurring olympiad motif. A naive scan handles each operation in $$O(n)$$, and the reflexive fix — a binary search wrapped around a logarithmic range query — only reaches $$O(\log^2 n)$$. We can do better on both fronts. Pairing a **segment tree walk** (a single descent that locates a boundary in one pass) with an **amortized potential argument** brings one operation to $$O(\log n)$$ worst case and the other to $$O(\log n)$$ amortized.

Our example is [LeetCode 2286 — Booking Concert Tickets in Groups](https://leetcode.com/problems/booking-concert-tickets-in-groups/), an unusually instructive problem. If you think of segment trees as _nodes that hold summaries_, my earlier post [Segment Tree: One Node at a Time](#segment-tree) builds the mental model this one relies on.

### Formal problem statement

We are given a hall of $$n$$ rows and $$m$$ seats per row, rows indexed $$R \in [0, n-1]$$ and seats $$C \in [0, m-1]$$. Seats in a row fill strictly left to right, so the state of row $$i$$ is captured by a single number $$r_i \in [0, m]$$ — the count of **remaining (free) seats**:

- allocated prefix: $$[0,\; m - r_i - 1]$$,
- free suffix: $$[m - r_i,\; m - 1]$$.

We maintain the vector $$R = (r_0, r_1, \dots, r_{n-1})$$ under two online operations:

1. **`gather(k, maxRow)`** — find the minimum index $$i \in [0, \text{maxRow}]$$ with $$r_i \ge k$$. If it exists, seat the group together: return $$(i,\; m - r_i)$$ and set $$r_i \leftarrow r_i - k$$. Otherwise return $$\varnothing$$ with no state change.
2. **`scatter(k, maxRow)`** — if $$\sum_{i=0}^{\text{maxRow}} r_i \ge k$$, greedily fill rows from the smallest index upward until $$k$$ seats are placed, then return `true`; otherwise return `false` with no state change.

Up to $$5 \cdot 10^4$$ calls are made, with $$n \le 5 \cdot 10^4$$ and $$m, k \le 10^9$$.

### The monoid on the tree

Build a segment tree over the row domain $$[0, n-1]$$. Each segment $$[l, r]$$ stores a pair

$$\mathcal{N}_{[l,r]} = \bigl(S_{[l,r]},\; M_{[l,r]}\bigr), \qquad S_{[l,r]} = \sum_{i=l}^{r} r_i, \quad M_{[l,r]} = \max_{i=l}^{r} r_i.$$

The sum $$S$$ answers "are there enough seats in total?" for `scatter`, and the max $$M$$ answers "does any single row fit the whole group?" for `gather`. The two merge componentwise, forming a monoid on $$\mathcal{U} = \mathbb{Z}_{\ge 0} \times \mathbb{Z}_{\ge 0}$$:

$$(S_L, M_L) \oplus (S_R, M_R) = \bigl(S_L + S_R,\; \max(M_L, M_R)\bigr),$$

with identity $$e = (0, 0)$$. Associativity carries over from $$+$$ and $$\max$$, so $$(\mathcal{U}, \oplus)$$ is a monoid and the tree supports point updates and range queries in $$O(\log n)$$. Every change here touches a single row, so all updates are **point** updates — no lazy propagation is needed.

### `gather`: the segment tree walk

The obvious route to the smallest valid row is to binary search the answer $$i^{*}$$, testing each candidate prefix with a range-max query — $$O(\log n)$$ tests of $$O(\log n)$$ each, so $$O(\log^2 n)$$. We can fold that search directly _into_ the tree descent instead. The technique goes by several names: the **segment tree walk**, **descent**, or **binary search on the segment tree**.

The insight is that the max stored at each node already tells us which half could contain a feasible row, so no separate search is needed. Starting from the root, at a node $$v$$ over $$[tl, tr]$$ with midpoint $$tm = tl + \lfloor (tr - tl)/2 \rfloor$$:

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

#### On the `maxRow` bound

One subtlety deserves care. The prune `tl > maxRow` rejects a subtree only when its _entire_ range starts past `maxRow`, so a node straddling the boundary is still entered, and the descent can slip into its right child and return a leaf index $$> \text{maxRow}$$. Here that never yields a wrong answer: the branch rule turns right only when the left child holds no row with $$r_i \ge k$$, so if a valid row $$\le \text{maxRow}$$ existed, the walk would have committed left before ever reaching the boundary. The mental model to keep: _the walk finds the global smallest row with $$r_i \ge k$$, and `maxRow` only gates the final answer_ — if the returned leaf exceeds it, treat that as failure. (For a stricter version, carry `maxRow` into the recursion and clamp the right-child call.)

### `scatter`: greedy consumption, amortized

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

#### Why this is $$O(\log n)$$ amortized

Define the potential $$\Phi$$ as the number of non-empty rows,

$$\Phi = \sum_{i=0}^{n-1} [\, r_i > 0 \,], \qquad \Phi_0 = n, \qquad \Phi \ge 0.$$

Take one `scatter` that spreads across $$t$$ rows. Exactly $$t - 1$$ of them are drained to $$r_i = 0$$ — each saturated row advances `head` by one and drops $$\Phi$$ by one — while at most one row is left partially full. Because `head` never moves backward and is bounded above by $$n$$, the saturating steps summed over the _entire_ run of queries telescope:

$$\sum_{\text{all calls}} (t - 1) \;\le\; \Phi_0 \;=\; n.$$

Each saturating step costs one $$O(\log n)$$ point update, and each call independently pays $$O(\log n)$$ for its feasibility query plus its final partial update. Over $$Q$$ queries:

$$\mathcal{T}_{\text{total}} = O\!\Bigl(Q \log n + \textstyle\sum (t-1)\,\log n\Bigr) = O\bigl((Q + n)\log n\bigr),$$

so `scatter` runs in $$O(\log n)$$ **amortized**. The `head` pointer does exactly the work a potential function is meant to bill: an expensive multi-row call is paid for by the rows it retires for good.

### Complexity summary

| Resource     | Complexity               | Justification                                        |
| ------------ | ------------------------ | ---------------------------------------------------- |
| Construction | $$O(n)$$                 | linear build over $$4n$$ nodes                       |
| `gather`     | $$O(\log n)$$ worst case | one root-to-leaf walk                                |
| `scatter`    | $$O(\log n)$$ amortized  | $$O(\log n)$$ query + $$O(1)$$ amortized saturations |
| Space        | $$O(n)$$                 | $$4n$$ nodes, two aggregates each                    |

#### A 64-bit warning

The largest possible range sum is $$n \cdot m = 5\cdot10^4 \times 10^9 = 5 \cdot 10^{13}$$, far beyond $$2^{31} - 1$$. Every sum aggregate, feasibility total, and `take`/`rem` counter must therefore be 64-bit (`long long`). The per-row maximum never exceeds $$m \le 10^9$$, but storing the whole node in `long long` avoids overflow bugs entirely.

### Implementation

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
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

### Takeaways

- Model each row by its free-seat count $$r_i$$; the tree stores a $$(\text{sum}, \max)$$ monoid — sum gates `scatter`, max gates `gather`.
- A **segment tree walk** turns "smallest index whose max $$\ge k$$" from $$O(\log^2 n)$$ into a single $$O(\log n)$$ descent by branching on the child aggregates.
- A **monotone `head` pointer** plus a potential $$\Phi = \#\{r_i > 0\}$$ proves the greedy `scatter` is $$O(\log n)$$ amortized: each expensive multi-row call is paid for by the rows it retires forever.
- Sums reach $$5 \cdot 10^{13}$$ — use 64-bit integers throughout.

## Fenwick Tree with Coordinate Compression {#fenwick-tree}

Not every range query needs a full segment tree. When the question is a prefix count and values are only ever added, a Fenwick tree does the same job in a few lines, as long as its indices are small. That last condition is where coordinate compression comes in.

A Fenwick tree counts along indices $$1 \dots m$$, so to count how many earlier prefix sums fall in some range, you would index it by the prefix-sum _value_. But prefix sums can be up to $$10^{14}$$ or negative, so you cannot use them as array indices directly. **Coordinate compression** fixes this: replace each value by its **rank** in the sorted set of all values that ever appear, giving a dense $$1 \dots m$$ index the Fenwick tree can use.

The one subtlety that trips people up: the candidate set must include **every value you will insert _and_ every value you will query** — the query boundaries too, not just the points. Miss a boundary and its `lower_bound` lands between ranks, silently off by one.

### The problem

[LeetCode — Count Subarrays with Distant Sums](https://leetcode.com/problems/count-subarrays-with-distant-sums/): count subarrays whose sum is _far_ from `goal`, i.e. $$\vert \text{sum} - \text{goal}\vert \ge k$$. With prefix sums $$P$$, a subarray $$(L, R]$$ has sum $$P_R - P_L$$, so we want

$$
\vert P_R - P_L - \text{goal} \vert \ge k.
$$

Fix $$R$$ and count valid $$L < R$$. It is easier to count the **complement** (the "close" ones) and subtract: $$L$$ is close when

$$
P_R - \text{goal} - k < P_L < P_R - \text{goal} + k,
$$

so of the $$R$$ subarrays ending at $$R$$, subtract those whose $$P_L$$ lands in that open window. Sweep $$R$$ left to right, keeping every earlier $$P_L$$ in a Fenwick tree keyed by value, and range-query the window.

### Flatten the candidates

Every value the Fenwick tree touches must have a rank. Those are the points we insert (each $$P_i$$) **and** the two window edges we query for each $$R$$ ($$P_i - \text{goal} - k$$ and $$P_i - \text{goal} + k$$). Collect them all, sort, dedupe, and `lower_bound` gives each value its 1-based rank:

```cpp
vector<ll> A;
auto addCandidate = [&](ll x) {
    A.pb(x);                 // a prefix sum we may insert
    A.pb(x - goal - k);      // a window edge we may query
    A.pb(x - goal + k);
};
REP(i, n + 1) addCandidate(pref[i]);

sort(all(A));
A.erase(unique(all(A)), A.end());          // dense ranks 1..m
auto position = [&](ll x) {                 // value -> Fenwick index
    return lower_bound(all(A), x) - A.begin() + 1;
};
```

Because the edges are in `A`, `position(P_R - goal - k)` and `position(P_R - goal + k)` land on real ranks, and the open window is the rank range between them.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
class FenwickTree {
private:
    int n;
    vi ft;
public:
    FenwickTree(int n) : n(n) { ft.assign(n+1, 0); }
    void add(int i, int x) {
        for (; i <= n; i+=i&-i) ft[i] += x;
    }
    int query(int i) {
        if (i < 0) return 0;
        int res = 0;
        for (; i > 0; i-=i&-i) res += ft[i];
        return res;
    }
    int query(int L, int R) {
        if (L > R) return 0;
        return query(R) - query(L-1);
    }
};

class Solution {
public:
    ll distantSubarrays(vi& nums, int goal, int k) {
        // |A[R] - A[L] - goal| >= k
        // A[R] <= A[L] + goal - k
        // A[R] >= A[L] + goal + k
        int n = sz(nums);

        vector<ll> pref(n+1, 0);
        REP(i, n) pref[i+1] = pref[i] + nums[i];

        vector<ll> A;
        auto addCandidate = [&](ll x) {
            A.pb(x);
            A.pb(x - goal - k);
            A.pb(x - goal + k);
        };
        REP(i, n+1) addCandidate(pref[i]);

        // coordinate compress
        sort(all(A));
        A.erase(unique(all(A)), A.end());
        int m = sz(A);
        auto position = [&](ll x) {
            return lower_bound(all(A), x) - A.begin() + 1;
        };

        FenwickTree ft(m);
        ft.add(position(pref[0]), 1);

        ll ans = 0;

        FOR(R, 1, n) {
            // A[L] >= A[R] - goal + k
            int lo = position(pref[R] - goal - k);

            // A[L] <= A[R] - goal - k
            int hi = position(pref[R] - goal + k);

            ans += R;
            ans -= ft.query(lo+1, hi-1); // minus middle part

            ft.add(position(pref[R]), 1);
        }

        return ans;
    }
};
```

</details>

Each step is one range query and one point update, so the whole sweep is $$O(n \log n)$$.

### The takeaway

Whenever a Fenwick (or segment) tree needs to be keyed by a value that is large, sparse, or negative, compress: gather **all** values it will ever see — inserts and query bounds alike — into one sorted, deduped array, and use each value's rank as the index. The "and query bounds" half is the easy thing to forget.

## Practice {#practice}

**Segment Tree**

- [LeetCode 2213 — Longest Substring of One Repeating Character](https://leetcode.com/problems/longest-substring-of-one-repeating-character/)
- [LeetCode 732 — My Calendar III](https://leetcode.com/problems/my-calendar-iii/)
- [LeetCode 715 — Range Module](https://leetcode.com/problems/range-module/)
- [CSES — Range Updates and Sums](https://cses.fi/problemset/task/1735)

**Segment Tree Walk**

- [LeetCode 2286 — Booking Concert Tickets in Groups](https://leetcode.com/problems/booking-concert-tickets-in-groups/)
- [CSES — Prefix Sum Queries](https://cses.fi/problemset/task/2166) (segment tree walk / max-prefix descent)
- [LeetCode 715 — Range Module](https://leetcode.com/problems/range-module/)
- [Codeforces EDU — Segment Tree, Part 1 & 2](https://codeforces.com/edu/course/2/lesson/4) (descent exercises)

**Fenwick Tree with Coordinate Compression**

- [LeetCode — Count Subarrays with Distant Sums](https://leetcode.com/problems/count-subarrays-with-distant-sums/)
- [LeetCode 327 — Count of Range Sum](https://leetcode.com/problems/count-of-range-sum/)
- [LeetCode 493 — Reverse Pairs](https://leetcode.com/problems/reverse-pairs/)
- [LeetCode 315 — Count of Smaller Numbers After Self](https://leetcode.com/problems/count-of-smaller-numbers-after-self/)

## Further reading {#further-reading}

**Segment Tree**

- [CP-Algorithms — Segment Tree](https://cp-algorithms.com/data_structures/segment_tree.html): the definitive reference. Start here for the recursive formulation, then read the sections on storing more per node and on dynamic/implicit trees.
- [USACO Guide — Segment Trees](https://usaco.guide/gold/segtree-ext?lang=cpp) and its [sparse segment tree](https://usaco.guide/plat/sparse-segtree?lang=cpp) page.
- [Codeforces — Efficient and easy segment trees](https://codeforces.com/blog/entry/18051) (al.cash) for the iterative bottom-up variant once the recursive one clicks.

**Segment Tree Walk**

- [CP-Algorithms — Segment Tree](https://cp-algorithms.com/data_structures/segment_tree.html) — see "Searching for the first element greater than a given amount."
- [USACO Guide — More Applications of Segment Tree](https://usaco.guide/plat/segtree-ext?lang=cpp) — the "Walking on a Segment Tree" section.
- [Potential method (Wikipedia)](https://en.wikipedia.org/wiki/Potential_method) — the amortized-analysis framing behind the `head` pointer.
