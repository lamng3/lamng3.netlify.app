---
layout: post
title: "Coordinate Compression: Ranks for a Fenwick Tree"
description: A Fenwick tree indexes by position 1..m, but the values you want to count (prefix sums) can be huge or negative. Flatten every value you will insert or query into one sorted array, and each value's rank in it becomes its Fenwick index.
date: 2026-09-13
author: Nathan Nguyen
categories: [Data Structures]
tags: [Fenwick Tree, BIT, Coordinate Compression, Prefix Sums, Binary Search, LeetCode, Competitive Programming]
toc:
  sidebar: right
---

A Fenwick tree counts along indices $$1 \dots m$$, so to count how many earlier prefix sums fall in some range, you would index it by the prefix-sum _value_. But prefix sums can be up to $$10^{14}$$ or negative, so you cannot use them as array indices directly. **Coordinate compression** fixes this: replace each value by its **rank** in the sorted set of all values that ever appear, giving a dense $$1 \dots m$$ index the Fenwick tree can use.

The one subtlety that trips people up: the candidate set must include **every value you will insert _and_ every value you will query** — the query boundaries too, not just the points. Miss a boundary and its `lower_bound` lands between ranks, silently off by one.

## The problem

[LeetCode — Count Subarrays with Distant Sums](https://leetcode.com/problems/count-subarrays-with-distant-sums/): count subarrays whose sum is _far_ from `goal`, i.e. $$\vert \text{sum} - \text{goal}\vert \ge k$$. With prefix sums $$P$$, a subarray $$(L, R]$$ has sum $$P_R - P_L$$, so we want

$$
\vert P_R - P_L - \text{goal} \vert \ge k.
$$

Fix $$R$$ and count valid $$L < R$$. It is easier to count the **complement** (the "close" ones) and subtract: $$L$$ is close when

$$
P_R - \text{goal} - k < P_L < P_R - \text{goal} + k,
$$

so of the $$R$$ subarrays ending at $$R$$, subtract those whose $$P_L$$ lands in that open window. Sweep $$R$$ left to right, keeping every earlier $$P_L$$ in a Fenwick tree keyed by value, and range-query the window.

## Flatten the candidates

Every value the Fenwick tree touches must have a rank. Those are the points we insert (each $$P_i$$) **and** the two window edges we query for each $$R$$ ($$P_i - \text{goal} - k$$ and $$P_i - \text{goal} + k$$). Collect them all, sort, dedupe, and `lower_bound` gives each value its 1-based rank:

```cpp
vector<ll> A;
auto addCandidate = [&](ll x) {
    A.pb(x);                 // a prefix sum we may insert
    A.pb(x - goal - k);      // a window edge we may query
    A.pb(x - goal + k);
};
REP(i, n + 1) addCandidate(pref[i]);

sort(all(A));
A.erase(unique(all(A)), A.end());          // dense ranks 1..m
auto position = [&](ll x) {                 // value -> Fenwick index
    return lower_bound(all(A), x) - A.begin() + 1;
};
```

Because the edges are in `A`, `position(P_R - goal - k)` and `position(P_R - goal + k)` land on real ranks, and the open window is the rank range between them.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
class FenwickTree {
private:
    int n;
    vi ft;
public:
    FenwickTree(int n) : n(n) { ft.assign(n+1, 0); }
    void add(int i, int x) {
        for (; i <= n; i+=i&-i) ft[i] += x;
    }
    int query(int i) {
        if (i < 0) return 0;
        int res = 0;
        for (; i > 0; i-=i&-i) res += ft[i];
        return res;
    }
    int query(int L, int R) {
        if (L > R) return 0;
        return query(R) - query(L-1);
    }
};

class Solution {
public:
    ll distantSubarrays(vi& nums, int goal, int k) {
        // |A[R] - A[L] - goal| >= k
        // A[R] <= A[L] + goal - k
        // A[R] >= A[L] + goal + k
        int n = sz(nums);

        vector<ll> pref(n+1, 0);
        REP(i, n) pref[i+1] = pref[i] + nums[i];

        vector<ll> A;
        auto addCandidate = [&](ll x) {
            A.pb(x);
            A.pb(x - goal - k);
            A.pb(x - goal + k);
        };
        REP(i, n+1) addCandidate(pref[i]);

        // coordinate compress
        sort(all(A));
        A.erase(unique(all(A)), A.end());
        int m = sz(A);
        auto position = [&](ll x) {
            return lower_bound(all(A), x) - A.begin() + 1;
        };

        FenwickTree ft(m);
        ft.add(position(pref[0]), 1);

        ll ans = 0;

        FOR(R, 1, n) {
            // A[L] >= A[R] - goal + k
            int lo = position(pref[R] - goal - k);

            // A[L] <= A[R] - goal - k
            int hi = position(pref[R] - goal + k);

            ans += R;
            ans -= ft.query(lo+1, hi-1); // minus middle part

            ft.add(position(pref[R]), 1);
        }

        return ans;
    }
};
```

</details>

Each step is one range query and one point update, so the whole sweep is $$O(n \log n)$$.

## The takeaway

Whenever a Fenwick (or segment) tree needs to be keyed by a value that is large, sparse, or negative, compress: gather **all** values it will ever see — inserts and query bounds alike — into one sorted, deduped array, and use each value's rank as the index. The "and query bounds" half is the easy thing to forget.

## Practice

- [LeetCode — Count Subarrays with Distant Sums](https://leetcode.com/problems/count-subarrays-with-distant-sums/)
- [LeetCode 327 — Count of Range Sum](https://leetcode.com/problems/count-of-range-sum/)
- [LeetCode 493 — Reverse Pairs](https://leetcode.com/problems/reverse-pairs/)
- [LeetCode 315 — Count of Smaller Numbers After Self](https://leetcode.com/problems/count-of-smaller-numbers-after-self/)
