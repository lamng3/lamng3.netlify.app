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

{% assign pinned = site.posts | where: "pinned", true %}
{% if pinned.size > 0 %}
  <h3>Pinned</h3>
  <ul class="post-list">
    {% for post in pinned %}
      <li>
        <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
        <time datetime="{{ post.date | date: '%Y-%m-%d' }}">{{ post.date | date: "%B %d, %Y" }}</time>
      </li>
    {% endfor %}
  </ul>
{% endif %}
{% assign unpinned = site.posts | where_exp: "post", "post.pinned != true" %}
{% assign by_year = unpinned | group_by_exp: "post", "post.date | date: '%Y'" %}
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
