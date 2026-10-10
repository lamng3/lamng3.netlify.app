---
layout: post
title: "Binary Search"
description: "When a problem asks to minimize the maximum (or maximize the minimum), the answer is often monotone even when the choices are not. Fix the answer, turn the problem into a yes-or-no check, and binary search. Reachability DP in Dynamic Programming starts the same way."
permalink: /blog/binary-search/
last_updated: 2026-10-10
author: Lam Nguyen
toc:
  sidebar: right
---

When a problem asks to minimize the maximum (or maximize the minimum), the answer is often monotone even when the choices are not. Fix the answer, turn the problem into a yes-or-no check, and binary search. Reachability DP in Dynamic Programming starts the same way.

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

## Search D, Not x {#search-d-not-x}

[LeetCode 3357 — Minimize the Maximum Adjacent Element Difference](https://leetcode.com/problems/minimize-the-maximum-adjacent-element-difference/). Some entries of `nums` are missing and written as $$-1$$. You pick one pair of positive integers $$(x, y)$$, once, and replace every $$-1$$ with either $$x$$ or $$y$$. Minimize the largest absolute difference between adjacent elements.

For $$[1, 2, -1, 10, 8]$$ the answer is $$4$$: fill the gap with $$6$$ to get $$[1, 2, 6, 10, 8]$$, whose gaps are $$1, 4, 4, 2$$.

This section follows how I actually got there, wrong turns included, because the wrong turns are where the useful questions came from.

### First instinct: search on x

Two unknowns, values up to $$10^9$$. My first thought was some kind of (parallel) binary search on $$x$$ and $$y$$. Say $$x < y$$, since $$x = y$$ is just the one-value case.

But what is monotone here? If I guess $$x$$ and it turns out badly, that tells me nothing about whether a bigger or smaller $$x$$ is better, because it depends on the $$y$$ I haven't picked yet. The array is unordered, so there is no direction to move in.

The second idea was greedy: for each $$x$$, find the best filling using only $$x$$, mark which cells would be better off with something else, and then pick $$y$$ for those. That is a greedy step over a huge value range, with no reason to believe the best filling for $$x$$ alone stays best once $$y$$ exists. I parked it.

Both ideas search over the **choices**. The question that unblocked me was to search over the **answer** instead:

> If some pair $$(x, y)$$ keeps every adjacent gap $$\le D$$, does it also keep every gap $$\le D + 1$$?

Yes, trivially, with the same pair. So define

$$
\text{can}(D) = \text{"some pair } (x, y) \text{ keeps every adjacent gap} \le D\text{"}.
$$

It is false up to some threshold and true after it, and the threshold is the answer. Binary search on $$D$$. The hard part moves from the search to the check.

One slip I made here, worth avoiding. I first wrote $$\text{can}(D)$$ as "the max gap **equals** $$D$$". That is not monotone, and I had to patch it with an argument about nudging $$x$$ or $$y$$ by $$\pm 1$$, which does not hold, because moving $$x$$ can break some other gap. With $$\le$$, no argument is needed.

### How low and how high can D be?

Look at adjacent pairs where both values are known. Nothing I choose can change them, so the answer is at least the **largest** of those gaps:

$$
\text{lo} = \max |\text{nums}[i] - \text{nums}[i-1]| \quad \text{over known-known pairs}.
$$

(My second slip: I first wrote a min here. A min tells you nothing, since every fixed gap has to fit under $$D$$.)

For the top, $$10^9$$ works, but there is a tighter bound once we know what $$x$$ and $$y$$ actually touch. That is the next question.

### What does a -1 actually see?

Take a maximal run of $$-1$$s between two known values:

$$
a \;\; \underbrace{-1 \; -1 \; \cdots \; -1}_{\text{run}} \;\; b
$$

Inside the run, two equal fills differ by $$0$$. So the inside of a run costs nothing, and only the known values **next to** a $$-1$$ ever interact with $$x$$ and $$y$$. Every other known value can be ignored by the check.

There is one exception inside a run. If the run starts with $$x$$ (to suit $$a$$) and ends with $$y$$ (to suit $$b$$), somewhere it switches, and that one step costs $$|x - y|$$. So $$|x - y| \le D$$ matters only for runs that switch.

Call the smallest and largest known values next to a $$-1$$ by $$m$$ and $$M$$. At $$D = M - m$$, the single value $$M$$ is within $$D$$ of every such neighbor, so $$\text{hi} = \max(\text{lo}, M - m)$$ is always feasible. If there are no such neighbors at all (no $$-1$$, or the whole array is $$-1$$), the answer is just $$\text{lo}$$.

### Where should x live?

Now fix $$D$$. We still have to choose $$x$$ and $$y$$, and my first attempt branched.

I anchored on the **first** known value next to a $$-1$$, call it $$K_0$$. Something has to be within $$D$$ of it, so $$x$$ is either $$K_0 + D$$ or $$K_0 - D$$ (going to the extreme of the window reaches furthest). Then I walked the other neighbors: any $$K$$ that $$x$$ already covers is fine, and the first one it misses decides $$y$$, again as $$K + D$$ or $$K - D$$. Two options for $$x$$, two for $$y$$: four candidates, which I was about to try with a bitmask.

The question that removes the branching:

> Why the **first** neighbor? Is there a neighbor where one of the two choices is obviously better?

Anchor on the **smallest** neighbor $$m$$ instead. Every other neighbor $$K$$ satisfies $$K \ge m$$. Compare the two choices for the value that covers $$m$$:

- $$x = m - D$$ covers values in $$[m - 2D,\; m]$$. Among neighbors (all $$\ge m$$), that is only $$m$$ itself.
- $$x = m + D$$ covers values in $$[m,\; m + 2D]$$. That includes $$m$$, and every neighbor up to $$m + 2D$$.

The second set contains the first. So $$x = m - D$$ is never better, and

$$
x = m + D.
$$

Mirror it with the largest neighbor $$M$$, whose best cover reaches down as far as possible:

$$
y = \max(M - D,\; 1).
$$

The clamp only fires when $$M - D < 1$$, and then $$x = m + D$$ already covers everything up to $$M$$, so it changes nothing. Pushing $$x$$ up and $$y$$ down also brings them closer together, which only helps the $$|x - y| \le D$$ condition.

So for each $$D$$ there is exactly **one** pair worth checking. No masks.

### What does one run need?

With $$x$$ and $$y$$ pinned, walk the runs. Say "$$v$$ covers $$k$$" when $$|v - k| \le D$$. For a run between $$a$$ and $$b$$:

- **Can one value do both ends?** If $$x$$ covers both $$a$$ and $$b$$, or $$y$$ does, fill the whole run with it. Done.
- **If not, is the run long enough to switch?** With length $$1$$ there is one cell, and it cannot be both $$x$$ and $$y$$. Infeasible.
- **Length $$\ge 2$$:** write $$x \dots x \; y \dots y$$ (or the reverse). It works when one end is covered by $$x$$, the other by $$y$$, and $$|x - y| \le D$$. A longer run never needs a second switch.
- **A run touching the edge of the array** has only one neighbor $$a$$, so it needs $$x$$ or $$y$$ to cover $$a$$.

$$\text{can}(D)$$ is true when every run passes.

### Checking it on two small arrays

**$$[1, 2, -1, 10, 8]$$.** The fixed gaps give $$\text{lo} = 2$$. The neighbors of the $$-1$$ are $$2$$ and $$10$$, so $$m = 2$$ and $$M = 10$$.

- $$D = 3$$: $$x = 5$$, $$y = 7$$. $$x$$ covers $$2$$ but not $$10$$, $$y$$ covers $$10$$ but not $$2$$, and the run has one cell. Fails.
- $$D = 4$$: $$x = y = 6$$, which covers both ends. Passes.

The answer is $$4$$.

**$$[1, -1, -1, 10]$$.** Now the run has two cells, $$m = 1$$, $$M = 10$$.

- $$D = 2$$: $$x = 3$$ covers $$1$$, $$y = 8$$ covers $$10$$, but $$|x - y| = 5 > 2$$. Fails.
- $$D = 3$$: $$x = 4$$, $$y = 7$$, and $$|x - y| = 3$$. Passes, with $$[1, 4, 7, 10]$$.

The answer is $$3$$.

### Complexity

Each check is one pass, $$O(n)$$. The binary search runs over at most $$10^9$$ values, about $$30$$ steps.

$$
O(n \log V) \text{ time}, \qquad O(1) \text{ extra space}.
$$

### What to ask next time

The two questions that did the work here carry over to other "minimize the maximum" problems:

1. **Is the answer monotone, even if the choices are not?** If a solution for $$D$$ is also a solution for $$D + 1$$, search on $$D$$ and turn the problem into a yes-or-no check.
2. **Once the answer is fixed, is some choice dominated?** Anchor on an extreme (the smallest or largest thing that must be covered) and compare the options. Often one of them covers everything the other does, and the search over choices disappears.

### Implementation

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
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

A couple of notes on the code. `mn` and `mx` are the $$m$$ and $$M$$ from above, and `x`, `y` inside `can` are the forced pair for that $$D$$. A run is found by remembering where it started in `L` and processing it once the next entry is not $$-1$$. Everything stays `int`: $$D \le 10^9$$ and $$m \le 10^9$$, so $$m + D \le 2 \cdot 10^9$$, still under `INT_MAX`.

## Practice {#practice}

**Search D, Not x**

- [LeetCode 3357 — Minimize the Maximum Adjacent Element Difference](https://leetcode.com/problems/minimize-the-maximum-adjacent-element-difference/)
- [LeetCode 410 — Split Array Largest Sum](https://leetcode.com/problems/split-array-largest-sum/)
- [LeetCode 875 — Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/)
- [LeetCode 1011 — Capacity To Ship Packages Within D Days](https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/)
