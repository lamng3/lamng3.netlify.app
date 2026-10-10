---
layout: post
title: "Binary Search on the Answer: Two Values That Fill Every Gap"
description: Minimize the Maximum Adjacent Element Difference (LeetCode 3357) lets you replace every missing entry with one of two values you get to choose. Fix a target difference D and the choice stops being a search, because the best pair is forced, and the whole problem becomes a monotone yes-or-no check you can binary search.
date: 2026-10-09
author: Lam Nguyen
categories: [Data Structures]
tags: [Binary Search, Binary Search on the Answer, Greedy, Dominance, Monotonicity, Arrays, LeetCode, Competitive Programming]
toc:
  sidebar: right
---

[LeetCode 3357 — Minimize the Maximum Adjacent Element Difference](https://leetcode.com/problems/minimize-the-maximum-adjacent-element-difference/) gives you an array where some entries are missing, written as $$-1$$. You pick **one pair** of positive integers $$(x, y)$$, and every $$-1$$ becomes either $$x$$ or $$y$$ (your choice per position). Minimize the largest absolute difference between adjacent elements.

For example, $$[1, 2, -1, 10, 8]$$ has answer $$4$$: choose $$(6, 7)$$, fill the gap with $$6$$, and you get $$[1, 2, 6, 10, 8]$$, whose adjacent differences are $$1, 4, 4, 2$$.

The search space looks awful: a pair of values up to $$10^9$$, plus a choice at every gap. The way out is the standard one for "minimize the maximum" problems, and the interesting part is what it buys us once we use it.

## Fix the answer, then ask yes or no

Let $$\text{can}(D)$$ mean: _some pair $$(x, y)$$ keeps every adjacent difference $$\le D$$._

If a pair works for $$D$$, the same pair works for $$D + 1$$. So $$\text{can}$$ is **monotone**: false up to some threshold, true from there on. We want the threshold, so we binary search on $$D$$. This is the same trick as splitting an array to minimize the largest sum or shipping packages in the fewest days: stop optimizing, and start checking.

That reduces the problem to answering one question quickly: given $$D$$, does a good pair exist?

## The bounds

The binary search needs a range.

- **Lower bound.** Two known neighbors never change, so every known-known gap is a floor. Let
  $$
  \text{lo} = \max_i |\,\text{nums}[i] - \text{nums}[i-1]\,| \quad \text{over pairs where both entries are known.}
  $$
- **Upper bound.** Only known values _next to a $$-1$$_ ever interact with $$x$$ and $$y$$. Let $$m$$ and $$M$$ be the smallest and largest of them. At $$D = M - m$$, the single value $$x = M$$ is within $$D$$ of every such neighbor, so everything is feasible. Take $$\text{hi} = \max(\text{lo}, M - m)$$.

If there are no neighbors at all (no $$-1$$, or the array is all $$-1$$), nothing depends on $$x$$ or $$y$$, and the answer is just $$\text{lo}$$.

## For a fixed $$D$$, the pair is forced

Here is the observation that makes the check cheap. We do not need to search over $$(x, y)$$ at all.

Say $$x \le y$$. The smallest neighbor $$m$$ has to be within $$D$$ of something we place, and $$x$$ is the lower of the two, so make $$x$$ the one that serves $$m$$. Every other neighbor is $$\ge m$$. A choice $$x' \le m + D$$ covers neighbors up to $$x' + D \le m + 2D$$. The choice

$$
x = m + D
$$

covers $$[m, m + 2D]$$, which contains everything any smaller $$x'$$ could cover among values $$\ge m$$. So $$x = m + D$$ **dominates**.

Symmetrically, the largest neighbor $$M$$ is served by $$y$$, and the best choice is

$$
y = \max(M - D, 1).
$$

The clamp to $$1$$ is safe: if $$M - D < 1$$, then $$x$$ alone already covers every neighbor.

Pushing $$x$$ up and $$y$$ down also pulls them _toward_ each other, which is what the split case below needs, so the dominance holds there too. For a given $$D$$, there is exactly one pair worth testing.

## Checking one run of $$-1$$s

Split the array into maximal runs of consecutive $$-1$$s. Inside a run, two adjacent fills that are equal differ by $$0$$, so only the **known values on each end of the run** matter. Call them $$a$$ (left) and $$b$$ (right), and write "$$v$$ covers $$k$$" for $$|v - k| \le D$$.

| situation | feasible when |
| --- | --- |
| One value, $$x$$ or $$y$$, covers both $$a$$ and $$b$$ | always: fill the whole run with it |
| $$x$$ covers one end and $$y$$ covers the other, run length $$1$$ | never: one cell cannot be both |
| the same split, run length $$\ge 2$$ | iff $$\lvert x - y \rvert \le D$$: write $$x \dots x\; y \dots y$$ and pay one jump from $$x$$ to $$y$$ |
| run touches an edge of the array (only one neighbor $$a$$) | iff $$x$$ or $$y$$ covers $$a$$ |

A run longer than two never needs more than one switch, so these rows are the whole story. $$\text{can}(D)$$ is true exactly when every run passes.

## Two small cases

**$$[1, 2, -1, 10, 8]$$.** Known gaps give $$\text{lo} = 2$$. The only neighbors of the $$-1$$ are $$2$$ and $$10$$, so $$m = 2$$, $$M = 10$$.

- $$D = 3$$: $$x = 5$$, $$y = 7$$. The run has length $$1$$, $$a = 2$$, $$b = 10$$. $$x$$ covers $$2$$ but not $$10$$, and $$y$$ covers $$10$$ but not $$2$$. That is a split on a single cell, so it fails.
- $$D = 4$$: $$x = y = 6$$ covers both ends. It passes.

The answer is $$4$$.

**$$[1, -1, -1, 10]$$.** Here $$m = 1$$, $$M = 10$$, and the run has length $$2$$.

- $$D = 2$$: $$x = 3$$, $$y = 8$$. $$x$$ covers $$1$$ and $$y$$ covers $$10$$, but $$|x - y| = 5 > 2$$, so the jump in the middle is too big.
- $$D = 3$$: $$x = 4$$, $$y = 7$$. Both ends are covered and $$|x - y| = 3 \le 3$$.

The answer is $$3$$, achieved by $$[1, 4, 7, 10]$$.

## Complexity

Each check scans the array once, in $$O(n)$$, and the binary search runs over a range of size at most $$V = 10^9$$, so about $$\log_2 V \approx 30$$ checks.

$$
O(n \log V) \text{ time}, \qquad O(1) \text{ extra space.}
$$

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

class Solution {
public:
    int minDifference(vi& nums) {
        int n = sz(nums);

        auto next_to_neg = [&](int i) {
            if (nums[i] == -1) return false; // is neg
            if (i > 0 && nums[i-1] == -1) return true;
            if (i < n-1 && nums[i+1] == -1) return true;
            return false;
        };

        // m, M: smallest and largest known value next to a -1
        int mn = INF, mx = 0;
        REP(i, n) {
            if (next_to_neg(i)) {
                mn = min(mn, nums[i]);
                mx = max(mx, nums[i]);
            }
        }

        // known-known gaps never change
        int mxdiff = 0;
        REP(i, n) if (i > 0 && nums[i] != -1 && nums[i-1] != -1) mxdiff = max(mxdiff, abs(nums[i] - nums[i-1]));

        // edge case: no -1 or all -1
        if (mn == INF) return mxdiff;

        auto can = [&](int D) {
            int x = mn + D, y = max(mx - D, 1);
            auto cov = [&](int v, int k) { return abs(v - k) <= D; };

            int L = -1;
            REP(i, n) {
                if (nums[i] == -1) {
                    if (L == -1) L = i;
                    if (i == n-1 || nums[i+1] != -1) {
                        // process the run [L..R]
                        int R = i;
                        bool hasA = L > 0, hasB = R < n-1;
                        if (hasA && hasB) {
                            int a = nums[L-1], b = nums[R+1];
                            bool same = (cov(x, a) && cov(x, b)) || (cov(y, a) && cov(y, b));
                            bool split = (R - L + 1 >= 2) && abs(x - y) <= D
                                      && ((cov(x, a) && cov(y, b)) || (cov(y, a) && cov(x, b)));
                            if (!same && !split) return false;
                        }
                        else {
                            int a = hasA ? nums[L-1] : nums[R+1];
                            if (!cov(x, a) && !cov(y, a)) return false;
                        }
                        L = -1;
                    }
                }
            }
            return true;
        };

        int left = mxdiff, right = max(mxdiff, mx - mn), ans = right;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (can(mid)) {
                ans = mid;
                right = mid-1;
            }
            else left = mid+1;
        }
        return ans;
    }
};
```
</details>

A couple of notes on the code. `x = mn + D` and `y = max(mx - D, 1)` are the forced pair, computed fresh inside every `can(D)`. The scan finds each run by remembering where it started in `L` and processing it when the next entry is not $$-1$$ (or the array ends). And `ans` starts at `right`, which is always feasible, so the loop only has to look for something smaller.

## Practice

- [LeetCode 3357 — Minimize the Maximum Adjacent Element Difference](https://leetcode.com/problems/minimize-the-maximum-adjacent-element-difference/)
- [LeetCode 410 — Split Array Largest Sum](https://leetcode.com/problems/split-array-largest-sum/)
- [LeetCode 875 — Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/)
- [LeetCode 1011 — Capacity To Ship Packages Within D Days](https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/)
