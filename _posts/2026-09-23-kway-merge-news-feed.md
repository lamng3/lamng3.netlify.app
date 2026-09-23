---
layout: post
title: "K-Way Merge: Designing a News Feed"
description: Design Twitter (LeetCode 355) passes with a backward scan of one global tweet log, but that rescans all of history on every feed request. Each user's own tweets are already sorted by time, so the feed is a k-way merge of a few short lists — the same heap trick as Merge k Sorted Lists.
date: 2026-09-23
author: Nathan Nguyen
categories: [Data Structures]
tags: [K-Way Merge, Heap, Priority Queue, Merge, System Design, LeetCode, Competitive Programming]
toc:
  sidebar: right
---

[LeetCode 355 — Design Twitter](https://leetcode.com/problems/design-twitter/) asks for a tiny social network: post a tweet, follow/unfollow, and fetch a **news feed** of the 10 most recent tweets from you and everyone you follow. The obvious solution passes — but it does an amount of work per feed that grows with the entire history, and there is a much better structure hiding in the problem.

## The easy version, and why it drags

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

## The reframe: a merge of sorted timelines

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

## The pattern, and where it lives

The move is worth filing away: when you must repeatedly take the few most-recent (or smallest) items across many already-sorted sequences, do not flatten and rescan — **merge the sequence heads with a heap**. It is the [k-way merge]({% post_url 2026-09-19-priority-queues-comparators-lazy-deletion %}) pattern, and it is everywhere. A database's external merge sort merges $$k$$ sorted runs the same way; a real timeline service merges recent posts from the accounts you follow at read time (**fan-out on read**), the exact structure here. The problem "as stated" is easy; treating the feed as a k-way merge is what makes it scale.

## Practice

- [LeetCode 355 — Design Twitter](https://leetcode.com/problems/design-twitter/)
- [LeetCode 23 — Merge k Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/)
- [LeetCode 373 — Find K Pairs with Smallest Sums](https://leetcode.com/problems/find-k-pairs-with-smallest-sums/)
- [LeetCode 632 — Smallest Range Covering Elements from K Lists](https://leetcode.com/problems/smallest-range-covering-elements-from-k-lists/)
