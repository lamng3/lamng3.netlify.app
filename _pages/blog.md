---
layout: default
permalink: /blog/
title: Blog
description: Study notes on algorithms, data structures, and the systems built on them, and where they turn up again in agentic memory.
---

<header>
  <h1>Blog</h1>
  <p class="lede">Study notes on algorithms, data structures, and the systems built on them, and where they turn up again in agentic memory.</p>
</header>

<ul class="post-list">
  {% for topic in site.data.topics %}
    {% assign topic_url = '/blog/' | append: topic.slug | append: '/' %}
    {% assign topic_page = site.pages | where: 'url', topic_url | first %}
    <li>
      <a href="{{ topic_url | relative_url }}">{{ topic.title }}</a>
      <time datetime="{{ topic_page.last_updated | date: '%Y-%m-%d' }}">{{ topic_page.last_updated | date: "%B %d, %Y" }}</time>
    </li>
  {% endfor %}
</ul>
