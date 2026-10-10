---
layout: post
title: "Graphs and Trees"
description: "Dependency graphs and trees. Kahn's algorithm kept as a live invariant resolves definitions as they arrive, and on a tree, counting by the vertex where three paths meet turns a triple loop into one pass."
permalink: /blog/graphs-and-trees/
last_updated: 2026-10-10
author: Lam Nguyen
toc:
  sidebar: right
---

Dependency graphs and trees. Kahn's algorithm kept as a live invariant resolves definitions as they arrive, and on a tree, counting by the vertex where three paths meet turns a triple loop into one pass.

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

## Topological Order, One Entry at a Time {#topological-order}

[LeetCode 3481 — Apply Substitutions](https://leetcode.com/problems/apply-substitutions/) hands you a mapping of keys to values, where a value may itself mention other keys as `%KEY%`, plus a text full of placeholders. Expand everything.

The constraints are deliberately tiny — at most 10 keys, values of at most 8 characters, and an explicit promise of no cyclic dependencies. So the problem as stated is a few lines. But the *shape* of it — values that reference other values, resolvable only in dependency order — is the shape of a build system, a CI config loader, a shell's variable expansion, and every template engine. That shape is worth building a component for rather than an answer.

### The one-shot answer, and what it assumes

If every definition is in hand before you start, expand recursively and memoize:

```cpp
string expand(const string& k) {
    if (mp.contains(k)) return mp[k];        // already done
    string res = "";
    for (auto& [lit, key] : parse(raw[k]))   // literal chunks and placeholders
        res += lit + (key.empty() ? "" : expand(key));
    return mp[k] = res;
}
```

This is correct and runs in time linear in the total output size. The recursion *is* a depth-first topological sort — the memo table is the "finished" mark, and a key's value is written only after all of its dependencies have been written.

Three assumptions are buried in it, though:

| Assumption | What breaks without it |
| ---------- | ---------------------- |
| Every key is defined before the first query | `raw[k]` silently default-constructs to `""`, and a missing definition expands to nothing instead of erroring |
| No cycles | Infinite recursion, then a stack overflow — the constraints promise this away, nothing in the code enforces it |
| You only ever ask for the final answer | No way to ask "is this resolvable *yet*?" between definitions |

Drop the first assumption and the problem genuinely changes. Suppose definitions arrive one at a time, in arbitrary order — `C` may reference `B` before `B` exists — and you must answer questions in between. You no longer want a function. You want a **data structure** that holds a partially-resolved world and repairs itself on every insertion.

### The dependency graph

Let $$K$$ be the set of keys. Write $$\text{raw}(k)$$ for the literal value of $$k$$ and

$$
D(k) = \{\, d \in K : \texttt{\%}d\texttt{\%} \text{ occurs in } \text{raw}(k) \,\}
$$

for its **dependency set**. The fully expanded value is then defined by the mutual recursion

$$
\text{val}(k) = \text{raw}(k)\Big[\ \texttt{\%}d\texttt{\%} \mapsto \text{val}(d)\ \ \text{for each } d \in D(k)\ \Big],
$$

which is well-defined precisely when the dependency relation is acyclic.

Now orient an edge $$d \to k$$ whenever $$d \in D(k)$$ — read it as "$$d$$ must be resolved before $$k$$ can be." A legal resolution order is exactly a topological order of this DAG. **Mind the direction:** edges run from dependency to dependent, the reverse of how you'd naturally write `C depends on B`. That orientation is the point — it lets a newly resolved key *push* progress forward to everything waiting on it, which is what makes the structure incremental rather than something you re-run from scratch.

Let $$R \subseteq K$$ be the set of keys resolved so far, and define

$$
\operatorname{indeg}(k) = \big|\, D(k) \setminus R \,\big|
$$

— the number of $$k$$'s dependencies that are **still pending**. Then the resolution rule is a single line:

$$
\operatorname{indeg}(k) = 0 \iff k \text{ is resolvable right now.}
$$

### Kahn's algorithm as a live invariant

Textbook [Kahn's algorithm](https://en.wikipedia.org/wiki/Topological_sorting#Kahn's_algorithm) is a batch procedure: compute every indegree, seed a queue with the zeros, then pop and decrement until the queue empties. Here the graph isn't known up front — it *grows*. The move is to stop thinking of Kahn's as a procedure you run and start thinking of its state as an **invariant you maintain**.

Two invariants carry the whole design:

> **I1.** `mp` contains exactly the fully resolved keys. No value stored in `mp` contains a placeholder.
>
> **I2.** For every known key $$k$$, `indeg[k]` equals the number of $$k$$'s dependencies not yet in `mp`.

Every insertion must leave both true. Here is `add`, and the subtle line is the `continue`:

```cpp
void add(const string& k, const string& v) {
    raw[k] = v;
    indeg[k] = 0;
    for (auto& d : get_keys(v)) {
        if (mp.contains(d)) continue;   // already resolved — folded in at fill time, no edge
        Adj[d].pb(k);                   // reverse edge: dependency -> dependent
        indeg[k]++;
    }
    if (indeg[k] == 0) resolve(k);      // nothing pending — resolve, and cascade
}
```

A dependency that is **already resolved contributes nothing**: no edge, no indegree. It needs no edge because its value is already sitting in `mp`, so the substitution pass will pick it up directly; and counting it would violate I2, which counts only *pending* dependencies. Only unresolved dependencies get tracked. That one `continue` is what keeps the indegree meaningful across a stream of insertions instead of a single batch.

And if nothing is pending, $$k$$ is resolvable immediately — so resolve it, which may unblock others.

### The cascade

`resolve` is Kahn's main loop, seeded with a single node instead of every source:

```cpp
void resolve(const string& s) {
    queue<string> q; q.push(s);
    while (!q.empty()) {
        auto u = q.front(); q.pop();
        mp[u] = fill_value(raw[u]);     // every dep of u is in mp, so this is complete
        for (auto& v : Adj[u]) {
            indeg[v]--;                 // u is no longer pending for v
            if (indeg[v] == 0) q.push(v);
        }
        Adj.erase(u);                   // u's outgoing edges are spent
    }
}
```

When $$u$$ resolves, every dependent $$v$$ loses one pending dependency. Those that drop to zero become resolvable and are enqueued, transitively. Termination is immediate: a key is enqueued only when its indegree *reaches* zero, which happens at most once, so each key is processed at most once and the loop is $$O(\lvert K \rvert + \lvert E \rvert)$$ across the structure's whole lifetime — amortized across all the `add` calls, not per call.

**Forward references fall out for free.** Add a key whose dependencies don't exist yet and it simply sits with a positive indegree, parked in the adjacency lists of keys that haven't arrived. When the last missing dependency finally shows up, its `resolve` cascade reaches the waiting key and finishes it. Nothing special-cases the out-of-order case; the invariant does it.

Here is the trace on Example 2 with the definitions arriving in the most hostile order — `C` first, referencing a `B` that doesn't exist yet, and `A` last:

| Step | `mp` (resolved) | `indeg` | pending edges `Adj` |
| ---- | --------------- | ------- | ------------------- |
| `add(C, "abc%B%")` | — | `C:1` | `B → [C]` |
| `add(B, "ace")` | `B: ace`, then `C: abcace` | `B:0, C:0` | — |
| `add(A, "bce")` | `A: bce` | `A:0` | — |

The second insertion does the real work: `B` has no dependencies, so it resolves at once; that drops `indeg[C]` to zero, so `C` resolves in the same cascade and picks up `mp[B]` — even though `C` was defined before `B` existed. `substitute("%A%_%B%_%C%")` then returns `bce_ace_abcace`.

### Keeping the placeholder

The substitution pass makes one choice worth calling out. When it meets a key that isn't resolved, it writes the placeholder back out unchanged:

```cpp
res += mp.contains(run) ? mp[run] : "%" + run + "%";
```

That single ternary is what makes partial substitution **total**: `substitute` is always callable, never throws, never silently drops text, and — crucially — its output is a valid *input* to a later `substitute`. Running it again after more definitions arrive makes strictly more progress, and running it on fully resolved text is a no-op. So a caller has two honest strategies, and `ready` lets it pick:

```cpp
bool ready(const string& text) {
    for (auto& d : get_keys(text)) if (!mp.contains(d)) return false;
    return true;
}
```

Ask first and block until `ready`, or substitute optimistically now and re-run later. Had the unresolved case thrown, or expanded to the empty string, neither strategy would be available — the output would stop being re-feedable, and a missing definition would become indistinguishable from an empty one.

### The check: what is stuck, and why

Since `indeg[k] > 0` means "waiting on something," the blocked set is a one-liner:

```cpp
vector<string> stuck() {
    vector<string> res;
    for (auto& [k, v] : indeg) if (v > 0) res.pb(k);
    return res;
}
```

This is the diagnostic the batch recursion cannot give you: it reports *who* is blocked, not just that something went wrong. But it conflates two genuinely different failures, and they want different fixes:

- a dependency was **never defined** — the caller forgot an entry, or typed a key wrong;
- a **cycle** — the definitions are contradictory and no amount of waiting will help.

Distinguishing them rests on a small fact about finite DAGs: **every finite non-empty DAG has a source.** So if some keys are blocked and no definition is missing, the pending subgraph has no source, and therefore contains a cycle. Missing definitions are the easy half:

```cpp
vector<string> missing() {               // referenced somewhere, never defined
    set<string> res;
    for (auto& [k, v] : raw)
        for (auto& d : get_keys(v))
            if (!raw.contains(d)) res.insert(d);
    return vector<string>(all(res));
}
```

For cycles, a depth-first search over the *forward* relation (key → its dependencies) finds a back edge, and the gray stack above it **is** the cycle — which is far more useful to report than a bare "cycle detected":

```cpp
// color: 0 = unvisited, 1 = on the current path (gray), 2 = done (black)
bool find_cycle(const string& u, map<string,int>& color,
                vector<string>& path, vector<string>& cyc) {
    color[u] = 1; path.pb(u);
    for (auto& d : get_keys(raw[u])) {
        if (!raw.contains(d)) continue;                      // missing, not a cycle
        if (color[d] == 1) {                                 // back edge to the path
            cyc.assign(find(all(path), d), path.end());      // the cycle itself
            return true;
        }
        if (color[d] == 0 && find_cycle(d, color, path, cyc)) return true;
    }
    color[u] = 2; path.pop_back();
    return false;
}
```

Note the asymmetry: `resolve` pushes forward along `Adj` (dependency → dependent) because progress flows that way, while cycle detection walks backward along `D(k)` (dependent → dependency) because that is the direction a *reason* flows. Same relation, two orientations, each used where it reads naturally.

### Where it breaks

Being honest about the edges of a structure is part of designing it. Four real limits:

| Limitation | What happens | Why it's hidden here |
| ---------- | ------------ | -------------------- |
| **Re-adding a key** | `add` resets `indeg[k] = 0`, but stale edges to `k` still sit in other keys' `Adj` lists. A later `resolve` decrements past zero, the `== 0` test never fires, and `k` is never re-resolved | LeetCode guarantees "all replacement keys are unique" |
| **Stale downstream values** | Even with re-adding fixed, keys already resolved *from* the old value keep their old expansion — invalidation has to cascade too | Same guarantee |
| **No escape for a literal `%`** | `%%` is read as an empty key, and an unbalanced trailing `%` is dropped by both the scanner and the filler | Values are drawn from a restricted alphabet |
| **Exponential output** | A value like `%B%%B%` doubles its dependency's length, so $$n$$ chained keys can expand to $$\Theta(2^n)$$ characters | Values cap at 8 characters and $$n \le 10$$ |

That last one is worth internalizing: the structure is linear in the **output** size, not the input size, and those can be exponentially far apart. A real template engine either shares expansions by reference instead of copying strings, or caps the total expansion.

Fixing the first two means versioning the edges — stamp each adjacency entry with the generation of the key that created it and ignore entries from a stale generation — then re-running the cascade in *invalidate* mode before re-running it in resolve mode. That is a genuinely different structure, and it is where incremental build systems actually live.

One more design note, on representation. `Adj` here is a `map<string, vector<string>>` — a node-keyed adjacency list with a `map` lookup per edge traversal. That is the right call *because* the structure is streaming: nodes appear mid-run, keys are strings rather than dense indices, and `Adj.erase(u)` reclaims a node's edges once they are spent. If the key set were known up front and dense, the same graph would be far better laid out as [Compressed Sparse Row](/blog/databases/#compressed-sparse-row) — one contiguous array of neighbors plus one offset per node, which is both smaller and cache-friendly. But CSR needs the whole edge list before it can compute offsets, which is exactly the assumption a streaming structure gives up. The flexibility has a price, and it is worth knowing which one you are paying.

> **The pattern worth naming.** Converting a batch graph algorithm into an incrementally maintained one is a move that generalizes well beyond substitution. The recipe: identify the algorithm's working state (here, `indeg` plus the queue), promote it to an invariant of the data structure, then show that each mutation restores the invariant in time proportional to the damage done rather than to the whole graph. Incremental topological order is the classic instance — it is what `make` and every modern build system compute when a file changes, what a spreadsheet does when you edit a cell that other formulas reference, and what a dataflow framework does to schedule operators.

### Implementation

The full structure. `get_keys` collects the dependencies of a value by toggling on `%`; `fill_value` does one substitution pass, keeping unresolved placeholders intact; `add` maintains I1 and I2; `resolve` runs the cascade.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
class StreamingSubstitutor {
private:
    map<string,vector<string>> Adj;   // dependency -> dependents (reverse edges)
    map<string,string> raw, mp;       // literal values; fully resolved values
    map<string,int> indeg;            // number of dependencies still pending

    vector<string> get_keys(const string& s) {
        set<string> st;
        string run = "";
        bool started = false;
        for (auto& c : s) {
            if (c == '%') {
                if (started) st.insert(run);
                run = "";
                started = !started;
            }
            else if (started) run += c;
        }
        return vector<string>(all(st));
    }

    string fill_value(const string& s) {
        string res = "", run = "";
        bool started = false;
        for (auto& c : s) {
            if (c == '%') {
                if (!started) res += run;
                // keep placeholder if not resolvable
                else res += mp.contains(run) ? mp[run] : "%" + run + "%";
                run = "";
                started = !started;
            }
            else run += c;
        }
        if (!run.empty()) res += run;
        return res;
    }

    void resolve(const string& s) {
        queue<string> q; q.push(s);
        while (!q.empty()) {
            auto u = q.front(); q.pop();
            mp[u] = fill_value(raw[u]);
            for (auto& v : Adj[u]) {
                indeg[v]--;
                if (indeg[v] == 0) q.push(v);
            }
            Adj.erase(u);
        }
    }

public:
    void clear() { Adj.clear(); raw.clear(); mp.clear(); indeg.clear(); }

    void add(const string& k, const string& v) {
        raw[k] = v;
        indeg[k] = 0;
        for (auto& d : get_keys(v)) {
            if (mp.contains(d)) continue;
            Adj[d].pb(k); // reverse
            indeg[k]++;
        }
        if (indeg[k] == 0) resolve(k);
    }

    bool ready(const string& text) {
        for (auto& d : get_keys(text)) if (!mp.contains(d)) return false;
        return true;
    }

    string substitute(const string& text) { return fill_value(text); }

    vector<string> stuck() { // missing defs or cycles
        vector<string> res;
        for (auto& [k, v] : indeg) if (v > 0) res.pb(k);
        return res;
    }
};

class Solution {
public:
    string applySubstitutions(vector<vector<string>>& replacements, string text) {
        StreamingSubstitutor ssub;
        for (auto& r : replacements) ssub.add(r[0], r[1]);
        return ssub.substitute(text);
    }
};
```

</details>

Against the judge, `applySubstitutions` just feeds the pairs in and asks for the text — the streaming machinery is invisible, and the no-cycle guarantee means `stuck()` is always empty. The structure earns its keep the moment definitions stop arriving all at once.

### The takeaway

The problem says "apply substitutions." The structure underneath says **topological order**, and once you see that, the interesting question stops being "what is the answer" and becomes "what state do I keep between insertions." Three choices did the work here: edges oriented dependency → dependent so progress flows forward; indegree counting only *pending* dependencies so it stays meaningful mid-stream; and unresolved placeholders preserved verbatim so partial output stays re-feedable. None of them are needed to pass the judge. All of them are what separates an answer from a component.

## Counting on Trees: The Meeting Vertex {#meeting-vertex}

The substitution problem walks a graph in dependency order. On a tree there is a different way to organize the work: pick the vertex where things meet, and count from there.

[Codeforces 2241E](https://codeforces.com/contest/2241/problem/E) gives a tree on $$n$$ vertices with a value $$a_x$$ on each vertex. Write $$p(x, y)$$ for the product of the values along the simple path from $$x$$ to $$y$$. Count the unordered triplets $$\{u, v, w\}$$ for which

$$
p(u, v)\cdot p(v, w)\cdot p(w, u)
$$

is a perfect square. The product ranges over paths, so it looks like it depends on the whole triangle; it does not. It depends on one vertex.

### The three paths share exactly one vertex

Fix a triplet $$\{u, v, w\}$$ and look at how many of the three paths $$P(u,v)$$, $$P(v,w)$$, $$P(w,u)$$ each vertex lies on.

> **Lemma.** There is exactly one vertex $$c$$ that lies on all three paths, and every other vertex lies on $$0$$ or $$2$$ of them.

**A vertex on all three exists.** If one of the triplet, say $$w$$, already lies on $$P(u,v)$$, take $$c = w$$: both $$P(w,u)$$ and $$P(w,v)$$ pass through $$w$$, and $$w \in P(u,v)$$ by assumption. Otherwise walk from $$w$$ toward $$P(u,v)$$; since the graph is a tree there is a unique first vertex $$c$$ where the walk meets that path. Every route from $$w$$ into $$P(u,v)$$ goes through $$c$$, so $$P(w,u)$$ and $$P(w,v)$$ both contain $$c$$, and $$c \in P(u,v)$$ by construction.

**It is unique.** Suppose $$x$$ lies on all three paths. From $$x \in P(w,u)$$ and $$x \in P(u,v)$$, the route from $$w$$ to $$x$$ enters $$P(u,v)$$ at $$x$$. But the first entry point from $$w$$ into $$P(u,v)$$ is $$c$$, so $$x = c$$.

**Everyone else is on $$0$$ or $$2$$.** Take $$x \ne c$$ and delete it; the tree breaks into components. If $$u, v, w$$ all land in one component, no pairwise path uses $$x$$, so $$x$$ is on $$0$$ paths. If they split across exactly two components, exactly two of the three pairs are separated by $$x$$, so $$x$$ is on $$2$$. If they split across three components, $$x$$ would separate all three pairs and hence lie on all three paths — making $$x$$ the unique common vertex, contradicting $$x \ne c$$. $$\blacksquare$$

That vertex $$c$$ is the Steiner point of the triplet.

### An LCA restatement: two of the three pairwise LCAs coincide

The $$O(n)$$ solution never computes an LCA — it deletes $$c$$ and counts components — but the meeting vertex has a clean rooted-tree description worth keeping in your pocket.

Root the tree anywhere. The highest vertex on a path $$P(x, y)$$ is $$\operatorname{lca}(x, y)$$, so the three pairwise LCAs are the topmost points of the three paths. Let $$L = \operatorname{lca}(u, v, w)$$ be the shallowest common ancestor of all three. Two cases:

- The three vertices descend into three different child-subtrees of $$L$$ (or one of them _is_ $$L$$). Then every pairwise path climbs all the way to $$L$$, so $$\operatorname{lca}(u,v) = \operatorname{lca}(v,w) = \operatorname{lca}(w,u) = L$$, and the meeting vertex is $$c = L$$.
- Otherwise two of them, say $$u$$ and $$v$$, share a child-subtree of $$L$$ while $$w$$ does not. Then $$\operatorname{lca}(u, v)$$ sits strictly below $$L$$ and equals the meeting vertex $$c$$, while $$\operatorname{lca}(v, w) = \operatorname{lca}(w, u) = L$$.

Either way, **at least two of the three pairwise LCAs are equal, and the deepest of them is the meeting vertex $$c$$.** This is the same $$c$$ as before, seen from the root instead of by deletion.

### Why only $$a_c$$ matters

In the product $$p(u,v)\,p(v,w)\,p(w,u)$$, each vertex $$x$$ contributes $$a_x$$ raised to the number of paths it lies on. Writing $$e_x$$ for that exponent, the lemma says $$e_x \in \{0, 2\}$$ for every $$x \ne c$$ and $$e_c = 3$$:

$$
p(u,v)\,p(v,w)\,p(w,u) = a_c^{3} \prod_{x \ne c} a_x^{e_x}.
$$

Every exponent on the right is even except $$e_c = 3$$, and $$a_c^3 = a_c^2 \cdot a_c$$, so the whole thing is $$a_c$$ times a perfect square. It is a perfect square **iff $$a_c$$ is a perfect square**. The triangle of paths was a distraction; the condition lives entirely at the meeting vertex.

### Counting triplets by their meeting vertex

Every triplet has exactly one meeting vertex, so we can bucket triplets by it without any double counting:

$$
\text{answer} = \sum_{\substack{x \,:\, a_x \text{ is a perfect square}}} \bigl(\text{triplets whose meeting vertex is } x\bigr).
$$

Delete $$x$$ and let the resulting components have sizes $$s_1, s_2, \dots, s_d$$. A triplet meets at $$x$$ in one of two ways:

- **$$x$$ is one of the three chosen vertices.** The other two must sit in _different_ components (otherwise the path between them avoids $$x$$). Count: $$\sum_{i<j} s_i s_j$$.
- **$$x$$ is not chosen.** All three vertices must sit in _different_ components, so that $$x$$ separates every pair. Count: $$\sum_{i<j<\ell} s_i s_j s_\ell$$.

Both sums are **elementary symmetric polynomials** of the component sizes: $$e_2 = \sum_{i<j} s_i s_j$$ and $$e_3 = \sum_{i<j<\ell} s_i s_j s_\ell$$. The contribution of $$x$$ is $$e_2 + e_3$$.

### Elementary symmetric sums, computed online

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

### Component sizes in one rooting

The last piece is the component sizes after deleting $$x$$. Root the tree anywhere and compute subtree sizes $$\text{sub}[\cdot]$$ with one DFS. Deleting $$x$$ produces one component per child (the child's subtree, size $$\text{sub}[\text{child}]$$) plus, unless $$x$$ is the root, the everything-else component of size $$n - \text{sub}[x]$$. Feed those sizes into the scan.

Every step — the DFS, and one linear scan of each vertex's incident branches — is linear, so the whole solution is $$O(n)$$.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
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

## From the Notebook {#notebook}

Implementations from my [competitive programming notebook](https://github.com/lamng3/competitive-programming-notebook), tagged with their [USACO Guide](https://usaco.guide/) level where they have one.

- **Disjoint set union** (gold). [`DSU.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/graphs/dsu/DSU.h): Parent and size, with path compression. [`DSU.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/graphs/dsu/DSU.py): The same structure in Python. [`323.cpp`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/examples/graphs/dsu/323.cpp): A worked DSU problem.
- **Euler tour** (gold). [`EulerTour.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/trees/euler_tour/EulerTour.h): Entry and exit times on a tree. [`euler_tour/`](https://github.com/lamng3/competitive-programming-notebook/blob/main/contests/leetcode/solve/euler_tour): Solved Euler-tour problems.
- **Binary lifting** (platinum). [`binary_lifting/`](https://github.com/lamng3/competitive-programming-notebook/blob/main/contests/leetcode/solve/binary_lifting): Binary lifting solutions.
- **Small to large** (platinum). [`small_to_large_merging/`](https://github.com/lamng3/competitive-programming-notebook/blob/main/contests/leetcode/solve/small_to_large_merging): Small-to-large merging solutions.
- **DSU rollback** (advanced). [`DSURollback.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/graphs/dsu/DSURollback.h): Disjoint set union that can undo unions. [`dsu_rollback/`](https://github.com/lamng3/competitive-programming-notebook/blob/main/contests/leetcode/solve/dsu_rollback): A solved rollback problem.
- **Strongly connected components** (advanced). [`kosaraju/`](https://github.com/lamng3/competitive-programming-notebook/blob/main/contests/leetcode/solve/kosaraju): Kosaraju solutions.
- **Eulerian path** (advanced). [`eulerian_path/`](https://github.com/lamng3/competitive-programming-notebook/blob/main/contests/leetcode/solve/eulerian_path): Eulerian-path solutions.

## Practice {#practice}

**Topological Order, One Entry at a Time**

- [LeetCode 3481 — Apply Substitutions](https://leetcode.com/problems/apply-substitutions/)
- [LeetCode 207 — Course Schedule](https://leetcode.com/problems/course-schedule/)
- [LeetCode 210 — Course Schedule II](https://leetcode.com/problems/course-schedule-ii/)
- [LeetCode 269 — Alien Dictionary](https://leetcode.com/problems/alien-dictionary/)
- [LeetCode 1136 — Parallel Courses](https://leetcode.com/problems/parallel-courses/)
- [LeetCode 1096 — Brace Expansion II](https://leetcode.com/problems/brace-expansion-ii/)

**Counting on Trees: The Meeting Vertex**

- [Codeforces 2241E](https://codeforces.com/contest/2241/problem/E)
- [Codeforces 161D — Distance in Tree](https://codeforces.com/problemset/problem/161/D)
- [LeetCode 3067 — Count Pairs of Connectable Servers in a Weighted Tree Network](https://leetcode.com/problems/count-pairs-of-connectable-servers-in-a-weighted-tree-network/)

## Further reading {#further-reading}

**Counting on Trees: The Meeting Vertex**

- [Codeforces 2241E editorial](https://codeforces.com/blog/entry/154698) — the meeting-vertex proof in full.
