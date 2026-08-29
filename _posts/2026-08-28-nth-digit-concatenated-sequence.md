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

## Practice

- [LeetCode 400 — Nth Digit](https://leetcode.com/problems/nth-digit/)
- [Codeforces 1177B — Digits Sequence (Hard Edition)](https://codeforces.com/problemset/problem/1177/B)
- [Codeforces 1216E2 — Numerical Sequences (Hard Version)](https://codeforces.com/problemset/problem/1216/E2)
