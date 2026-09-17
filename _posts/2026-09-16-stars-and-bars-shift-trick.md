---
layout: post
title: "Stars and Bars: The Shift Trick"
description: A binomial coefficient counts ways to pick distinct increasing values. When constraints mix strict and non-strict inequalities (shared endpoints allowed), shift the i-th item by i-1 to turn every ≤ into <, and the count collapses to a single C(n+k-1, 2k).
date: 2026-09-16
author: Nathan Nguyen
categories: [Combinatorics]
tags: [Stars and Bars, Binomial Coefficients, Combinatorics, Modular Arithmetic, Bijection, LeetCode, CSES, Competitive Programming]
toc:
  sidebar: right
---

$$\binom{m}{t}$$ counts the ways to choose $$t$$ **strictly increasing** (hence distinct) values from $$\{0, 1, \dots, m-1\}$$. So when a counting problem lines up as $$x_1 < x_2 < \dots < x_t$$, the answer is a single binomial. The trouble starts when the chain mixes strict and non-strict steps — some $$<$$, some $$\le$$ — because a $$\le$$ lets two values coincide, and you can no longer say "choose distinct values." The **shift trick** repairs exactly this: nudge each item by its index so every $$\le$$ becomes a $$<$$.

## The problem

[LeetCode 1621 — Number of Sets of K Non-Overlapping Line Segments](https://leetcode.com/problems/number-of-sets-of-k-non-overlapping-line-segments/): on points $$0, 1, \dots, n-1$$, count the ways to draw $$k$$ segments, each covering $$\ge 2$$ points, that don't overlap but **may share endpoints**. Order the segments left to right; segment $$i$$ is $$[\ell_i, r_i]$$ with $$\ell_i < r_i$$, and non-overlap with a shared endpoint means $$r_i \le \ell_{i+1}$$. Stacking these:

$$
0 \le \ell_1 < r_1 \le \ell_2 < r_2 \le \dots \le \ell_k < r_k \le n-1.
$$

We are choosing $$2k$$ values, but the $$\le$$ at each boundary allows $$r_i = \ell_{i+1}$$, so they need not be distinct — no clean binomial yet.

## The shift

Add $$i-1$$ to both endpoints of the $$i$$-th segment: $$\ell_i' = \ell_i + (i-1)$$ and $$r_i' = r_i + (i-1)$$. Two things happen:

- **Inside a segment** the strict step survives: $$\ell_i' = \ell_i + (i-1) < r_i + (i-1) = r_i'$$.
- **At a boundary** the non-strict step becomes strict, because the next segment is shifted one more:

$$
r_i' = r_i + (i-1) \;\le\; \ell_{i+1} + (i-1) \;<\; \ell_{i+1} + i = \ell_{i+1}'.
$$

Now the whole chain is strict, over an expanded range:

$$
0 \le \ell_1' < r_1' < \ell_2' < \dots < \ell_k' < r_k' \le (n-1) + (k-1) = n+k-2.
$$

That is $$2k$$ **distinct** values chosen from $$\{0, 1, \dots, n+k-2\}$$, a set of size $$n+k-1$$. The shift is invertible (subtract $$i-1$$ back), so it is a bijection between valid segment sets and these choices. Hence

$$
\boxed{\;\text{answer} = \binom{n+k-1}{\,2k\,}.\;}
$$

The intuition: each of the $$k-1$$ boundaries could have "wasted" a shared point; the shift hands each one its own slot, buying back exactly $$k-1$$ extra positions so every value can be distinct.

## Computing the binomial mod a prime

$$n$$ is small, so precompute factorials and inverse factorials once and read $$\binom{a}{b} = a!\,\cdot\,(b!)^{-1}\,\cdot\,((a-b)!)^{-1}$$ in $$O(1)$$. Inverses come from Fermat's little theorem, $$x^{-1} \equiv x^{p-2} \pmod p$$.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
#include <bits/stdc++.h>
using namespace std;

using ll = long long;

using vi = vector<int>;

#define FOR(i, a, b) for (int i = (a); i <= (b); i++)
#define FORD(i, a, b) for (int i = (a); i >= (b); i--)

const int MOD = 1e9+7;

const int MAXN = 10000;
ll fac[MAXN+5], ifac[MAXN+5];

ll modpow(ll a, ll b) {
    a %= MOD;
    ll r = 1;
    while (b) {
        if (b&1) r = (r * a) % MOD;
        a = (a * a) % MOD;
        b >>= 1;
    }
    return r;
}
ll modinv(ll x) { return modpow(x, MOD-2); }

void build() {
    fac[0] = 1;
    FOR(i, 1, MAXN) fac[i] = (fac[i-1] * i) % MOD;
    ifac[MAXN] = modinv(fac[MAXN]);
    FORD(i, MAXN-1, 0) ifac[i] = (ifac[i+1] * (i+1)) % MOD;
}

ll nCk(int n, int k) {
    if (k < 0 || k > n) return 0;
    return fac[n] * ifac[k] % MOD * ifac[n-k] % MOD;
}

class Solution {
public:
    int numberOfSets(int n, int k) {
        // shift segment i by (i-1): all <= become <, so we pick 2k
        // distinct values from a range of size n+k-1
        build();
        return nCk(n + k - 1, 2 * k);
    }
};
```

</details>

(`build()` runs each call here; since the factorial table is input-independent, guarding it with a flag so it runs once — the [static-precompute idea]({% post_url 2026-09-12-static-precompute-across-test-cases %}) — saves the repeated work across test cases.)

## The takeaway

Whenever a count lines up as an increasing chain that mixes $$<$$ and $$\le$$, try shifting the $$i$$-th term by a function of $$i$$ (here $$i-1$$) to make every step strict. A strict chain of $$t$$ values over a range of size $$m$$ is just $$\binom{m}{t}$$ — the same "add an offset to separate collisions" move behind the stars-and-bars identity $$\binom{m+n-1}{n-1}$$ for distributing indistinguishable items.

## Additional reading

- [CP-Algorithms — Binomial coefficients](https://cp-algorithms.com/combinatorics/binomial-coefficients.html) — computing $$\binom{n}{k} \bmod p$$ with factorials and inverse factorials.
- [CSES — Distributing Apples](https://cses.fi/problemset/task/1716) — the canonical stars-and-bars problem, $$\binom{m+n-1}{n-1}$$.

## Practice

- [LeetCode 1621 — Number of Sets of K Non-Overlapping Line Segments](https://leetcode.com/problems/number-of-sets-of-k-non-overlapping-line-segments/)
- [LeetCode 62 — Unique Paths](https://leetcode.com/problems/unique-paths/)
- [CSES — Distributing Apples](https://cses.fi/problemset/task/1716)
- [CSES — Binomial Coefficients](https://cses.fi/problemset/task/1079)
