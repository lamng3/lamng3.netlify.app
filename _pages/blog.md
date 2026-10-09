---
layout: default
permalink: /blog/
title: Blog
description: Notes on algorithms, data structures, and math, from my competitive programming years.
---

<header>
  <h1>Blog</h1>
  <p class="lede">Notes on algorithms, data structures, and math from my competitive programming years. They are the tools I still reach for when thinking about retrieval and databases.</p>
</header>

{% assign by_year = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}
{% for year in by_year %}
  <h3>{{ year.name }}</h3>
  <ul class="post-list">
    {% for post in year.items %}
      <li>
        <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
        <time datetime="{{ post.date | date: '%Y-%m-%d' }}">{{ post.date | date: "%B %d" }}</time>
      </li>
    {% endfor %}
  </ul>
{% endfor %}
