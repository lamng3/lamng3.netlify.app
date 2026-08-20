---
layout: post
title: "Increasing Frequency: A Maximum Subarray in Disguise"
description: Codeforces 1082E asks you to add k to one segment of an array to maximize how many elements equal c. The trick is to see the operation's net effect as a +1/-1 balance, turning the whole thing into a maximum-subarray (Kadane) problem — and then a prefix-count idea lets us solve it for every value in O(n) total.
date: 2026-08-19
author: Nathan Nguyen
categories: [Algorithms]
tags: [Maximum Subarray, Kadane, Prefix Sums, Greedy, Codeforces, Competitive Programming]
toc:
  sidebar: right
---

Some problems look like they need a heavy data structure and then quietly collapse into something you already know. [Codeforces 1082E — Increasing Frequency](https://codeforces.com/contest/1082/problem/E) (rated **2000**) is one of those: it dresses up as a range-update optimization, but underneath it is just a **maximum subarray** problem wearing a costume.

## The problem

You are given an array $$a$$ of length $$n$$. You pick one segment $$[l, r]$$ and one integer $$k$$ (positive, negative, or zero) and add $$k$$ to every element in that segment. After this single operation, how many elements can equal a fixed target $$c$$ at most?

With $$n \le 5 \cdot 10^5$$, we need something close to linear.

## What one operation actually does

Fix the segment $$[l, r]$$ and the shift $$k$$, and split the array into "inside the segment" and "outside."

- **Outside** $$[l, r]$$ nothing moves, so every element that already equals $$c$$ stays counted.
- **Inside** $$[l, r]$$ every element gains $$k$$. An element ends at $$c$$ exactly when it _started_ at $$c - k$$. Meanwhile the elements that were already $$c$$ get shifted to $$c + k$$ and are lost (unless $$k = 0$$).

So if `tot` is the number of $$c$$'s in the whole array, the count after the operation is

$$\text{tot} \;-\; \underbrace{(\#\,c \text{ inside } [l,r])}_{\text{shifted away}} \;+\; \underbrace{(\#\,(c-k) \text{ inside } [l,r])}_{\text{shifted onto } c}.$$

Everything outside the segment is already baked into `tot`. All the operation can do is, _within the chosen window_, trade the $$c$$'s it destroys for the $$(c-k)$$'s it creates.

## A maximum subarray appears

Here is the key move: **fix the value we want to convert**, $$v = c - k$$. Once $$v$$ is fixed, choosing $$k$$ is fixed too, and we only need the best window. Give each position a weight:

$$w_i = \begin{cases} +1 & a_i = v \quad(\text{becomes } c) \\ -1 & a_i = c \quad(\text{was } c, \text{ now lost}) \\ \phantom{+}0 & \text{otherwise} \end{cases}$$

The quantity we add to `tot` is exactly the sum of $$w_i$$ over the window $$[l, r]$$. Maximizing it over all windows is the textbook **maximum-subarray problem** — Kadane's algorithm — and the empty gain $$0$$ (take $$k = 0$$, change nothing) is always available, so the answer is never worse than `tot`.

$$\text{answer} = \text{tot} + \max_{v \ne c}\Bigl(\text{best subarray sum of the } {+}1/{-}1 \text{ weights for } v\Bigr).$$

Running Kadane once per distinct value would be $$O(n)$$ per value, or $$O(n \cdot \text{distinct})$$ overall — too slow when many values appear.

## Doing every value in O(n) total

The rescue is that for a fixed $$v$$, almost every weight is $$0$$. Only the positions where $$a_i = v$$ (the $$+1$$'s) and where $$a_i = c$$ (the $$-1$$'s) matter, and an optimal window would never _start_ or _end_ on a $$-1$$ or a $$0$$ — you'd just trim it. So the window can always begin and end on an occurrence of $$v$$.

That lets us walk only the occurrences of $$v$$. Let `pref[i]` be the number of $$c$$'s in $$a[0..i]$$, and let $$v$$ occur at positions $$p_0 < p_1 < \dots < p_{m-1}$$. Extending a window from occurrence $$p_{i-1}$$ to the next occurrence $$p_i$$ adds one fresh $$+1$$ (for the new $$v$$) and subtracts however many $$c$$'s sit strictly between them:

$$\text{step}_i = 1 - \bigl(\text{pref}[p_i] - \text{pref}[p_{i-1}]\bigr),$$

with $$\text{step}_0 = 1$$ (a window starting at the first occurrence). Run Kadane over these per-occurrence steps — restarting a window at occurrence $$i$$ is worth $$1$$, not $$\text{step}_i$$, since a fresh start doesn't pay for the $$c$$'s before it, which is why the update clamps to `max(1, ...)`.

Because the occurrence lists across all values partition the array, the total work over every value is $$\sum_v m_v = O(n)$$.

## Implementation

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

void preprocess() {

}

void solve() {
    int n, c; cin >> n >> c;
    vi a(n);
    REP(i, n) cin >> a[i];

    // pref[i] = number of c's in a[0..i]
    vi pref(n, 0);
    REP(i, n) pref[i] = (i > 0 ? pref[i-1] : 0) + (a[i] == c);

    // occurrence positions of every value != c
    map<int, vi> pos;
    REP(i, n) if (a[i] != c) pos[a[i]].pb(i);

    int tot = pref[n-1], ans = tot;
    for (auto& [v, p] : pos) {
        // best (#v - #c) over a window that starts and ends on an occurrence of v
        int best = 0, cur = 0;
        REP(i, sz(p)) {
            int step = (i == 0) ? 1 : 1 - (pref[p[i]] - pref[p[i-1]]);
            cur = max(1, cur + step);   // restart is worth 1 (this v alone)
            best = max(best, cur);
        }
        ans = max(ans, tot + best);
    }
    cout << ans << '\n';
}

int main() {
    // freopen("name.in", "r", stdin);
    // freopen("name.out", "w", stdout);
    ios::sync_with_stdio(0);
    cin.tie(0);
    preprocess();
    int tt = 1;
    // cin >> tt;
    while (tt--) solve();
    return 0;
}
```

</details>

A nice side effect of the framing: the $$n = 1$$ edge case needs no special handling. If that single element is $$c$$, `tot = 1` and there are no other values, so the answer is $$1$$; if it isn't, `tot = 0` but its own occurrence contributes a gain of $$1$$, again giving $$1$$.

## Complexity

- Prefix counts: $$O(n)$$.
- Grouping occurrences and the per-value Kadane: $$O(n)$$ work plus the `map`'s $$O(n \log n)$$ (swap in a size-$$5\cdot10^5$$ bucket array for a clean $$O(n)$$).
- Space: $$O(n)$$.

## Takeaways

- A single range-add that maximizes a target count factors into _outside stays fixed, inside trades old $$c$$'s for new ones_ — a $$+1/-1$$ balance.
- That balance is a **maximum subarray**: answer $$= \text{tot} + \max_v \text{Kadane}(v)$$.
- Only occurrences carry weight, so a **prefix count of $$c$$** collapses per-value Kadane onto the occurrence lists, giving $$O(n)$$ across all values.

## Practice

- [Codeforces 1082E — Increasing Frequency](https://codeforces.com/contest/1082/problem/E)
- [LeetCode 53 — Maximum Subarray](https://leetcode.com/problems/maximum-subarray/)
- [CSES — Maximum Subarray Sum](https://cses.fi/problemset/task/1643)
- [LeetCode 1749 — Maximum Absolute Sum of Any Subarray](https://leetcode.com/problems/maximum-absolute-sum-of-any-subarray/)
