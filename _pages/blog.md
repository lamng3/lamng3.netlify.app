---
layout: default
permalink: /blog/
title: Blog
description: Notes on data structures, algorithms, and mathematical topics.
---

<header>
  <h1>Blog</h1>
  <p class="lede">Notes on data structures, algorithms, and mathematical topics.</p>
</header>

<ul class="post-list">
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <time datetime="{{ post.date | date: '%Y-%m-%d' }}">{{ post.date | date: "%B %d, %Y" }}</time>
    </li>
  {% endfor %}
</ul>
