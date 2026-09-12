---
layout: post
title: "XOR Hashing: Fingerprinting Sets and Trees"
description: Give each distinct value a random key and XOR the keys of a collection's members — you get an order-independent fingerprint of a set, recoverable by prefix XOR. The same idea, combining children into a parent, hashes whole trees and detects duplicate subtrees.
date: 2026-08-31
author: Nathan Nguyen
categories: [Hashing]
tags: [Hashing, Zobrist Hashing, XOR Hashing, Merkle Hashing, Trees, Prefix Sums, Anti-Hash, LeetCode, Codeforces, Competitive Programming]
toc:
  sidebar: right
---

A [rolling hash]({% post_url 2026-08-30-rolling-hash %}) fingerprints an _ordered_ sequence — `"abc"` and `"cab"` come out different, by design. But plenty of problems ask the opposite: is this the same **unordered** collection, in any order? Are these two multisets equal? Do two tree nodes have identical subtrees regardless of how you drew them? Order-sensitivity is now a bug, not a feature.

**XOR hashing** (a.k.a. **Zobrist hashing**) is the tool for that. It is a small, sharp idea with one recipe: give each distinct value its own random key, then summarize a collection by combining the keys of its members.

## The core: random keys, combined

Give every distinct value $$v$$ a random 64-bit key $$r[v]$$, and fingerprint a _set_ $$S$$ by XOR-ing the keys of its members:

$$
\text{fingerprint}(S) = \bigoplus_{v \in S} r[v].
$$

Two properties make this powerful:

- **Order-independent.** XOR is commutative, so a set and any reordering of it share a fingerprint — exactly what a rolling hash refuses to do.
- **Self-inverse, hence prefix-XOR recoverable.** Since $$r[v] \oplus r[v] = 0$$, toggling an element is its own undo: `add` and `remove` are the same $$O(1)$$ operation. Define the prefix $$P_i = r[a_0] \oplus \dots \oplus r[a_{i-1}]$$; then the fingerprint of any range is

$$
\bigoplus_{j=l}^{r-1} r[a_j] = P_r \oplus P_l,
$$

because the shared prefix cancels itself. Prefix XOR is the XOR analogue of a prefix sum.

Two random keys collide only with probability $$\approx 2^{-64}$$, so two collections share a fingerprint essentially iff they are truly equal.

## Set vs. multiset: XOR vs. sum

The one thing to watch: **plain XOR fingerprints a _set_, not a multiset.** Because $$r[v] \oplus r[v] = 0$$, a value appearing twice vanishes — XOR sees only each value's _parity_ of occurrences. That is perfect for "does every value occur an even number of times here?" (test the fingerprint against $$0$$), but wrong for anagram-style questions where counts matter.

So the recipe has one knob — the combining operator:

- **XOR** summarizes a **set**: repeats cancel.
- **sum** summarizes a **multiset**: each occurrence adds its key, so counts survive (natural `u64` overflow is the modulus).

Keep the randomness in one place — seed one generator, hand out one key per distinct value from a shared table — so that every fingerprint is built from the same keys and is therefore comparable.

<details markdown="1">
<summary>C++ XorHash / SumHash templates</summary>

```cpp
mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());

// one random key per distinct value, shared by every hash object
map<ll, u64> key_table;
u64 keyOf(ll v) {
    auto it = key_table.find(v);
    if (it != key_table.end()) return it->second;
    return key_table[v] = rng();
}

// set fingerprint (multiplicity-blind): use when elements are distinct
class XorHash {
    vector<u64> pref; // pref[0] = 0, pref[i+1] = pref[i] ^ keyOf(a[i])
public:
    XorHash() { pref.pb(0); }
    void push_back(ll v) { pref.pb(pref.back() ^ keyOf(v)); }
    void init(const vector<ll>& a) { for (ll v : a) push_back(v); }
    u64 get_hash() { return pref.back(); }                       // whole prefix
    u64 get_hash(int L, int R) { return pref[R+1] ^ pref[L]; }   // a[L..R], inclusive
};

// multiset fingerprint (counts respected): the additive twin, ^ becomes + / -
class SumHash {
    vector<u64> pref; // pref[0] = 0, pref[i+1] = pref[i] + keyOf(a[i])
public:
    SumHash() { pref.pb(0); }
    void push_back(ll v) { pref.pb(pref.back() + keyOf(v)); }
    void init(const vector<ll>& a) { for (ll v : a) push_back(v); }
    u64 get_hash() { return pref.back(); }
    u64 get_hash(int L, int R) { return pref[R+1] - pref[L]; }
};
```

</details>

Reach for `XorHash` when the elements are distinct or you only care about presence; reach for `SumHash` when repeats must be counted. For bounded values, swap the `map` for a precomputed `u64 key[MAXV]` filled once from `rng()` — a flat array is faster, and the `map` earns its keep only when values are large or sparse.

## Example: is a subarray a permutation?

A common query ([Codeforces note](https://codeforces.com/blog/entry/85900)): given an array $$A$$ and many pairs $$(l, r)$$, decide whether $$A_l, \dots, A_r$$ is a permutation of $$1, 2, \dots, \text{len}$$, where $$\text{len} = r - l + 1$$. Order is irrelevant — you are asking whether the subarray's values are exactly the set $$\{1, \dots, \text{len}\}$$, each once. That is a set-equality question, so XOR hashing answers it in $$O(1)$$ per query after $$O(n)$$ preprocessing.

Give each value $$v$$ a random key $$r[v]$$, take prefix XORs $$P_i = r[A_1] \oplus \dots \oplus r[A_i]$$, and precompute the reference fingerprints $$T_k = r[1] \oplus \dots \oplus r[k]$$ of the target sets $$\{1, \dots, k\}$$. Then

$$
A_l \dots A_r \text{ is a permutation of } 1 \dots \text{len} \iff P_r \oplus P_{l-1} = T_{\text{len}},
$$

the subarray's set-fingerprint on the left, the target set's on the right.

```cpp
mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());

// values are in [1, n]; A is 1-indexed
vector<u64> key(n+1), P(n+1, 0), T(n+1, 0);
FOR(v, 1, n) key[v] = rng();
FOR(v, 1, n) T[v] = T[v-1] ^ key[v];      // fingerprint of {1..v}
FOR(i, 1, n) P[i] = P[i-1] ^ key[A[i]];   // prefix xor over A

auto is_permutation = [&](int l, int r) {
    int len = r - l + 1;
    return (P[r] ^ P[l-1]) == T[len];
};
```

**Why it works, and its limit.** A genuine permutation holds each of $$1, \dots, \text{len}$$ exactly once, so its XOR is exactly $$T_{\text{len}}$$ — no permutation is ever rejected. A non-permutation passes only if its odd-occurrence values XOR to $$T_{\text{len}}$$, i.e. some nonempty set of random keys cancels, with probability $$\approx 2^{-64}$$ per query. The one blind spot is again multiplicity: XOR cannot on its own catch a repeat like $$\{1, 2, 2, 3\}$$. Comparing to $$T_{\text{len}}$$ (which pins the length) rules out most of these; to close the gap cheaply, also check that the range maximum equals $$\text{len}$$ — a permutation of $$1 \dots \text{len}$$ must contain $$\text{len}$$ — which a sparse table answers in $$O(1)$$.

## Example: permutation in a string (counts matter)

[LeetCode 567](https://leetcode.com/problems/permutation-in-string/) asks whether some window of `s2` is a permutation of `s1`: a fixed-length window whose _multiset_ of letters matches `s1`. XOR is the wrong tool here — `"aa"` and `"bb"` both XOR to $$0$$ and would compare equal — so switch to `SumHash`, whose additive fingerprint respects counts.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
// rng, keyOf, and SumHash as defined above
class Solution {
public:
    bool checkInclusion(string s1, string s2) {
        if (sz(s2) < sz(s1)) return false;
        SumHash a; for (char c : s1) a.push_back(c);   // fingerprint of the pattern
        SumHash b; for (char c : s2) b.push_back(c);   // prefix sums over the text
        u64 target = a.get_hash();
        REP(i, sz(s2) - sz(s1) + 1) {
            int L = i, R = L + sz(s1) - 1;
            if (b.get_hash(L, R) == target) return true;
        }
        return false;
    }
};
```

</details>

Now `"aa"` sums to $$2\,r[\texttt{a}]$$ and `"bb"` to $$2\,r[\texttt{b}]$$, so they differ. [LeetCode 438](https://leetcode.com/problems/find-all-anagrams-in-a-string/) is the same solution that collects every matching start instead of returning on the first.

## From sets to trees: Merkle-style hashing

The real reach of XOR hashing is **combining children into a parent**. A subtree is defined by its root plus the (unordered or ordered) collection of its children's subtrees — and if each child already has a hash, the parent's hash is just those child hashes combined with the node's own value. Do this bottom-up and every subtree gets a fingerprint; equal subtrees get equal fingerprints. This is exactly a **Merkle hash**, and XOR is a natural combiner when the children form a _set_.

### Find duplicate subtrees

[LeetCode 652 — Find Duplicate Subtrees](https://leetcode.com/problems/find-duplicate-subtrees/) wants every subtree that occurs more than once. Hash each subtree by folding in three things: a tagged value `{'V', node->val}`, and — if present — the left and right child hashes, tagged `{'L', ...}` and `{'R', ...}`. The tags are what preserve structure: a left child and a right child with the same subtree hash are _different_ inputs, so a left-heavy tree and its mirror do not collide. Count each hash; the second time one appears, its root is a duplicate.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
template<typename T>
class XorHash {
private:
    inline static map<T, u64> tags;
    vector<u64> hash;
    set<T> seen;
public:
    XorHash() { hash.pb(0); }
    u64 tag(const T& v) {
        if (!tags.count(v)) tags[v] = rng();
        return tags[v];
    }
    void add(const T& v) {
        if (seen.count(v)) {          // a duplicate child would cancel under XOR
            hash.pb(hash.back());     // so ignore repeats: this fingerprints the set
            return;
        }
        seen.insert(v);
        hash.pb(hash.back() ^ tag(v));
    }
    u64 get_hash() { return hash.back(); }
};

struct Info {
    char dir;
    u64 hash;
    bool operator<(const Info& o) const {
        return tie(dir, hash) < tie(o.dir, o.hash);
    }
};

class Solution {
private:
    map<TreeNode*, u64> H;
    map<u64, int> f;
    vector<TreeNode*> ans;
public:
    u64 dfs(TreeNode* node) {
        if (!node) return 0;
        XorHash<Info> xh;
        xh.add({'V', (u64)node->val});
        if (node->left)  xh.add({'L', dfs(node->left)});
        if (node->right) xh.add({'R', dfs(node->right)});
        u64 h = xh.get_hash();
        if (++f[h] == 2) ans.pb(node);
        return H[node] = h;
    }
    vector<TreeNode*> findDuplicateSubtrees(TreeNode* root) {
        dfs(root);
        return ans;
    }
};
```

</details>

### Delete duplicate folders

[LeetCode 1948 — Delete Duplicate Folders in System](https://leetcode.com/problems/delete-duplicate-folders-in-system/) is the same idea on a filesystem tree, where "identical" means the same _set_ of named subfolders with the same structure — genuinely unordered, so XOR is the natural combiner. Build the tree from the paths, hash each folder by XOR-ing over its children's `{name, childHash}` pairs, count how many times each subtree-hash occurs, then keep only folders whose hash is unique (or empty).

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
class Solution {
private:
    map<string, set<string>> G;
    map<string, u64> H;
    map<u64, int> f;
public:
    u64 dfs(const string& p) {
        XorHash<pair<string, u64>> xh;
        for (auto& c : G[p]) {
            u64 chash = dfs(p + "/" + c);
            xh.add({c, chash});
        }
        u64 hash = xh.get_hash();
        if (!G[p].empty() && !p.empty()) f[hash]++;
        return H[p] = hash;
    }
    void collect(const string& p, vector<string>& cur, vector<vector<string>>& ans) {
        for (auto& c : G[p]) {
            string cp = p + "/" + c;
            if (!G[cp].empty() && f[H[cp]] >= 2) continue;  // whole duplicate subtree is deleted
            cur.pb(c);
            ans.pb(cur);
            collect(cp, cur, ans);
            cur.pop_back();
        }
    }
    vector<vector<string>> deleteDuplicateFolder(vector<vector<string>>& paths) {
        G.clear();
        for (auto& path : paths) {
            string p = "";
            for (auto& c : path) {
                G[p].insert(c);
                p += "/" + c;
            }
        }
        H.clear(); f.clear();
        dfs("");
        vector<vector<string>> ans;
        vector<string> cur;
        collect("", cur, ans);
        return ans;
    }
};
```

</details>

## The one habit worth keeping

Both faces of XOR hashing are the same move: **assign randomness to atoms, then combine.** Down a flat array the atoms are values and the combiner is XOR along a prefix — a set fingerprint you can slice in $$O(1)$$. Up a tree the atoms are a node's value and its children's hashes, and the same combiner folds a whole subtree into one number, so structural equality becomes integer equality. Swap XOR for `+` and the same machinery counts multiplicities instead of collapsing them. Pick the combiner to match what "equal" means — a set, a multiset, or a tree — and the fingerprint falls out.

## Docs worth reading

- [USACO Guide — Hashing](https://usaco.guide/gold/hashing?lang=cpp), including the XOR / Zobrist section.
- [CP-Algorithms — String hashing](https://cp-algorithms.com/string/string-hashing.html) for the polynomial cousin.

## Practice

- [LeetCode 652 — Find Duplicate Subtrees](https://leetcode.com/problems/find-duplicate-subtrees/)
- [LeetCode 1948 — Delete Duplicate Folders in System](https://leetcode.com/problems/delete-duplicate-folders-in-system/)
- [LeetCode 567 — Permutation in String](https://leetcode.com/problems/permutation-in-string/)
- [LeetCode 438 — Find All Anagrams in a String](https://leetcode.com/problems/find-all-anagrams-in-a-string/)
- [Codeforces 1418G — Three Occurrences](https://codeforces.com/problemset/problem/1418/G)
