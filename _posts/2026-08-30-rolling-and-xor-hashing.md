---
layout: post
title: "Rolling Hashes and XOR Hashes"
description: Two ways to fingerprint data with a single integer. A polynomial rolling hash identifies an ordered sequence and gives any substring's hash in O(1); XOR / Zobrist hashing identifies an unordered set and is recoverable by prefix XOR. Plus how to scramble keys so an adversary can't force collisions.
date: 2026-08-30
last_updated: 2026-08-30 23:27:00
author: Nathan Nguyen
categories: [Algorithms, Strings]
tags: [Hashing, Rolling Hash, Polynomial Hashing, Zobrist Hashing, XOR Hashing, Prefix Sums, Anti-Hash, LeetCode, Codeforces, Competitive Programming]
toc:
  sidebar: right
---

Hashing compresses a piece of data into one integer so that equality becomes a cheap number comparison. Which hash you want depends on what "equal" means:

- **Same ordered sequence?** Use a **polynomial rolling hash** — `"abc"` and `"cab"` must differ.
- **Same unordered (multi)set?** Use **XOR / Zobrist hashing** — `{a, b, c}` and `{c, a, b}` must match.

They are different tools, and the second is not a drop-in for the first. Both are below.

## Polynomial rolling hash

Read a string as the digits of a base-$$B$$ number, modulo a large prime $$M$$:

$$
H(s) = \bigl(s_0 B^{L-1} + s_1 B^{L-2} + \dots + s_{L-1}\bigr) \bmod M.
$$

Build prefix hashes with $$h_0 = 0$$ and $$h_{i+1} = (h_i B + s_i) \bmod M$$, so $$h_i$$ is the hash of the prefix $$s_0 \dots s_{i-1}$$. With powers $$B^k \bmod M$$ precomputed, **any substring's hash is $$O(1)$$**:

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

## Example: concatenation of all words

[LeetCode 30 — Substring with Concatenation of All Words](https://leetcode.com/problems/substring-with-concatenation-of-all-words/) gives a string `s` and `n` words, all of the same length `m`. Find every start index of a window of length $$k = nm$$ that is a concatenation of all the words in **some order**.

Hash each word and store the target frequency of each word-hash. Build one rolling hash over `s`. For each start, walk the window in `m`-length chunks, take each chunk's hash in $$O(1)$$, tally it, and reject as soon as a chunk hash is unknown or over its target count. Order among the words does not matter, so this is a multiset comparison by hash.

<details markdown="1">
<summary>C++ implementation</summary>

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

## Scrambling keys against adversaries

Two collision worries are separate. The one above is a random accident, handled by a big modulus and double hashing. The other is an **adversary** who feeds inputs crafted to make your hash — or your `unordered_map` — degrade to $$O(n)$$ buckets. Standard-library integer hashing is often the identity, so known bucket counts make it easy to attack.

The defense is to **mix the key through a random-seeded scrambler** before use. A minimal version scrambles with XOR and reduces mod a prime:

```cpp
const int MOD = 5e6 - 1;                       // prime
const ll MAX_VALUE = 1e18 + 2;
const ll SALT = 2207199722071997LL;            // fixed scramble constant

int getHash(ll x) {                            // x in [-1e18, 1e18]
    x = (x + MAX_VALUE) ^ SALT;                // shift out of negatives, flip bits
    int res = x % MOD;
    return res < 0 ? res + MOD : res;
}
```

XOR is worth understanding here: XOR-ing by a constant flips a fixed set of bits, which is a **bijection** (apply it twice and you are back), and unlike `+` or `*` it **cannot overflow**. So it reshuffles a key for free. That said, XOR by a single constant is a _linear_ mix — structured keys can stay clustered. For a genuinely adversary-resistant `unordered_map`, the community standard is a nonlinear mixer seeded by the clock (splitmix64):

```cpp
struct custom_hash {
    static uint64_t splitmix64(uint64_t x) {
        x += 0x9e3779b97f4a7c15;
        x = (x ^ (x >> 30)) * 0xbf58476d1ce4e5b9;
        x = (x ^ (x >> 27)) * 0x94d049bb133111eb;
        return x ^ (x >> 31);
    }
    size_t operator()(uint64_t x) const {
        static const uint64_t SEED =
            chrono::steady_clock::now().time_since_epoch().count();
        return splitmix64(x + SEED);
    }
};
// unordered_map<ll, int, custom_hash> safe_map;
```

Same idea, stronger mix: without knowing the run-time seed, an attacker can't precompute colliding keys.

## XOR / Zobrist hashing

Now the other family, and the answer to "can XOR hash strings?" **Zobrist hashing** gives every distinct value $$v$$ a random 64-bit key $$r[v]$$, and fingerprints a _set_ by XOR-ing the keys of its members:

$$
\text{fingerprint}(S) = \bigoplus_{v \in S} r[v].
$$

Two properties make it powerful:

- **Order-independent.** XOR commutes, so a set and any reordering share a fingerprint — exactly what a polynomial hash refuses to do.
- **Self-inverse, hence recoverable by prefix XOR.** Toggling one element XORs its key again, so `add` and `remove` are the same $$O(1)$$ operation. Define $$P_i = r[a_0] \oplus \dots \oplus r[a_{i-1}]$$; then the fingerprint of any range is

$$
\bigoplus_{j=l}^{r-1} r[a_j] = P_r \oplus P_l,
$$

because the shared prefix cancels itself. Your instinct was right: prefix XOR _is_ recoverable — that self-cancellation is the whole mechanism, the XOR analogue of a prefix sum.

The one thing to watch: **plain XOR fingerprints a set, not a multiset.** Since $$r[v] \oplus r[v] = 0$$, a value appearing twice vanishes — XOR only sees each value's _parity_ of occurrences. That is perfect for "does every value occur an even number of times in this range?" (test XOR $$= 0$$), but wrong for anagram-style questions where counts matter. When multiplicity matters, either add the keys instead of XOR-ing (a sum respects counts, with natural `uint64_t` overflow as the modulus), or give the $$j$$-th occurrence of a value its own random key — the trick behind counting subarrays where every value appears exactly three times.

So, back to strings: XOR hashing does **not** replace a rolling hash for ordered substring matching — it is blind to order by design. It shines on the complementary question — _is this window the same (multi)set of characters or words, in any order?_ — where the rolling hash is the wrong tool. In the concatenation problem above, for instance, the words may appear in any order, so a Zobrist fingerprint over the word-hashes (summed, since words can repeat) is a natural alternative to the frequency map.

### A worked example: is a subarray a permutation?

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

**Why it works, and its limit.** A genuine permutation holds each of $$1, \dots, \text{len}$$ exactly once, so its XOR is exactly $$T_{\text{len}}$$ — no permutation is ever rejected. A non-permutation passes only if its odd-occurrence values XOR to $$T_{\text{len}}$$, i.e. some nonempty set of random keys cancels, which happens with probability $$\approx 2^{-64}$$ per query. The one blind spot is again multiplicity: XOR cannot on its own catch a repeat like $$\{1, 2, 2, 3\}$$. Comparing to $$T_{\text{len}}$$ (which pins the length) already rules out most of these; to close the gap cheaply, also check that the range maximum equals $$\text{len}$$ — a permutation of $$1 \dots \text{len}$$ must contain $$\text{len}$$ — which a sparse table answers in $$O(1)$$.

This is the right shape when the elements are **distinct**. The sibling questions "does this window contain a permutation / anagram of a pattern" ([LeetCode 567](https://leetcode.com/problems/permutation-in-string/), [LeetCode 438](https://leetcode.com/problems/find-all-anagrams-in-a-string/)) are _multiset_ problems — letters repeat — so XOR is the wrong hash there (two equal letters cancel); use an additive fingerprint $$\sum r[c]$$ or a plain frequency window instead.

## Docs worth reading

- [USACO Guide — Hashing](https://usaco.guide/gold/hashing?lang=cpp), including the XOR / Zobrist section.

## Practice

- [LeetCode 30 — Substring with Concatenation of All Words](https://leetcode.com/problems/substring-with-concatenation-of-all-words/)
- [LeetCode 187 — Repeated DNA Sequences](https://leetcode.com/problems/repeated-dna-sequences/)
- [LeetCode 1044 — Longest Duplicate Substring](https://leetcode.com/problems/longest-duplicate-substring/)
- [LeetCode 567 — Permutation in String](https://leetcode.com/problems/permutation-in-string/) (multiset fingerprint — use a sum, not XOR)
- [LeetCode 438 — Find All Anagrams in a String](https://leetcode.com/problems/find-all-anagrams-in-a-string/) (multiset fingerprint)
- [Codeforces 1418G — Three Occurrences](https://codeforces.com/problemset/problem/1418/G)
