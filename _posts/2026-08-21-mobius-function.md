---
layout: post
title: "The Möbius Function"
description: The Möbius function mu(n) from the ground up — the sign flip that gives (-1)^k for k distinct primes, why a single squared prime forces mu(n) = 0, and a sieve that computes it for all n up to N in O(N log N) by propagating each value to its multiples.
date: 2026-08-21
last_updated: 2026-08-21 01:17:00
author: Nathan Nguyen
categories: [Mathematics, Number Theory]
tags: [Mobius Function, Number Theory, Sieve, Squarefree, Inclusion-Exclusion, Competitive Programming]
toc:
  sidebar: right
---

The Möbius function $$\mu(n)$$ is one of the basic tools of number theory: it is the signed indicator you attach to a divisor so that inclusion-exclusion over divisors works out. This post builds it from the definition, proves the one property people trip over — why a squared prime factor zeroes it — and computes it for all $$n \le N$$ with a sieve.

## Definition

$$
\mu(n) = \begin{cases}
1 & n = 1 \\
(-1)^k & n = p_1 p_2 \cdots p_k \text{ (distinct primes, no repeats)} \\
0 & \text{a squared prime divides } n
\end{cases}
$$

A number with no repeated prime factor is **squarefree**. So $$\mu$$ is: $$+1$$ or $$-1$$ on squarefree numbers depending on the parity of how many primes they have, and $$0$$ on everything else.

## The sign flip

Read the middle case as a running product. Start at $$n = 1$$ with value $$+1$$, then bring in one distinct prime at a time; each new prime flips the sign:

$$
30 = 2 \cdot 3 \cdot 5: \qquad \underbrace{+1}_{1} \xrightarrow{\;\times 2\;} \underbrace{-1}_{2} \xrightarrow{\;\times 3\;} \underbrace{+1}_{6} \xrightarrow{\;\times 5\;} \underbrace{-1}_{30}
$$

Three distinct primes, three flips, $$\mu(30) = (-1)^3 = -1$$. In general $$k$$ distinct primes flip the sign $$k$$ times, giving $$(-1)^k$$. The only thing that breaks this is a prime showing up twice — which is the next section.

## Why a squared prime forces zero

This is the property to internalize: **if $$p^2 \mid n$$ for some prime $$p$$, then $$\mu(n) = 0$$.**

The clean reason comes from the identity that makes $$\mu$$ useful in the first place: summed over all divisors of $$n$$, the Möbius values cancel to nothing (except at $$n = 1$$),

$$
\sum_{d \mid n} \mu(d) = \begin{cases} 1 & n = 1 \\ 0 & n > 1. \end{cases}
$$

For a squarefree $$n$$ with $$k$$ prime factors, the divisors that contribute are exactly the $$2^k$$ subsets of those primes, and a subset of size $$j$$ contributes $$(-1)^j$$, so the sum is

$$
\sum_{j=0}^{k} \binom{k}{j}(-1)^j = (1 - 1)^k = 0 \quad (k \ge 1).
$$

That is the same binomial cancellation behind [inclusion-exclusion]({% post_url 2026-07-24-principle-of-inclusion-exclusion %}).

Now apply the identity to $$n = p^2$$. Its divisors are $$1, p, p^2$$, so

$$
\mu(1) + \mu(p) + \mu(p^2) = 0 \implies 1 + (-1) + \mu(p^2) = 0 \implies \mu(p^2) = 0.
$$

The zero is _forced_. And once one squared prime appears, it drags everything built on it down with it:

> **Corollary.** If $$X$$ has a squared prime factor and $$X \mid Y$$, then $$\mu(Y) = 0$$.
>
> If $$p^2 \mid X$$ and $$X \mid Y$$, then $$p^2 \mid Y$$, so $$Y$$ is not squarefree, and $$\mu(Y) = 0$$ by definition.

So the moment a prime repeats, the sign flip stops mattering — the value is $$0$$, not $$\pm 1$$.

## Computing it like a sieve

To get $$\mu(n)$$ for every $$n \le N$$, rearrange the divisor identity for $$n > 1$$:

$$
\mu(n) = -\sum_{\substack{d \mid n \\ d < n}} \mu(d).
$$

Each value is minus the sum of the Möbius values of its _proper_ divisors. That is a sieve: process $$i$$ from small to large, and once $$\mu(i)$$ is known, **add it into every multiple** $$2i, 3i, \dots$$. By the time we reach $$i$$, all of its proper divisors have already pushed their values into it, so the accumulated sum sitting at index $$i$$ is exactly $$\sum_{d \mid i,\, d < i} \mu(d)$$ — negate it and you have $$\mu(i)$$.

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

const int MAX_N = 1e6+5;

int mobius[MAX_N];

void sieve_mobius(int n) {
    mobius[1] = 1;
    FOR(i, 1, n) {
        // before i is processed, mobius[i] holds sum of mu over its proper divisors
        if (i > 1) mobius[i] = -mobius[i];   // mu(i) = -(that sum)
        if (mobius[i] == 0) continue;        // squared prime somewhere -> nothing to push
        for (int j = 2*i; j <= n; j += i)
            mobius[j] += mobius[i];          // push mu(i) into every multiple
    }
}
```

</details>

### Trace: how index 12 lands on 0

Watch indices $$4, 6, 12$$. Everything starts at $$0$$ except `mobius[1] = 1`.

| Step       | Action                               | `mobius[4]`   | `mobius[6]`   | `mobius[12]`  |
| ---------- | ------------------------------------ | ------------- | ------------- | ------------- |
| $$i = 1$$  | push $$+1$$ to all multiples         | $$1$$         | $$1$$         | $$1$$         |
| $$i = 2$$  | $$\mu(2) = -1$$, push $$-1$$         | $$0$$         | $$0$$         | $$0$$         |
| $$i = 3$$  | $$\mu(3) = -1$$, push $$-1$$         | —             | $$-1$$        | $$-1$$        |
| $$i = 4$$  | $$\mu(4) = -0 = 0$$, skip            | $$0$$ (final) | —             | —             |
| $$i = 6$$  | $$\mu(6) = -(-1) = +1$$, push $$+1$$ | —             | $$1$$ (final) | $$0$$         |
| $$i = 12$$ | $$\mu(12) = -0 = 0$$                 | —             | —             | $$0$$ (final) |

Index $$12 = 2^2 \cdot 3$$ collects $$+1$$ (from $$1$$), $$-1$$ (from $$2$$), $$-1$$ (from $$3$$), nothing (from $$4$$, skipped), $$+1$$ (from $$6$$):

$$
1 - 1 - 1 + 1 = 0 \implies \mu(12) = -0 = 0,
$$

exactly what the squared factor $$2^2$$ predicts. Meanwhile $$\mu(6) = +1$$ (two primes) and $$\mu(4) = 0$$ (squared prime).

### Complexity

The inner loop runs $$\sum_i N/i = O(N \log N)$$. Skipping the zeros (non-squarefree indices, a $$1 - 6/\pi^2 \approx 39\%$$ share) trims the constant but not the bound. A smallest-prime-factor linear sieve computes the same values in $$O(N)$$ if you need it, but this divisor-propagation version is shorter and maps directly onto the identity.

## Example: counting coprime pairs (CSES 2417)

[CSES — Counting Coprime Pairs](https://cses.fi/problemset/task/2417/) asks: given $$n$$ integers $$A_1, \dots, A_n$$ (up to $$10^6$$), how many pairs $$i < j$$ have $$\gcd(A_i, A_j) = 1$$? Checking every pair is $$O(n^2)$$; Möbius turns it into a sieve.

Start from the divisor identity, this time with $$m = \gcd(A_i, A_j)$$, so that $$[\gcd(A_i, A_j) = 1] = \sum_{d \mid \gcd(A_i, A_j)} \mu(d)$$:

$$
\text{Ans} = \sum_{i < j} [\gcd(A_i, A_j) = 1] = \sum_{i < j} \sum_{d \mid \gcd(A_i, A_j)} \mu(d).
$$

Swap the order of summation and iterate over the divisor $$d$$ first. Since $$d \mid \gcd(A_i, A_j)$$ means $$d$$ divides _both_ $$A_i$$ and $$A_j$$, the inner count is the number of pairs whose elements are both multiples of $$d$$. Let $$\text{cnt}[d]$$ be the number of array elements divisible by $$d$$; then that count is $$\binom{\text{cnt}[d]}{2}$$:

$$
\text{Ans} = \sum_{d = 1}^{\max A} \mu(d) \binom{\text{cnt}[d]}{2} = \sum_{d = 1}^{\max A} \mu(d)\,\frac{\text{cnt}[d]\,(\text{cnt}[d] - 1)}{2}.
$$

This is inclusion-exclusion: $$\binom{\text{cnt}[d]}{2}$$ counts pairs sharing the common factor $$d$$ (a superset of what we want), and $$\mu(d)$$ sifts those overcounts down to gcd exactly $$1$$ with alternating signs.

Everything now hinges on computing $$\text{cnt}[d]$$ fast.

### First attempt: divisors per element (TLE)

The direct route is to take each $$A_i$$, enumerate its divisors in $$O(\sqrt{A_i})$$, and bump a counter for each. It's correct, but $$O(n \sqrt{\max A})$$ divisor work funneled through a `std::map` is too slow for $$n, \max A$$ up to the CSES limits.

<details markdown="1">
<summary>C++ implementation (TLE)</summary>

```cpp
    // count frequencies of divisors
    map<int,int> f;
    REP(i, n) {
        for (int p = 1; p * p <= x[i]; p++) {
            if (x[i] % p == 0) {
                f[p]++;
                if (x[i]/p != p) f[x[i]/p]++;
            }
        }
    }

    ll ans = 0;
    FOR(g, 1, mxx) ans += (ll)mu[g] * ((ll)f[g] * (f[g]-1) / 2);
```

</details>

### Optimized: frequency array + harmonic sieve

Flip it around. Instead of finding the divisors of each element, count how many elements land on each _value_, then sweep multiples: $$\text{cnt}[d] = \sum_{d \mid v} \text{freq}[v]$$. That inner sweep is the same harmonic sum $$\sum_d \max A / d = O(\max A \log \max A)$$ as the Möbius sieve itself — the two computations share the exact same shape, just accumulating different things. No `map`, no per-element $$\sqrt{A}$$.

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

void solve() {
    int n; cin >> n;
    vi x(n);
    int mxx = 0;
    REP(i, n) {
        cin >> x[i];
        mxx = max(mxx, x[i]);
    }

    // construct mobius function
    vi mu(mxx+5);
    mu[1] = -1;
    FOR(i, 1, mxx) {
        if (mu[i]) {
            mu[i] = -mu[i];
            for (int j = 2*i; j <= mxx; j+=i) mu[j] += mu[i];
        }
    }

    // frequency of each value
    vi f(mxx+5, 0);
    REP(i, n) f[x[i]]++;

    // cnt[d] = number of elements divisible by d
    vi cnt(mxx+5, 0);
    FOR(g, 1, mxx) {
        if (mu[g] == 0) continue;
        for (int j = g; j <= mxx; j+=g) cnt[g] += f[j];
    }

    ll ans = 0;
    FOR(g, 1, mxx) {
        if (mu[g] == 0 || cnt[g] < 2) continue;
        ans += (ll)mu[g] * ((ll)cnt[g] * (cnt[g]-1) / 2);
    }
    cout << ans << '\n';
}

int main() {
    ios::sync_with_stdio(0);
    cin.tie(0);
    solve();
    return 0;
}
```

</details>

Both the Möbius values and $$\text{cnt}[d]$$ come out of the same "loop over multiples of each $$d$$" sieve, which is why they pair so naturally: build $$\mu$$ once, count divisible elements the same way, and the answer is a single weighted sum. Factoring each $$A_i$$ into its prime factors and running inclusion-exclusion per element also works, but the sieve is simpler here and reuses machinery you already have.

## Where it shows up

- **Möbius inversion**: recover $$f$$ from $$g(n) = \sum_{d \mid n} f(d)$$ via $$f(n) = \sum_{d \mid n} \mu(d)\, g(n/d)$$.
- **Counting coprime pairs** and squarefree numbers up to $$N$$.
- **Inclusion-exclusion over prime factors**, e.g. counting integers in a range divisible by none of a set of primes.

## Docs worth reading

- [USACO Guide — Inclusion-Exclusion Principle](https://usaco.guide/plat/PIE?lang=cpp#mobius-function), Möbius section.
- [Möbius function (Wikipedia)](https://en.wikipedia.org/wiki/M%C3%B6bius_function).

## Practice

- [LeetCode 2572 — Count the Number of Square-Free Subsets](https://leetcode.com/problems/count-the-number-of-square-free-subsets/)
- [Codeforces 547C — Mike and Foam](https://codeforces.com/problemset/problem/547/C)
- [Codeforces 900D — Unusual Sequences](https://codeforces.com/problemset/problem/900/D)
- [Codeforces 1139D — Steps to One](https://codeforces.com/problemset/problem/1139/D)
