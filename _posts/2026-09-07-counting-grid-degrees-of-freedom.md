---
layout: post
title: "Degrees of Freedom: Counting Binary Grids"
description: Count the binary matrices whose every r×c window has an even number of ones (Codeforces 2240B). Each window is one XOR equation that forces a single cell, so the free cells form an L-shaped border and the answer is just 2 raised to the number of free cells.
date: 2026-09-07
author: Nathan Nguyen
categories: [Mathematics, Algorithms]
tags: [Counting, Linear Algebra, GF(2), XOR, Degrees of Freedom, Inclusion-Exclusion, Codeforces, Competitive Programming]
toc:
  sidebar: right
---

[Codeforces 2240B — AI Finds Nothing Here](https://codeforces.com/contest/2240/problem/B) is a small problem with a clean idea worth slowing down on. We fill an $$n \times m$$ grid with $$0$$s and $$1$$s. Call the grid **clean** if every contiguous $$r \times c$$ block has an even number of ones — equivalently, the XOR of its $$rc$$ cells is $$0$$. Count the clean grids, modulo $$998244353$$.

With $$n, m$$ up to $$10^9$$ we cannot build the grid, let alone enumerate fillings. The answer has to be a formula, and it turns out to be

$$
2^{\,nm \,-\, (n-r+1)(m-c+1)}.
$$

The rest of this post is about _why_, told slowly. The whole thing rests on one observation: **each constraint forces exactly one cell**, so counting clean grids is just counting the cells we are still free to choose.

## Start by counting choices

Every cell is one bit, so it is one of two choices. With no constraints at all there would be $$2^{nm}$$ grids. Each constraint we add can only cut down that freedom. The question is by how much.

A **window** is one placement of the $$r \times c$$ block. Its top-left corner $$(i, j)$$ can sit at any row $$1 \le i \le n-r+1$$ and any column $$1 \le j \le m-c+1$$, because the block must stay inside the grid. That gives

$$
(n-r+1)(m-c+1) \text{ windows,}
$$

and each window is one requirement: the XOR of the cells it covers is $$0$$. So "clean" means all $$(n-r+1)(m-c+1)$$ of these XOR equations hold at once.

Our goal is to figure out how many of the $$nm$$ cells we can still pick freely once all these equations are in force. That count of free cells is the number of **degrees of freedom**, and the answer will be $$2$$ to that power.

## One window forces one cell

Look at a single window and write its constraint out:

$$
(\text{XOR of all } rc \text{ cells}) = 0.
$$

Over XOR, $$x \oplus x = 0$$ and every value is its own inverse, so we can move any one term to the other side. Move the bottom-right cell of the window:

$$
(\text{bottom-right cell}) = (\text{XOR of the other } rc-1 \text{ cells}).
$$

Read that again: the constraint is not some vague restriction on the window. It **computes** the bottom-right cell from the rest. If we already know every cell of the window except its bottom-right corner, that corner is no longer a choice — it is forced.

```
a 2×2 window, "XOR of the block = 0":

   a  b
   c  ?          ?  =  a ⊕ b ⊕ c
```

So think of each window not as a filter on grids, but as a _rule that fills in its own bottom-right cell_.

## Which cells are free, which are forced

One picture carries the whole argument. Draw the line between rows $$r-1$$ and $$r$$, and the line between columns $$c-1$$ and $$c$$; together they cut the grid into four blocks.

```
               columns 1 … c-1      columns c … m
             +--------------------+--------------------+
  rows       |        FREE        |        FREE        |
  1 … r-1    |     (r-1)(c-1)     |    (r-1)(m-c+1)    |
             +--------------------+--------------------+
  rows       |        FREE        |       FORCED       |
  r … n      |    (n-r+1)(c-1)    |   (n-r+1)(m-c+1)   |
             |                    |   one per window   |
             +--------------------+--------------------+
```

The **bottom-right block** — rows $$r \dots n$$, columns $$c \dots m$$ — is exactly the set of window bottom-right corners. As a window's top-left corner $$(i,j)$$ ranges over all $$(n-r+1)(m-c+1)$$ positions, its bottom-right corner $$(i+r-1,\, j+c-1)$$ sweeps this block, one cell per window — the map is a shift by $$(r-1,\, c-1)$$, so it is a bijection. Every cell in this block is **forced**.

The other three blocks — the first $$r-1$$ rows and the first $$c-1$$ columns — are **free**. These are _whole_ rows and _whole_ columns, so the free region is a band that can be many cells thick; it only looks like a thin frame when $$r-1 = c-1 = 1$$, and it is never a fixed $$r + c - 1$$ cells.

**Why the forced block can always be filled.** Process the windows in reading order — corners top to bottom, then left to right. When we reach a window, every cell it covers except its bottom-right corner is either in a free block or is the bottom-right corner of an _earlier_ window; either way it is already set. So only the corner is new, and the window's equation computes it from the rest.

## Following the sweep on a small grid

Take $$n = m = 3$$, $$r = c = 2$$ — the smallest interesting case, where the free band is a thin L: the first row and the first column (five cells), with the bottom-right $$2\times2$$ block forced (four cells, one per window).

```
   col:  1 2 3
   row1: F F F
   row2: F . .
   row3: F . .

F = free    . = forced
```

Choose the five `F` cells however you like, then process the four windows in order; each fills one `.`:

1. window at $$(1,1)$$ covers $$(1,1),(1,2),(2,1)$$ — all free — and forces $$(2,2)$$.
2. window at $$(1,2)$$ covers $$(1,2),(1,3),(2,2)$$ — the last just got set — and forces $$(2,3)$$.
3. window at $$(2,1)$$ covers $$(2,1),(3,1),(2,2)$$ — all known — and forces $$(3,2)$$.
4. window at $$(2,2)$$ covers $$(2,2),(2,3),(3,2)$$ — all known — and forces $$(3,3)$$.

Four windows, four forced cells, no cell touched twice, nothing left undetermined. Five free cells, so $$2^5 = 32$$ clean grids for this size.

## Why every choice gives exactly one grid

Put the two halves together into a bijection.

- **Free border $$\to$$ grid.** Pick the border arbitrarily ($$2^{\text{(free cells)}}$$ ways). The sweep then fills every forced cell exactly once, always from cells already known, so there is never a conflict, and every window's equation holds because we set that window's own corner to make it hold. One border filling yields exactly one clean grid.
- **Grid $$\to$$ free border.** Any clean grid, restricted to the border, is some border filling — and recomputing its forced cells by the same rule reproduces the grid.

So clean grids and border fillings are in one-to-one correspondence. The number of clean grids equals the number of border fillings, which is $$2^{\text{(free cells)}}$$.

## Counting the free cells

Straight off the four blocks, the free cells are everything except the forced block:

$$
\text{free cells} = nm - (n-r+1)(m-c+1).
$$

You can also add the three free blocks up directly. Together they are the first $$r-1$$ rows plus the first $$c-1$$ columns, and those two overlap in the top-left $$(r-1)\times(c-1)$$ block — so [inclusion-exclusion]({% post_url 2026-07-24-principle-of-inclusion-exclusion %}) says add both and subtract the overlap once:

$$
\underbrace{(r-1)\,m}_{\text{first } r-1 \text{ rows}} + \underbrace{n\,(c-1)}_{\text{first } c-1 \text{ cols}} - \underbrace{(r-1)(c-1)}_{\text{counted twice}}.
$$

A line of algebra confirms the two counts agree,

$$
(r-1)m + n(c-1) - (r-1)(c-1) = nm - (n-r+1)(m-c+1),
$$

so the exponent is simply $$nm$$ minus the number of windows. Hence

$$
\boxed{\ \text{clean grids} = 2^{\,nm - (n-r+1)(m-c+1)} \bmod 998244353.\ }
$$

**A sanity check.** Take $$r = c = 1$$: every single cell is a $$1\times1$$ window whose XOR must be $$0$$, so every cell is forced to $$0$$ and there is exactly one clean grid. The formula agrees: windows $$= nm$$, free cells $$= nm - nm = 0$$, answer $$2^0 = 1$$.

## Implementation

Nothing is built. Compute the exponent (at most $$nm \le 10^{18}$$, so it fits in a signed 64-bit integer) and raise $$2$$ to it modulo the prime with fast exponentiation — $$O(\log nm)$$ per test.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
#include <bits/stdc++.h>
using namespace std;

using ll = long long;

const int MOD = 998244353;

ll power(ll a, ll b) { // a^b mod MOD
    ll r = 1; a %= MOD;
    while (b) {
        if (b & 1) r = r * a % MOD;
        a = a * a % MOD;
        b >>= 1;
    }
    return r;
}

void solve() {
    ll n, m, r, c; cin >> n >> m >> r >> c;
    ll cells     = n * m;                       // <= 1e18, fits in ll
    ll windows   = (n - r + 1) * (m - c + 1);   // one XOR constraint each
    ll freeCells = cells - windows;             // the L-shaped border
    cout << power(2, freeCells) << '\n';
}

int main() {
    ios::sync_with_stdio(0);
    cin.tie(0);
    int tt; cin >> tt;
    while (tt--) solve();
    return 0;
}
```

</details>

Read $$n, m, r, c$$ as 64-bit from the start: $$n \cdot m$$ already overflows 32-bit at these bounds.

## Practice

- [Codeforces 2240B — AI Finds Nothing Here](https://codeforces.com/contest/2240/problem/B)
