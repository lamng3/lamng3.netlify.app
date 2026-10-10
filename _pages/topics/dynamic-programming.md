---
layout: post
title: "Dynamic Programming"
description: "Most of dynamic programming is choosing what to remember. Each technique here is a different answer to that question: digits and a remainder, a split point, a set of reachable values, or a running best."
permalink: /blog/dynamic-programming/
last_updated: 2026-10-10
author: Lam Nguyen
toc:
  sidebar: right
---

Most of dynamic programming is choosing what to remember. Each technique here is a different answer to that question: digits and a remainder, a split point, a set of reachable values, or a running best.

<details markdown="1">
<summary>C++ template used by every implementation on this page</summary>

Each implementation below starts after this header. A snippet that needs a different modulus defines its own `MOD` in place of this one.

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

mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());
```
</details>

## Digit DP {#digit-dp}

[LeetCode 2827 — Number of Beautiful Integers in the Range](https://leetcode.com/problems/number-of-beautiful-integers-in-the-range/) calls an integer **beautiful** when it satisfies two conditions at once:

1. it has the same number of even digits as odd digits, and
2. it is divisible by $$k$$.

Count the beautiful integers in $$[\text{low}, \text{high}]$$, with bounds up to $$10^9$$ and $$1 \le k \le 20$$. For example, in $$[10, 20]$$ with $$k = 3$$ the multiples of $$3$$ are $$12, 15, 18$$; of those, $$12$$ and $$18$$ have one even and one odd digit, while $$15$$ is two odds — so the answer is $$2$$.

This is a **digit DP**, and digit DP problems are almost entirely about one question: _as you build a number one digit at a time, what is the least you must remember?_ Get the state right and the code writes itself. This section is about choosing that state.

### Reduce the range to a prefix count

First, turn the range into two prefix counts. Let $$f(x)$$ be the number of beautiful integers in $$[1, x]$$. Then

$$
\text{answer} = f(\text{high}) - f(\text{low} - 1),
$$

so we only ever need to count beautiful integers _up to_ a bound. That is what digit DP does well.

### Building a number digit by digit

To count integers $$\le x$$, write $$x$$ out as a string and fill positions from the most significant digit down. At each position we try every allowed digit and recurse. Three pieces of bookkeeping show up in _every_ digit DP, no matter the problem:

- **`pos`** — how many positions are left to fill. The recursion shrinks it to $$0$$, where we decide whether the number we built is valid.
- **`tight`** — are we still pinned to $$x$$'s own prefix? If every digit so far has matched $$x$$ exactly, the next digit cannot exceed $$x$$'s digit at this position (going higher would overshoot $$x$$). Once we place something smaller, we are free ($$\text{tight} = 0$$) and the rest may be anything $$0$$–$$9$$.
- **`started`** — have we placed a nonzero digit yet? This handles **leading zeros**. The number $$12$$ padded to width $$10$$ is `0000000012`; those leading zeros are not real digits and must not count toward the even/odd balance. While `started` is false, we are still in the padding.

The remaining state is what this _particular_ problem forces us to track — and that is the interesting part.

### What to remember, and the two compressions

Beautiful asks for two things. Naively you might carry the full number (to test divisibility) and both digit counts (to test balance). Both are wasteful, and each collapses to something tiny.

**Divisible by $$k$$ → carry the remainder, not the number.** Whether a number is divisible by $$k$$ depends only on its value $$\bmod\ k$$. And a remainder updates digit by digit: if the prefix has remainder $$\text{rem}$$ and we append digit $$d$$, the new remainder is $$(\text{rem} \cdot 10 + d) \bmod k$$. So one number in $$\{0, \dots, k-1\}$$ replaces the whole (up to $$10^9$$) value.

**Equal even and odd counts → carry the difference, not two counts.** We do not need how many evens and how many odds there are, only that they end up equal. So track a single signed difference

$$
\text{diff} = (\#\text{even digits}) - (\#\text{odd digits}),
$$

adding $$+1$$ for an even digit and $$-1$$ for an odd one. "Balanced" is simply $$\text{diff} = 0$$ at the end. With at most $$10$$ digits, $$\text{diff} \in [-10, 10]$$ — one small number instead of two counts.

That is the crux of state design: **keep only what the final test actually reads.** Divisibility reads a remainder; balance reads a difference.

### The full state

Putting the universal bookkeeping together with the two compressions:

| state     | meaning                              | range            | why it is needed                                  |
| --------- | ------------------------------------ | ---------------- | ------------------------------------------------- |
| `pos`     | positions left to fill               | $$0 \dots 10$$   | drives the recursion; the base case is `pos == 0` |
| `tight`   | still pinned to the bound's prefix   | $$0 / 1$$        | caps the next digit so we never exceed $$x$$      |
| `started` | placed a nonzero digit yet?          | $$0 / 1$$        | leading zeros must not count toward the balance   |
| `rem`     | value so far $$\bmod\ k$$            | $$0 \dots k-1$$  | divisibility reads only the remainder             |
| `diff`    | $$(\#\text{even}) - (\#\text{odd})$$ | $$-10 \dots 10$$ | balance reads only the difference (`== 0` at end) |

Arrays cannot take a negative index, so `diff` is stored shifted by $$10$$ (the range $$[-10, 10]$$ becomes $$[0, 20]$$).

### Transitions and the base case

At a position, the largest digit we may place is $$x$$'s digit there if `tight`, otherwise $$9$$. For each candidate digit $$d$$ from $$0$$ to that cap, update the four carried quantities:

- $$\text{tight}' = \text{tight}$$ **and** $$(d = \text{cap})$$ — we stay pinned only if we again matched the bound exactly;
- $$\text{started}' = \text{started}$$ **or** $$(d \ne 0)$$;
- $$\text{rem}' = (\text{rem} \cdot 10 + d) \bmod k$$;
- $$\text{diff}' = \text{diff} + (\text{even? } +1 : -1)$$ — but only once `started'` is true; while still in leading zeros, leave `diff` at $$0$$.

When `pos == 0` the number is complete. It is beautiful when it is a real number and both tests pass:

$$
\text{started} \ \wedge\ \text{rem} = 0 \ \wedge\ \text{diff} = 0.
$$

Requiring `started` also excludes the all-zeros "number," so $$0$$ is never counted.

### Complexity

The number of states is $$\text{pos} \times \text{tight} \times \text{started} \times \text{rem} \times \text{diff} \approx 11 \cdot 2 \cdot 2 \cdot k \cdot 21$$, and each fans out to at most $$10$$ digits. With $$k \le 20$$ that is under two million transitions per bound, and we evaluate two bounds per query — instant. Memoize on the state; because the digit cap depends on the specific bound $$x$$, reset the table for each call to $$f(x)$$.

### Implementation

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
// dp[pos][tight][started][rem][diff + 10]
int dp[11][2][2][21][21];

class Solution {
public:
    int solve_dp(string& num, int k, int pos, int tight, int started, int rem, int diff) {
        if (pos == 0) return started && rem == 0 && diff == 0;
        if (dp[pos][tight][started][rem][diff+10] != -1) {
            return dp[pos][tight][started][rem][diff+10];
        }
        int res = 0;
        int ub = tight ? (num[sz(num)-pos] - '0') : 9;
        FOR(d, 0, ub) {
            int ntight = tight & (d == ub);
            int nstarted = started | (d != 0);
            int nrem = (rem * 10 + d) % k;
            int ndiff = nstarted ? diff + (d % 2 ? -1 : 1) : 0;
            res += solve_dp(num, k, pos-1, ntight, nstarted, nrem, ndiff);
        }
        return dp[pos][tight][started][rem][diff+10] = res;
    }

    int count_up_to(int x, int k) {
        if (x <= 0) return 0;
        memset(dp, -1, sizeof dp);
        string sx = to_string(x);
        return solve_dp(sx, k, sz(sx), 1, 0, 0, 0);
    }

    int numberOfBeautifulIntegers(int low, int high, int k) {
        int L = count_up_to(low-1, k);
        int R = count_up_to(high, k);
        return R - L;
    }
};
```

</details>

A couple of notes on the code. `pos` counts _down_ to $$0$$, so the digit at the current position is `num[sz(num) - pos]`. The `diff + 10` offset is the negative-index shift from the table. And `memset(dp, -1, ...)` runs inside `count_up_to`: the cache is valid only for one bound, since a `tight` state's digit cap comes from that bound's digits — reset it before each new number.

## Range DP {#range-dp}

Digit DP chooses its state by asking what the final test reads. Range DP asks a different question: what is the last step, and where does it split the input?

[LeetCode 679 — 24 Game](https://leetcode.com/problems/24-game/) gives four cards, each in $$[1, 9]$$, and asks whether some expression built from $$+, -, \times, \div$$ and parentheses evaluates to $$24$$. Division is real division, so $$6 \div (1 - \tfrac{3}{4}) = 24$$ is a valid answer for $$\{1, 3, 4, 6\}$$.

An expression has two independent freedoms: the **order** you place the operands, and the **grouping** (parentheses). Handle them separately, and mind the real-number division.

### Operand order: backtracking with a bitmask

The first freedom is a permutation of the cards. Generate them by backtracking, tracking which indices are already used in a single integer `used` as a bitmask — bit $$i$$ set means card $$i$$ is taken.

Three one-liners drive it:

- **turn a bit on:** `used |= (1 << i)`
- **test a bit:** `used & (1 << i)`
- **turn a bit off:** `used &= ~(1 << i)`

The last one is the backtracking undo: `~(1 << i)` is all ones except bit $$i$$, so AND-ing clears exactly that bit and leaves the rest. Set the bit and append the card before recursing, clear it and pop after — the array and the mask return to their previous state for the next choice.

```cpp
void permutate(const vi& cards, int used, vi cur) {
    if (sz(cur) == sz(cards)) { candidates.insert(cur); return; }
    REP(i, sz(cards)) {
        if (used & (1 << i)) continue;   // already taken
        used |= (1 << i);                // take it
        cur.pb(cards[i]);
        permutate(cards, used, cur);
        used &= ~(1 << i);               // put it back
        cur.pop_back();
    }
}
```

### Grouping: split, don't place brackets

The second freedom is where the parentheses go. There are Catalan-many parenthesizations, and enumerating bracket placements directly is awkward. The clean move is to **not place parentheses at all** — split instead.

Any fully-parenthesized expression over a contiguous run of operands $$[L, R]$$ has a single outermost operator. That operator cuts the run into a left part $$[L, i]$$ and a right part $$[i+1, R]$$, each a smaller sub-expression. So the set of values reachable from $$[L, R]$$ is: pick a split point $$i$$, take any value the left part can make and any value the right part can make, and combine them with one operator.

$$
\text{reach}(L, R) = \bigcup_{i=L}^{R-1}\ \bigcup_{\substack{a \in \text{reach}(L, i) \\ b \in \text{reach}(i+1, R)}} \{\, a+b,\ a-b,\ a \times b,\ a \div b \ (b \ne 0)\,\},
$$

with the base case $$\text{reach}(L, L) = \{\text{card}_L\}$$. Every parenthesization is captured by _which split you take at each level_ — no brackets are ever written down.

This is why the permutation and the split work together. A split only ever combines a **contiguous** range, so two particular cards can be the first ones combined only if they sit next to each other. Ranging over all permutations is exactly what lets any pair meet first; ranging over all splits is what supplies every grouping. Between them, every expression is covered: read the leaves of any expression tree left to right and you get some permutation, and the tree's shape is one choice of splits.

> **An extension worth naming.** The recurrence "combine an answer for $$[L, i]$$ with an answer for $$[i+1, R]$$ over all split points $$i$$" is **range DP** (a.k.a. interval DP) — the same skeleton as matrix-chain multiplication, optimal BST, [Burst Balloons](https://leetcode.com/problems/burst-balloons/), and [Different Ways to Add Parentheses](https://leetcode.com/problems/different-ways-to-add-parentheses/). Those keep one optimal number per interval; here we keep a whole _set_ of reachable values, but the $$O(n^2)$$ intervals and $$O(n)$$ split points are identical.

Because $$\text{reach}(L, R)$$ for a fixed operand order depends only on the range $$[L, R]$$, memoize it top-down keyed by $$(L, R)$$. The memo is per-permutation — clear it before each new ordering, since the same $$(L, R)$$ names a different sub-array once the cards are rearranged.

### Precision: real division needs care

Once division enters, values stop being integers, and two floating-point numbers are essentially never bit-for-bit equal. Testing `result == 24` will silently miss valid answers. The standard fix is a tolerance $$\varepsilon$$:

| Exact intent | Floating-point form  |
| ------------ | -------------------- |
| `a == b`     | `fabs(a - b) <= eps` |
| `a > b`      | `a > b + eps`        |
| `a <= b`     | `a <= b + eps`       |

with `const double eps = 1e-7` (anywhere from $$10^{-6}$$ to $$10^{-9}$$ is typical — too large invites false positives, too small misses near-ties). One caution: **do not use an $$\varepsilon$$ inside a sort comparator or a binary-search predicate.** An "almost equal" comparator is not a strict weak ordering and breaks `std::sort`; a fuzzy predicate destroys the monotonicity binary search relies on. Keep $$\varepsilon$$ for direct comparisons only.

For the 24 Game the check is just `fabs(x - 24) < eps` over every reachable value.

#### The exact way: rational arithmetic

The robust competitive-programming habit is to sidestep floating point entirely: when a problem is about exact values, **compute in integers or fractions, not doubles.** Carry each value as a reduced fraction $$\frac{p}{q}$$ with $$q > 0$$ and $$\gcd(\vert p \vert, q) = 1$$, and do every operation with integer arithmetic:

$$
\frac{p_1}{q_1} \pm \frac{p_2}{q_2} = \frac{p_1 q_2 \pm p_2 q_1}{q_1 q_2}, \quad
\frac{p_1}{q_1}\cdot\frac{p_2}{q_2} = \frac{p_1 p_2}{q_1 q_2}, \quad
\frac{p_1}{q_1} \div \frac{p_2}{q_2} = \frac{p_1 q_2}{q_1 p_2}\ (p_2 \ne 0),
$$

reducing by the gcd and forcing $$q > 0$$ after each step. Then "is it $$24$$?" becomes the exact integer test $$p = 24$$ and $$q = 1$$ — no $$\varepsilon$$, no false positives. With four cards up to $$9$$, numerators and denominators stay tiny, so `long long` is plenty (`__int128` is a safety net when the arithmetic can blow up). Reserve $$\varepsilon$$ for problems where floating point is genuinely unavoidable, like geometry.

### Implementation

The solution below takes the floating-point route: generate every permutation, run the memoized split recurrence per permutation, and test each reachable value against $$24$$ with an $$\varepsilon$$.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
const double eps = 1e-6;

class Solution {
private:
    set<vi> candidates;
    map<pii, set<double>> memo;

public:
    void permutate(const vi& cards, int used, vi cur) {
        if (sz(cur) == sz(cards)) {
            candidates.insert(cur);
            return;
        }
        REP(i, sz(cards)) {
            if (used & (1 << i)) continue;
            used |= (1 << i); // turn on
            cur.pb(cards[i]);
            permutate(cards, used, cur);
            used &= ~(1 << i); // turn off
            cur.pop_back();
        }
    }

    set<double> generate(const vi& cards, int L, int R) {
        if (L == R) return set<double>({(double)cards[L]});
        if (memo.count({L,R})) return memo[{L,R}];
        set<double> res;
        for (int i = L; i < R; i++) {
            set<double> left = generate(cards, L, i);
            set<double> right = generate(cards, i+1, R);
            for (auto& lx : left) {
                for (auto& rx : right) {
                    res.insert(lx + rx);
                    res.insert(lx - rx);
                    res.insert(lx * rx);
                    if (rx != 0) res.insert(lx / rx);
                }
            }
        }
        return memo[{L,R}] = res;
    }

    bool judgePoint24(vi& cards) {
        vi cur;
        permutate(cards, 0, cur);

        for (auto& cand : candidates) {
            memo.clear();
            set<double> sols = generate(cand, 0, sz(cand)-1);
            for (auto& x : sols) if (abs(x-24) < eps) return true;
        }
        return false;
    }
};
```

</details>

With four cards the whole search is tiny, so the redundancy of regenerating per permutation costs nothing here; on larger instances you would switch to picking any two values from a multiset and recursing, which avoids the permutation layer entirely.

### The same move on a string: Score of Parentheses

[LeetCode 856 — Score of Parentheses](https://leetcode.com/problems/score-of-parentheses/) is the same "recurse on a range" habit stripped down to one dimension. A balanced string $$S$$ is scored by three rules:

- $$\text{score}(\texttt{"()"}) = 1$$,
- $$\text{score}(A B) = \text{score}(A) + \text{score}(B)$$ for balanced $$A, B$$,
- $$\text{score}(\texttt{"("} A \texttt{")"}) = 2 \cdot \text{score}(A)$$ for balanced $$A$$.

Those rules already *are* a recursion on a range — the only work is deciding where one range ends and the next begins, and here the string tells you. Call a balanced string **primitive** if its first character's matching close is its last character. Every balanced string decomposes **uniquely** into a concatenation of primitives $$P_1 P_2 \cdots P_k$$, and the cut points are exactly the prefixes where the running balance (`+1` for `(`, `-1` for `)`) returns to zero for the first time since the last cut. So scan $$[L, R]$$ keeping `bal`; each time it hits $$0$$ you have closed off one primitive.

For a primitive $$P = \texttt{(}A\texttt{)}$$ there are only two cases: it has length $$2$$, so it is `"()"` and contributes $$1$$; or it is longer, and it contributes $$2 \cdot \text{score}(A)$$ where $$A$$ is the strictly interior range. That is the whole algorithm.

$$
\text{score}(L, R) = \sum_{j=1}^{k} \begin{cases}
1 & \text{if } P_j = \texttt{"()"} \\
2 \cdot \text{score}(\ell_j + 1,\ r_j - 1) & \text{otherwise}
\end{cases}
$$

where $$[\ell_j, r_j]$$ are the primitive blocks of $$[L, R]$$.

```cpp
int score(const string& s, int L, int R) {
    // score of s[L..R], assumed balanced
    int res = 0, bal = 0;
    for (int pivot = L; pivot <= R; pivot++) {
        bal += s[pivot] == '(' ? 1 : -1;
        if (bal == 0) {                 // s[L..pivot] is a primitive
            if (pivot - L == 1) res += 1;               // "()"
            else res += 2 * score(s, L + 1, pivot - 1); // "(" A ")"
            L = pivot + 1;              // next primitive starts here
        }
    }
    return res;
}
```

Note the mutation of `L` inside the loop: `pivot` keeps marching forward over the whole range while `L` tracks the start of the *current* primitive, so one pass both finds every cut point and supplies the correct interior range to each recursive call. No stack, no index map of matching brackets.

The cost is $$O(n^2)$$ in the worst case — a fully nested `((((...))))` peels one layer per call and rescans the rest — which is the same shape of redundancy as the range DP above, and perfectly fine at $$n \le 50$$. Writing it this way is worth it anyway, because it makes the structure explicit: *decompose the range into independent blocks, recurse into each block's interior, combine.* Once that is the mental model, the $$O(n)$$ one-pass solutions read as optimizations of it rather than tricks. Each `"()"` sitting at depth $$d$$ contributes $$2^d$$, since the $$d$$ enclosing pairs each double it — so a single scan that tracks depth and adds $$2^{d}$$ at every `"()"` computes the same sum, and the explicit-stack version is just this recursion with its frames made manual.

## Reachability DP {#reachability-dp}

Both DPs so far carry one value per state. Sometimes the right state is the _set_ of values still reachable, and the problem only asks whether a target is in it.

[Codeforces 2260D — Signs of Prefix Sums](https://codeforces.com/contest/2260/problem/D) is a compact problem worth pulling apart slowly, because it stacks two patterns that recur everywhere.

Take an array $$a_1, \dots, a_n$$ of **nonzero** integers and its prefix sums $$p_i = a_1 + \dots + a_i$$. Record only the sign of each prefix sum as a character: `+` if $$p_i > 0$$, `-` if $$p_i < 0$$, `0` if $$p_i = 0$$. That gives a string $$s$$ of length $$n$$. The **cost** of the array is $$\max_i \vert a_i \vert$$. Given $$s$$, find the minimum possible cost of a nonzero array that produces it, or $$-1$$ if none exists.

The two layers are: (1) turning "minimize the maximum" into a yes/no search, and (2) turning "is it feasible" into "is there a path." The second is the interesting one — it comes from choosing the _prefix sums themselves_ as the variables.

### Layer 1: minimize-the-max becomes a yes/no question

We are asked for the smallest $$x$$ such that a valid array exists with $$\max_i \vert a_i \vert \le x$$. Minimizing directly is awkward, so flip it into a predicate:

$$
\text{feasible}(x) = \text{"does a valid array exist using steps of size} \le x \text{?"}
$$

This predicate is **monotone**: a larger budget can only help, so the truth values run false, false, …, true, true, and the answer is the boundary. That is the standard move for every "minimize the maximum" (or "maximize the minimum") problem — you binary-search the boundary instead of optimizing directly.

Here the boundary is tiny, and it is worth seeing _why_.

**When is it $$-1$$?** Two local obstructions, both forced by "all $$a_i \ne 0$$":

- $$s_1 = $$ `0` is impossible, since $$p_1 = a_1 \ne 0$$.
- `00` anywhere is impossible, since $$p_i = 0 = p_{i+1}$$ forces $$a_{i+1} = 0$$.

If neither occurs, a valid array always exists — and in fact one of cost at most $$3$$.

**Why cost $$\le 3$$ always suffices.** Build the prefix sums directly. In each maximal run of one sign $$\sigma$$, alternate the magnitude between $$1$$ and $$2$$: $$\sigma\cdot 1, \sigma\cdot 2, \sigma\cdot 1, \dots$$; use $$0$$ for a `0`. Then

- consecutive values inside a run differ by $$1$$ (a step of $$1$$, and never zero);
- a run's endpoints have magnitude at most $$2$$, so stepping to or from a `0` costs at most $$2$$;
- flipping to the opposite sign steps from magnitude $$\le 2$$ to the next run's first value at magnitude $$1$$, a step of at most $$2 + 1 = 3$$.

Every step is $$\le 3$$ and every $$a_i \ne 0$$, so this is a valid array of cost $$\le 3$$.

**Why $$3$$ is sometimes forced.** Consider `+--+`. The middle `--` run has length two flanked by `+` on both sides. Its two negative prefix sums must be distinct, so one of them has magnitude $$\ge 2$$. Flipping between that magnitude-$$\ge 2$$ value and an opposite-sign value (magnitude $$\ge 1$$) costs at least $$2 + 1 = 3$$. So no array of cost $$2$$ exists; the minimum is exactly $$3$$.

So the answer is always $$-1$$, $$1$$, $$2$$, or $$3$$. We only have to test $$\text{feasible}(1)$$ and $$\text{feasible}(2)$$; if both fail, the answer is $$3$$. The search space is two candidates, but the reasoning is the same monotone-boundary argument that a full binary search would use.

### Layer 2: feasibility becomes reachability

Now fix a budget $$x$$ and ask whether a valid array exists. This is where choosing the right variable changes everything.

In **$$a$$-space**, the sign at position $$i$$ is the sign of $$a_1 + \dots + a_i$$ — a running total. So the constraint at $$i$$ couples $$a_i$$ to _every_ earlier element. Global constraints like that are hard to satisfy one step at a time.

Switch to **$$p$$-space**: treat the prefix sums $$p_1, \dots, p_n$$ as the variables, with $$p_0 = 0$$ and $$a_i = p_i - p_{i-1}$$. Now all three rules become **local**, relating only $$p_{i-1}$$ and $$p_i$$:

- **sign:** $$p_i > 0$$, $$< 0$$, or $$= 0$$ according to $$s_i$$;
- **nonzero element:** $$p_i \ne p_{i-1}$$ (that is $$a_i \ne 0$$);
- **budget:** $$\vert p_i - p_{i-1} \vert \le x$$ (that is $$\vert a_i \vert \le x$$).

Once every constraint touches only an adjacent pair, the problem is a **layered graph**. Layer $$i$$ holds the candidate values for $$p_i$$; put an edge from value $$v$$ in layer $$i-1$$ to value $$w$$ in layer $$i$$ exactly when the pair $$(v, w)$$ is legal ($$w \ne v$$, $$\vert w - v \vert \le x$$, and $$w$$ has sign $$s_i$$). Start from a single source, $$p_0 = 0$$ in layer $$0$$. Then

$$
\text{feasible}(x) \iff \text{there is a path from the source through every layer to layer } n.
$$

That is the whole reframing: _global constraints on the array became local constraints on the prefix sums, and local constraints are a graph you can walk._ Filling the array left to right is now just extending a path one layer at a time.

### Carry a set of values, not one

The tempting way to walk the layers is greedily: at each position pick the "best" value and move on. That fails, and `--+` (with budget $$x = 2$$) is the counterexample.

Greedy, hugging zero, sets $$p_1 = -1$$. Then $$p_2$$ must be negative, distinct from $$-1$$, within $$2$$ — so $$p_2 = -2$$. Now $$p_3$$ must be positive within $$2$$ of $$-2$$, but $$-2 + 2 = 0$$ is not positive: **dead end.** Yet a valid array exists: $$p = [-2, -1, 1]$$, with steps $$2, 1, 2$$, cost $$2$$. The right first move ($$-2$$, which looks worse) was the one greedy threw away, because the correct choice at position $$1$$ depends on what happens at position $$3$$.

The fix is to _not choose_. Carry forward **every** value that could still be the last element of a valid prefix — the set of reachable states in this layer. In the code that set is `cur`. You have deferred the decision, and the constraints will kill the states that lead nowhere. That is exactly the difference between greedy and DP: greedy commits to one path, DP keeps all viable states alive at once.

Concretely, with $$\text{reach}_i$$ the set of achievable values for $$p_i$$:

$$
\text{reach}_0 = \{0\}, \qquad
\text{reach}_i = \bigl\{\, w : \operatorname{sign}(w) = s_i,\ \exists\, v \in \text{reach}_{i-1},\ w \ne v,\ \vert w - v \vert \le x \,\bigr\},
$$

and the answer at budget $$x$$ is "$$\text{reach}_n$$ is non-empty." Keeping `--+` honest: $$\text{reach}_1 = \{-1, -2\}$$, and from $$-2$$ we can reach $$-1$$, so $$\text{reach}_2 \ni -1$$, from which $$+1 \in \text{reach}_3$$. The set kept $$-1$$ alive even though the greedy path lost it.

**What type of DP is this?** It is a **reachability (feasibility) DP over a layered DAG**: a boolean table $$\text{dp}[i][v] = $$ "can $$p_i = v$$," where each entry is an OR over legal predecessors. Rolling two boolean arrays (`cur`, `nxt`) is just the space-optimized, one-layer-at-a-time version of that table — literally breadth-first reachability on an implicit graph. If the question were _how many_ arrays rather than _whether one exists_, you would swap the OR for a sum; the shape is identical. (That boolean-vs-count duality is the same one behind subset-sum feasibility versus counting.)

**Why the set stays small.** A value only matters for what move it permits next. To flip sign next step you must be within $$x$$ of zero, and to land on `0` you must be within $$x$$ of zero; a value far from zero can only continue in the same sign. Since we only ask whether _some_ valid array exists, we never need to wander past magnitude $$x + 1$$: a same-sign value at magnitude $$x+1$$ can make every move a farther value could that we would actually use. So each $$\text{reach}_i$$ fits inside $$[-(x+1),\, x+1]$$ — at most $$2x + 3$$ values (the code keeps a slightly wider cushion). With $$x \le 2$$ the frontier is under a dozen slots wide.

### Complexity

For a fixed budget, each layer pairs a frontier of width $$w = O(x)$$ against the next, so one feasibility check is $$O(n \cdot w^2)$$. Here $$w \le 9$$, so it is effectively linear with a tiny constant, and we run it for $$x \in \{1, 2\}$$ — comfortably within $$n$$ up to $$3 \cdot 10^5$$.

### Implementation

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
const int MOD = 998244353; // 1e9+7


void preprocess() {

}

void solve() {
    int n; cin >> n;
    string s; cin >> s;

    // a[i] must be nonzero
    if (s[0] == '0') { cout << -1 << '\n'; return; }
    REP(i, n - 1) if (s[i] == '0' && s[i + 1] == '0') { cout << -1 << '\n'; return; }

    auto chksign = [&](int v, char c) {
        if (c == '+') return v > 0;
        if (c == '-') return v < 0;
        return v == 0;
    };

    auto check = [&](int x) {
        int k = x+2, m = 2*k+1; // shifted for negative values
        vector<char> cur(m, 0), nxt(m, 0);
        FOR(v, -k, k) if (abs(v) <= x && chksign(v, s[0])) cur[v+k] = 1;
        FOR(i, 1, n-1) {
            fill(all(nxt), 0);
            bool any = false;
            FOR(v, -k, k) {
                if (!cur[v+k]) continue;
                FOR(w, -k, k) {
                    if (w == v || abs(w-v) > x) continue;
                    if (!chksign(w, s[i])) continue;
                    nxt[w+k] = 1;
                    any = true;
                }
            }
            if (!any) return false;
            cur.swap(nxt);
        }
        REP(v, m) if (cur[v]) return true;
        return false;
    };

    FOR(x, 1, 2) if (check(x)) { cout << x << '\n'; return; }
    cout << 3 << '\n';
}

int main() {
    // freopen("name.in", "r", stdin);
    // freopen("name.out", "w", stdout);
    ios::sync_with_stdio(0);
    cin.tie(0);
    preprocess();
    int tt = 1;
    cin >> tt;
    while (tt--) solve();
    return 0;
}
```

</details>

The first layer uses $$\vert v \vert \le x$$ because $$p_1 = a_1$$; later layers only bound the _step_ $$\vert w - v \vert \le x$$, with values clamped to $$[-(x+2),\, x+2]$$ by the domination argument. `cur`/`nxt` are the rolling frontier, indexed by $$v + k$$ so negative values fit in an array. If a layer's frontier ever empties, the budget is infeasible.

### Recognizing the same two moves next time

Both layers travel well beyond this problem, and each has a trigger you can watch for.

The first is a reflex for any objective phrased as **minimize the maximum** or **maximize the minimum**. Stop optimizing the quantity and ask a yes/no question about a budget instead: "is a valid object achievable with everything bounded by $$x$$?" Feasibility is monotone in the budget, so the answer is a boundary you can locate — by binary search in general, or, as here, by checking a couple of candidates once the range is pinned down. Whenever the thing you are minimizing is itself a maximum (or vice versa), this conversion is available.

The second move is the one that made the problem tractable. When a rule couples all the variables through a **running aggregate** — a prefix sum here, but equally a running maximum, a prefix XOR, a running gcd, or a balance counter — make that aggregate the variable rather than the raw array. What changes is the _reach_ of the constraints. Stated on the array, "the sign of $$a_1 + \dots + a_i$$" looks back across the entire prefix. Stated on the aggregate, "the sign of $$p_i$$, with $$p_i - p_{i-1}$$ nonzero and bounded" touches only two neighbors. Global constraints collapse to local ones, and a chain of local constraints is a layered graph.

Once you are on that graph the finish writes itself: "does a valid object exist" is "is there a path from the source to the last layer." A reachability DP walks it by keeping, at each position, the entire set of values still consistent with everything seen so far — committing to none, letting the constraints prune the rest — and a domination argument keeps that set small enough to be linear. Replace the boolean OR with a sum and the very same walk counts the objects instead of merely detecting one.

So the outline to reach for, when an optimization that is secretly a max-or-min sits on top of a constraint that couples everything through a running total: peel the optimization into a feasibility search, promote the running total to the variable so the constraints go local, then walk the resulting graph. It is the same instinct — carry a compressed running total and let it drive the transitions — behind [digit DP](#digit-dp), where the running total is the value taken $$\bmod\ k$$, and behind [prefix XOR hashing](/blog/hashing/#xor-hashing), where it is the XOR of a prefix. Three aggregates, one habit.

## Maximum Subarray from a Range Update {#maximum-subarray}

The last one is the oldest DP on this page, Kadane's maximum subarray, reached from a problem that does not look like one at first.

[Codeforces 1082E — Increasing Frequency](https://codeforces.com/contest/1082/problem/E) (rated **2000**) reduces to a maximum subarray problem. This writeup derives that reduction and the $$O(n)$$ implementation.

### The problem

Given an array $$a$$ of length $$n$$, pick one segment $$[l, r]$$ and one integer $$k$$ (positive, negative, or zero) and add $$k$$ to every element in that segment. Maximize the number of elements equal to a fixed target $$c$$ after the operation. Constraints: $$n \le 5 \cdot 10^5$$, so we want $$O(n)$$ or $$O(n \log n)$$.

### The effect of one operation

Fix the segment $$[l, r]$$ and the shift $$k$$, and split the array into "inside the segment" and "outside."

- **Outside** $$[l, r]$$ nothing moves, so every element that already equals $$c$$ stays counted.
- **Inside** $$[l, r]$$ every element gains $$k$$. An element ends at $$c$$ exactly when it _started_ at $$c - k$$. Meanwhile the elements that were already $$c$$ get shifted to $$c + k$$ and are lost (unless $$k = 0$$).

So if `tot` is the number of $$c$$'s in the whole array, the count after the operation is

$$\text{tot} \;-\; \underbrace{(\#\,c \text{ inside } [l,r])}_{\text{shifted away}} \;+\; \underbrace{(\#\,(c-k) \text{ inside } [l,r])}_{\text{shifted onto } c}.$$

Everything outside the segment is already counted in `tot`. Within the chosen window, the operation trades the $$c$$'s it destroys for the $$(c-k)$$'s it creates.

### Reducing to a maximum subarray

Fix the value to convert, $$v = c - k$$. Once $$v$$ is fixed, $$k$$ is fixed too, and only the window remains to be chosen. Assign each position a weight:

$$w_i = \begin{cases} +1 & a_i = v \quad(\text{becomes } c) \\ -1 & a_i = c \quad(\text{was } c, \text{ now lost}) \\ \phantom{+}0 & \text{otherwise} \end{cases}$$

The amount added to `tot` is the sum of $$w_i$$ over the window $$[l, r]$$. Maximizing it over all windows is the maximum-subarray problem (Kadane), and the empty gain $$0$$ (take $$k = 0$$) is always available, so the answer is never below `tot`.

$$\text{answer} = \text{tot} + \max_{v \ne c}\Bigl(\text{best subarray sum of the } {+}1/{-}1 \text{ weights for } v\Bigr).$$

Running Kadane once per distinct value would be $$O(n)$$ per value, or $$O(n \cdot \text{distinct})$$ overall — too slow when many values appear.

### Doing every value in O(n) total

The rescue is that for a fixed $$v$$, almost every weight is $$0$$. Only the positions where $$a_i = v$$ (the $$+1$$'s) and where $$a_i = c$$ (the $$-1$$'s) matter, and an optimal window would never _start_ or _end_ on a $$-1$$ or a $$0$$ — you'd just trim it. So the window can always begin and end on an occurrence of $$v$$.

That lets us walk only the occurrences of $$v$$. Let `pref[i]` be the number of $$c$$'s in $$a[0..i]$$, and let $$v$$ occur at positions $$p_0 < p_1 < \dots < p_{m-1}$$. Extending a window from occurrence $$p_{i-1}$$ to the next occurrence $$p_i$$ adds one fresh $$+1$$ (for the new $$v$$) and subtracts however many $$c$$'s sit strictly between them. This is the `add[]` array in the code:

$$\text{add}[i] = 1 - \bigl(\text{pref}[p_i] - \text{pref}[p_{i-1}]\bigr), \qquad \text{add}[0] = 1.$$

`kadane` runs the standard scan over `add[]`, with one twist: restarting a window at occurrence $$i$$ is worth $$1$$, not $$\text{add}[i]$$, since a fresh start doesn't pay for the $$c$$'s before it — hence `z = max(1, z + add[i])` instead of the usual `max(0, ...)`.

Because the occurrence lists across all values partition the non-$$c$$ elements, the total work over every value is $$\sum_v m_v = O(n)$$.

### Implementation

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
void preprocess() {

}

void solve() {
    int n, c; cin >> n >> c;
    vi a(n);
    REP(i, n) cin >> a[i];
    if (n == 1) { cout << 1 << '\n'; return; }

    // prefix count of c
    vi pref(n, 0);
    REP(i, n) pref[i] = (i > 0 ? pref[i-1] : 0) + (a[i] == c);

    // position mapping for c-k
    map<int, vi> pos;
    REP(i, n) if (a[i] != c) pos[a[i]].pb(i);

    auto kadane = [&](const vi& add) {
        // try extend (..v[i]] to (v[i+1]..v[i+2]]
        int best = 0, z = 0;
        REP(i, sz(add)) {
            // extend or start new from v[i]
            z = max(1, z + add[i]);
            best = max(best, z);
        }
        return best;
    };

    int tot = pref[n-1], ans = tot;
    for (auto& [x, v] : pos) {
        // if include range [v[i]..v[i+1]], we gain 1 - (pref[v[i+1]] - pref[v[i]])
        vi add(sz(v), 1); // add[0] = [-oo,0] = 1
        REP(i, sz(v)-1) add[i+1] = 1 - (pref[v[i+1]] - pref[v[i]]);

        int gain = kadane(add);
        ans = max(ans, tot + gain);
    }
    cout << ans << '\n';
}

int main() {
    // freopen("name.in", "r", stdin);
    // freopen("name.out", "w", stdout);
    ios::sync_with_stdio(0);
    cin.tie(0);
    preprocess();
    int tt = 1;
    // cin >> tt;
    while (tt--) solve();
    return 0;
}
```

</details>

### Complexity

- Prefix counts: $$O(n)$$.
- Grouping occurrences and the per-value Kadane: $$O(n)$$ work plus the `map`'s $$O(n \log n)$$ (swap in a size-$$5\cdot10^5$$ bucket array for a clean $$O(n)$$).
- Space: $$O(n)$$.

### Takeaways

- A single range-add that maximizes a target count factors into _outside stays fixed, inside trades old $$c$$'s for new ones_ — a $$+1/-1$$ balance.
- That balance is a **maximum subarray**: answer $$= \text{tot} + \max_v \text{Kadane}(v)$$.
- Only occurrences carry weight, so a **prefix count of $$c$$** collapses per-value Kadane onto the occurrence lists, giving $$O(n)$$ across all values.

## From the Notebook {#notebook}

Implementations from my [competitive programming notebook](https://github.com/lamng3/competitive-programming-notebook), tagged with their [USACO Guide](https://usaco.guide/) level where they have one.

- **Dynamic programming** (gold). [`3418.cpp`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/examples/dynamic_programming/3418.cpp): One DP writeup. [`usaco/dp/`](https://github.com/lamng3/competitive-programming-notebook/blob/main/contests/usaco/dp): DP solutions. [`dp_on_tree/`](https://github.com/lamng3/competitive-programming-notebook/blob/main/contests/leetcode/solve/dp_on_tree): Tree DP solutions. [`lis/`](https://github.com/lamng3/competitive-programming-notebook/blob/main/contests/leetcode/solve/lis): Longest increasing subsequence.

## Practice {#practice}

**Digit DP**

- [LeetCode 2827 — Number of Beautiful Integers in the Range](https://leetcode.com/problems/number-of-beautiful-integers-in-the-range/)
- [LeetCode 902 — Numbers At Most N Given Digit Set](https://leetcode.com/problems/numbers-at-most-n-given-digit-set/)
- [LeetCode 600 — Non-negative Integers without Consecutive Ones](https://leetcode.com/problems/non-negative-integers-without-consecutive-ones/)
- [Codeforces 1036C — Classy Numbers](https://codeforces.com/problemset/problem/1036/C)

**Range DP**

- [LeetCode 679 — 24 Game](https://leetcode.com/problems/24-game/)
- [LeetCode 241 — Different Ways to Add Parentheses](https://leetcode.com/problems/different-ways-to-add-parentheses/)
- [LeetCode 312 — Burst Balloons](https://leetcode.com/problems/burst-balloons/)
- [LeetCode 856 — Score of Parentheses](https://leetcode.com/problems/score-of-parentheses/)

**Reachability DP**

- [Codeforces 2260D — Signs of Prefix Sums](https://codeforces.com/contest/2260/problem/D) (the problem above)
- [LeetCode 416 — Partition Equal Subset Sum](https://leetcode.com/problems/partition-equal-subset-sum/) (boolean reachability DP — carry the set of reachable sums)
- [LeetCode 494 — Target Sum](https://leetcode.com/problems/target-sum/) (the counting sibling: OR becomes +)
- [LeetCode 926 — Flip String to Monotone Increasing](https://leetcode.com/problems/flip-string-to-monotone-increasing/) (per-position feasibility DP)

**Maximum Subarray from a Range Update**

- [Codeforces 1082E — Increasing Frequency](https://codeforces.com/contest/1082/problem/E)
- [LeetCode 53 — Maximum Subarray](https://leetcode.com/problems/maximum-subarray/)
- [CSES — Maximum Subarray Sum](https://cses.fi/problemset/task/1643)
- [LeetCode 1749 — Maximum Absolute Sum of Any Subarray](https://leetcode.com/problems/maximum-absolute-sum-of-any-subarray/)

## Further reading {#further-reading}

**Reachability DP**

- [Competitive Programmer's Handbook](https://cses.fi/book/book.pdf), ch. 7 (DP) — the reachability/counting DP template in its plainest form.
- [USACO Guide — Introduction to DP](https://usaco.guide/gold/intro-dp).
- [Codeforces — Everything About Dynamic Programming](https://codeforces.com/blog/entry/43256).
