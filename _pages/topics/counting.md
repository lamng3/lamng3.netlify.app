---
layout: post
title: "Counting"
description: "Counting without listing. Inclusion-exclusion corrects for overlaps, the Möbius function is its sign flip on divisors, stars and bars counts distributions, and degrees of freedom and digit blocks count by finding what is actually free."
permalink: /blog/counting/
last_updated: 2026-10-10
author: Lam Nguyen
toc:
  sidebar: right
---

Counting without listing. Inclusion-exclusion corrects for overlaps, the Möbius function is its sign flip on divisors, stars and bars counts distributions, and degrees of freedom and digit blocks count by finding what is actually free.

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

## Inclusion-Exclusion {#inclusion-exclusion}

Counting is easy until sets start to overlap. If you want to know how many people ordered coffee _or_ tea, you can't just add the two counts — the people who ordered **both** get counted twice. The **Principle of Inclusion-Exclusion (PIE)** is the bookkeeping rule that fixes this, at any number of sets.

### The two-set case

For two sets, the correction is obvious once you draw the Venn diagram:

$$\vert A \cup B \vert = \vert A \vert + \vert B \vert - \vert A \cap B \vert$$

You add both sets, then subtract the overlap you counted twice. Three sets need one more twist — you subtract the pairwise overlaps, but now you've subtracted the triple overlap one time too many, so you add it back:

$$\vert A \cup B \vert = \vert A \vert + \vert B \vert + \vert C \vert - \vert A \cap B \vert - \vert A \cap C \vert - \vert B \cap C \vert + \vert A \cap B \cap C \vert$$

The pattern — _add singles, subtract pairs, add triples, subtract quadruples_ — is the whole principle. The signs alternate, and the last term for $$n$$ sets carries the sign $$(-1)^{n-1}$$.

### The general statement

$$\left\vert \bigcup_{i=1}^n A_i \right\vert = \sum_{m=1}^{n} (-1)^{m-1} \sum_{i_1 < \dots < i_m} \vert A_{i_1} \cap \dots \cap A_{i_m} \vert$$

The inner sum runs over all $$m$$-element subsets of the sets; odd sizes add, even sizes subtract.

### The proof

Count the contribution of a single element. If every element of the union is counted exactly once on the right-hand side, the two sides are equal.

Fix $$X$$ and let it lie in exactly $$k$$ of the sets, $$1 \le k \le n$$. An $$m$$-fold intersection contains $$X$$ only if all $$m$$ of its sets are among those $$k$$; there are $$\binom{k}{m}$$ such intersections, and every other term contributes $$0$$. With the alternating signs, the total count of $$X$$ is

$$\sum_{m=1}^{k} (-1)^{m-1}\binom{k}{m} = \binom{k}{1} - \binom{k}{2} + \dots + (-1)^{k-1}\binom{k}{k}.$$

By the binomial theorem, $$\sum_{m=0}^{k} (-1)^m \binom{k}{m} = (1-1)^k = 0$$. Splitting off the $$m=0$$ term $$\binom{k}{0}=1$$ and negating gives exactly the sum above, so it equals $$1$$. Every element is counted once, and the identity holds. $$\blacksquare$$

The alternating signs are not a guess: they are precisely what forces $$(1-1)^k$$ to collapse an element in $$k$$ sets down to a single unit. As a check, $$k=3$$ gives $$\binom{3}{1} - \binom{3}{2} + \binom{3}{3} = 3 - 3 + 1 = 1$$.

### A worked example: GCD pair queries

The cleanest way to _feel_ inclusion-exclusion is to use it. [LeetCode 3312 — Sorted GCD Pair Queries](https://leetcode.com/problems/sorted-gcd-pair-queries/) (rated **2532**) is a great one, because the whole solution hinges on a single PIE step.

**The problem.** Given `nums`, form the $$\binom{N}{2}$$ pairs $$(i, j)$$ with $$i < j$$ and compute $$\gcd(\text{nums}[i], \text{nums}[j])$$ for each. Sort all those gcd values, then answer queries: "what is the $$q$$-th smallest gcd?" With $$N$$ up to $$10^5$$, there are up to $$\sim 5 \times 10^9$$ pairs — far too many to list. We need the _count_ of pairs with each gcd value, not the pairs themselves.

**The plan, in four steps:**

1. **`cnt[g]` — pairs' building block.** Let `cnt[g]` be the number of elements in `nums` divisible by $$g$$. We find it by iterating each `x` over its divisors in $$O(\sqrt{x})$$.

2. **`tot[g]` — pairs divisible by $$g$$.** Any two elements both divisible by $$g$$ form a pair whose gcd is a _multiple_ of $$g$$ (possibly $$g$$ itself, possibly larger). So the number of such pairs is $$\text{tot}[g] = \binom{\text{cnt}[g]}{2} = \frac{\text{cnt}[g]\,(\text{cnt}[g]-1)}{2}$$.

3. **`exact[g]` — the inclusion-exclusion step.** Here `tot[g]` over-counts: it includes pairs whose gcd is $$2g, 3g, 4g, \dots$$, not just exactly $$g$$. To get pairs with gcd _exactly_ $$g$$, subtract off the ones already accounted for at every proper multiple:

   $$\text{exact}[g] = \text{tot}[g] - \sum_{k \ge 2} \text{exact}[k g]$$

   This is inclusion-exclusion over the divisibility lattice. Processing $$g$$ from large to small guarantees every $$\text{exact}[kg]$$ is finalized before we use it. (It's the same "subtract what you've already counted" move as the two-set formula — just indexed by multiples instead of set overlaps.)

4. **Prefix sums + binary search.** Build `pref[g] = pref[g-1] + exact[g]`, the number of pairs with gcd $$\le g$$. Each query is then a binary search: the smallest $$g$$ whose prefix count exceeds $$q$$ is the answer.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
const int MAX_M = 5e4+5;

class Solution {
public:
    vi gcdValues(vi& nums, vector<ll>& queries) {
        /*
            1 <= M <= 5e4
            cnt[g] = # elements in nums divisible by g
            for x in nums
                for p in sqrt(x)
                    cnt[p] += 1
                    cnt[x/p] += 1

            tot[g] = # pairs divisible by g
            tot[g] = cnt[g] * (cnt[g]-1) / 2

            exact[g] = # pairs with gcd exactly g
            * inclusion/exclusion:
                exact[g] = tot[g] - sum(exact[k * g])
                    with k = 2 to M/g

            pref[g] = prefix count # pairs for exact

            for q in queries
                binary search in pref
                    pref[i] >= q
        */

        vi cnt(MAX_M, 0);
        // O(N * sqrt(M))
        for (int x : nums) {
            for (int g = 1; g * g <= x; g++) {
                if (x % g == 0) {
                    cnt[g]++;
                    if (x/g != g) cnt[x/g]++;
                }
            }
        }

        vector<ll> tot(MAX_M, 0);
        for (int g = 1; g < MAX_M; g++) tot[g] = (ll)cnt[g] * (cnt[g]-1) / 2;

        // inclusion-exclusion for exact gcd pairs count
        vector<ll> exact(MAX_M, 0);
        for (int g = MAX_M-1; g >= 1; g--) {
            exact[g] = tot[g];
            for (int k = 2*g; k < MAX_M; k+=g) {
                exact[g] -= exact[k];
            }
        }

        // prefix sum of gcd counts
        vector<ll> pref(MAX_M, 0);
        for (int g = 1; g < MAX_M; g++) pref[g] = pref[g-1] + exact[g];

        vi ans;
        for (ll q : queries) {
            auto it = upper_bound(pref.begin(), pref.end(), q);
            int g = distance(pref.begin(), it);
            ans.pb(g);
        }
        return ans;
    }
};
```

</details>

The inclusion-exclusion loop is $$O(M \log M)$$ (a harmonic sum over multiples), the divisor counting is $$O(N \sqrt{M})$$, and each query is $$O(\log M)$$. The one insight that unlocks the whole problem is step 3: _pairs-divisible-by-$$g$$ minus pairs-with-a-larger-common-factor equals pairs-with-gcd-exactly-$$g$$_ — PIE, indexed by multiples.

### A second example: k-th smallest amount

[LeetCode 3116 — Kth Smallest Amount with Single Denomination Combination](https://leetcode.com/problems/kth-smallest-amount-with-single-denomination-combination/) (rated **2387**) shows PIE in its most literal, textbook form — a straight bitmask over the sets.

**The problem.** Given `coins`, the set of reachable amounts is the union of the multiples of each coin: $$A_i = \{c_i, 2c_i, 3c_i, \dots\}$$. Find the $$k$$-th smallest value in $$\bigcup_i A_i$$. (You may only use one denomination per amount, so it really is a plain union of multiple-sets — no combining coins.)

**The idea.** We can't enumerate the union directly, but we can **count how many reachable values are $$\le X$$** for any $$X$$, then binary-search for the smallest $$X$$ whose count reaches $$k$$. Counting is where PIE enters:

- The number of multiples of $$c_i$$ that are $$\le X$$ is just $$\lfloor X / c_i \rfloor$$.
- But summing those over all coins double-counts values that are multiples of several coins. A value divisible by both $$c_i$$ and $$c_j$$ is a multiple of $$\text{lcm}(c_i, c_j)$$, and it got counted in both.
- So apply inclusion-exclusion directly to the formula $$\left\vert \bigcup A_i \right\vert$$: for each non-empty subset of coins, take $$\lfloor X / \text{lcm}(\text{subset}) \rfloor$$ and give it sign $$(-1)^{\vert \text{subset} \vert - 1}$$ — add odd-sized subsets, subtract even-sized ones.

With at most 15 coins, iterating all $$2^n$$ subsets as a bitmask is cheap, and this is _exactly_ the PIE statement from the top of this section, with $$\vert A_{i_1} \cap \dots \cap A_{i_m}\vert = \lfloor X / \text{lcm}(c_{i_1}, \dots, c_{i_m}) \rfloor$$.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
const ll INF64 = 2e18;

class Solution {
public:
    ll findKthSmallest(vi& coins, int k) {
        int n = (int)coins.size();
        auto gcd = [&](ll a, ll b) {
            if (a < b) swap(a, b);
            while (b) {
                ll r = a % b;
                a = b;
                b = r;
            }
            return a;
        };
        auto lcm = [&](ll a, ll b) {
            if (a < b) swap(a, b);
            return (a / gcd(a, b)) * b;
        };
        auto count = [&](ll X) {
            /*
                PIE with bitmask
            */
            ll res = 0;
            REP(mask, 1<<n) {
                if (mask == 0) continue;
                ll p = 1;
                REP(i, n) {
                    if (mask & (1 << i)) p = lcm(p, coins[i]);
                }
                int bc = __builtin_popcount(mask);
                int sign = (bc % 2) ? 1 : -1;
                // count how many numbers mod p = 0 <= X
                res += (X / p) * sign;
            }
            return res;
        };
        ll left = 1, right = INF64;
        while (left < right) {
            ll mid = left + (right - left) / 2;
            /*
                kth smallest = X >= k-1 elems
                count(X) = total number of valid elems <= X
                find first X that count(X) >= k
            */
            if (count(mid) < k) left = mid+1;
            else right = mid;
        }
        return left;
    }
};
```

</details>

The binary search runs $$O(\log(\text{max answer}))$$ iterations, each calling `count`, which sweeps all $$2^n$$ subsets — so $$O(2^n \cdot n \cdot \log)$$ overall, comfortably fast for $$n \le 15$$. Notice the sign rule `(bc % 2) ? 1 : -1` is literally the $$(-1)^{m-1}$$ from the PIE formula: odd-sized subsets add, even-sized subtract.

Both problems reduce to the same trick — you can't touch the elements directly, so you **count how many are $$\le X$$ with inclusion-exclusion and binary-search the answer**. In the GCD problem the sets are indexed by multiples; here they're indexed by coin subsets. Same principle, different lattice.

### Where it shows up

PIE is everywhere once you know to look for it:

- **Counting derangements** — permutations with no fixed point — by excluding the arrangements that fix at least one element.
- **Euler's totient** $$\varphi(n)$$, counting integers coprime to $$n$$ by inclusion-exclusion over its prime factors.
- **Surjection counting** and the number of onto functions between finite sets.
- **Competitive programming**: counting numbers in a range divisible by _at least one_ of a given set of primes, or lattice paths avoiding forbidden cells.

The statement looks heavy, but the engine underneath is just one line of algebra: $$(1-1)^k = 0$$.

## Möbius Function {#mobius-function}

Inclusion-exclusion over divisors needs a sign for each divisor. The Möbius function is that sign, and it comes with a sieve of its own.

The Möbius function $$\mu(n)$$ is one of the basic tools of number theory: it is the signed indicator you attach to a divisor so that inclusion-exclusion over divisors works out. This section builds it from the definition, proves the one property people trip over — why a squared prime factor zeroes it — and computes it for all $$n \le N$$ with a sieve.

### Definition

$$
\mu(n) = \begin{cases}
1 & n = 1 \\
(-1)^k & n = p_1 p_2 \cdots p_k \text{ (distinct primes, no repeats)} \\
0 & \text{a squared prime divides } n
\end{cases}
$$

A number with no repeated prime factor is **squarefree**. So $$\mu$$ is: $$+1$$ or $$-1$$ on squarefree numbers depending on the parity of how many primes they have, and $$0$$ on everything else.

### The sign flip

Read the middle case as a running product. Start at $$n = 1$$ with value $$+1$$, then bring in one distinct prime at a time; each new prime flips the sign:

$$
30 = 2 \cdot 3 \cdot 5: \qquad \underbrace{+1}_{1} \xrightarrow{\;\times 2\;} \underbrace{-1}_{2} \xrightarrow{\;\times 3\;} \underbrace{+1}_{6} \xrightarrow{\;\times 5\;} \underbrace{-1}_{30}
$$

Three distinct primes, three flips, $$\mu(30) = (-1)^3 = -1$$. In general $$k$$ distinct primes flip the sign $$k$$ times, giving $$(-1)^k$$. The only thing that breaks this is a prime showing up twice — which is the next section.

### Why a squared prime forces zero

This is the property to internalize: **if $$p^2 \mid n$$ for some prime $$p$$, then $$\mu(n) = 0$$.**

The clean reason comes from the identity that makes $$\mu$$ useful in the first place: summed over all divisors of $$n$$, the Möbius values cancel to nothing (except at $$n = 1$$),

$$
\sum_{d \mid n} \mu(d) = \begin{cases} 1 & n = 1 \\ 0 & n > 1. \end{cases}
$$

For a squarefree $$n$$ with $$k$$ prime factors, the divisors that contribute are exactly the $$2^k$$ subsets of those primes, and a subset of size $$j$$ contributes $$(-1)^j$$, so the sum is

$$
\sum_{j=0}^{k} \binom{k}{j}(-1)^j = (1 - 1)^k = 0 \quad (k \ge 1).
$$

That is the same binomial cancellation behind [inclusion-exclusion](#inclusion-exclusion).

Now apply the identity to $$n = p^2$$. Its divisors are $$1, p, p^2$$, so

$$
\mu(1) + \mu(p) + \mu(p^2) = 0 \implies 1 + (-1) + \mu(p^2) = 0 \implies \mu(p^2) = 0.
$$

The zero is _forced_. And once one squared prime appears, it drags everything built on it down with it:

> **Corollary.** If $$X$$ has a squared prime factor and $$X \mid Y$$, then $$\mu(Y) = 0$$.
>
> If $$p^2 \mid X$$ and $$X \mid Y$$, then $$p^2 \mid Y$$, so $$Y$$ is not squarefree, and $$\mu(Y) = 0$$ by definition.

So the moment a prime repeats, the sign flip stops mattering — the value is $$0$$, not $$\pm 1$$.

### Computing it like a sieve

To get $$\mu(n)$$ for every $$n \le N$$, rearrange the divisor identity for $$n > 1$$:

$$
\mu(n) = -\sum_{\substack{d \mid n \\ d < n}} \mu(d).
$$

Each value is minus the sum of the Möbius values of its _proper_ divisors. That is a sieve: process $$i$$ from small to large, and once $$\mu(i)$$ is known, **add it into every multiple** $$2i, 3i, \dots$$. By the time we reach $$i$$, all of its proper divisors have already pushed their values into it, so the accumulated sum sitting at index $$i$$ is exactly $$\sum_{d \mid i,\, d < i} \mu(d)$$ — negate it and you have $$\mu(i)$$.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
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

#### Trace: how index 12 lands on 0

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

#### Complexity

The inner loop runs $$\sum_i N/i = O(N \log N)$$. Skipping the zeros (non-squarefree indices, a $$1 - 6/\pi^2 \approx 39\%$$ share) trims the constant but not the bound. A smallest-prime-factor linear sieve computes the same values in $$O(N)$$ if you need it, but this divisor-propagation version is shorter and maps directly onto the identity.

### Example: counting coprime pairs (CSES 2417)

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

#### First attempt: divisors per element (TLE)

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

#### Optimized: frequency array + harmonic sieve

Flip it around. Instead of finding the divisors of each element, count how many elements land on each _value_, then sweep multiples: $$\text{cnt}[d] = \sum_{d \mid v} \text{freq}[v]$$. That inner sweep is the same harmonic sum $$\sum_d \max A / d = O(\max A \log \max A)$$ as the Möbius sieve itself — the two computations share the exact same shape, just accumulating different things. No `map`, no per-element $$\sqrt{A}$$.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
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

### Where it shows up

- **Möbius inversion**: recover $$f$$ from $$g(n) = \sum_{d \mid n} f(d)$$ via $$f(n) = \sum_{d \mid n} \mu(d)\, g(n/d)$$.
- **Counting coprime pairs** and squarefree numbers up to $$N$$.
- **Inclusion-exclusion over prime factors**, e.g. counting integers in a range divisible by none of a set of primes.

## Stars and Bars {#stars-and-bars}

Inclusion-exclusion counts by correcting overlaps. Stars and bars counts by reshaping: turn the objects into a choice of positions, and one binomial coefficient does the rest.

$$\binom{m}{t}$$ counts the ways to choose $$t$$ **strictly increasing** (hence distinct) values from $$\{0, 1, \dots, m-1\}$$. **Stars and bars** is the craft of bending a counting problem into exactly that shape. Often it drops out directly; sometimes the constraints mix strict and non-strict steps ($$<$$ and $$\le$$), and a small **shift** is needed to make every step strict. Here is one of each.

### Warm-up: sorted vowel strings

[LeetCode 1641 — Count Sorted Vowel Strings](https://leetcode.com/problems/count-sorted-vowel-strings/): count the length-$$n$$ strings over the five vowels $$a \le e \le i \le o \le u$$ that are non-decreasing, e.g. `aae`, `eiou`, `uuuuu`.

A sorted string is pinned down entirely by _how many_ of each vowel it uses, so it is a way to split $$n$$ identical letters among the $$5$$ vowel groups. Write the $$n$$ letters as **stars** and drop **4 bars** to mark where one vowel group ends and the next begins — every arrangement of $$n$$ stars and $$4$$ bars is one valid string (empty groups allowed). Equivalently, **imagine $$n+4$$ symbols and choose which $$4$$ are bars**:

$$
\binom{n+4}{4}.
$$

That is the stars-and-bars identity $$\binom{m+g-1}{g-1}$$ with $$m = n$$ stars and $$g = 5$$ groups. With the factorial machinery below, the whole solution is `return nCk(n + 4, 4);`. It is equally a short DP — let $$dp[i][c]$$ be the sorted strings of length $$i$$ ending at vowel $$c$$, so $$dp[i][c] = \sum_{p \le c} dp[i-1][p]$$:

<details markdown="1">
<summary>C++ implementation (DP alternative)</summary>

```cpp
class Solution {
public:
    int countVowelStrings(int n) {
        vii dp(n, vi(5, 0));
        REP(c, 5) dp[0][c] = 1;
        FOR(i, 1, n-1) {
            REP(c, 5) {
                FOR(p, 0, c) {
                    dp[i][c] += dp[i-1][p];
                }
            }
        }
        int ans = 0;
        REP(c, 5) ans += dp[n-1][c];
        return ans;
    }
};
```

</details>

### Now with shared endpoints

The same family gets a twist when the pieces may _share_ an endpoint, so the chain mixes $$<$$ and $$\le$$ — that is where the shift earns its keep.

[LeetCode 1621 — Number of Sets of K Non-Overlapping Line Segments](https://leetcode.com/problems/number-of-sets-of-k-non-overlapping-line-segments/): on points $$0, 1, \dots, n-1$$, count the ways to draw $$k$$ segments, each covering $$\ge 2$$ points, that don't overlap but **may share endpoints**. Order the segments left to right; segment $$i$$ is $$[\ell_i, r_i]$$ with $$\ell_i < r_i$$, and non-overlap with a shared endpoint means $$r_i \le \ell_{i+1}$$. Stacking these:

$$
0 \le \ell_1 < r_1 \le \ell_2 < r_2 \le \dots \le \ell_k < r_k \le n-1.
$$

We are choosing $$2k$$ values, but the $$\le$$ at each boundary allows $$r_i = \ell_{i+1}$$, so they need not be distinct — no clean binomial yet.

### The shift

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

### Computing the binomial mod a prime

$$n$$ is small, so precompute factorials and inverse factorials once and read $$\binom{a}{b} = a!\,\cdot\,(b!)^{-1}\,\cdot\,((a-b)!)^{-1}$$ in $$O(1)$$. Inverses come from Fermat's little theorem, $$x^{-1} \equiv x^{p-2} \pmod p$$.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
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

(`build()` runs each call here; since the factorial table is input-independent, guarding it with a flag so it runs once — the [static-precompute idea](/blog/data-structure-design/#static-precompute) — saves the repeated work across test cases.)

### The takeaway

Whenever a count lines up as an increasing chain that mixes $$<$$ and $$\le$$, try shifting the $$i$$-th term by a function of $$i$$ (here $$i-1$$) to make every step strict. A strict chain of $$t$$ values over a range of size $$m$$ is just $$\binom{m}{t}$$ — the same "add an offset to separate collisions" move behind the stars-and-bars identity $$\binom{m+n-1}{n-1}$$ for distributing indistinguishable items.

## Degrees of Freedom {#degrees-of-freedom}

Sometimes there is no formula to reach for, and the count comes from asking which choices are actually free. If $$k$$ binary cells can be chosen freely and the rest are forced, the answer is $$2^k$$, so the whole problem is finding $$k$$.

[Codeforces 2240B — AI Finds Nothing Here](https://codeforces.com/contest/2240/problem/B) is a small problem with a clean idea worth slowing down on. We fill an $$n \times m$$ grid with $$0$$s and $$1$$s. Call the grid **clean** if every contiguous $$r \times c$$ block has an even number of ones — equivalently, the XOR of its $$rc$$ cells is $$0$$. Count the clean grids, modulo $$998244353$$.

With $$n, m$$ up to $$10^9$$ we cannot build the grid, let alone enumerate fillings. The answer has to be a formula, and it turns out to be

$$
2^{\,nm \,-\, (n-r+1)(m-c+1)}.
$$

The rest of this section is about _why_, told slowly. The whole thing rests on one observation: **each constraint forces exactly one cell**, so counting clean grids is just counting the cells we are still free to choose.

### Start by counting choices

Every cell is one bit, so it is one of two choices. With no constraints at all there would be $$2^{nm}$$ grids. Each constraint we add can only cut down that freedom. The question is by how much.

A **window** is one placement of the $$r \times c$$ block. Its top-left corner $$(i, j)$$ can sit at any row $$1 \le i \le n-r+1$$ and any column $$1 \le j \le m-c+1$$, because the block must stay inside the grid. That gives

$$
(n-r+1)(m-c+1) \text{ windows,}
$$

and each window is one requirement: the XOR of the cells it covers is $$0$$. So "clean" means all $$(n-r+1)(m-c+1)$$ of these XOR equations hold at once.

Our goal is to figure out how many of the $$nm$$ cells we can still pick freely once all these equations are in force. That count of free cells is the number of **degrees of freedom**, and the answer will be $$2$$ to that power.

### One window forces one cell

Look at a single window and write its constraint out:

$$
(\text{XOR of all } rc \text{ cells}) = 0.
$$

Over XOR, $$x \oplus x = 0$$ and every value is its own inverse, so we can move any one term to the other side. Move the bottom-right cell of the window:

$$
(\text{bottom-right cell}) = (\text{XOR of the other } rc-1 \text{ cells}).
$$

Read that again: the constraint is not some vague restriction on the window. It **computes** the bottom-right cell from the rest. If we already know every cell of the window except its bottom-right corner, that corner is no longer a choice — it is forced.

```
a 2×2 window, "XOR of the block = 0":

   a  b
   c  ?          ?  =  a ⊕ b ⊕ c
```

So think of each window not as a filter on grids, but as a _rule that fills in its own bottom-right cell_.

### Which cells are free, which are forced

One picture carries the whole argument. Draw the line between rows $$r-1$$ and $$r$$, and the line between columns $$c-1$$ and $$c$$; together they cut the grid into four blocks.

```
               columns 1 … c-1      columns c … m
             +--------------------+--------------------+
  rows       |        FREE        |        FREE        |
  1 … r-1    |     (r-1)(c-1)     |    (r-1)(m-c+1)    |
             +--------------------+--------------------+
  rows       |        FREE        |       FORCED       |
  r … n      |    (n-r+1)(c-1)    |   (n-r+1)(m-c+1)   |
             |                    |   one per window   |
             +--------------------+--------------------+
```

The **bottom-right block** — rows $$r \dots n$$, columns $$c \dots m$$ — is exactly the set of window bottom-right corners. As a window's top-left corner $$(i,j)$$ ranges over all $$(n-r+1)(m-c+1)$$ positions, its bottom-right corner $$(i+r-1,\, j+c-1)$$ sweeps this block, one cell per window — the map is a shift by $$(r-1,\, c-1)$$, so it is a bijection. Every cell in this block is **forced**.

The other three blocks — the first $$r-1$$ rows and the first $$c-1$$ columns — are **free**. These are _whole_ rows and _whole_ columns, so the free region is a band that can be many cells thick; it only looks like a thin frame when $$r-1 = c-1 = 1$$, and it is never a fixed $$r + c - 1$$ cells.

**Why the forced block can always be filled.** Process the windows in reading order — corners top to bottom, then left to right. When we reach a window, every cell it covers except its bottom-right corner is either in a free block or is the bottom-right corner of an _earlier_ window; either way it is already set. So only the corner is new, and the window's equation computes it from the rest.

### Following the sweep on a small grid

Take $$n = m = 3$$, $$r = c = 2$$ — the smallest interesting case, where the free band is a thin L: the first row and the first column (five cells), with the bottom-right $$2\times2$$ block forced (four cells, one per window).

```
   col:  1 2 3
   row1: F F F
   row2: F . .
   row3: F . .

F = free    . = forced
```

Choose the five `F` cells however you like, then process the four windows in order; each fills one `.`:

1. window at $$(1,1)$$ covers $$(1,1),(1,2),(2,1)$$ — all free — and forces $$(2,2)$$.
2. window at $$(1,2)$$ covers $$(1,2),(1,3),(2,2)$$ — the last just got set — and forces $$(2,3)$$.
3. window at $$(2,1)$$ covers $$(2,1),(3,1),(2,2)$$ — all known — and forces $$(3,2)$$.
4. window at $$(2,2)$$ covers $$(2,2),(2,3),(3,2)$$ — all known — and forces $$(3,3)$$.

Four windows, four forced cells, no cell touched twice, nothing left undetermined. Five free cells, so $$2^5 = 32$$ clean grids for this size.

### Why every choice gives exactly one grid

Put the two halves together into a bijection.

- **Free border $$\to$$ grid.** Pick the border arbitrarily ($$2^{\text{(free cells)}}$$ ways). The sweep then fills every forced cell exactly once, always from cells already known, so there is never a conflict, and every window's equation holds because we set that window's own corner to make it hold. One border filling yields exactly one clean grid.
- **Grid $$\to$$ free border.** Any clean grid, restricted to the border, is some border filling — and recomputing its forced cells by the same rule reproduces the grid.

So clean grids and border fillings are in one-to-one correspondence. The number of clean grids equals the number of border fillings, which is $$2^{\text{(free cells)}}$$.

### Counting the free cells

Straight off the four blocks, the free cells are everything except the forced block:

$$
\text{free cells} = nm - (n-r+1)(m-c+1).
$$

You can also add the three free blocks up directly. Together they are the first $$r-1$$ rows plus the first $$c-1$$ columns, and those two overlap in the top-left $$(r-1)\times(c-1)$$ block — so [inclusion-exclusion](#inclusion-exclusion) says add both and subtract the overlap once:

$$
\underbrace{(r-1)\,m}_{\text{first } r-1 \text{ rows}} + \underbrace{n\,(c-1)}_{\text{first } c-1 \text{ cols}} - \underbrace{(r-1)(c-1)}_{\text{counted twice}}.
$$

A line of algebra confirms the two counts agree,

$$
(r-1)m + n(c-1) - (r-1)(c-1) = nm - (n-r+1)(m-c+1),
$$

so the exponent is simply $$nm$$ minus the number of windows. Hence

$$
\boxed{\ \text{clean grids} = 2^{\,nm - (n-r+1)(m-c+1)} \bmod 998244353.\ }
$$

**A sanity check.** Take $$r = c = 1$$: every single cell is a $$1\times1$$ window whose XOR must be $$0$$, so every cell is forced to $$0$$ and there is exactly one clean grid. The formula agrees: windows $$= nm$$, free cells $$= nm - nm = 0$$, answer $$2^0 = 1$$.

### Implementation

Nothing is built. Compute the exponent (at most $$nm \le 10^{18}$$, so it fits in a signed 64-bit integer) and raise $$2$$ to it modulo the prime with fast exponentiation — $$O(\log nm)$$ per test.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
const int MOD = 998244353;

ll power(ll a, ll b) { // a^b mod MOD
    ll r = 1; a %= MOD;
    while (b) {
        if (b & 1) r = r * a % MOD;
        a = a * a % MOD;
        b >>= 1;
    }
    return r;
}

void solve() {
    ll n, m, r, c; cin >> n >> m >> r >> c;
    ll cells     = n * m;                       // <= 1e18, fits in ll
    ll windows   = (n - r + 1) * (m - c + 1);   // one XOR constraint each
    ll freeCells = cells - windows;             // the L-shaped border
    cout << power(2, freeCells) << '\n';
}

int main() {
    ios::sync_with_stdio(0);
    cin.tie(0);
    int tt; cin >> tt;
    while (tt--) solve();
    return 0;
}
```

</details>

Read $$n, m, r, c$$ as 64-bit from the start: $$n \cdot m$$ already overflows 32-bit at these bounds.

## Digit Counting {#digit-counting}

One last counting move: count in blocks instead of one at a time. It locates a single position in a sequence far too long to write down.

[LeetCode 400 — Nth Digit](https://leetcode.com/problems/nth-digit/) concatenates the positive integers into one string, $$1\,2\,3\,\dots\,9\,10\,11\,12\dots$$, and asks for the digit at position $$n$$. The string is astronomically long, so we never build it — we count our way to the answer in $$O(\log n)$$.

### Counting digits in blocks

Group the numbers by their digit length $$L$$. For each $$L$$ there are

$$
9 \cdot 10^{L-1} \text{ numbers, contributing } L \cdot 9 \cdot 10^{L-1} \text{ digits},
$$

because the $$L$$-digit numbers run from $$10^{L-1}$$ to $$10^{L}-1$$. So the sequence splits into blocks: $$9$$ digits from the 1-digit numbers, $$180$$ from the 2-digit numbers, $$2700$$ from the 3-digit ones, and so on. Each block is more than ten times the previous, so only $$O(\log n)$$ of them precede position $$n$$.

Finding the $$n$$-th digit is then three steps:

1. **Skip whole blocks.** While $$n$$ is past the current block ($$n > L \cdot 9 \cdot 10^{L-1}$$), subtract that block's digit count and advance to $$L+1$$. After the loop, $$n$$ is the (1-indexed) offset _within_ the block of $$L$$-digit numbers.
2. **Locate the number.** The block starts at $$x_0 = 10^{L-1}$$. Each number uses $$L$$ digits, so the offset lands inside

$$
x = x_0 + \left\lfloor \frac{n-1}{L} \right\rfloor.
$$

3. **Locate the digit.** Within $$x$$, the digit we want is at index $$(n-1) \bmod L$$.

#### A quick check: $$n = 11$$

The 1-digit block holds $$9$$ digits; $$11 > 9$$, so subtract and move on with $$n = 2$$, $$L = 2$$, $$x_0 = 10$$. The 2-digit block holds $$180$$ digits, so we stop. Then $$x = 10 + \lfloor 1/2 \rfloor = 10$$ and the digit index is $$1 \bmod 2 = 1$$, i.e. the `'0'` in `"10"`. Correct.

### Implementation

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
class Solution {
public:
    int findNthDigit(int n) {
        ll len = 1, cnt = 9, x = 1;
        while (n > len * cnt) {
            n -= len * cnt;
            len++;
            cnt *= 10;
            x *= 10;
        }
        x += (n-1) / len; // 0-indexed
        string sx = to_string(x);
        return sx[(n-1)%len] - '0';
    }
};
```

</details>

Here `len` is $$L$$, `cnt` is $$9 \cdot 10^{L-1}$$, and `x` is the block start $$10^{L-1}$$, all kept in `long long` so the product `len * cnt` never overflows while scanning. The loop runs at most $$\sim\!\log_{10} n$$ times, then two $$O(L)$$ operations finish it.

### Scaling up

The same block-counting works when the position is far larger than a 32-bit `int` — you only need a wider type for $$n$$ and for the running number. [Codeforces 1177B](https://codeforces.com/problemset/problem/1177/B) is the identical sequence with $$k$$ up to $$10^{12}$$: keep everything in 64-bit and the code above is essentially unchanged.

A step harder, [Codeforces 1216E2](https://codeforces.com/problemset/problem/1216/E2) nests the idea — its sequence is $$1,\,12,\,123,\,\dots$$, i.e. block $$i$$ is the concatenation $$1\,2\,\dots\,i$$ — so you count twice: first find which block holds position $$k$$, then apply this digit-counting inside that block. Both layers are the same "sum a geometric-ish series, subtract full chunks, descend" pattern.

### When the blocks alternate direction

[LeetCode — K-th Digit in Infinite String](https://leetcode.com/problems/k-th-digit-in-infinite-string/) keeps the same digits but reorders them. Group the positive integers into blocks by their leading part: block $$b$$ holds $$10b, 10b+1, \dots, 10b+9$$, written **ascending when $$b$$ is even and descending when $$b$$ is odd** (block $$0$$ is just $$1$$–$$9$$). The string starts

$$
\underbrace{1\,2\,\dots\,9}_{b=0}\;\underbrace{19\,18\,\dots\,10}_{b=1}\;\underbrace{20\,21\,\dots\,29}_{b=2}\;\underbrace{39\,\dots\,30}_{b=3}\dots
$$

The digit-length counting is untouched: block $$0$$ is the nine 1-digit numbers, blocks $$1$$–$$9$$ are the ninety 2-digit numbers, blocks $$10$$–$$99$$ the 3-digit ones. So steps 1–2 — find the length $$L$$ and the 0-indexed slot $$s$$ of the number holding position $$k$$ — are exactly as before. Only the slot-to-number map changes: within the $$L$$-digit range the numbers come in prefix-blocks of ten, so

$$
b = 10^{\,L-2} + \left\lfloor \tfrac{s}{10} \right\rfloor, \qquad j = s \bmod 10, \qquad \text{num} = 10b + \begin{cases} j & b \text{ even} \\ 9 - j & b \text{ odd} \end{cases}
$$

(read $$10^{L-2}$$ as $$0$$ when $$L = 1$$, where block $$0$$ shifts to $$1$$–$$9$$ instead of $$0$$–$$9$$). Then take digit $$k \bmod L$$ of `num`. For $$k = 15$$: length $$L = 2$$, slot lands in block $$b = 1$$ (descending $$19, 18, 17, \dots$$) at $$17$$, digit index $$1$$, giving `7` — matching $$1\dots9\,19\,18\,17$$.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
class Solution {
public:
    int kthDigit(ll k) {
        // find the digit length lg of the number holding position k
        int lg = 0;
        ll cnt = 0, rngcnt = 9;
        while (cnt < k) { // lg <= 15
            cnt += rngcnt * (lg+1);
            rngcnt *= 10;
            lg++;
        }

        // reduce k to the 1-indexed offset within the lg-digit range
        rngcnt = 9;
        REP(clg, lg-1) {
            k -= rngcnt * (clg+1);
            rngcnt *= 10;
        }

        // locate the number-slot and the digit inside it
        k--; // 0-index
        ll pos = k/lg, rem = k%lg;

        // prefix-block b of the slot (b starts at 10^(lg-2), or 0 for lg=1)
        ll b = 0;
        REP(i, lg-1) b = (b == 0 ? 1 : b*10);
        b += (pos/10);
        ll ld = pos%10; // index within the prefix-block

        // ascending if b even, descending if b odd; block 0 shifts 1..9
        ll num = 10 * b + (b % 2 ? 9 - ld : (b == 0 ? ld + 1 : ld));
        string s = to_string(num);
        return s[rem] - '0';
    }
};
```

</details>

Same skeleton as the plain sequence — the block counting to find $$L$$ and the slot is byte-for-byte the same math; the parity branch is the only new line.

## Practice {#practice}

**Inclusion-Exclusion**

- [LeetCode 878 — Nth Magical Number](https://leetcode.com/problems/nth-magical-number/)
- [LeetCode 3116 — Kth Smallest Amount with Single Denomination Combination](https://leetcode.com/problems/kth-smallest-amount-with-single-denomination-combination/)
- [LeetCode 3312 — Sorted GCD Pair Queries](https://leetcode.com/problems/sorted-gcd-pair-queries/)

**Möbius Function**

- [LeetCode 2572 — Count the Number of Square-Free Subsets](https://leetcode.com/problems/count-the-number-of-square-free-subsets/)
- [Codeforces 547C — Mike and Foam](https://codeforces.com/problemset/problem/547/C)
- [Codeforces 900D — Unusual Sequences](https://codeforces.com/problemset/problem/900/D)
- [Codeforces 1139D — Steps to One](https://codeforces.com/problemset/problem/1139/D)

**Stars and Bars**

- [LeetCode 1641 — Count Sorted Vowel Strings](https://leetcode.com/problems/count-sorted-vowel-strings/)
- [LeetCode 1621 — Number of Sets of K Non-Overlapping Line Segments](https://leetcode.com/problems/number-of-sets-of-k-non-overlapping-line-segments/)
- [LeetCode 62 — Unique Paths](https://leetcode.com/problems/unique-paths/)
- [CSES — Distributing Apples](https://cses.fi/problemset/task/1716)
- [CSES — Binomial Coefficients](https://cses.fi/problemset/task/1079)

**Degrees of Freedom**

- [Codeforces 2240B — AI Finds Nothing Here](https://codeforces.com/contest/2240/problem/B)

**Digit Counting**

- [LeetCode 400 — Nth Digit](https://leetcode.com/problems/nth-digit/)
- [LeetCode — K-th Digit in Infinite String](https://leetcode.com/problems/k-th-digit-in-infinite-string/)
- [Codeforces 1177B — Digits Sequence (Hard Edition)](https://codeforces.com/problemset/problem/1177/B)
- [Codeforces 1216E2 — Numerical Sequences (Hard Version)](https://codeforces.com/problemset/problem/1216/E2)

- [LeetCode 400 — Nth Digit](https://leetcode.com/problems/nth-digit/)
- [Codeforces 1177B — Digits Sequence (Hard Edition)](https://codeforces.com/problemset/problem/1177/B)
- [Codeforces 1216E2 — Numerical Sequences (Hard Version)](https://codeforces.com/problemset/problem/1216/E2)

## Further reading {#further-reading}

**Möbius Function**

- [USACO Guide — Inclusion-Exclusion Principle](https://usaco.guide/plat/PIE?lang=cpp#mobius-function), Möbius section.
- [Möbius function (Wikipedia)](https://en.wikipedia.org/wiki/M%C3%B6bius_function).

**Stars and Bars**

- [CP-Algorithms — Binomial coefficients](https://cp-algorithms.com/combinatorics/binomial-coefficients.html) — computing $$\binom{n}{k} \bmod p$$ with factorials and inverse factorials.
- [CSES — Distributing Apples](https://cses.fi/problemset/task/1716) — the canonical stars-and-bars problem, $$\binom{m+n-1}{n-1}$$.
