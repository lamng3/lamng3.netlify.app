---
layout: post
title: "Persistency: Keeping Old Versions Around"
description: A simple look at persistent data structures — the snapshot array, the persistent segment tree, and how the same idea shows up in databases as MVCC.
date: 2026-07-08
author: Nathan Nguyen
categories: [Data Structures, Algorithms]
tags: [Persistency, Persistent Data Structures, Segment Tree, Snapshot Array, Databases, MVCC, Competitive Programming]
---

Most data structures live only in the present. When you update an array or a tree, the old state is gone. A **persistent** data structure keeps the old versions around: every update makes a new version, and you can still query any of the old ones.

Think of it like `git` for a data structure — each change is a commit, and nothing is ever overwritten.

## The trick: don't copy everything

The naive way to keep old versions is to copy the whole structure on every update. That's $$O(n)$$ per update — far too slow.

The real trick is **path copying**: when you change one element, you only copy the nodes on the path from the root to that element, and _reuse_ everything else. In a balanced tree of height $$O(\log n)$$, that's only $$O(\log n)$$ new nodes per update. Each version is just a different root pointing into a mostly-shared tree.

That single idea — _share what didn't change, copy only what did_ — is the whole story.

## Snapshot Array (the easy one)

[LeetCode 1146 — Snapshot Array](https://leetcode.com/problems/snapshot-array/) is the friendliest place to meet persistence. You have an array with three operations: `set(i, val)`, `snap()` (freeze the current state and return an id), and `get(i, snap_id)` (read an old snapshot).

You don't need a fancy tree here. Just keep, for each index, a list of `(snap_id, value)` events. `set` appends to the list; `get` binary-searches for the right snapshot. Old snapshots stay valid because you never erase past events.

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

Memory is $$O(\text{number of sets})$$ and each `get` is $$O(\log m)$$. No cloning, no trees — just a per-index history.

## Persistent Segment Tree (the CP one)

When you need _range_ queries across old versions, you reach for the **persistent segment tree**. It's a normal segment tree, but each update path-copies $$O(\log n)$$ nodes and returns a new root. Keep a list of roots and you can query any version.

The classic problem is [CSES — Range Queries and Copies](https://cses.fi/problemset/task/1737), which supports: update a position, sum over a range, and _copy_ an array. A copy is basically free — it's just a new root pointing at the same tree.

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

The key detail: nodes are never mutated — `update` and `join` only ever push new nodes, so old roots keep working forever. That gives $$O(\log n)$$ per update and query, and $$O((n + q)\log n)$$ total memory.

For a proper walkthrough with pictures, the [USACO Guide's persistence section](https://usaco.guide/adv/persistent?lang=cpp#persistent-segment-tree) is the best CP resource, and [this video](https://www.youtube.com/watch?v=m3uEG4NgJx8) is a nice visual intro.

> Heads up: persistent segment trees almost never show up on LeetCode. They're a competitive-programming (Codeforces / CSES) thing. On LeetCode, Snapshot Array is about as far as persistence goes.

## The same idea in databases: MVCC

Here's the fun part — persistence isn't just a contest trick. Your database does it every day.

When many transactions read and write at once, a database can't just overwrite a row: a reader might be halfway through a query that expects the old value. So instead of overwriting, the database _keeps the old version_ and writes a new one. Each version is tagged with the transaction that created it, and every reader sees the version that was current when its transaction began.

This is **MVCC — Multi-Version Concurrency Control**, and it's exactly what Postgres, MySQL's InnoDB, and Oracle use. If you've read _Database Internals_, this is the "readers don't block writers, writers don't block readers" story: everyone gets a consistent **snapshot** of the data without waiting on locks, because old versions are still lying around to read from.

Notice the parallel:

- **Snapshot Array** keeps old `(snap_id, value)` entries per index → MVCC keeps old versions per row.
- **Persistent segment tree** path-copies to give each version its own root → copy-on-write storage engines (LMDB, WiredTiger) copy a page and its path to the root, so each snapshot has its own consistent view.

Same trick at every scale: _never overwrite; keep the old version and point new readers at the new one._

## Practice

- [LeetCode 1146 — Snapshot Array](https://leetcode.com/problems/snapshot-array/) (persistence, easy)
- [CSES — Range Queries and Copies](https://cses.fi/problemset/task/1737) (persistent segment tree)

_(I'll add more problems here over time.)_
