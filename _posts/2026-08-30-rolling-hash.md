---
layout: post
title: "Rolling Hash: Fingerprinting Substrings in O(1)"
description: A polynomial rolling hash turns a string into one integer so any substring's fingerprint comes back in O(1) after linear preprocessing. That makes substring equality a number comparison — powering concatenation matching, palindromic prefixes, and a binary search for the longest common subpath.
date: 2026-08-30
last_updated: 2026-09-12 01:59:00
author: Nathan Nguyen
categories: [Hashing]
tags: [Hashing, Rolling Hash, Polynomial Hashing, Prefix Sums, Binary Search, Anti-Hash, LeetCode, Competitive Programming]
toc:
  sidebar: right
---

Comparing two substrings character by character is $$O(\text{length})$$, and problems that ask it thousands of times drown in that cost. A **rolling hash** compresses a string into a single integer so that comparing substrings becomes comparing two numbers — $$O(1)$$ each, after linear preprocessing. It is the tool for "are these two stretches of text equal?" asked at scale.

The one thing it is built around is **order**: `"abc"` and `"cab"` must hash differently. (When order should _not_ matter — comparing unordered sets — you want [XOR hashing]({% post_url 2026-08-31-xor-hashing %}) instead, which is a separate tool.)

## The polynomial hash

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

## Example: concatenation of all words

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

## Example: shortest palindrome

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

## Example: longest common subpath

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

## Docs worth reading

- [CP-Algorithms — String hashing](https://cp-algorithms.com/string/string-hashing.html), the substring formula and collision analysis.
- [USACO Guide — Hashing](https://usaco.guide/gold/hashing?lang=cpp).

## Practice

- [LeetCode 30 — Substring with Concatenation of All Words](https://leetcode.com/problems/substring-with-concatenation-of-all-words/)
- [LeetCode 214 — Shortest Palindrome](https://leetcode.com/problems/shortest-palindrome/)
- [LeetCode 1923 — Longest Common Subpath](https://leetcode.com/problems/longest-common-subpath/)
- [LeetCode 187 — Repeated DNA Sequences](https://leetcode.com/problems/repeated-dna-sequences/)
- [LeetCode 1044 — Longest Duplicate Substring](https://leetcode.com/problems/longest-duplicate-substring/)
