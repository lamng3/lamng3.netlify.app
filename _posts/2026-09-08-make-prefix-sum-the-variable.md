---
layout: post
title: "Reachability DP: Make the Prefix Sum the Variable"
description: Codeforces "Signs of Prefix Sums" stacks two reusable patterns — minimize-the-max becomes a feasibility question you can search, and feasibility becomes reachability once you treat the prefix sums (not the array) as the variables, which turns global constraints into local ones and lets a small reachability DP walk the answer.
date: 2026-09-08
author: Nathan Nguyen
categories: [Dynamic Programming]
tags: [Prefix Sums, Reachability DP, Feasibility, Binary Search on Answer, Layered Graph, State Design, Codeforces, Competitive Programming]
toc:
  sidebar: right
---

[Codeforces 2260D — Signs of Prefix Sums](https://codeforces.com/contest/2260/problem/D) is a compact problem worth pulling apart slowly, because it stacks two patterns that recur everywhere.

Take an array $$a_1, \dots, a_n$$ of **nonzero** integers and its prefix sums $$p_i = a_1 + \dots + a_i$$. Record only the sign of each prefix sum as a character: `+` if $$p_i > 0$$, `-` if $$p_i < 0$$, `0` if $$p_i = 0$$. That gives a string $$s$$ of length $$n$$. The **cost** of the array is $$\max_i \vert a_i \vert$$. Given $$s$$, find the minimum possible cost of a nonzero array that produces it, or $$-1$$ if none exists.

The two layers are: (1) turning "minimize the maximum" into a yes/no search, and (2) turning "is it feasible" into "is there a path." The second is the interesting one — it comes from choosing the _prefix sums themselves_ as the variables.

## Layer 1: minimize-the-max becomes a yes/no question

We are asked for the smallest $$x$$ such that a valid array exists with $$\max_i \vert a_i \vert \le x$$. Minimizing directly is awkward, so flip it into a predicate:

$$
\text{feasible}(x) = \text{"does a valid array exist using steps of size} \le x \text{?"}
$$

This predicate is **monotone**: a larger budget can only help, so the truth values run false, false, …, true, true, and the answer is the boundary. That is the standard move for every "minimize the maximum" (or "maximize the minimum") problem — you binary-search the boundary instead of optimizing directly.

Here the boundary is tiny, and it is worth seeing _why_.

**When is it $$-1$$?** Two local obstructions, both forced by "all $$a_i \ne 0$$":

- $$s_1 = $$ `0` is impossible, since $$p_1 = a_1 \ne 0$$.
- `00` anywhere is impossible, since $$p_i = 0 = p_{i+1}$$ forces $$a_{i+1} = 0$$.

If neither occurs, a valid array always exists — and in fact one of cost at most $$3$$.

**Why cost $$\le 3$$ always suffices.** Build the prefix sums directly. In each maximal run of one sign $$\sigma$$, alternate the magnitude between $$1$$ and $$2$$: $$\sigma\cdot 1, \sigma\cdot 2, \sigma\cdot 1, \dots$$; use $$0$$ for a `0`. Then

- consecutive values inside a run differ by $$1$$ (a step of $$1$$, and never zero);
- a run's endpoints have magnitude at most $$2$$, so stepping to or from a `0` costs at most $$2$$;
- flipping to the opposite sign steps from magnitude $$\le 2$$ to the next run's first value at magnitude $$1$$, a step of at most $$2 + 1 = 3$$.

Every step is $$\le 3$$ and every $$a_i \ne 0$$, so this is a valid array of cost $$\le 3$$.

**Why $$3$$ is sometimes forced.** Consider `+--+`. The middle `--` run has length two flanked by `+` on both sides. Its two negative prefix sums must be distinct, so one of them has magnitude $$\ge 2$$. Flipping between that magnitude-$$\ge 2$$ value and an opposite-sign value (magnitude $$\ge 1$$) costs at least $$2 + 1 = 3$$. So no array of cost $$2$$ exists; the minimum is exactly $$3$$.

So the answer is always $$-1$$, $$1$$, $$2$$, or $$3$$. We only have to test $$\text{feasible}(1)$$ and $$\text{feasible}(2)$$; if both fail, the answer is $$3$$. The search space is two candidates, but the reasoning is the same monotone-boundary argument that a full binary search would use.

## Layer 2: feasibility becomes reachability

Now fix a budget $$x$$ and ask whether a valid array exists. This is where choosing the right variable changes everything.

In **$$a$$-space**, the sign at position $$i$$ is the sign of $$a_1 + \dots + a_i$$ — a running total. So the constraint at $$i$$ couples $$a_i$$ to _every_ earlier element. Global constraints like that are hard to satisfy one step at a time.

Switch to **$$p$$-space**: treat the prefix sums $$p_1, \dots, p_n$$ as the variables, with $$p_0 = 0$$ and $$a_i = p_i - p_{i-1}$$. Now all three rules become **local**, relating only $$p_{i-1}$$ and $$p_i$$:

- **sign:** $$p_i > 0$$, $$< 0$$, or $$= 0$$ according to $$s_i$$;
- **nonzero element:** $$p_i \ne p_{i-1}$$ (that is $$a_i \ne 0$$);
- **budget:** $$\vert p_i - p_{i-1} \vert \le x$$ (that is $$\vert a_i \vert \le x$$).

Once every constraint touches only an adjacent pair, the problem is a **layered graph**. Layer $$i$$ holds the candidate values for $$p_i$$; put an edge from value $$v$$ in layer $$i-1$$ to value $$w$$ in layer $$i$$ exactly when the pair $$(v, w)$$ is legal ($$w \ne v$$, $$\vert w - v \vert \le x$$, and $$w$$ has sign $$s_i$$). Start from a single source, $$p_0 = 0$$ in layer $$0$$. Then

$$
\text{feasible}(x) \iff \text{there is a path from the source through every layer to layer } n.
$$

That is the whole reframing: _global constraints on the array became local constraints on the prefix sums, and local constraints are a graph you can walk._ Filling the array left to right is now just extending a path one layer at a time.

## Carry a set of values, not one

The tempting way to walk the layers is greedily: at each position pick the "best" value and move on. That fails, and `--+` (with budget $$x = 2$$) is the counterexample.

Greedy, hugging zero, sets $$p_1 = -1$$. Then $$p_2$$ must be negative, distinct from $$-1$$, within $$2$$ — so $$p_2 = -2$$. Now $$p_3$$ must be positive within $$2$$ of $$-2$$, but $$-2 + 2 = 0$$ is not positive: **dead end.** Yet a valid array exists: $$p = [-2, -1, 1]$$, with steps $$2, 1, 2$$, cost $$2$$. The right first move ($$-2$$, which looks worse) was the one greedy threw away, because the correct choice at position $$1$$ depends on what happens at position $$3$$.

The fix is to _not choose_. Carry forward **every** value that could still be the last element of a valid prefix — the set of reachable states in this layer. In the code that set is `cur`. You have deferred the decision, and the constraints will kill the states that lead nowhere. That is exactly the difference between greedy and DP: greedy commits to one path, DP keeps all viable states alive at once.

Concretely, with $$\text{reach}_i$$ the set of achievable values for $$p_i$$:

$$
\text{reach}_0 = \{0\}, \qquad
\text{reach}_i = \bigl\{\, w : \operatorname{sign}(w) = s_i,\ \exists\, v \in \text{reach}_{i-1},\ w \ne v,\ \vert w - v \vert \le x \,\bigr\},
$$

and the answer at budget $$x$$ is "$$\text{reach}_n$$ is non-empty." Keeping `--+` honest: $$\text{reach}_1 = \{-1, -2\}$$, and from $$-2$$ we can reach $$-1$$, so $$\text{reach}_2 \ni -1$$, from which $$+1 \in \text{reach}_3$$. The set kept $$-1$$ alive even though the greedy path lost it.

**What type of DP is this?** It is a **reachability (feasibility) DP over a layered DAG**: a boolean table $$\text{dp}[i][v] = $$ "can $$p_i = v$$," where each entry is an OR over legal predecessors. Rolling two boolean arrays (`cur`, `nxt`) is just the space-optimized, one-layer-at-a-time version of that table — literally breadth-first reachability on an implicit graph. If the question were _how many_ arrays rather than _whether one exists_, you would swap the OR for a sum; the shape is identical. (That boolean-vs-count duality is the same one behind subset-sum feasibility versus counting.)

**Why the set stays small.** A value only matters for what move it permits next. To flip sign next step you must be within $$x$$ of zero, and to land on `0` you must be within $$x$$ of zero; a value far from zero can only continue in the same sign. Since we only ask whether _some_ valid array exists, we never need to wander past magnitude $$x + 1$$: a same-sign value at magnitude $$x+1$$ can make every move a farther value could that we would actually use. So each $$\text{reach}_i$$ fits inside $$[-(x+1),\, x+1]$$ — at most $$2x + 3$$ values (the code keeps a slightly wider cushion). With $$x \le 2$$ the frontier is under a dozen slots wide.

## Complexity

For a fixed budget, each layer pairs a frontier of width $$w = O(x)$$ against the next, so one feasibility check is $$O(n \cdot w^2)$$. Here $$w \le 9$$, so it is effectively linear with a tiny constant, and we run it for $$x \in \{1, 2\}$$ — comfortably within $$n$$ up to $$3 \cdot 10^5$$.

## Implementation

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
#include <bits/stdc++.h>
using namespace std;

using ll = long long;
using i64 = int64_t;
using u64 = uint64_t;
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
const int MOD = 998244353; // 1e9+7

mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());

void preprocess() {

}

void solve() {
    int n; cin >> n;
    string s; cin >> s;

    // a[i] must be nonzero
    if (s[0] == '0') { cout << -1 << '\n'; return; }
    REP(i, n - 1) if (s[i] == '0' && s[i + 1] == '0') { cout << -1 << '\n'; return; }

    auto chksign = [&](int v, char c) {
        if (c == '+') return v > 0;
        if (c == '-') return v < 0;
        return v == 0;
    };

    auto check = [&](int x) {
        int k = x+2, m = 2*k+1; // shifted for negative values
        vector<char> cur(m, 0), nxt(m, 0);
        FOR(v, -k, k) if (abs(v) <= x && chksign(v, s[0])) cur[v+k] = 1;
        FOR(i, 1, n-1) {
            fill(all(nxt), 0);
            bool any = false;
            FOR(v, -k, k) {
                if (!cur[v+k]) continue;
                FOR(w, -k, k) {
                    if (w == v || abs(w-v) > x) continue;
                    if (!chksign(w, s[i])) continue;
                    nxt[w+k] = 1;
                    any = true;
                }
            }
            if (!any) return false;
            cur.swap(nxt);
        }
        REP(v, m) if (cur[v]) return true;
        return false;
    };

    FOR(x, 1, 2) if (check(x)) { cout << x << '\n'; return; }
    cout << 3 << '\n';
}

int main() {
    // freopen("name.in", "r", stdin);
    // freopen("name.out", "w", stdout);
    ios::sync_with_stdio(0);
    cin.tie(0);
    preprocess();
    int tt = 1;
    cin >> tt;
    while (tt--) solve();
    return 0;
}
```

</details>

The first layer uses $$\vert v \vert \le x$$ because $$p_1 = a_1$$; later layers only bound the _step_ $$\vert w - v \vert \le x$$, with values clamped to $$[-(x+2),\, x+2]$$ by the domination argument. `cur`/`nxt` are the rolling frontier, indexed by $$v + k$$ so negative values fit in an array. If a layer's frontier ever empties, the budget is infeasible.

## Recognizing the same two moves next time

Both layers travel well beyond this problem, and each has a trigger you can watch for.

The first is a reflex for any objective phrased as **minimize the maximum** or **maximize the minimum**. Stop optimizing the quantity and ask a yes/no question about a budget instead: "is a valid object achievable with everything bounded by $$x$$?" Feasibility is monotone in the budget, so the answer is a boundary you can locate — by binary search in general, or, as here, by checking a couple of candidates once the range is pinned down. Whenever the thing you are minimizing is itself a maximum (or vice versa), this conversion is available.

The second move is the one that made the problem tractable. When a rule couples all the variables through a **running aggregate** — a prefix sum here, but equally a running maximum, a prefix XOR, a running gcd, or a balance counter — make that aggregate the variable rather than the raw array. What changes is the _reach_ of the constraints. Stated on the array, "the sign of $$a_1 + \dots + a_i$$" looks back across the entire prefix. Stated on the aggregate, "the sign of $$p_i$$, with $$p_i - p_{i-1}$$ nonzero and bounded" touches only two neighbors. Global constraints collapse to local ones, and a chain of local constraints is a layered graph.

Once you are on that graph the finish writes itself: "does a valid object exist" is "is there a path from the source to the last layer." A reachability DP walks it by keeping, at each position, the entire set of values still consistent with everything seen so far — committing to none, letting the constraints prune the rest — and a domination argument keeps that set small enough to be linear. Replace the boolean OR with a sum and the very same walk counts the objects instead of merely detecting one.

So the outline to reach for, when an optimization that is secretly a max-or-min sits on top of a constraint that couples everything through a running total: peel the optimization into a feasibility search, promote the running total to the variable so the constraints go local, then walk the resulting graph. It is the same instinct — carry a compressed running total and let it drive the transitions — behind [digit DP]({% post_url 2026-09-07-digit-dp-choosing-state %}), where the running total is the value taken $$\bmod\ k$$, and behind [prefix XOR hashing]({% post_url 2026-08-30-rolling-and-xor-hashing %}), where it is the XOR of a prefix. Three aggregates, one habit.

## Docs worth reading

- [Competitive Programmer's Handbook](https://cses.fi/book/book.pdf), ch. 7 (DP) — the reachability/counting DP template in its plainest form.
- [USACO Guide — Introduction to DP](https://usaco.guide/gold/intro-dp).
- [Codeforces — Everything About Dynamic Programming](https://codeforces.com/blog/entry/43256).

## Practice

- [Codeforces 2260D — Signs of Prefix Sums](https://codeforces.com/contest/2260/problem/D) (the problem above)
- [LeetCode 416 — Partition Equal Subset Sum](https://leetcode.com/problems/partition-equal-subset-sum/) (boolean reachability DP — carry the set of reachable sums)
- [LeetCode 494 — Target Sum](https://leetcode.com/problems/target-sum/) (the counting sibling: OR becomes +)
- [LeetCode 926 — Flip String to Monotone Increasing](https://leetcode.com/problems/flip-string-to-monotone-increasing/) (per-position feasibility DP)
