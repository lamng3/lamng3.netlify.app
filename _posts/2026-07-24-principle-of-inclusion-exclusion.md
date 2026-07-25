---
layout: post
title: "Inclusion-Exclusion: Counting Without Double-Counting"
description: A gentle build-up to the Principle of Inclusion-Exclusion, followed by a clean proof that every element in the union is counted exactly once — the whole thing falling out of the binomial theorem applied to (1 - 1)^k.
date: 2026-07-24
author: Nathan Nguyen
categories: [Mathematics, Combinatorics]
tags: [Inclusion-Exclusion, PIE, Combinatorics, Counting, Binomial Theorem, Proof, Competitive Programming]
toc:
  sidebar: right
---

Counting is easy until sets start to overlap. If you want to know how many people ordered coffee _or_ tea, you can't just add the two counts — the people who ordered **both** get counted twice. The **Principle of Inclusion-Exclusion (PIE)** is the bookkeeping rule that fixes this, at any number of sets.

## Two sets: the whole idea in miniature

For two sets, the correction is obvious once you draw the Venn diagram:

$$\vert A \cup B \vert = \vert A \vert + \vert B \vert - \vert A \cap B \vert$$

You add both sets, then subtract the overlap you counted twice. Three sets need one more twist — you subtract the pairwise overlaps, but now you've subtracted the triple overlap one time too many, so you add it back:

$$\vert A \cup B \vert = \vert A \vert + \vert B \vert + \vert C \vert - \vert A \cap B \vert - \vert A \cap C \vert - \vert B \cap C \vert + \vert A \cap B \cap C \vert$$

The pattern — _add singles, subtract pairs, add triples, subtract quadruples_ — is the whole principle. The signs alternate, and the last term for $$n$$ sets carries the sign $$(-1)^{n-1}$$.

## The general statement

$$\left\vert \bigcup_{i=1}^n A_i \right\vert = \sum_{i=1}^n \vert A_i \vert - \sum_{i<j} \vert A_i \cap A_j \vert + \sum_{i<j<m} \vert A_i \cap A_j \cap A_m \vert - \dots + (-1)^{n-1} \vert A_1 \cap \dots \cap A_n \vert$$

It looks intimidating, but the proof is short and genuinely satisfying. The strategy is **counting the contribution of a single element**: if we can show that _every_ element of the union is counted exactly once on the right-hand side (RHS), then the two sides must be equal.

## The proof

### Goal

Show that any element $$X$$ belonging to at least one set is counted **exactly once** on the RHS.

### Setup

Let $$X$$ be an element contained in exactly $$k$$ sets, where $$1 \le k \le n$$. Without loss of generality, call these sets $$A_1, A_2, \dots, A_k$$.

Here is the key observation: for $$X$$ to belong to an intersection of $$m$$ sets, **all $$m$$ of those sets must come from $$\{A_1, \dots, A_k\}$$**. Any intersection that involves even one set outside this group cannot contain $$X$$, so it contributes $$0$$ to the count of $$X$$. This lets us ignore every set that $$X$$ is not in.

### Counting the occurrences of $$X$$

Now we tally how many times $$X$$ is counted in each layer of the RHS. Since $$X$$ sits inside all of $$A_1, \dots, A_k$$, the number of $$m$$-fold intersections that contain $$X$$ is exactly the number of ways to choose $$m$$ sets out of those $$k$$ — that is, $$\binom{k}{m}$$.

1. **Singletons** $$\left(\sum \vert A_i \vert\right)$$: $$X$$ appears in $$\binom{k}{1}$$ sets.
2. **Pairs** $$\left(\sum \vert A_i \cap A_j \vert\right)$$: $$X$$ appears in $$\binom{k}{2}$$ intersections.
3. **Triplets** $$\left(\sum \vert A_i \cap A_j \cap A_m \vert\right)$$: $$X$$ appears in $$\binom{k}{3}$$ intersections.
4. **$$m$$-fold intersections**: $$X$$ appears in $$\binom{k}{m}$$ intersections, for every $$m \le k$$.

Because the signs on the RHS alternate, the total signed count of $$X$$ is:

$$\text{Count}(X) = \binom{k}{1} - \binom{k}{2} + \binom{k}{3} - \dots + (-1)^{k-1}\binom{k}{k}$$

(The sum stops at $$k$$, not $$n$$, because $$\binom{k}{m} = 0$$ for $$m > k$$ — there simply aren't enough sets containing $$X$$ to form a larger intersection.)

### The binomial theorem finishes it

The alternating sum of binomial coefficients has a beautiful closed form. Apply the binomial theorem to $$(1 - 1)^k$$:

$$0 = (1 - 1)^k = \sum_{m=0}^k \binom{k}{m}(-1)^m = \binom{k}{0} - \binom{k}{1} + \binom{k}{2} - \dots + (-1)^k \binom{k}{k}$$

Move the $$\binom{k}{0} = 1$$ term to the other side and negate:

$$1 = \binom{k}{1} - \binom{k}{2} + \binom{k}{3} - \dots + (-1)^{k-1}\binom{k}{k}$$

The right-hand side of this identity is exactly $$\text{Count}(X)$$. Therefore:

$$\text{Count}(X) = 1$$

Every element in the union is counted **exactly once** on the RHS, no matter how many sets it belongs to. Since this holds for each element, the two sides count the same thing, and the principle is proved. $$\blacksquare$$

## Why the binomial trick is the heart of it

It's worth pausing on why $$(1-1)^k = 0$$ is doing all the work. PIE alternates signs precisely so that the over- and under-counting cancels, and $$(1-1)^k$$ is the algebraic embodiment of that cancellation: an element in $$k$$ sets gets pulled in and pushed out across the layers until exactly one "unit" of it survives. The alternating signs aren't a lucky guess — they are forced by the requirement that this sum collapse to $$1$$.

## A quick sanity check

Take $$k = 3$$ — an element in three sets. It's counted $$\binom{3}{1} = 3$$ times among the singletons, subtracted $$\binom{3}{2} = 3$$ times among the pairs, and added back $$\binom{3}{3} = 1$$ time in the triple intersection:

$$3 - 3 + 1 = 1 \checkmark$$

Counted three times, removed three times, restored once. Exactly once, as promised.

## A worked example: GCD pair queries

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

## A second example: k-th smallest amount

[LeetCode 3116 — Kth Smallest Amount with Single Denomination Combination](https://leetcode.com/problems/kth-smallest-amount-with-single-denomination-combination/) (rated **2387**) shows PIE in its most literal, textbook form — a straight bitmask over the sets.

**The problem.** Given `coins`, the set of reachable amounts is the union of the multiples of each coin: $$A_i = \{c_i, 2c_i, 3c_i, \dots\}$$. Find the $$k$$-th smallest value in $$\bigcup_i A_i$$. (You may only use one denomination per amount, so it really is a plain union of multiple-sets — no combining coins.)

**The idea.** We can't enumerate the union directly, but we can **count how many reachable values are $$\le X$$** for any $$X$$, then binary-search for the smallest $$X$$ whose count reaches $$k$$. Counting is where PIE enters:

- The number of multiples of $$c_i$$ that are $$\le X$$ is just $$\lfloor X / c_i \rfloor$$.
- But summing those over all coins double-counts values that are multiples of several coins. A value divisible by both $$c_i$$ and $$c_j$$ is a multiple of $$\text{lcm}(c_i, c_j)$$, and it got counted in both.
- So apply inclusion-exclusion directly to the formula $$\left\vert \bigcup A_i \right\vert$$: for each non-empty subset of coins, take $$\lfloor X / \text{lcm}(\text{subset}) \rfloor$$ and give it sign $$(-1)^{\vert \text{subset} \vert - 1}$$ — add odd-sized subsets, subtract even-sized ones.

With at most 15 coins, iterating all $$2^n$$ subsets as a bitmask is cheap, and this is _exactly_ the PIE statement from the top of this post, with $$\vert A_{i_1} \cap \dots \cap A_{i_m}\vert = \lfloor X / \text{lcm}(c_{i_1}, \dots, c_{i_m}) \rfloor$$.

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

## Where it shows up

PIE is everywhere once you know to look for it:

- **Counting derangements** — permutations with no fixed point — by excluding the arrangements that fix at least one element.
- **Euler's totient** $$\varphi(n)$$, counting integers coprime to $$n$$ by inclusion-exclusion over its prime factors.
- **Surjection counting** and the number of onto functions between finite sets.
- **Competitive programming**: counting numbers in a range divisible by _at least one_ of a given set of primes, or lattice paths avoiding forbidden cells.

The statement looks heavy, but the engine underneath is just one line of algebra: $$(1-1)^k = 0$$.

## Practice

- [LeetCode 878 — Nth Magical Number](https://leetcode.com/problems/nth-magical-number/) (PIE with two sets + binary search, medium) — the gentlest warm-up: count multiples of $$a$$ **or** $$b$$ up to $$X$$ as $$\lfloor X/a \rfloor + \lfloor X/b \rfloor - \lfloor X/\text{lcm}(a,b) \rfloor$$.
- [LeetCode 3116 — Kth Smallest Amount with Single Denomination Combination](https://leetcode.com/problems/kth-smallest-amount-with-single-denomination-combination/) (bitmask PIE + binary search, rated 2387) — the same idea generalized to $$n$$ sets.
- [LeetCode 3312 — Sorted GCD Pair Queries](https://leetcode.com/problems/sorted-gcd-pair-queries/) (PIE over multiples, rated 2532) — inclusion-exclusion on the divisibility lattice.
