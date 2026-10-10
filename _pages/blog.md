---
layout: default
permalink: /blog/
title: Blog
description: Algorithms, data structures, and math, grouped by technique, from my competitive programming years.
---

<header>
  <h1>Blog</h1>
  <p class="lede">Algorithms, data structures, and math from my competitive programming years, grouped by technique. Each topic is one page, with a table of contents to move between techniques.</p>
</header>

<section id="pinned">
  <h2>Pinned</h2>
  <ul class="post-list">
    <li><a href="{{ '/blog/selected-leetcode-problems/' | relative_url }}">Selected LeetCode Problems</a></li>
    <li><a href="{{ '/blog/databases/#persistence' | relative_url }}">Persistence: Keeping Old Versions Around</a></li>
  </ul>
</section>

{% for area in site.data.topics %}
  <section>
    <h2>{{ area.area }}</h2>
    {% for topic in area.topics %}
      <h3><a href="{{ '/blog/' | append: topic.slug | append: '/' | relative_url }}">{{ topic.title }}</a></h3>
      <ul class="post-list">
        {% for section in topic.sections %}
          <li><a href="{{ '/blog/' | append: topic.slug | append: '/#' | append: section.id | relative_url }}">{{ section.title }}</a></li>
        {% endfor %}
      </ul>
    {% endfor %}
  </section>
{% endfor %}
