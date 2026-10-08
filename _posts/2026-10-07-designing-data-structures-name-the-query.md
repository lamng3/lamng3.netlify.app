---
layout: post
title: "Designing Data Structures: Name the Query First"
description: A running catalog of problems that are really asking you to build a small data structure. Each entry names the one query the algorithm repeats, the cheap certificate that answers it, and how much repair work an update costs — starting with a sliding-window minimum gap for Contains Duplicate III.
date: 2026-10-07
author: Lam Nguyen
categories: [Data Structures]
tags: [Multiset, Sliding Window, Invariants, Amortized Analysis, Overflow, Design, LeetCode, Competitive Programming]
toc:
  sidebar: right
---

Some problems do not want an algorithm. They want a small **data structure** — an object that answers one specific question over and over while the underlying set changes beneath it. The giveaway is a loop whose body asks the same thing every iteration, and whose honest implementation would rescan everything to answer it.

Every one of them yields to the same three questions, and this post is a running catalog of the answers.

## The recipe

> 1. **Name the query.** What single question does the loop ask on every iteration?
> 2. **Find a certificate.** What small piece of state answers that question in $$O(1)$$, without touching the rest of the set?
> 3. **Bound the damage.** When one element enters or leaves, how much of the certificate breaks? If the answer is "a constant amount," you have a data structure. If it is "all of it," you have the wrong certificate.

Step 3 is where designs live or die. A certificate you have to rebuild from scratch on every update is just the rescan with extra bookkeeping.

## Minimum gap in a sliding window

[LeetCode 220 — Contains Duplicate III](https://leetcode.com/problems/contains-duplicate-iii/) asks whether there are two indices $$i \ne j$$ with

$$
|i - j| \le \texttt{indexDiff} \quad\text{and}\quad |\,\text{nums}[i] - \text{nums}[j]\,| \le \texttt{valueDiff}.
$$

The index constraint is a sliding window of width $$k = \texttt{indexDiff} + 1$$. So walk the window and, at each position, ask: **do any two values currently in the window lie within `valueDiff` of each other?** Equivalently — and this is step 1, naming the query —

$$
\min_{i < j} \big|\, a_j - a_i \,\big| \;\overset{?}{\le}\; \texttt{valueDiff}
$$

over the window's multiset of values. Checking that directly costs $$\binom{k}{2}$$ comparisons per step. We need a certificate.

### Only adjacent gaps matter

Sort the window as $$a_1 \le a_2 \le \cdots \le a_k$$. For any $$i < j$$, telescope the difference:

$$
a_j - a_i = \sum_{t=i}^{j-1} \big( a_{t+1} - a_t \big) \;\ge\; \min_{1 \le t < k} \big( a_{t+1} - a_t \big),
$$

because every summand is nonnegative, so the sum is at least its smallest term — and at least the smallest gap anywhere in the window. An adjacent pair attains that bound. Hence

$$
\min_{i < j} \big|\, a_j - a_i \,\big| \;=\; \min_{1 \le t < k} \big( a_{t+1} - a_t \big).
$$

That is the certificate: the minimum of the $$k-1$$ **adjacent gaps**, down from $$\binom{k}{2}$$ pairs. Keep the window's values in sorted order, keep their adjacent gaps in a second multiset, and the query is `*diffs.begin()`.

### Bounding the damage

Now step 3 — how much does one insertion break? Insert $$x$$ between its predecessor $$p$$ and successor $$s$$. The gap $$s - p$$ no longer exists, and two new gaps appear:

| Neighbors of $$x$$ | Gaps destroyed | Gaps created |
| ------------------ | -------------- | ------------ |
| both $$p$$ and $$s$$ | $$s - p$$ | $$x - p$$, $$s - x$$ |
| only $$p$$ (new maximum) | — | $$x - p$$ |
| only $$s$$ (new minimum) | — | $$s - x$$ |
| neither (set was empty) | — | — |

At most one gap dies and at most two are born, **regardless of $$k$$**. Deletion is the same table read backwards. Constant damage per update, so the certificate is maintainable:

```cpp
class GapSet {
private:
    multiset<int> vals;
    multiset<ll> diffs;             // adjacent gaps, smallest first
public:
    void add(int x) {
        auto succ = vals.lower_bound(x);
        bool hasPred = succ != vals.begin(), hasSucc = succ != vals.end();
        if (hasPred && hasSucc) diffs.erase(diffs.find((ll)*succ - *prev(succ)));
        if (hasPred) diffs.insert((ll)x - *prev(succ));
        if (hasSucc) diffs.insert((ll)*succ - x);
        vals.insert(x);
    }
    void remove(int x) {
        auto it = vals.find(x);
        if (it == vals.end()) return;
        auto succ = next(it);
        bool hasPred = it != vals.begin(), hasSucc = succ != vals.end();
        if (hasPred) diffs.erase(diffs.find((ll)x - *prev(it)));
        if (hasSucc) diffs.erase(diffs.find((ll)*succ - x));
        if (hasPred && hasSucc) diffs.insert((ll)*succ - *prev(it));
        vals.erase(it);
    }
    ll minDiff() { return diffs.empty() ? LLONG_MAX : *diffs.begin(); }
};
```

Note that `lower_bound(x)` returns the first element $$\ge x$$, which *is* the successor — so `prev(succ)` is the predecessor and no second lookup is needed. Duplicates need no special case either: a repeated value produces an adjacent gap of $$0$$, which is exactly the right answer when `valueDiff` is $$0$$.

The driver keeps the window at $$k$$ elements and asks the query once per position:

```cpp
bool containsNearbyAlmostDuplicate(vi& nums, int idiff, int vdiff) {
    GapSet gset;
    REP(i, sz(nums)) {
        gset.add(nums[i]);
        if (i > idiff) gset.remove(nums[i - idiff - 1]);
        if (gset.minDiff() <= vdiff) return true;
    }
    return false;
}
```

Each step does $$O(1)$$ multiset operations on containers of size $$O(k)$$, so the whole scan is $$O(n \log k)$$ time and $$O(k)$$ space.

### Two traps worth naming

Both of these bite silently — the code compiles, passes the samples, and is wrong.

**Erasing by value deletes too much.** `multiset::erase(key)` removes **every** element equal to `key`, not one of them. Gaps repeat constantly — any arithmetic run has identical gaps throughout — so `diffs.erase(d)` would wipe out unrelated gaps and corrupt the invariant. Erasing through an iterator, `diffs.erase(diffs.find(d))`, removes exactly one occurrence. The same distinction applies to `multiset<int> vals`, which is why `remove` erases through `it` rather than by value.

**The gap overflows `int` before it is widened.** `diffs` is a `multiset<ll>`, which looks like enough. But in an expression like `*succ - x`, both operands are `int`, so the subtraction is evaluated in `int` and only *then* converted to `ll`. The constraints allow $$-2^{31} \le \text{nums}[i] \le 2^{31} - 1$$, so a gap can reach $$2^{32} - 1$$ and overflow. The minimal witness is `nums = [INT_MIN, INT_MAX]` with `indexDiff = 1`, `valueDiff = 1`: the true gap is $$4294967295$$, far outside the threshold, but the overflowed subtraction wraps to $$-1$$, the minimum gap reads as negative, and the function returns `true` instead of `false`. Checked against brute force over 20,000 random cases drawn from the extremes of the `int` range, the uncast version disagrees on **4,223** of them; casting one operand per subtraction — `(ll)*succ - x` — brings that to **0**, and to 0 across 40,000 further cases spanning the full range and small values.

The general rule is the one worth carrying away: **declaring the container wide does not widen the arithmetic.** The cast belongs on the operands, at the subtraction, not on the destination.

> **The faster alternative, and why it is less useful.** Bucket the values by width `valueDiff + 1` and keep one value per bucket; two values within `valueDiff` must land in the same bucket or in neighbors, so each step checks three buckets in $$O(1)$$ and the scan is $$O(n)$$. It is the better submission. But it answers only the threshold question — "is some pair within `valueDiff`?" — because the bucket width is derived from `valueDiff`. `GapSet` answers "what *is* the minimum gap?", which is a strictly stronger query that survives a change of threshold, supports multiple thresholds at once, and reports the actual value. That is the usual trade: the specialized trick wins on the problem as stated; the structure wins the moment the question moves.

## The rest of the catalog

Three more entries, each with the same three questions answered. They have standalone treatments, so these are the summaries.

**Resolution order under streaming inserts.** [LeetCode 3481 — Apply Substitutions](https://leetcode.com/problems/apply-substitutions/) defines values that reference other values. *Query:* which keys are resolvable right now? *Certificate:* a per-key count of dependencies not yet resolved, where zero means ready — Kahn's algorithm's indegree, promoted from a scratch variable to a maintained invariant. *Damage:* inserting a key touches one indegree per dependency, and resolving one cascades only to its direct dependents. Full derivation in [Streaming Substitution]({% post_url 2026-10-07-streaming-substitution-dependency-graph %}).

**The few newest across many sorted lists.** [LeetCode 355 — Design Twitter](https://leetcode.com/problems/design-twitter/) wants the 10 most recent tweets from the accounts you follow. *Query:* what is the largest unconsumed element across $$k$$ sorted sequences? *Certificate:* a heap holding one entry per sequence — its current head. *Damage:* consuming an element pushes that sequence's next head, one $$O(\log k)$$ operation. Full derivation in [K-Way Merge]({% post_url 2026-09-23-kway-merge-news-feed %}).

**Deleting from the middle of a heap.** A heap exposes only its top, so an element that becomes invalid while buried cannot be removed. *Query:* what is the smallest *still-valid* element? *Certificate:* the heap plus a record of what has been invalidated. *Damage:* none at invalidation time — pay at the top instead, discarding stale entries lazily before reading. Full derivation in [Priority Queues]({% post_url 2026-09-19-priority-queues-comparators-lazy-deletion %}).

## Reading the recipe backwards

The catalog has a pattern, and it is in step 2 every time. Each certificate is a **reduction in the candidate set**, justified by a small proof:

| Problem | Candidates, naively | Certificate | Why the rest can be ignored |
| ------- | ------------------- | ----------- | --------------------------- |
| Min gap in a window | all $$\binom{k}{2}$$ pairs | $$k-1$$ adjacent gaps | a difference telescopes into gaps, so it is at least the smallest one |
| Resolution order | all unresolved keys | keys at indegree $$0$$ | a finite DAG always has a source |
| $$k$$-way merge | every element of every list | $$k$$ list heads | each list is sorted, so its head dominates it |
| Lazy deletion | the whole heap | the top, after discarding stale entries | a stale entry below the top can never be the answer first |

So the real work in designing one of these is never the code. It is finding the argument that lets you stop looking at most of the set — and then checking that an update only disturbs a constant amount of what you kept.

## Practice

- [LeetCode 220 — Contains Duplicate III](https://leetcode.com/problems/contains-duplicate-iii/)
- [LeetCode 1438 — Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit](https://leetcode.com/problems/longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit/)
- [LeetCode 480 — Sliding Window Median](https://leetcode.com/problems/sliding-window-median/)
- [LeetCode 239 — Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/)
- [LeetCode 3481 — Apply Substitutions](https://leetcode.com/problems/apply-substitutions/)
- [LeetCode 355 — Design Twitter](https://leetcode.com/problems/design-twitter/)
