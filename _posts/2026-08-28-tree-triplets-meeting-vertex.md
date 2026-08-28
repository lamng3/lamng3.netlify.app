---
layout: post
title: "Counting Tree Triplets by Their Meeting Vertex"
description: In a tree, the three pairwise paths of a triplet {u,v,w} share exactly one vertex, and every other vertex lies on either zero or two of them. That parity fact collapses Codeforces 2241E to a per-vertex count, which an online elementary-symmetric-polynomial scan finishes in O(n).
date: 2026-08-28
author: Nathan Nguyen
categories: [Algorithms, Graph Theory]
tags: [Trees, LCA, Counting, Symmetric Polynomials, Prefix DP, Combinatorics, Codeforces, Competitive Programming]
toc:
  sidebar: right
---

[Codeforces 2241E](https://codeforces.com/contest/2241/problem/E) gives a tree on $$n$$ vertices with a value $$a_x$$ on each vertex. Write $$p(x, y)$$ for the product of the values along the simple path from $$x$$ to $$y$$. Count the unordered triplets $$\{u, v, w\}$$ for which

$$
p(u, v)\cdot p(v, w)\cdot p(w, u)
$$

is a perfect square. The product ranges over paths, so it looks like it depends on the whole triangle; it does not. It depends on one vertex.

## The three paths share exactly one vertex

Fix a triplet $$\{u, v, w\}$$ and look at how many of the three paths $$P(u,v)$$, $$P(v,w)$$, $$P(w,u)$$ each vertex lies on.

> **Lemma.** There is exactly one vertex $$c$$ that lies on all three paths, and every other vertex lies on $$0$$ or $$2$$ of them.

**A vertex on all three exists.** If one of the triplet, say $$w$$, already lies on $$P(u,v)$$, take $$c = w$$: both $$P(w,u)$$ and $$P(w,v)$$ pass through $$w$$, and $$w \in P(u,v)$$ by assumption. Otherwise walk from $$w$$ toward $$P(u,v)$$; since the graph is a tree there is a unique first vertex $$c$$ where the walk meets that path. Every route from $$w$$ into $$P(u,v)$$ goes through $$c$$, so $$P(w,u)$$ and $$P(w,v)$$ both contain $$c$$, and $$c \in P(u,v)$$ by construction.

**It is unique.** Suppose $$x$$ lies on all three paths. From $$x \in P(w,u)$$ and $$x \in P(u,v)$$, the route from $$w$$ to $$x$$ enters $$P(u,v)$$ at $$x$$. But the first entry point from $$w$$ into $$P(u,v)$$ is $$c$$, so $$x = c$$.

**Everyone else is on $$0$$ or $$2$$.** Take $$x \ne c$$ and delete it; the tree breaks into components. If $$u, v, w$$ all land in one component, no pairwise path uses $$x$$, so $$x$$ is on $$0$$ paths. If they split across exactly two components, exactly two of the three pairs are separated by $$x$$, so $$x$$ is on $$2$$. If they split across three components, $$x$$ would separate all three pairs and hence lie on all three paths — making $$x$$ the unique common vertex, contradicting $$x \ne c$$. $$\blacksquare$$

That vertex $$c$$ is the Steiner point of the triplet.

## An LCA restatement: two of the three pairwise LCAs coincide

The $$O(n)$$ solution never computes an LCA — it deletes $$c$$ and counts components — but the meeting vertex has a clean rooted-tree description worth keeping in your pocket.

Root the tree anywhere. The highest vertex on a path $$P(x, y)$$ is $$\operatorname{lca}(x, y)$$, so the three pairwise LCAs are the topmost points of the three paths. Let $$L = \operatorname{lca}(u, v, w)$$ be the shallowest common ancestor of all three. Two cases:

- The three vertices descend into three different child-subtrees of $$L$$ (or one of them _is_ $$L$$). Then every pairwise path climbs all the way to $$L$$, so $$\operatorname{lca}(u,v) = \operatorname{lca}(v,w) = \operatorname{lca}(w,u) = L$$, and the meeting vertex is $$c = L$$.
- Otherwise two of them, say $$u$$ and $$v$$, share a child-subtree of $$L$$ while $$w$$ does not. Then $$\operatorname{lca}(u, v)$$ sits strictly below $$L$$ and equals the meeting vertex $$c$$, while $$\operatorname{lca}(v, w) = \operatorname{lca}(w, u) = L$$.

Either way, **at least two of the three pairwise LCAs are equal, and the deepest of them is the meeting vertex $$c$$.** This is the same $$c$$ as before, seen from the root instead of by deletion.

## Why only $$a_c$$ matters

In the product $$p(u,v)\,p(v,w)\,p(w,u)$$, each vertex $$x$$ contributes $$a_x$$ raised to the number of paths it lies on. Writing $$e_x$$ for that exponent, the lemma says $$e_x \in \{0, 2\}$$ for every $$x \ne c$$ and $$e_c = 3$$:

$$
p(u,v)\,p(v,w)\,p(w,u) = a_c^{3} \prod_{x \ne c} a_x^{e_x}.
$$

Every exponent on the right is even except $$e_c = 3$$, and $$a_c^3 = a_c^2 \cdot a_c$$, so the whole thing is $$a_c$$ times a perfect square. It is a perfect square **iff $$a_c$$ is a perfect square**. The triangle of paths was a distraction; the condition lives entirely at the meeting vertex.

## Counting triplets by their meeting vertex

Every triplet has exactly one meeting vertex, so we can bucket triplets by it without any double counting:

$$
\text{answer} = \sum_{\substack{x \,:\, a_x \text{ is a perfect square}}} \bigl(\text{triplets whose meeting vertex is } x\bigr).
$$

Delete $$x$$ and let the resulting components have sizes $$s_1, s_2, \dots, s_d$$. A triplet meets at $$x$$ in one of two ways:

- **$$x$$ is one of the three chosen vertices.** The other two must sit in _different_ components (otherwise the path between them avoids $$x$$). Count: $$\sum_{i<j} s_i s_j$$.
- **$$x$$ is not chosen.** All three vertices must sit in _different_ components, so that $$x$$ separates every pair. Count: $$\sum_{i<j<\ell} s_i s_j s_\ell$$.

Both sums are **elementary symmetric polynomials** of the component sizes: $$e_2 = \sum_{i<j} s_i s_j$$ and $$e_3 = \sum_{i<j<\ell} s_i s_j s_\ell$$. The contribution of $$x$$ is $$e_2 + e_3$$.

## Elementary symmetric sums, computed online

Evaluating $$e_2$$ and $$e_3$$ term by term is $$O(d^2)$$ and $$O(d^3)$$. A single left-to-right scan gets every $$e_k$$ at once in $$O(d)$$.

Keep $$p_k$$ equal to $$e_k$$ of the prefix seen so far. When a new size $$s$$ arrives, a $$k$$-subset of the extended prefix either omits $$s$$ (already counted in $$e_k$$) or includes $$s$$ alongside a $$(k-1)$$-subset of what came before:

$$
e_k \mathrel{+}= s \cdot e_{k-1}.
$$

Apply this from the largest $$k$$ downward so each update reads the _old_ lower-order values:

```cpp
ll p1 = 0; // e1 = sum s_i
ll p2 = 0; // e2 = sum_{i<j} s_i s_j
ll p3 = 0; // e3 = sum_{i<j<k} s_i s_j s_k

for (ll s : branches) {
    p3 += s * p2;  // (k-1)=2 subsets before, plus s
    p2 += s * p1;  // (k-1)=1 subsets before, plus s
    p1 += s;       // s joins the pool
}
```

The generating-function view makes the invariant obvious: the scan multiplies in one factor at a time of

$$
\prod_{i=1}^{d} (1 + s_i\, t) = \sum_{k \ge 0} e_k\, t^k,
$$

and each line is in-place polynomial multiplication by $$(1 + s\,t)$$, updating coefficients top-down so the low coefficients used on the right are still the previous ones. For an arbitrary cap $$K$$ it generalizes to a knapsack-style loop:

```cpp
vector<ll> dp(K + 1, 0);
dp[0] = 1;
for (ll s : branches)
    for (int k = K; k >= 1; k--)
        dp[k] += dp[k - 1] * s;   // dp[k] = e_k
```

That is $$O(dK)$$, and the top-down inner loop is the standard trick that stops a single element from being used twice. Here $$K = 3$$ suffices, so the three-line version is enough.

## Component sizes in one rooting

The last piece is the component sizes after deleting $$x$$. Root the tree anywhere and compute subtree sizes $$\text{sub}[\cdot]$$ with one DFS. Deleting $$x$$ produces one component per child (the child's subtree, size $$\text{sub}[\text{child}]$$) plus, unless $$x$$ is the root, the everything-else component of size $$n - \text{sub}[x]$$. Feed those sizes into the scan.

Every step — the DFS, and one linear scan of each vertex's incident branches — is linear, so the whole solution is $$O(n)$$.

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

#define all(x) (x).begin(), (x).end()
#define sz(x) (int)((x).size())

#define fi first
#define se second
#define pb push_back

const int INF = 1e9+7;
const int MOD = 1e9+7;

const int MAXN = 2e5+5;

int A[MAXN];
vi Adj[MAXN];
int sub[MAXN];
int parent[MAXN];

int dfs(int u, int p) {
    sub[u] = 1;
    parent[u] = p;
    for (int v : Adj[u]) {
        if (v == p) continue;
        sub[u] += dfs(v, u);
    }
    return sub[u];
}

void solve() {
    int n; cin >> n;

    REP(i,n) cin >> A[i];

    REP(i,n) Adj[i].clear();
    REP(i,n-1) {
        int u, v; cin >> u >> v;
        u--; v--;
        Adj[u].pb(v);
        Adj[v].pb(u);
    }

    dfs(0,-1);

    ll ans = 0;
    REP(u,n) {
        int x = sqrt(A[u]);
        if (x * x != A[u]) continue;
        // component sizes when u is removed from the tree
        vector<ll> branches;
        for (int v : Adj[u]) {
            if (v == parent[u]) continue;
            branches.pb(sub[v]);
        }
        if (u != 0) branches.pb(n - sub[u]);
        // p2 = pairs (u chosen); p3 = triples (u not chosen)
        ll pref = 0, p2 = 0, p3 = 0;
        for (auto& b : branches) {
            p3 += b * p2;
            p2 += b * pref;
            pref += b;
        }
        ans += p2 + p3;
    }
    cout << ans << '\n';
}

int main() {
    ios::sync_with_stdio(0);
    cin.tie(0);
    int tt = 1;
    cin >> tt;
    while (tt--) solve();
    return 0;
}
```

</details>

One implementation note: `int x = sqrt(A[u])` can land one off from floating error, so re-check `x*x == A[u]` (and, to be safe on the boundary, you may test `x+1` too). Everything is 64-bit for the products — with $$n$$ up to $$2\cdot10^5$$, a single vertex's $$e_3$$ already overflows 32-bit.

## Docs worth reading

- [Codeforces 2241E editorial](https://codeforces.com/blog/entry/154698) — the meeting-vertex proof in full.

## Practice

- [Codeforces 2241E](https://codeforces.com/contest/2241/problem/E)
- [Codeforces 161D — Distance in Tree](https://codeforces.com/problemset/problem/161/D)
- [LeetCode 3067 — Count Pairs of Connectable Servers in a Weighted Tree Network](https://leetcode.com/problems/count-pairs-of-connectable-servers-in-a-weighted-tree-network/)
