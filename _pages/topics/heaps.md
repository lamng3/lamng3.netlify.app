---
layout: post
title: "Heaps"
description: "A heap answers one question fast: what is on top right now. Choosing the comparator decides what that means, lazy deletion handles elements that go stale while buried, and a k-way merge uses a heap to read many sorted lists as one."
permalink: /blog/heaps/
last_updated: 2026-09-23
author: Lam Nguyen
toc:
  sidebar: right
---

A heap answers one question fast: what is on top right now. Choosing the comparator decides what that means, lazy deletion handles elements that go stale while buried, and a k-way merge uses a heap to read many sorted lists as one.

## Priority Queues and Lazy Deletion {#priority-queues}

Reach for a **priority queue** (a binary heap) whenever you repeatedly need the current extreme — the min or the max — of a set that keeps changing. It gives you $$O(\log n)$$ push, $$O(\log n)$$ pop of the extreme, and $$O(1)$$ peek, which is exactly the budget a greedy or a sweep needs when "the next thing to handle" is always the smallest or largest remaining item.

The primitive is easy. The two things that actually take practice are: **which order** (what does "extreme" mean here, and which key breaks ties), and **which pattern** (how to compose one or two heaps into a solution, including how to fake deletion when an element goes stale). This section is a map of both.

### The comparator: what ends up on top

In C++, `std::priority_queue` keeps on `top()` the element that is **greatest** according to its comparator. Two defaults to memorize:

```cpp
priority_queue<int> mx;                                   // max-heap: top() = largest
priority_queue<int, vector<int>, greater<int>> mn;        // min-heap: top() = smallest
```

The trap is that the comparator points the **opposite way from `sort`**. `sort(v.begin(), v.end(), cmp)` lists the `cmp`-smallest first; the _same_ `cmp` in a `priority_queue` puts the `cmp`-largest on `top()`. So `greater<>` — which sorts descending — gives you a **min**-heap, and the default `less<>` gives a **max**-heap. When in doubt: write the comparator, then flip your expectation.

Formally, `cmp(a, b)` returns `true` when `a` has **lower priority** than `b` (i.e. `a` comes out later). The element that no other element beats is `top()`.

#### Composite keys and tie-breaks

Most real problems key on a struct, sorting by a primary field and breaking ties on a secondary. In [Single-Threaded CPU](https://leetcode.com/problems/single-threaded-cpu/) you want the task with the **smallest processing time**, ties broken by **smallest index**:

```cpp
struct Task { int etime, ptime, id; };

// min-heap on (ptime, id): smallest processing time on top, then smallest id
auto cmp = [](const Task& a, const Task& b) {
    if (a.ptime != b.ptime) return a.ptime > b.ptime;  // '>' => smaller on top
    return a.id > b.id;
};
priority_queue<Task, vector<Task>, decltype(cmp)> pq(cmp);
```

Every comparison uses `>` because we want a min-heap on the whole tuple. Notice the payload: the heap carries the sort key _and_ an `id` so you can map the winner back to the answer.

### A catalog of patterns

Almost every heap problem is one of a handful of shapes. For each, the design question is the same: **what is the single element I keep pulling off the top, and how is it keyed?**

#### Top-K with a bounded heap

To hold the $$k$$ largest of a stream, keep a **min-heap of size $$k$$**: the smallest of your top-$$k$$ sits on top, and the $$k$$-th largest overall _is_ that top. Push everything; whenever the size exceeds $$k$$, pop.

```cpp
// k-th largest in an array
priority_queue<int, vector<int>, greater<int>> pq;  // min-heap
for (int x : nums) { pq.push(x); if (sz(pq) > k) pq.pop(); }
return pq.top();
```

The counterintuitive part is the inversion — to track the _largest_ $$k$$ you use a _min_-heap, because you only ever want to discard the smallest survivor. Same shape: [215 Kth Largest Element](https://leetcode.com/problems/kth-largest-element-in-an-array/), [703 Kth Largest in a Stream](https://leetcode.com/problems/kth-largest-element-in-a-stream/), [2583 Kth Largest Level Sum](https://leetcode.com/problems/kth-largest-sum-in-a-binary-tree/).

#### K-way merge

Merging $$k$$ sorted sources: the heap holds one **frontier** element per source, keyed by value. Pop the smallest, then push that source's successor. The heap size stays $$O(k)$$ while you stream out the full merged order.

[23 Merge k Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/) pushes list heads and re-pushes `node->next`. [264 Ugly Number II](https://leetcode.com/problems/ugly-number-ii/) generates the sorted multiples of $$\{2,3,5\}$$ this way — with a **dedup** step, since $$2\cdot3 = 3\cdot2$$ would otherwise emit $$6$$ twice. [373 K Pairs with Smallest Sums](https://leetcode.com/problems/find-k-pairs-with-smallest-sums/) merges the rows of an implicit sorted grid.

This same $$k$$-way merge is a workhorse in **database systems**. External merge sort — how a database sorts data larger than memory — writes sorted runs to disk and then merges $$k$$ of them at a time with exactly this heap (engines often use a _loser tree_, a tournament-tree variant tuned for merging), and merge joins and ordered scans consume their sorted inputs the same way.

#### Two heaps that balance

Keep the lower half of the data in a **max-heap** and the upper half in a **min-heap**, sized so the two tops straddle the middle. That gives the running median in $$O(\log n)$$ per insert — [295 Find Median from Data Stream](https://leetcode.com/problems/find-median-from-data-stream/). The invariant $$0 \le \vert \text{left} \vert - \vert \text{right} \vert \le 1$$ is the whole trick; rebalance after each insert.

#### A bounded heap sweeping in sorted order

Process items in one deliberate order, keep a size-$$k$$ heap of candidates, and evict the worst when the window overflows. [1383 Maximum Performance of a Team](https://leetcode.com/problems/maximum-performance-of-a-team/): sort employees by **efficiency descending**, keep a **min-heap on speed** of size $$k$$; as each new (lower-efficiency) employee enters, they set the multiplier, and you drop the smallest speed to keep the best sum. The two orders — efficiency to sweep, speed to prune — are the crux.

#### Event simulation with free / used heaps

Time-ordered simulation uses two heaps: one of **in-use resources keyed by finish time** (to release them as time advances) and one of **free resources keyed by id** (to assign the best one). [253 Meeting Rooms II](https://leetcode.com/problems/meeting-rooms-ii/), [2402 Meeting Rooms III](https://leetcode.com/problems/meeting-rooms-iii/), and [1834 Single-Threaded CPU](https://leetcode.com/problems/single-threaded-cpu/) all run this loop: advance the clock, release everything that finished, then assign. In [1801 Number of Orders in the Backlog](https://leetcode.com/problems/number-of-orders-in-the-backlog/) the two heaps are a **max-heap of buys** and a **min-heap of sells** matched at their tops — an order book.

### Lazy deletion

The one thing a binary heap _cannot_ do cheaply is remove an arbitrary element (or decrease a key) — `top()`/`pop()` only reach the extreme. The workaround is **lazy deletion**: never delete in place. Keep a **source of truth** for what is currently valid, push freely, and when you peek, throw away any top that the source of truth says is stale. Each element is popped at most once, so the discards are amortized free.

There are two common flavors.

**Validity check on pop.** [2349 Design a Number Container System](https://leetcode.com/problems/design-a-number-container-system/) maps each index to its current number (`current`, the truth) and, per number, a min-heap of indices that _ever_ held it (`lazy`). On a query, pop tops whose truth no longer matches:

```cpp
class NumberContainers {
public:
    map<int,int> current;                                   // index -> its number (source of truth)
    map<int, priority_queue<int, vector<int>, greater<int>>> lazy;  // number -> min-heap of indices

    void change(int index, int number) {
        current[index] = number;
        lazy[number].push(index);                           // never erase the old entry
    }
    int find(int number) {
        auto& pq = lazy[number];
        while (!pq.empty() && current[pq.top()] != number)  // top is stale? drop it
            pq.pop();
        return pq.empty() ? -1 : pq.top();
    }
};
```

**Monotone discard.** When you process queries in a sorted order, an element can become _permanently_ dead, so you can pop it the moment it surfaces. That is the heart of the worked example below, and it is exactly the sketch of keeping an `is_in_queue`-style source of truth and dropping stale tops — one heap answers, another structure records validity.

### Worked example: Minimum Interval to Include Each Query

[1851 Minimum Interval to Include Each Query](https://leetcode.com/problems/minimum-interval-to-include-each-query/) ties three of these ideas together. For each query $$q$$, report the length of the shortest interval $$[L, R]$$ with $$L \le q \le R$$.

The design decisions:

- **Answer queries offline, smallest first.** Sort queries ascending. As $$q$$ grows, an interval only ever _starts_ being eligible (when $$L \le q$$) and, once $$R < q$$, is dead forever.
- **Feed by one key, answer by another.** Sort intervals by $$L$$ and add each to a heap as soon as $$L \le q$$. The heap is keyed by **length** so its top is the shortest candidate — that is the answer, if it is still alive.
- **Lazy-delete the dead ones.** Before reading the top, pop any interval with $$R < q$$. Because queries only increase, such an interval can never satisfy a later query, so popping it permanently is safe (monotone discard).

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
struct Query {
    int value, id;
};

struct Interval {
    int L, R;
    int length() { return R - L + 1; }
};

class Solution {
public:
    vi minInterval(vii& intervals, vi& queries) {
        int n = sz(intervals), m = sz(queries);

        vector<Query> Q(m);
        REP(i, m) Q[i] = {queries[i], i};
        // sort queries by value asc
        sort(all(Q), [](const Query& q1, const Query& q2) {
            return q1.value < q2.value;
        });

        vector<Interval> I(n);
        REP(i, n) I[i] = {intervals[i][0], intervals[i][1]};
        // sort intervals by L asc
        sort(all(I), [](const Interval& i1, const Interval& i2) {
            return i1.L < i2.L;
        });

        // min-heap {length, R} to get smallest length that satisfies R >= queries[j]
        priority_queue<pii, vector<pii>, greater<pii>> pq;
        vi ans(m, -1);

        int iid = 0; // interval id
        for (auto& q : Q) {
            // add intervals with L <= q.value
            while (iid < n && I[iid].L <= q.value) {
                pq.push({I[iid].length(), I[iid].R});
                iid++;
            }

            // remove intervals with q.value > R
            while (!pq.empty() && pq.top().se < q.value) {
                pq.pop();
            }

            if (!pq.empty()) ans[q.id] = pq.top().fi;
        }

        return ans;
    }
};
```

</details>

Sorting dominates, so the whole thing is $$O((n + m)\log(n + m))$$.

### How to choose the order and the pattern

When a problem smells like a heap, four questions pin down the design:

1. **What single element do I repeatedly pull off?** That element is `top()`, and whether it is the min or the max fixes `greater<>` vs the default `less<>`. Remember the inversion: to keep the _largest_ $$k$$, the bounded heap is a _min_-heap.
2. **Do I feed elements in a different order than I answer them?** If yes, this is an offline sweep: sort (or heap) by the **feed key**, and use a second heap keyed by the **answer key**. The interval problem feeds by $$L$$ and answers by length.
3. **Can an element go stale?** A heap cannot delete from the middle, so keep a **source of truth** and lazily pop tops that disagree with it — a validity check (Number Containers) or a monotone discard (interval sweep).
4. **Is the set bounded?** Top-$$k$$ and sliding windows keep a fixed-size heap and evict on overflow; the evicted element is always the current top.

Answer those and the comparator and the loop write themselves. The recurring instinct is the same one behind a [segment tree walk](/blog/range-queries/#segment-tree-walk) or a sweep: keep just enough state to serve the _next_ extreme cheaply, and let an ordering do the bookkeeping.

### Docs worth reading

- [USACO Guide — Priority Queues](https://usaco.guide/silver/priority-queues) — the cleanest introduction with practice.
- [cppreference — std::priority_queue](https://en.cppreference.com/w/cpp/container/priority_queue) — the comparator semantics, precisely.
- [Codeforces — deleting elements in a priority queue](https://codeforces.com/blog/entry/67265) — the lazy-deletion technique.

### Practice

- **Top-K:** [215 Kth Largest Element](https://leetcode.com/problems/kth-largest-element-in-an-array/), [703 Kth Largest in a Stream](https://leetcode.com/problems/kth-largest-element-in-a-stream/), [2583 Kth Largest Level Sum](https://leetcode.com/problems/kth-largest-sum-in-a-binary-tree/)
- **K-way merge:** [23 Merge k Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/), [264 Ugly Number II](https://leetcode.com/problems/ugly-number-ii/), [373 K Pairs with Smallest Sums](https://leetcode.com/problems/find-k-pairs-with-smallest-sums/)
- **Two heaps:** [295 Find Median from Data Stream](https://leetcode.com/problems/find-median-from-data-stream/), [1383 Maximum Performance of a Team](https://leetcode.com/problems/maximum-performance-of-a-team/)
- **Event simulation:** [253 Meeting Rooms II](https://leetcode.com/problems/meeting-rooms-ii/), [2402 Meeting Rooms III](https://leetcode.com/problems/meeting-rooms-iii/), [1834 Single-Threaded CPU](https://leetcode.com/problems/single-threaded-cpu/), [1801 Number of Orders in the Backlog](https://leetcode.com/problems/number-of-orders-in-the-backlog/)
- **Lazy deletion:** [2349 Design a Number Container System](https://leetcode.com/problems/design-a-number-container-system/), [1851 Minimum Interval to Include Each Query](https://leetcode.com/problems/minimum-interval-to-include-each-query/)

## K-Way Merge {#k-way-merge}

[LeetCode 355 — Design Twitter](https://leetcode.com/problems/design-twitter/) asks for a tiny social network: post a tweet, follow/unfollow, and fetch a **news feed** of the 10 most recent tweets from you and everyone you follow. The obvious solution passes — but it does an amount of work per feed that grows with the entire history, and there is a much better structure hiding in the problem.

### The easy version, and why it drags

Keep one global log of every tweet in post order. To build a feed, scan it **backwards** and collect the first 10 whose author is you or someone you follow:

```cpp
// global: vector<pair<int,int>> stream;  // {authorId, tweetId}, in post order
vector<int> getNewsFeed(int userId) {
    vector<int> feed;
    for (int i = sz(stream) - 1; i >= 0 && sz(feed) < 10; i--) {
        auto [uid, tid] = stream[i];
        if (uid == userId || following[userId].count(uid))
            feed.push_back(tid);
    }
    return feed;
}
```

It is correct and simple. The catch: each `getNewsFeed` walks the **whole global history** to find at most 10 relevant tweets, so a feed costs $$O(N)$$ with $$N$$ the total number of tweets ever posted — regardless of how few people you follow. On the hidden tests that adds up; a straightforward submission of this clocked in around **2351 ms**.

### The reframe: a merge of sorted timelines

Here is the observation that changes everything: **each user's own tweets are already in chronological order** — appending to their personal list keeps it sorted by time. Your feed is nothing more than the 10 newest tweets across a handful of these sorted lists (yours plus each person you follow). That is precisely [Merge k Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/): a **k-way merge**, stopped after 10 outputs.

So store tweets **per user** with a global timestamp, and merge with a max-heap keyed by time. Seed the heap with each followed user's _newest_ tweet; pop the newest overall, then push that user's _previous_ tweet, ten times.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
class Twitter {
    struct Tweet { int id, time; };

    unordered_map<int, vector<Tweet>> tweets;
    unordered_map<int, unordered_set<int>> following;
    int timestamp = 0;

    vector<int> mergeKTweets(int userId) {
        priority_queue<tuple<int, int, int>> pq; // {time, uid, idx}

        auto push = [&](int uid) {
            if (!tweets.count(uid) || tweets[uid].empty()) return;
            int i = tweets[uid].size() - 1;
            pq.emplace(tweets[uid][i].time, uid, i);
        };

        push(userId);
        for (int f : following[userId]) push(f);

        vector<int> feed;
        while (!pq.empty() && feed.size() < 10) {
            auto [t, uid, i] = pq.top(); pq.pop();
            feed.push_back(tweets[uid][i].id);
            if (i > 0) pq.emplace(tweets[uid][i - 1].time, uid, i - 1);
        }
        return feed;
    }

public:
    Twitter() {}

    void postTweet(int userId, int tweetId) {
        tweets[userId].push_back({tweetId, timestamp++});
    }

    vector<int> getNewsFeed(int userId) {
        return mergeKTweets(userId);
    }

    void follow(int followerId, int followeeId) {
        if (followerId != followeeId) following[followerId].insert(followeeId);
    }

    void unfollow(int followerId, int followeeId) {
        following[followerId].erase(followeeId);
    }
};
```

</details>

Now a feed touches only the $$k$$ list heads (one per followed user) plus 10 pops, each $$O(\log k)$$ — so $$O((k + 10)\log k)$$, with $$k$$ the number of people you follow, **independent of the total tweet count**. `postTweet` stays $$O(1)$$. The same submission drops from ~2351 ms to about **4 ms**.

Two details make it correct: the default `priority_queue` is a **max-heap**, so keying on `time` puts the most recent tweet on top; and pushing the _previous_ index `i-1` after each pop is exactly the "advance the winning list" step of a k-way merge — it keeps each user's timeline feeding into the merge newest-to-oldest.

### The pattern, and where it lives

The move is worth filing away: when you must repeatedly take the few most-recent (or smallest) items across many already-sorted sequences, do not flatten and rescan — **merge the sequence heads with a heap**. It is the [k-way merge](#priority-queues) pattern, and it is everywhere. A database's external merge sort merges $$k$$ sorted runs the same way; a real timeline service merges recent posts from the accounts you follow at read time (**fan-out on read**), the exact structure here. The problem "as stated" is easy; treating the feed as a k-way merge is what makes it scale.

### Practice

- [LeetCode 355 — Design Twitter](https://leetcode.com/problems/design-twitter/)
- [LeetCode 23 — Merge k Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/)
- [LeetCode 373 — Find K Pairs with Smallest Sums](https://leetcode.com/problems/find-k-pairs-with-smallest-sums/)
- [LeetCode 632 — Smallest Range Covering Elements from K Lists](https://leetcode.com/problems/smallest-range-covering-elements-from-k-lists/)
