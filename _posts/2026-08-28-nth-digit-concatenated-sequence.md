---
layout: post
title: "Finding the N-th Digit of a Concatenated Sequence"
description: Write the positive integers back to back — 123456789101112… — and locate the n-th digit without materializing the string. Count digits in blocks by number length, jump to the block that contains position n, then read off the exact number and digit in O(log n).
date: 2026-08-28
author: Nathan Nguyen
categories: [Algorithms, Mathematics]
tags: [Digits, Counting, Math, Binary Search, Codeforces, LeetCode, Competitive Programming]
toc:
  sidebar: right
---

[LeetCode 400 — Nth Digit](https://leetcode.com/problems/nth-digit/) concatenates the positive integers into one string, $$1\,2\,3\,\dots\,9\,10\,11\,12\dots$$, and asks for the digit at position $$n$$. The string is astronomically long, so we never build it — we count our way to the answer in $$O(\log n)$$.

## Counting digits in blocks

Group the numbers by their digit length $$L$$. For each $$L$$ there are

$$
9 \cdot 10^{L-1} \text{ numbers, contributing } L \cdot 9 \cdot 10^{L-1} \text{ digits},
$$

because the $$L$$-digit numbers run from $$10^{L-1}$$ to $$10^{L}-1$$. So the sequence splits into blocks: $$9$$ digits from the 1-digit numbers, $$180$$ from the 2-digit numbers, $$2700$$ from the 3-digit ones, and so on. These grow geometrically, so only $$O(\log n)$$ blocks precede position $$n$$.

Finding the $$n$$-th digit is then three steps:

1. **Skip whole blocks.** While $$n$$ is past the current block ($$n > L \cdot 9 \cdot 10^{L-1}$$), subtract that block's digit count and advance to $$L+1$$. After the loop, $$n$$ is the (1-indexed) offset _within_ the block of $$L$$-digit numbers.
2. **Locate the number.** The block starts at $$x_0 = 10^{L-1}$$. Each number uses $$L$$ digits, so the offset lands inside

$$
x = x_0 + \left\lfloor \frac{n-1}{L} \right\rfloor.
$$

3. **Locate the digit.** Within $$x$$, the digit we want is at index $$(n-1) \bmod L$$.

### A quick check: $$n = 11$$

The 1-digit block holds $$9$$ digits; $$11 > 9$$, so subtract and move on with $$n = 2$$, $$L = 2$$, $$x_0 = 10$$. The 2-digit block holds $$180$$ digits, so we stop. Then $$x = 10 + \lfloor 1/2 \rfloor = 10$$ and the digit index is $$1 \bmod 2 = 1$$, i.e. the `'0'` in `"10"`. Correct.

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

class Solution {
public:
    int findNthDigit(int n) {
        ll len = 1, cnt = 9, x = 1;
        while (n > len * cnt) {
            n -= len * cnt;
            len++;
            cnt *= 10;
            x *= 10;
        }
        x += (n-1) / len; // 0-indexed
        string sx = to_string(x);
        return sx[(n-1)%len] - '0';
    }
};
```

</details>

Here `len` is $$L$$, `cnt` is $$9 \cdot 10^{L-1}$$, and `x` is the block start $$10^{L-1}$$, all kept in `long long` so the product `len * cnt` never overflows while scanning. The loop runs at most $$\sim\!\log_{10} n$$ times, then two $$O(L)$$ operations finish it.

## Scaling up

The same block-counting works when the position is far larger than a 32-bit `int` — you only need a wider type for $$n$$ and for the running number. [Codeforces 1177B](https://codeforces.com/problemset/problem/1177/B) is the identical sequence with $$k$$ up to $$10^{12}$$: keep everything in 64-bit and the code above is essentially unchanged.

A step harder, [Codeforces 1216E2](https://codeforces.com/problemset/problem/1216/E2) nests the idea — its sequence is $$1,\,12,\,123,\,\dots$$, i.e. block $$i$$ is the concatenation $$1\,2\,\dots\,i$$ — so you count twice: first find which block holds position $$k$$, then apply this digit-counting inside that block. Both layers are the same "sum a geometric-ish series, subtract full chunks, descend" pattern.

## When the blocks alternate direction

[LeetCode — K-th Digit in Infinite String](https://leetcode.com/problems/k-th-digit-in-infinite-string/) keeps the same digits but reorders them. Group the positive integers into blocks by their leading part: block $$b$$ holds $$10b, 10b+1, \dots, 10b+9$$, written **ascending when $$b$$ is even and descending when $$b$$ is odd** (block $$0$$ is just $$1$$–$$9$$). The string starts

$$
\underbrace{1\,2\,\dots\,9}_{b=0}\;\underbrace{19\,18\,\dots\,10}_{b=1}\;\underbrace{20\,21\,\dots\,29}_{b=2}\;\underbrace{39\,\dots\,30}_{b=3}\dots
$$

The digit-length counting is untouched: block $$0$$ is the nine 1-digit numbers, blocks $$1$$–$$9$$ are the ninety 2-digit numbers, blocks $$10$$–$$99$$ the 3-digit ones. So steps 1–2 — find the length $$L$$ and the 0-indexed slot $$s$$ of the number holding position $$k$$ — are exactly as before. Only the slot-to-number map changes: within the $$L$$-digit range the numbers come in prefix-blocks of ten, so

$$
b = 10^{\,L-2} + \left\lfloor \tfrac{s}{10} \right\rfloor, \qquad j = s \bmod 10, \qquad \text{num} = 10b + \begin{cases} j & b \text{ even} \\ 9 - j & b \text{ odd} \end{cases}
$$

(read $$10^{L-2}$$ as $$0$$ when $$L = 1$$, where block $$0$$ shifts to $$1$$–$$9$$ instead of $$0$$–$$9$$). Then take digit $$k \bmod L$$ of `num`. For $$k = 15$$: length $$L = 2$$, slot lands in block $$b = 1$$ (descending $$19, 18, 17, \dots$$) at $$17$$, digit index $$1$$, giving `7` — matching $$1\dots9\,19\,18\,17$$.

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

class Solution {
public:
    int kthDigit(ll k) {
        // find the digit length lg of the number holding position k
        int lg = 0;
        ll cnt = 0, rngcnt = 9;
        while (cnt < k) { // lg <= 15
            cnt += rngcnt * (lg+1);
            rngcnt *= 10;
            lg++;
        }

        // reduce k to the 1-indexed offset within the lg-digit range
        rngcnt = 9;
        REP(clg, lg-1) {
            k -= rngcnt * (clg+1);
            rngcnt *= 10;
        }

        // locate the number-slot and the digit inside it
        k--; // 0-index
        ll pos = k/lg, rem = k%lg;

        // prefix-block b of the slot (b starts at 10^(lg-2), or 0 for lg=1)
        ll b = 0;
        REP(i, lg-1) b = (b == 0 ? 1 : b*10);
        b += (pos/10);
        ll ld = pos%10; // index within the prefix-block

        // ascending if b even, descending if b odd; block 0 shifts 1..9
        ll num = 10 * b + (b % 2 ? 9 - ld : (b == 0 ? ld + 1 : ld));
        string s = to_string(num);
        return s[rem] - '0';
    }
};
```

</details>

Same skeleton as the plain sequence — the block counting to find $$L$$ and the slot is byte-for-byte the same math; the parity branch is the only new line.

## Practice

- [LeetCode 400 — Nth Digit](https://leetcode.com/problems/nth-digit/)
- [LeetCode — K-th Digit in Infinite String](https://leetcode.com/problems/k-th-digit-in-infinite-string/)
- [Codeforces 1177B — Digits Sequence (Hard Edition)](https://codeforces.com/problemset/problem/1177/B)
- [Codeforces 1216E2 — Numerical Sequences (Hard Version)](https://codeforces.com/problemset/problem/1216/E2)

- [LeetCode 400 — Nth Digit](https://leetcode.com/problems/nth-digit/)
- [Codeforces 1177B — Digits Sequence (Hard Edition)](https://codeforces.com/problemset/problem/1177/B)
- [Codeforces 1216E2 — Numerical Sequences (Hard Version)](https://codeforces.com/problemset/problem/1216/E2)
