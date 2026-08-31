---
layout: post
title: "Permutations, Parenthesizations, and Precision"
description: Working through LeetCode 679 (the 24 Game) — generate operand orders by backtracking with a bitmask, enumerate every parenthesization by splitting a range instead of placing brackets (the range-DP idea), and handle real division either with an epsilon or, exactly, with rational arithmetic.
date: 2026-08-30
author: Nathan Nguyen
categories: [Algorithms]
tags: [Backtracking, Bitmask, Interval DP, Range DP, Memoization, Floating Point, Rational Arithmetic, LeetCode, Competitive Programming]
toc:
  sidebar: right
---

[LeetCode 679 — 24 Game](https://leetcode.com/problems/24-game/) gives four cards, each in $$[1, 9]$$, and asks whether some expression built from $$+, -, \times, \div$$ and parentheses evaluates to $$24$$. Division is real division, so $$6 \div (1 - \tfrac{3}{4}) = 24$$ is a valid answer for $$\{1, 3, 4, 6\}$$.

An expression has two independent freedoms: the **order** you place the operands, and the **grouping** (parentheses). Handle them separately, and mind the real-number division.

## Operand order: backtracking with a bitmask

The first freedom is a permutation of the cards. Generate them by backtracking, tracking which indices are already used in a single integer `used` as a bitmask — bit $$i$$ set means card $$i$$ is taken.

Three one-liners drive it:

- **turn a bit on:** `used |= (1 << i)`
- **test a bit:** `used & (1 << i)`
- **turn a bit off:** `used &= ~(1 << i)`

The last one is the backtracking undo: `~(1 << i)` is all ones except bit $$i$$, so AND-ing clears exactly that bit and leaves the rest. Set the bit and append the card before recursing, clear it and pop after — the array and the mask return to their previous state for the next choice.

```cpp
void permutate(const vi& cards, int used, vi cur) {
    if (sz(cur) == sz(cards)) { candidates.insert(cur); return; }
    REP(i, sz(cards)) {
        if (used & (1 << i)) continue;   // already taken
        used |= (1 << i);                // take it
        cur.pb(cards[i]);
        permutate(cards, used, cur);
        used &= ~(1 << i);               // put it back
        cur.pop_back();
    }
}
```

## Grouping: split, don't place brackets

The second freedom is where the parentheses go. There are Catalan-many parenthesizations, and enumerating bracket placements directly is awkward. The clean move is to **not place parentheses at all** — split instead.

Any fully-parenthesized expression over a contiguous run of operands $$[L, R]$$ has a single outermost operator. That operator cuts the run into a left part $$[L, i]$$ and a right part $$[i+1, R]$$, each a smaller sub-expression. So the set of values reachable from $$[L, R]$$ is: pick a split point $$i$$, take any value the left part can make and any value the right part can make, and combine them with one operator.

$$
\text{reach}(L, R) = \bigcup_{i=L}^{R-1}\ \bigcup_{\substack{a \in \text{reach}(L, i) \\ b \in \text{reach}(i+1, R)}} \{\, a+b,\ a-b,\ a \times b,\ a \div b \ (b \ne 0)\,\},
$$

with the base case $$\text{reach}(L, L) = \{\text{card}_L\}$$. Every parenthesization is captured by _which split you take at each level_ — no brackets are ever written down.

This is why the permutation and the split work together. A split only ever combines a **contiguous** range, so two particular cards can be the first ones combined only if they sit next to each other. Ranging over all permutations is exactly what lets any pair meet first; ranging over all splits is what supplies every grouping. Between them, every expression is covered: read the leaves of any expression tree left to right and you get some permutation, and the tree's shape is one choice of splits.

> **An extension worth naming.** The recurrence "combine an answer for $$[L, i]$$ with an answer for $$[i+1, R]$$ over all split points $$i$$" is **range DP** (a.k.a. interval DP) — the same skeleton as matrix-chain multiplication, optimal BST, [Burst Balloons](https://leetcode.com/problems/burst-balloons/), and [Different Ways to Add Parentheses](https://leetcode.com/problems/different-ways-to-add-parentheses/). Those keep one optimal number per interval; here we keep a whole _set_ of reachable values, but the $$O(n^2)$$ intervals and $$O(n)$$ split points are identical.

Because $$\text{reach}(L, R)$$ for a fixed operand order depends only on the range $$[L, R]$$, memoize it top-down keyed by $$(L, R)$$. The memo is per-permutation — clear it before each new ordering, since the same $$(L, R)$$ names a different sub-array once the cards are rearranged.

## Precision: real division needs care

Once division enters, values stop being integers, and two floating-point numbers are essentially never bit-for-bit equal. Testing `result == 24` will silently miss valid answers. The standard fix is a tolerance $$\varepsilon$$:

| Exact intent | Floating-point form  |
| ------------ | -------------------- |
| `a == b`     | `fabs(a - b) <= eps` |
| `a > b`      | `a > b + eps`        |
| `a <= b`     | `a <= b + eps`       |

with `const double eps = 1e-7` (anywhere from $$10^{-6}$$ to $$10^{-9}$$ is typical — too large invites false positives, too small misses near-ties). One caution: **do not use an $$\varepsilon$$ inside a sort comparator or a binary-search predicate.** An "almost equal" comparator is not a strict weak ordering and breaks `std::sort`; a fuzzy predicate destroys the monotonicity binary search relies on. Keep $$\varepsilon$$ for direct comparisons only.

For the 24 Game the check is just `fabs(x - 24) < eps` over every reachable value.

### The exact way: rational arithmetic

The robust competitive-programming habit is to sidestep floating point entirely: when a problem is about exact values, **compute in integers or fractions, not doubles.** Carry each value as a reduced fraction $$\frac{p}{q}$$ with $$q > 0$$ and $$\gcd(\lvert p \rvert, q) = 1$$, and do every operation with integer arithmetic:

$$
\frac{p_1}{q_1} \pm \frac{p_2}{q_2} = \frac{p_1 q_2 \pm p_2 q_1}{q_1 q_2}, \quad
\frac{p_1}{q_1}\cdot\frac{p_2}{q_2} = \frac{p_1 p_2}{q_1 q_2}, \quad
\frac{p_1}{q_1} \div \frac{p_2}{q_2} = \frac{p_1 q_2}{q_1 p_2}\ (p_2 \ne 0),
$$

reducing by the gcd and forcing $$q > 0$$ after each step. Then "is it $$24$$?" becomes the exact integer test $$p = 24$$ and $$q = 1$$ — no $$\varepsilon$$, no false positives. With four cards up to $$9$$, numerators and denominators stay tiny, so `long long` is plenty (`__int128` is a safety net when the arithmetic can blow up). Reserve $$\varepsilon$$ for problems where floating point is genuinely unavoidable, like geometry.

## Implementation

The solution below takes the floating-point route: generate every permutation, run the memoized split recurrence per permutation, and test each reachable value against $$24$$ with an $$\varepsilon$$.

<details markdown="1">
<summary>C++ implementation</summary>

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
const double eps = 1e-6;

class Solution {
private:
    set<vi> candidates;
    map<pii, set<double>> memo;

public:
    void permutate(const vi& cards, int used, vi cur) {
        if (sz(cur) == sz(cards)) {
            candidates.insert(cur);
            return;
        }
        REP(i, sz(cards)) {
            if (used & (1 << i)) continue;
            used |= (1 << i); // turn on
            cur.pb(cards[i]);
            permutate(cards, used, cur);
            used &= ~(1 << i); // turn off
            cur.pop_back();
        }
    }

    set<double> generate(const vi& cards, int L, int R) {
        if (L == R) return set<double>({(double)cards[L]});
        if (memo.count({L,R})) return memo[{L,R}];
        set<double> res;
        for (int i = L; i < R; i++) {
            set<double> left = generate(cards, L, i);
            set<double> right = generate(cards, i+1, R);
            for (auto& lx : left) {
                for (auto& rx : right) {
                    res.insert(lx + rx);
                    res.insert(lx - rx);
                    res.insert(lx * rx);
                    if (rx != 0) res.insert(lx / rx);
                }
            }
        }
        return memo[{L,R}] = res;
    }

    bool judgePoint24(vi& cards) {
        vi cur;
        permutate(cards, 0, cur);

        for (auto& cand : candidates) {
            memo.clear();
            set<double> sols = generate(cand, 0, sz(cand)-1);
            for (auto& x : sols) if (abs(x-24) < eps) return true;
        }
        return false;
    }
};
```

</details>

With four cards the whole search is tiny, so the redundancy of regenerating per permutation costs nothing here; on larger instances you would switch to picking any two values from a multiset and recursing, which avoids the permutation layer entirely.

## Practice

- [LeetCode 679 — 24 Game](https://leetcode.com/problems/24-game/)
- [LeetCode 241 — Different Ways to Add Parentheses](https://leetcode.com/problems/different-ways-to-add-parentheses/)
- [LeetCode 312 — Burst Balloons](https://leetcode.com/problems/burst-balloons/)
