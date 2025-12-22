---
layout: default
permalink: /blog/
title: blog
nav: true
nav_order: 3
pagination:
  enabled: true
  collection: posts
  permalink: /page/:num/
  per_page: 20
  sort_field: date
  sort_reverse: true
---

<div class="blog-page">
  <div class="blog-header">
    <h1>{{ site.blog_name }}</h1>
    {% if site.blog_description %}
      <p class="blog-subtitle">{{ site.blog_description }}</p>
    {% endif %}
  </div>

  <div class="blog-list">
    {% if page.pagination.enabled %}
      {% assign postlist = paginator.posts %}
    {% else %}
      {% assign postlist = site.posts | sort: 'date' | reverse %}
    {% endif %}

    {% for post in postlist %}
      <article class="blog-item">
        <a href="{{ post.url | relative_url }}" class="blog-link">
          <h2 class="blog-title">{{ post.title }}</h2>
          <time class="blog-date">{{ post.date | date: '%B %d, %Y' }}</time>
        </a>
      </article>
    {% endfor %}

  </div>

{% if page.pagination.enabled %}
{% include pagination.liquid %}
{% endif %}

</div>
