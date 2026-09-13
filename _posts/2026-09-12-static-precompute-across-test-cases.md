---
layout: post
title: "Static Precompute: One Table Across All Test Cases"
description: When an expensive table is input-independent, building it inside your function makes you pay for it on every test case. A static member built once, guarded by a flag, is shared across every call — turning repeated work into one-time work.
date: 2026-09-12
author: Nathan Nguyen
categories: [Data Structures]
tags: [Precompute, Static Members, inline static, Binary Search, Palindromes, C++, LeetCode, Competitive Programming]
toc:
  sidebar: right
---

Some solutions need a big lookup table that does not depend on the input at all: every prime below $$10^7$$, all factorials mod $$p$$, every palindrome up to $$10^{10}$$. Build that table inside your solve function and you rebuild it on **every test case** — and judges run many. The table is the same each time, so all but the first build is wasted work, and it is exactly the kind of waste that turns a correct solution into a TLE.

The fix is to build it **once** and share it across every call: a `static` table, guarded so it initializes on the first call and is reused forever after.

## The problem

[LeetCode 4053 — Minimum Operations to Make Every Element Palindromic](https://leetcode.com/problems/minimum-operations-to-make-every-element-palindromic/): given `nums`, one operation increments or decrements some `nums[i]` by $$2$$; make every element a positive palindrome at minimum total cost.

Two observations solve it:

- **$$\pm 2$$ preserves parity.** An element can only ever become a palindrome of the **same parity** as its starting value, and moving from $$x$$ to a palindrome $$p$$ costs $$\vert x - p \vert / 2$$ operations (each step changes the value by $$2$$).
- **So each element is independent:** send $$x$$ to the _nearest same-parity palindrome_, and sum the per-element costs.

That reduces the task to: for each `x`, find the closest palindrome of the same parity. Precompute all palindromes, split by parity into two sorted lists, and binary-search each one.

## Precompute once, not per call

Generating the palindromes is the expensive part, and it is **completely input-independent** — the set of palindromes never changes. So it belongs in a table computed once. Make that table a `static` member and guard the generation with a flag:

```cpp
inline static vector<ll> palins[2];   // shared by every Solution call

void generate() {
    if (sz(palins[0])) return;        // already built? reuse it.
    /* ... fill palins[0], palins[1], sort ... */
}
```

The judge constructs `Solution` and calls `minOperations` once per test case. A plain local table would be rebuilt each call; a `static` member lives past the call, so the `if (sz(palins[0])) return;` guard makes generation run on the **first** test case only and every later call reuses it.

**Why `inline static`?** A classic `static` data member needs a separate out-of-class definition (`vector<ll> Solution::palins[2];`) or the linker complains. C++17's `inline static` lets you declare _and_ define it in one line inside the class — no boilerplate, and still a single shared instance.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
#include <bits/stdc++.h>
using namespace std;

using ll = long long;

using vi = vector<int>;

#define REP(i, n) for (int i = 0; i < (n); i++)
#define FOR(i, a, b) for (int i = (a); i <= (b); i++)
#define all(x) (x).begin(), (x).end()
#define sz(x) (int)((x).size())
#define pb push_back

const ll INF64 = (ll)2e18;

class Solution {
private:
    inline static vector<ll> palins[2]; // generate across all test cases
public:
    void generate() {
        if (sz(palins[0])) return;
        auto rev = [](string s) { reverse(all(s)); return s; };
        REP(b, 2) palins[b].reserve(2e5);
        FOR(x, 1, 99999) {
            string s = to_string(x), r = rev(s);
            REP(i, 11) {
                string px = i == 10 ? "" : string(1, '0' + i);
                ll p = stoll(s + px + r);
                palins[p & 1].pb(p);
            }
        }
        FOR(d, 1, 9) palins[d & 1].pb(d);
        REP(b, 2) sort(all(palins[b]));
    }
    ll minOperations(vi& nums) {
        generate();
        auto solve = [&](int x) {
            auto& v = palins[x & 1];
            auto it = lower_bound(all(v), (ll)x);
            ll best = INF64;
            if (it != v.end()) best = min(best, *it - x);
            if (it != v.begin()) best = min(best, x - *prev(it));
            return best / 2;
        };
        ll ans = 0;
        for (auto& x : nums) ans += solve(x);
        return ans;
    }
};
```

</details>

The generator builds each palindrome from its left half `x`: mirror `x` to get an even-length palindrome, or insert a middle digit for odd length, bucket by `p & 1`, and add the single digits `1..9`. Each `solve(x)` then does one `lower_bound` and checks the neighbor on each side, taking the smaller gap divided by $$2$$.

## The takeaway

When a table is a pure function of _nothing but constants_ — not of the input — it should be built once, not once per test case. A `static` member plus an "already built?" guard turns $$T$$ rebuilds into one, and `inline static` gives you that with zero boilerplate. The same move applies to a prime sieve, a factorial/inverse-factorial table, or any precomputed structure you binary-search or index into across many queries.

## Practice

- [LeetCode 4053 — Minimum Operations to Make Every Element Palindromic](https://leetcode.com/problems/minimum-operations-to-make-every-element-palindromic/)
- [LeetCode 2081 — Sum of k-Mirror Numbers](https://leetcode.com/problems/sum-of-k-mirror-numbers/)
- [LeetCode 866 — Prime Palindrome](https://leetcode.com/problems/prime-palindrome/)
