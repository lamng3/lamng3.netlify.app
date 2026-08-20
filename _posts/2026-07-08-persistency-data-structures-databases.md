---
layout: post
title: "Persistency: Keeping Old Versions Around"
description: A simple look at persistent data structures — the snapshot array, the persistent segment tree, persistent queues, and how the same idea shows up in databases as MVCC and copy-on-write B-trees.
date: 2026-07-08
last_updated: 2026-08-20
author: Nathan Nguyen
categories: [Data Structures, Algorithms]
tags: [Persistency, Persistent Data Structures, Segment Tree, Snapshot Array, Databases, MVCC, Competitive Programming]
toc:
  sidebar: right
---

A **persistent** data structure keeps its old versions: every update produces a new version, and every earlier version stays queryable. An ordinary structure overwrites in place, so its past states are lost.

The mechanism is copy-on-write — each update creates new nodes instead of mutating existing ones, so earlier versions stay intact, the same principle as a `git` commit.

## The trick: don't copy everything

The naive way to keep old versions is to copy the whole structure on every update. That's $$O(n)$$ per update — far too slow.

The real trick is **path copying**: when you change one element, you only copy the nodes on the path from the root to that element, and _reuse_ everything else. In a balanced tree of height $$O(\log n)$$, that's only $$O(\log n)$$ new nodes per update. Each version is just a different root pointing into a mostly-shared tree.

That single idea — _share what didn't change, copy only what did_ — is the core of every persistent structure below.

## Snapshot Array

[LeetCode 1146 — Snapshot Array](https://leetcode.com/problems/snapshot-array/) is the simplest example of persistence. You have an array with three operations: `set(i, val)`, `snap()` (freeze the current state and return an id), and `get(i, snap_id)` (read an old snapshot).

You don't need a fancy tree here. Just keep, for each index, a list of `(snap_id, value)` events. `set` appends to the list; `get` binary-searches for the right snapshot. Old snapshots stay valid because you never erase past events.

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

class SnapshotArray {
private:
    int time;
    vector<vector<pii>> snapshot;

public:
    SnapshotArray(int n) {
        time = 0;
        snapshot.resize(n);
        REP(i, n) set(i, 0);
    }

    void set(int i, int val) {
        if (!snapshot[i].empty() && snapshot[i].back().fi == time) {
            snapshot[i].back().se = val;
        }
        else snapshot[i].pb({time, val});
    }

    int snap() {
        return time++;
    }

    int get(int i, int snap_id) {
        auto& history = snapshot[i];
        int left = 0, right = history.size();
        while (left < right) {
            int mid = left + (right - left) / 2;
            if (history[mid].fi == snap_id) return history[mid].se;
            if (history[mid].fi < snap_id) left = mid+1;
            else right = mid;
        }
        return history[left-1].se;
    }
};

/**
 * Your SnapshotArray object will be instantiated and called as such:
 * SnapshotArray* obj = new SnapshotArray(length);
 * obj->set(index,val);
 * int param_2 = obj->snap();
 * int param_3 = obj->get(index,snap_id);
 */
```

</details>

Memory is $$O(\text{number of sets})$$ and each `get` is $$O(\log m)$$. No cloning, no trees — just a per-index history.

## Persistent Segment Tree

**Why do we need this?** A plain segment tree is great at _range queries_ — the sum, minimum, or count over some range $$[l, r]$$ — in $$O(\log n)$$. But it only ever knows the _current_ array. The moment you update it, the old array is gone.

Sometimes the question isn't "what is the range sum _now_," but "what was the range sum _back at version 5_?" Think of an array that changes over time where you still need to answer range queries against any past state: an audit query on yesterday's data, a "k-th smallest in a range" query built from historical prefixes, or simply a problem that lets you branch off old copies. A plain segment tree can't do this; a **persistent segment tree** can, because it keeps every version cheaply and lets you run the same $$O(\log n)$$ range query against any root you like.

It's a normal segment tree, but each update path-copies $$O(\log n)$$ nodes and returns a new root. Keep a list of roots and every past version stays queryable.

The classic problem is [CSES — Range Queries and Copies](https://cses.fi/problemset/task/1737): update a position, sum over a range, and _copy_ an array. A copy is basically free — it's just a new root pointing at the same tree.

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

const int MAX_N = 2e5+5;

struct PersistentST {
    struct Node {
        ll sum = 0;
        int left = 0, right = 0;
    };

    int N;
    vi A;
    vector<Node> tree;

    PersistentST(int n, vi& a) : N(n), A(a) {
        tree.reserve(MAX_N);
        tree.pb(Node());
    }

    int join(int l, int r) {
        tree.pb({tree[l].sum + tree[r].sum, l, r});
        return tree.size()-1;
    }

    int build(int v, int tl, int tr) {
        if (tl == tr) {
            tree.pb({A[tl], 0, 0});
            return tree.size()-1;
        }
        int tm = tl + (tr - tl) / 2;
        return join(build(tree[v].left, tl, tm), build(tree[v].right, tm+1, tr));
    }

    int update(int v, int tl, int tr, int pos, int val) {
        if (tl == tr) {
            tree.pb({val, 0, 0});
            return tree.size()-1;
        }
        int tm = tl + (tr - tl) / 2;
        int lc = (v == 0) ? 0 : tree[v].left;
        int rc = (v == 0) ? 0 : tree[v].right;
        if (pos <= tm) return join(update(lc, tl, tm, pos, val), rc);
        else return join(lc, update(rc, tm+1, tr, pos, val));
    }

    int copy(int v) {
        tree.pb(tree[v]);
        return tree.size()-1;
    }

    ll query(int v, int tl, int tr, int ql, int qr) {
        if (v == 0 || ql > qr) return 0;
        if (ql == tl && tr == qr) return tree[v].sum;
        int tm = tl + (tr - tl) / 2;
        ll left = query(tree[v].left, tl, tm, ql, min(tm, qr));
        ll right = query(tree[v].right, tm+1, tr, max(tm+1, ql), qr);
        return left + right;
    }
};

void solve() {
    int n, q; cin >> n >> q;
    vi a(n);
    REP(i, n) cin >> a[i];

    PersistentST segtree(n, a);
    vi roots = {segtree.build(0, 0, n-1)};

    REP(i, q) {
        int type, k; cin >> type >> k;
        k--;

        if (type == 1) {
            int pos, val; cin >> pos >> val;
            pos--;
            roots[k] = segtree.update(roots[k], 0, n-1, pos, val);
        } else if (type == 2) {
            int l, r; cin >> l >> r;
            l--, r--;
            cout << segtree.query(roots[k], 0, n-1, l, r) << '\n';
        } else if (type == 3) {
            roots.pb(segtree.copy(roots[k]));
        }
    }
}

int main() {
    // freopen("name.in", "r", stdin);
    // freopen("name.out", "w", stdout);
    ios::sync_with_stdio(0);
    cin.tie(0);
    int tt = 1;
    // cin >> tt;
    while (tt--) solve();
    return 0;
}
```

</details>

The key detail: nodes are never mutated — `update` and `join` only ever push new nodes, so old roots keep working forever. That gives $$O(\log n)$$ per update and query, and $$O((n + q)\log n)$$ total memory.

For a proper walkthrough with pictures, the [USACO Guide's persistence section](https://usaco.guide/adv/persistent?lang=cpp#persistent-segment-tree) is the best CP resource, and [SecondThread's video](https://www.youtube.com/watch?v=m3uEG4NgJx8) is a great visual intro.

> Heads up: persistent segment trees almost never show up on LeetCode. They're a competitive-programming (Codeforces / CSES) thing. On LeetCode, Snapshot Array is about as far as persistence goes.

## Persistent Queue

Persistence isn't just about trees. SecondThread's video also walks through the **persistent queue** — a queue where every `push` and `pop` returns a _new_ queue, leaving the old one intact and still usable.

The trick is a classic: represent the queue as two stacks, a `front` and a `back`. You push onto `back`; you pop from `front`, and when `front` runs empty you reverse `back` into it. Stacks are the easiest structure to make persistent — a stack is just an immutable singly linked list, so `push`/`pop` are $$O(1)$$ and every intermediate list is automatically a version. Build the queue out of two persistent stacks and you get a queue whose whole history stays alive, which is exactly what you need when different versions branch off and each has to keep enqueueing and dequeuing independently.

(Getting _worst-case_ $$O(1)$$ per operation under heavy persistent branching needs Okasaki's real-time queues with lazy evaluation, but the two-stack idea is the intuition.)

## The same idea in databases: MVCC and copy-on-write B-trees

Persistence isn't only a competitive-programming technique; databases rely on it constantly.

When many transactions read and write at once, a database can't just overwrite a row: a reader might be halfway through a query that expects the old value. So instead of overwriting, the database _keeps the old version_ and writes a new one. Each version is tagged with the transaction that created it, and every reader sees the version that was current when its transaction began.

This is **MVCC — Multi-Version Concurrency Control**, used by Postgres, MySQL's InnoDB, and Oracle. If you've read _Database Internals_, this is the "readers don't block writers, writers don't block readers" story: everyone gets a consistent **snapshot** without waiting on locks, because old versions are still lying around to read from.

But MVCC raises a question: how do you organize all those versions on disk so a snapshot stays consistent? One elegant answer is the **copy-on-write (CoW) B-tree**, used by storage engines like LMDB and WiredTiger. When you modify a page, you don't overwrite it — you copy that page, apply the change, and then copy every page along the path up to the root, producing a _new root_. The old root still points at a fully intact old tree; the new root is the new version.

If that sounds familiar, it should: **a copy-on-write B-tree is a persistent segment tree scaled up to disk pages.** Same path copying, same structural sharing, same "each version is just a different root." The payoff is atomic, crash-consistent snapshots — a reader following the old root sees a coherent old database even while a writer is busy building the new one, and the switch to the new version is a single pointer swap.

So the recurring lesson holds at every scale:

- **Snapshot Array** keeps old `(snap_id, value)` entries per index.
- **Persistent segment tree** path-copies to give each version its own root.
- **MVCC** keeps old versions per row, and **CoW B-trees** path-copy pages to give each snapshot its own root.

_Never overwrite; keep the old version and point new readers at the new one._

## Practice

- [LeetCode 1146 — Snapshot Array](https://leetcode.com/problems/snapshot-array/) (persistence, easy)
- [CSES — Range Queries and Copies](https://cses.fi/problemset/task/1737) (persistent segment tree)
