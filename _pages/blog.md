---
layout: default
permalink: /blog/
title: blog
nav: true
nav_order: 3
pagination:
  enabled: false
---

<div class="blog-page">
  <div class="blog-header">
    <h1>{{ site.blog_name }}</h1>
    {% if site.blog_description %}
      <p class="blog-subtitle">{{ site.blog_description }}</p>
    {% endif %}
  </div>

{% assign categories = site.categories | sort %}
{% if categories.size > 0 %}

<nav class="blog-categories">
<a href="{{ '/blog/' | relative_url }}" class="cat-chip cat-chip-all">All</a>
{% for cat in categories %}
<a href="{{ cat[0] | slugify | prepend: '/blog/category/' | append: '/' | relative_url }}" class="cat-chip">
{{ cat[0] }}<span class="cat-count">{{ cat[1].size }}</span>
</a>
{% endfor %}
</nav>
{% endif %}

{% assign posts_sorted = site.posts | sort: 'date' | reverse %}
{% assign by_month = posts_sorted | group_by_exp: "p", "p.date | date: '%Y-%m'" %}

{% if posts_sorted.size > 0 %}

<div class="blog-layout">
<div class="blog-main">
{% for group in by_month %}
{% assign label = group.items.first.date | date: '%B %Y' %}
<h2 class="blog-month-heading" id="month-{{ group.name }}">{{ label }}</h2>
<div class="blog-list">
{% for post in group.items %}
<article class="blog-item">
<a href="{{ post.url | relative_url }}" class="blog-link">
<h3 class="blog-title">{{ post.title }}</h3>
<time class="blog-date">{{ post.date | date: '%B %d, %Y' }}</time>
</a>
</article>
{% endfor %}
</div>
{% endfor %}
</div>

      <aside class="blog-months-sidebar">
        <div class="blog-months-inner">
          <div class="blog-months-title">Months</div>
          <nav class="blog-months-nav">
            {% for group in by_month %}
              {% assign label = group.items.first.date | date: '%B %Y' %}
              <a href="#month-{{ group.name }}">{{ label }}</a>
            {% endfor %}
          </nav>
        </div>
      </aside>
    </div>

{% else %}

<p>No posts yet. Check back soon!</p>
{% endif %}

</div>
