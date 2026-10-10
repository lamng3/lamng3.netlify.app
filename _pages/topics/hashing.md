---
layout: post
title: "Hashing"
description: "Fingerprints that let you compare things in O(1). A rolling hash fingerprints ordered sequences, and XOR hashing fingerprints sets, multisets, and trees."
permalink: /blog/hashing/
last_updated: 2026-09-12
author: Lam Nguyen
toc:
  sidebar: right
---

Fingerprints that let you compare things in O(1). A rolling hash fingerprints ordered sequences, and XOR hashing fingerprints sets, multisets, and trees.

## Rolling Hash {#rolling-hash}

Comparing two substrings character by character is $$O(\text{length})$$, and problems that ask it thousands of times drown in that cost. A **rolling hash** compresses a string into a single integer so that comparing substrings becomes comparing two numbers — $$O(1)$$ each, after linear preprocessing. It is the tool for "are these two stretches of text equal?" asked at scale.

The one thing it is built around is **order**: `"abc"` and `"cab"` must hash differently. (When order should _not_ matter — comparing unordered sets — you want [XOR hashing](#xor-hashing) instead, which is a separate tool.)

### The polynomial hash

Read a string as the digits of a base-$$B$$ number, modulo a large prime $$M$$:

$$
H(s) = \bigl(s_0 B^{L-1} + s_1 B^{L-2} + \dots + s_{L-1}\bigr) \bmod M.
$$

Build prefix hashes with $$h_0 = 0$$ and $$h_{i+1} = (h_i B + s_i) \bmod M$$, so $$h_i$$ is the hash of the prefix $$s_0 \dots s_{i-1}$$. With the powers $$B^k \bmod M$$ precomputed, **any substring's hash is $$O(1)$$**:

$$
H(s_L \dots s_R) = \bigl(h_{R+1} - h_L \cdot B^{\,R-L+1}\bigr) \bmod M.
$$

The subtraction peels the prefix $$s_0 \dots s_{L-1}$$ off after shifting it up by the length of the substring — exactly the "shift left and cancel" you would do with ordinary base-10 numbers.

**Parameter choices, and why they matter.**

- $$M = 2^{61} - 1$$, a Mersenne prime. Products of two residues reach nearly $$2^{122}$$, so multiply in a 128-bit type (`__int128`) before reducing.
- $$B$$ a base larger than the alphabet. A _fixed_ base like $$313$$ is fine offline, but on Codeforces it is hackable — an adversary can craft two strings that collide under a known base. Draw $$B$$ at random per run.
- One 61-bit hash collides on a given pair with probability $$\approx 2^{-61}$$, but across $$q$$ comparisons the birthday bound makes it $$\approx q^2 / 2^{62}$$. When that is uncomfortable, use **double hashing** — two independent $$(B, M)$$ pairs — and treat strings as equal only if both agree.

<details markdown="1">
<summary>C++ rolling-hash class</summary>

```cpp
class RollingHash {
private:
    u128 base = 313;
    u128 mod = ((1ULL << 61) - 1ULL);
    vector<u128> hash;
    vector<u128> pow;
public:
    RollingHash() {}
    void init(const string& s) {
        hash.pb(0);
        pow.pb(1);
        for (auto& c : s) push_back(c);
    }
    void push_back(char c) {
        hash.pb((hash.back() * base + c) % mod);
        pow.pb((pow.back() * base) % mod);
    }
    u128 get_hash() { return hash.back(); }
    u128 get_hash(int L, int R) {
        u128 term = hash[L] * pow[R-L+1] % mod;
        return (hash[R+1] + mod - term) % mod; // + mod avoids negatives
    }
};
```

</details>

### Example: concatenation of all words

[LeetCode 30 — Substring with Concatenation of All Words](https://leetcode.com/problems/substring-with-concatenation-of-all-words/) gives a string `s` and `n` words, all of the same length `m`. Find every start index of a window of length $$k = nm$$ that is a concatenation of all the words in **some order**.

Hash each word and store the target frequency of each word-hash. Build one rolling hash over `s`. For each start, walk the window in `m`-length chunks, take each chunk's hash in $$O(1)$$, tally it, and reject as soon as a chunk hash is unknown or over its target count.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
#include <bits/stdc++.h>
using namespace std;

using ll = long long;
using u128 = unsigned __int128;

using vi = vector<int>;

#define REP(i, n) for (int i = 0; i < (n); i++)
#define sz(x) (int)((x).size())
#define pb push_back

class RollingHash {
private:
    u128 base = 313;
    u128 mod = ((1ULL << 61) - 1ULL);
    vector<u128> hash;
    vector<u128> pow;
public:
    RollingHash() {}
    void init(const string& s) {
        hash.pb(0);
        pow.pb(1);
        for (auto& c : s) push_back(c);
    }
    void push_back(char c) {
        hash.pb((hash.back() * base + c) % mod);
        pow.pb((pow.back() * base) % mod);
    }
    u128 get_hash() { return hash.back(); }
    u128 get_hash(int L, int R) {
        u128 term = hash[L] * pow[R-L+1] % mod;
        return (hash[R+1] + mod - term) % mod;
    }
};

class Solution {
public:
    vi findSubstring(string s, vector<string>& words) {
        int n = sz(words), m = sz(words[0]), k = n*m;
        if (sz(s) < k) return {};

        RollingHash rhs;
        rhs.init(s);

        map<u128,int> f;
        vector<RollingHash> rhw(n);
        REP(i, n) {
            rhw[i].init(words[i]);
            f[rhw[i].get_hash()]++;
        }

        auto check = [&](int start, int end) {
            map<u128,int> curf;
            for (int L = start; L <= end-m+1; L+=m) {
                int R = L+m-1;
                u128 hash = rhs.get_hash(L, R);
                curf[hash]++;
                if (!f.count(hash) || curf[hash] > f[hash]) return false;
            }
            return true;
        };

        vi ans;
        REP(start, sz(s)-k+1) {
            int end = start+k-1;
            if (check(start, end)) ans.pb(start);
        }
        return ans;
    }
};
```

</details>

Each `check` scans $$n$$ chunks, so this is about $$O(\vert s \vert \cdot n)$$. It passes the constraints; the standard speedup is to group starts by `start % m` into `m` independent sliding windows and slide by one chunk each step, reusing the count map, which brings it to $$O(\vert s \vert)$$.

### Example: shortest palindrome

[LeetCode 214 — Shortest Palindrome](https://leetcode.com/problems/shortest-palindrome/) asks for the shortest palindrome you can make by adding characters **in front** of `s`. Since only a prefix is prepended, write `s = head + tail` where `head` is the longest prefix of `s` that is already a palindrome; the answer is then `reverse(tail) + s`. The whole task reduces to **finding the longest palindromic prefix.**

A rolling hash finds it in one pass by carrying two hashes of the growing prefix — one read forward, one read backward — and noting when they agree. As we append $$s_i$$ (base $$b$$, modulus $$M$$):

$$
\text{fwd} \leftarrow \text{fwd}\cdot b + s_i, \qquad \text{rev} \leftarrow \text{rev} + s_i \cdot b^{\,i}.
$$

Here `fwd` is the hash of $$s_0 \dots s_i$$ with $$s_0$$ most significant, and `rev` is the hash of the _reversed_ prefix $$s_i \dots s_0$$ with $$s_i$$ most significant. The prefix equals its reverse — i.e. it is a palindrome — exactly when $$\text{fwd} = \text{rev}$$. Keep the largest index $$i$$ where that holds.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
class Solution {
public:
    string shortestPalindrome(string s) {
        int n = sz(s);
        const u128 b = 313, M = ((1ULL << 61) - 1ULL);
        u128 fwd = 0, rev = 0, p = 1;   // p = b^i
        int best = -1;                  // longest palindromic prefix ends here
        REP(i, n) {
            u128 c = (unsigned char)s[i];
            fwd = (fwd * b + c) % M;     // s[0..i], s[0] most significant
            rev = (rev + c * p) % M;     // reversed prefix, s[i] most significant
            p   = p * b % M;
            if (fwd == rev) best = i;    // s[0..i] is a palindrome
        }
        string tail = s.substr(best + 1);
        reverse(all(tail));
        return tail + s;
    }
};
```

</details>

Each step is $$O(1)$$, so the scan is $$O(n)$$. It is a single hash, so a hostile test could in principle force a false palindrome; a random base with double hashing makes that negligible, and if you want a deterministic route, the KMP failure function of `reverse(s) + '#' + s` gives the same longest palindromic prefix.

### Example: longest common subpath

[LeetCode 1923 — Longest Common Subpath](https://leetcode.com/problems/longest-common-subpath/) gives $$m$$ paths (each an array of city ids) and asks for the length of the longest contiguous subarray that appears in **every** path. This is the "longest common substring across many strings" problem, over integer sequences instead of letters.

Two observations turn it into a rolling-hash problem:

- **The answer length is monotone.** If a common subpath of length $$k$$ exists, so does one of every length $$< k$$ (any suffix of it). So we can **binary search** the length $$k$$, checking feasibility at each step.
- **Feasibility is a common $$k$$-window.** A length-$$k$$ subpath is shared by all paths iff some length-$$k$$ window has a hash that appears in every path. Roll each path, collect the distinct window-hashes per path, and a hash whose count reaches $$m$$ is present in all of them.

Deduplicate within a path (a window repeated in one path must still count once toward "appears in $$m$$ paths"), then bump a global frequency map and look for a hash that hit $$m$$.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
#include <bits/stdc++.h>
using namespace std;

using ll = long long;
using u128 = unsigned __int128;

using vi = vector<int>;
using vii = vector<vector<int>>;

#define REP(i, n) for (int i = 0; i < (n); i++)
#define sz(x) (int)((x).size())
#define pb push_back

const int INF = 1e9+7;

class RollingHash {
private:
    u128 base = 1e5+5;
    u128 mod = (1ULL << 61) - 1ULL;
    vector<u128> hash;
    vector<u128> pow;
public:
    RollingHash() {
        hash.pb(0);
        pow.pb(1);
    }
    void push_front(int c) {
        hash.pb((hash.back() * base + c) % mod);
        pow.pb((pow.back() * base) % mod);
    }
    u128 get_hash() { return hash.back(); }
    u128 get_hash(int L, int R) {
        u128 term = hash[L] * pow[R-L+1] % mod;
        return (hash[R+1] + mod - term) % mod;
    }
};

class Solution {
public:
    int longestCommonSubpath(int n, vii& paths) {
        int m = sz(paths);
        vector<RollingHash> rh(m);
        int mx = INF;
        REP(i, m) {
            mx = min(mx, sz(paths[i]));
            for (int x : paths[i]) rh[i].push_front(x+1); // 1-based
        }
        auto check = [&](int k) {
            map<u128, int> f;
            REP(i, m) {
                set<u128> seen;
                REP(L, sz(paths[i])-k+1) {
                    int R = L+k-1;
                    u128 hash = rh[i].get_hash(L, R);
                    if (seen.count(hash)) continue;
                    seen.insert(hash);
                    f[hash]++;
                }
            }
            for (auto& [h, c] : f) if (c == m) return true;
            return false;
        };
        int left = 0, right = mx, best = 0;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (check(mid)) {
                best = mid;
                left = mid+1;
            }
            else right = mid-1;
        }
        return best;
    }
};
```

</details>

With $$N$$ the total number of cities, each `check` is $$O(N \log N)$$ (rolling every window, the log from the maps), and the binary search adds an outer $$O(\log N)$$ — comfortable for the constraints. Adding `x+1` keeps city id $$0$$ from hashing to a real zero, and the base above the city range keeps distinct windows distinct.

### Docs worth reading

- [CP-Algorithms — String hashing](https://cp-algorithms.com/string/string-hashing.html), the substring formula and collision analysis.
- [USACO Guide — Hashing](https://usaco.guide/gold/hashing?lang=cpp).

### Practice

- [LeetCode 30 — Substring with Concatenation of All Words](https://leetcode.com/problems/substring-with-concatenation-of-all-words/)
- [LeetCode 214 — Shortest Palindrome](https://leetcode.com/problems/shortest-palindrome/)
- [LeetCode 1923 — Longest Common Subpath](https://leetcode.com/problems/longest-common-subpath/)
- [LeetCode 187 — Repeated DNA Sequences](https://leetcode.com/problems/repeated-dna-sequences/)
- [LeetCode 1044 — Longest Duplicate Substring](https://leetcode.com/problems/longest-duplicate-substring/)

## XOR Hashing {#xor-hashing}

A [rolling hash](#rolling-hash) fingerprints an _ordered_ sequence — `"abc"` and `"cab"` come out different, by design. But plenty of problems ask the opposite: is this the same **unordered** collection, in any order? Are these two multisets equal? Do two tree nodes have identical subtrees regardless of how you drew them? Order-sensitivity is now a bug, not a feature.

**XOR hashing** (a.k.a. **Zobrist hashing**) is the tool for that. It is a small, sharp idea with one recipe: give each distinct value its own random key, then summarize a collection by combining the keys of its members.

### The core: random keys, combined

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

### Set vs. multiset: XOR vs. sum

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

### Example: is a subarray a permutation?

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

### Example: permutation in a string (counts matter)

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

### From sets to trees: Merkle-style hashing

The real reach of XOR hashing is **combining children into a parent**. A subtree is defined by its root plus the (unordered or ordered) collection of its children's subtrees — and if each child already has a hash, the parent's hash is just those child hashes combined with the node's own value. Do this bottom-up and every subtree gets a fingerprint; equal subtrees get equal fingerprints. This is exactly a **Merkle hash**, and XOR is a natural combiner when the children form a _set_.

#### Find duplicate subtrees

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

#### Delete duplicate folders

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

### The one habit worth keeping

Both faces of XOR hashing are the same move: **assign randomness to atoms, then combine.** Down a flat array the atoms are values and the combiner is XOR along a prefix — a set fingerprint you can slice in $$O(1)$$. Up a tree the atoms are a node's value and its children's hashes, and the same combiner folds a whole subtree into one number, so structural equality becomes integer equality. Swap XOR for `+` and the same machinery counts multiplicities instead of collapsing them. Pick the combiner to match what "equal" means — a set, a multiset, or a tree — and the fingerprint falls out.

### Docs worth reading

- [USACO Guide — Hashing](https://usaco.guide/gold/hashing?lang=cpp), including the XOR / Zobrist section.
- [CP-Algorithms — String hashing](https://cp-algorithms.com/string/string-hashing.html) for the polynomial cousin.

### Practice

- [LeetCode 652 — Find Duplicate Subtrees](https://leetcode.com/problems/find-duplicate-subtrees/)
- [LeetCode 1948 — Delete Duplicate Folders in System](https://leetcode.com/problems/delete-duplicate-folders-in-system/)
- [LeetCode 567 — Permutation in String](https://leetcode.com/problems/permutation-in-string/)
- [LeetCode 438 — Find All Anagrams in a String](https://leetcode.com/problems/find-all-anagrams-in-a-string/)
- [Codeforces 1418G — Three Occurrences](https://codeforces.com/problemset/problem/1418/G)
