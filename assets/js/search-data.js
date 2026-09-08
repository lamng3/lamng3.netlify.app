// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-blog",
          title: "blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog/";
          },
        },{id: "post-reachability-dp-make-the-prefix-sum-the-variable",
        
          title: "Reachability DP: Make the Prefix Sum the Variable",
        
        description: "Codeforces &quot;Signs of Prefix Sums&quot; stacks two reusable patterns — minimize-the-max becomes a feasibility question you can search, and feasibility becomes reachability once you treat the prefix sums (not the array) as the variables, which turns global constraints into local ones and lets a small reachability DP walk the answer.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/make-prefix-sum-the-variable/";
          
        },
      },{id: "post-compressed-sparse-row-a-flat-adjacency-list",
        
          title: "Compressed Sparse Row: A Flat Adjacency List",
        
        description: "CSR is a data layout, not an algorithm — the standard flat way to store n groups of variable size in one contiguous array plus an offset table. Its build is a counting sort, it replaces vector&gt; for a 2-3x speedup on graph-heavy problems, and the whole thing is O(n + m).",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/compressed-sparse-row/";
          
        },
      },{id: "post-digit-dp-choosing-the-right-state",
        
          title: "Digit DP: Choosing the Right State",
        
        description: "Count integers in [low, high] whose digits are half even, half odd and that are divisible by k (LeetCode 2827). The whole difficulty is deciding what to remember as you build a number digit by digit — carry the remainder mod k, not the number, and the even-minus-odd difference, not two counts.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/digit-dp-choosing-state/";
          
        },
      },{id: "post-degrees-of-freedom-counting-binary-grids",
        
          title: "Degrees of Freedom: Counting Binary Grids",
        
        description: "Count the binary matrices whose every r×c window has an even number of ones (Codeforces 2240B). Each window is one XOR equation that forces a single cell, so the free cells form an L-shaped border and the answer is just 2 raised to the number of free cells.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/counting-grid-degrees-of-freedom/";
          
        },
      },{id: "post-hashing-rolling-and-xor",
        
          title: "Hashing: Rolling and XOR",
        
        description: "Two ways to fingerprint data with a single integer. A polynomial rolling hash identifies an ordered sequence and gives any substring&#39;s hash in O(1); XOR / Zobrist hashing identifies an unordered set and is recoverable by prefix XOR. Plus how to scramble keys so an adversary can&#39;t force collisions.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/rolling-and-xor-hashing/";
          
        },
      },{id: "post-range-dp-every-parenthesization-by-splitting",
        
          title: "Range DP: Every Parenthesization by Splitting",
        
        description: "Working through LeetCode 679 (the 24 Game) — generate operand orders by backtracking with a bitmask, enumerate every parenthesization by splitting a range instead of placing brackets (the range-DP idea), and handle real division either with an epsilon or, exactly, with rational arithmetic.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/permutations-parenthesizations-precision/";
          
        },
      },{id: "post-tree-counting-the-meeting-vertex",
        
          title: "Tree Counting: The Meeting Vertex",
        
        description: "In a tree, the three pairwise paths of a triplet {u,v,w} share exactly one vertex, and every other vertex lies on either zero or two of them. That parity fact collapses Codeforces 2241E to a per-vertex count, which an online elementary-symmetric-polynomial scan finishes in O(n).",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/tree-triplets-meeting-vertex/";
          
        },
      },{id: "post-digit-counting-the-n-th-digit-of-a-concatenation",
        
          title: "Digit Counting: The N-th Digit of a Concatenation",
        
        description: "Write the positive integers back to back — 123456789101112… — and locate the n-th digit without materializing the string. Count digits in blocks by number length, jump to the block that contains position n, then read off the exact number and digit in O(log n).",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/nth-digit-concatenated-sequence/";
          
        },
      },{id: "post-möbius-function-the-sign-flip-and-its-sieve",
        
          title: "Möbius Function: The Sign Flip and Its Sieve",
        
        description: "The Möbius function mu(n) from the ground up — the sign flip that gives (-1)^k for k distinct primes, why a single squared prime forces mu(n) = 0, and a sieve that computes it for all n up to N in O(N log N) by propagating each value to its multiples.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/mobius-function/";
          
        },
      },{id: "post-maximum-subarray-from-a-range-update",
        
          title: "Maximum Subarray: From a Range Update",
        
        description: "Add k to one segment of an array to maximize how many elements equal c. The operation&#39;s net effect is a +1/-1 balance, which reduces the problem to a maximum subarray (Kadane), and a prefix count of c solves it for every value in O(n) total.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/increasing-frequency-maximum-subarray/";
          
        },
      },{id: "post-segment-tree-walk-descending-to-the-answer",
        
          title: "Segment Tree Walk: Descending to the Answer",
        
        description: "A cp-algorithms-style deep dive into Booking Concert Tickets in Groups — modeling seat allocation as a sum/max monoid on a segment tree, replacing a binary-searched range-max with an O(log n) descent (the &quot;segment tree walk&quot;), and proving the greedy scatter is O(log n) amortized via a potential argument on a monotone head pointer.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/segment-tree-walk-amortized-allocation/";
          
        },
      },{id: "post-segment-tree-one-node-at-a-time",
        
          title: "Segment Tree: One Node at a Time",
        
        description: "A different way to think about segment trees — as a tree of nodes, each holding a small summary that merges from its children. Once you see it that way, the &quot;store more per node&quot; trick and the dynamic/sparse segment tree over a billion-wide range both fall out naturally.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/segment-tree-nodes-dynamic-sparse/";
          
        },
      },{id: "post-pie-principle-of-inclusion-exclusion",
        
          title: "PIE: Principle of Inclusion-Exclusion",
        
        description: "A gentle build-up to the Principle of Inclusion-Exclusion, followed by a clean proof that every element in the union is counted exactly once — the whole thing falling out of the binomial theorem applied to (1 - 1)^k.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/principle-of-inclusion-exclusion/";
          
        },
      },{id: "post-persistence-keeping-old-versions-around",
        
          title: "Persistence: Keeping Old Versions Around",
        
        description: "A simple look at persistent data structures — the snapshot array, the persistent segment tree, persistent queues, and how the same idea shows up in databases as MVCC and copy-on-write B-trees.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/persistency-data-structures-databases/";
          
        },
      },{id: "books-the-godfather",
          title: 'The Godfather',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/the_godfather/";
            },},{id: "news-see-what-topics-i-am-exploring",
          title: 'See what topics I am exploring',
          description: "",
          section: "News",handler: () => {
              window.location.href = "/news/announcement_2/";
            },},{id: "news-i-am-joining-microsoft-as-a-software-engineer-in-redmond-wa-sparkles-smile",
          title: 'I am joining Microsoft as a Software Engineer in Redmond, WA! :sparkles: :smile:...',
          description: "",
          section: "News",},{id: "notes-first-reflection",
          title: 'First Reflection',
          description: "",
          section: "Notes",handler: () => {
              window.location.href = "/notes/2025/first-reflection/";
            },},{id: "projects-project-1",
          title: 'project 1',
          description: "with background image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/1_project/";
            },},{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/lamng3", "_blank");
        },
      },{
        id: 'social-leetcode',
        title: 'LeetCode',
        section: 'Socials',
        handler: () => {
          window.open("https://leetcode.com/u/triplethread/", "_blank");
        },
      },{
        id: 'social-chess_username',
        title: 'Chess_username',
        section: 'Socials',
        handler: () => {
          window.open("", "_blank");
        },
      },{
        id: 'social-linkedin',
        title: 'LinkedIn',
        section: 'Socials',
        handler: () => {
          window.open("https://www.linkedin.com/in/lamng3", "_blank");
        },
      },{
        id: 'social-scholar',
        title: 'Google Scholar',
        section: 'Socials',
        handler: () => {
          window.open("https://scholar.google.com/citations?user=ws80Q0IAAAAJ", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
