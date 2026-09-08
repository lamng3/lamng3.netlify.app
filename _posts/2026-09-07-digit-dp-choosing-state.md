---
layout: post
title: "Digit DP: Choosing the Right State"
description: Count integers in [low, high] whose digits are half even, half odd and that are divisible by k (LeetCode 2827). The whole difficulty is deciding what to remember as you build a number digit by digit — carry the remainder mod k, not the number, and the even-minus-odd difference, not two counts.
date: 2026-09-07
author: Nathan Nguyen
categories: [Algorithms, Dynamic Programming]
tags: [Digit DP, Dynamic Programming, Counting, State Design, Memoization, LeetCode, Codeforces, Competitive Programming]
toc:
  sidebar: right
---

[LeetCode 2827 — Number of Beautiful Integers in the Range](https://leetcode.com/problems/number-of-beautiful-integers-in-the-range/) calls an integer **beautiful** when it satisfies two conditions at once:

1. it has the same number of even digits as odd digits, and
2. it is divisible by $$k$$.

Count the beautiful integers in $$[\text{low}, \text{high}]$$, with bounds up to $$10^9$$ and $$1 \le k \le 20$$. For example, in $$[10, 20]$$ with $$k = 3$$ the multiples of $$3$$ are $$12, 15, 18$$; of those, $$12$$ and $$18$$ have one even and one odd digit, while $$15$$ is two odds — so the answer is $$2$$.

This is a **digit DP**, and digit DP problems are almost entirely about one question: _as you build a number one digit at a time, what is the least you must remember?_ Get the state right and the code writes itself. This post is about choosing that state.

## Reduce the range to a prefix count

First, turn the range into two prefix counts. Let $$f(x)$$ be the number of beautiful integers in $$[1, x]$$. Then

$$
\text{answer} = f(\text{high}) - f(\text{low} - 1),
$$

so we only ever need to count beautiful integers _up to_ a bound. That is what digit DP does well.

## Building a number digit by digit

To count integers $$\le x$$, write $$x$$ out as a string and fill positions from the most significant digit down. At each position we try every allowed digit and recurse. Three pieces of bookkeeping show up in _every_ digit DP, no matter the problem:

- **`pos`** — how many positions are left to fill. The recursion shrinks it to $$0$$, where we decide whether the number we built is valid.
- **`tight`** — are we still pinned to $$x$$'s own prefix? If every digit so far has matched $$x$$ exactly, the next digit cannot exceed $$x$$'s digit at this position (going higher would overshoot $$x$$). Once we place something smaller, we are free ($$\text{tight} = 0$$) and the rest may be anything $$0$$–$$9$$.
- **`started`** — have we placed a nonzero digit yet? This handles **leading zeros**. The number $$12$$ padded to width $$10$$ is `0000000012`; those leading zeros are not real digits and must not count toward the even/odd balance. While `started` is false, we are still in the padding.

The remaining state is what this _particular_ problem forces us to track — and that is the interesting part.

## What to remember, and the two compressions

Beautiful asks for two things. Naively you might carry the full number (to test divisibility) and both digit counts (to test balance). Both are wasteful, and each collapses to something tiny.

**Divisible by $$k$$ → carry the remainder, not the number.** Whether a number is divisible by $$k$$ depends only on its value $$\bmod\ k$$. And a remainder updates digit by digit: if the prefix has remainder $$\text{rem}$$ and we append digit $$d$$, the new remainder is $$(\text{rem} \cdot 10 + d) \bmod k$$. So one number in $$\{0, \dots, k-1\}$$ replaces the whole (up to $$10^9$$) value.

**Equal even and odd counts → carry the difference, not two counts.** We do not need how many evens and how many odds there are, only that they end up equal. So track a single signed difference

$$
\text{diff} = (\#\text{even digits}) - (\#\text{odd digits}),
$$

adding $$+1$$ for an even digit and $$-1$$ for an odd one. "Balanced" is simply $$\text{diff} = 0$$ at the end. With at most $$10$$ digits, $$\text{diff} \in [-10, 10]$$ — one small number instead of two counts.

That is the crux of state design: **keep only what the final test actually reads.** Divisibility reads a remainder; balance reads a difference.

## The full state

Putting the universal bookkeeping together with the two compressions:

| state     | meaning                              | range            | why it is needed                                  |
| --------- | ------------------------------------ | ---------------- | ------------------------------------------------- |
| `pos`     | positions left to fill               | $$0 \dots 10$$   | drives the recursion; the base case is `pos == 0` |
| `tight`   | still pinned to the bound's prefix   | $$0 / 1$$        | caps the next digit so we never exceed $$x$$      |
| `started` | placed a nonzero digit yet?          | $$0 / 1$$        | leading zeros must not count toward the balance   |
| `rem`     | value so far $$\bmod\ k$$            | $$0 \dots k-1$$  | divisibility reads only the remainder             |
| `diff`    | $$(\#\text{even}) - (\#\text{odd})$$ | $$-10 \dots 10$$ | balance reads only the difference (`== 0` at end) |

Arrays cannot take a negative index, so `diff` is stored shifted by $$10$$ (the range $$[-10, 10]$$ becomes $$[0, 20]$$).

## Transitions and the base case

At a position, the largest digit we may place is $$x$$'s digit there if `tight`, otherwise $$9$$. For each candidate digit $$d$$ from $$0$$ to that cap, update the four carried quantities:

- $$\text{tight}' = \text{tight}$$ **and** $$(d = \text{cap})$$ — we stay pinned only if we again matched the bound exactly;
- $$\text{started}' = \text{started}$$ **or** $$(d \ne 0)$$;
- $$\text{rem}' = (\text{rem} \cdot 10 + d) \bmod k$$;
- $$\text{diff}' = \text{diff} + (\text{even? } +1 : -1)$$ — but only once `started'` is true; while still in leading zeros, leave `diff` at $$0$$.

When `pos == 0` the number is complete. It is beautiful when it is a real number and both tests pass:

$$
\text{started} \ \wedge\ \text{rem} = 0 \ \wedge\ \text{diff} = 0.
$$

Requiring `started` also excludes the all-zeros "number," so $$0$$ is never counted.

## Complexity

The number of states is $$\text{pos} \times \text{tight} \times \text{started} \times \text{rem} \times \text{diff} \approx 11 \cdot 2 \cdot 2 \cdot k \cdot 21$$, and each fans out to at most $$10$$ digits. With $$k \le 20$$ that is under two million transitions per bound, and we evaluate two bounds per query — instant. Memoize on the state; because the digit cap depends on the specific bound $$x$$, reset the table for each call to $$f(x)$$.

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
const int MOD = 1e9+7;

mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());

// dp[pos][tight][started][rem][diff + 10]
int dp[11][2][2][21][21];

class Solution {
public:
    int solve_dp(string& num, int k, int pos, int tight, int started, int rem, int diff) {
        if (pos == 0) return started && rem == 0 && diff == 0;
        if (dp[pos][tight][started][rem][diff+10] != -1) {
            return dp[pos][tight][started][rem][diff+10];
        }
        int res = 0;
        int ub = tight ? (num[sz(num)-pos] - '0') : 9;
        FOR(d, 0, ub) {
            int ntight = tight & (d == ub);
            int nstarted = started | (d != 0);
            int nrem = (rem * 10 + d) % k;
            int ndiff = nstarted ? diff + (d % 2 ? -1 : 1) : 0;
            res += solve_dp(num, k, pos-1, ntight, nstarted, nrem, ndiff);
        }
        return dp[pos][tight][started][rem][diff+10] = res;
    }

    int count_up_to(int x, int k) {
        if (x <= 0) return 0;
        memset(dp, -1, sizeof dp);
        string sx = to_string(x);
        return solve_dp(sx, k, sz(sx), 1, 0, 0, 0);
    }

    int numberOfBeautifulIntegers(int low, int high, int k) {
        int L = count_up_to(low-1, k);
        int R = count_up_to(high, k);
        return R - L;
    }
};
```

</details>

A couple of notes on the code. `pos` counts _down_ to $$0$$, so the digit at the current position is `num[sz(num) - pos]`. The `diff + 10` offset is the negative-index shift from the table. And `memset(dp, -1, ...)` runs inside `count_up_to`: the cache is valid only for one bound, since a `tight` state's digit cap comes from that bound's digits — reset it before each new number.

## Practice

- [LeetCode 2827 — Number of Beautiful Integers in the Range](https://leetcode.com/problems/number-of-beautiful-integers-in-the-range/)
- [LeetCode 902 — Numbers At Most N Given Digit Set](https://leetcode.com/problems/numbers-at-most-n-given-digit-set/)
- [LeetCode 600 — Non-negative Integers without Consecutive Ones](https://leetcode.com/problems/non-negative-integers-without-consecutive-ones/)
- [Codeforces 1036C — Classy Numbers](https://codeforces.com/problemset/problem/1036/C)
