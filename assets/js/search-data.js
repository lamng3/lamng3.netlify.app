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
  },{id: "nav-publications",
          title: "publications",
          description: "publications &amp; preprints",
          section: "Navigation",
          handler: () => {
            window.location.href = "/publications/";
          },
        },{id: "nav-blog",
          title: "blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog/";
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
          window.open("https://www.linkedin.com/in/ltn18", "_blank");
        },
      },{
        id: 'social-scholar',
        title: 'Google Scholar',
        section: 'Socials',
        handler: () => {
          window.open("https://scholar.google.com/citations?user=ws80Q0IAAAAJ", "_blank");
        },
      },];
