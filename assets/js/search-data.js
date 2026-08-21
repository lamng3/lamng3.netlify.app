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
        },{id: "post-the-möbius-function",
        
          title: "The Möbius Function",
        
        description: "The Möbius function mu(n) from the ground up — the sign flip that gives (-1)^k for k distinct primes, why a single squared prime forces mu(n) = 0, and a sieve that computes it for all n up to N in O(N log N) by propagating each value to its multiples.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/mobius-function/";
          
        },
      },{id: "post-from-range-update-to-maximum-subarray",
        
          title: "From Range Update to Maximum Subarray",
        
        description: "Add k to one segment of an array to maximize how many elements equal c. The operation&#39;s net effect is a +1/-1 balance, which reduces the problem to a maximum subarray (Kadane), and a prefix count of c solves it for every value in O(n) total.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/increasing-frequency-maximum-subarray/";
          
        },
      },{id: "post-segment-tree-walk-and-amortized-allocation",
        
          title: "Segment Tree Walk and Amortized Allocation",
        
        description: "A cp-algorithms-style deep dive into Booking Concert Tickets in Groups — modeling seat allocation as a sum/max monoid on a segment tree, replacing a binary-searched range-max with an O(log n) descent (the &quot;segment tree walk&quot;), and proving the greedy scatter is O(log n) amortized via a potential argument on a monotone head pointer.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/segment-tree-walk-amortized-allocation/";
          
        },
      },{id: "post-segment-trees-one-node-at-a-time",
        
          title: "Segment Trees, One Node at a Time",
        
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
      },{id: "post-persistency-keeping-old-versions-around",
        
          title: "Persistency: Keeping Old Versions Around",
        
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
