---
layout: default
permalink: /blog/
title: Blog
description: Study notes on algorithms, data structures, and the systems built on them, organized by topic.
---

<header>
  <h1>Blog</h1>
  <p class="lede">Study notes on algorithms, data structures, and the systems built on them. Each topic is one page, and each technique on it starts from a problem: the first idea, why it breaks, and the observation that fixes it.</p>
</header>

{% for area in site.data.topics %}
  <section>
    <h2>{{ area.area }}</h2>
    {% for topic in area.topics %}
      {% assign topic_url = '/blog/' | append: topic.slug | append: '/' | relative_url %}
      {% if topic.sections.size > 0 %}
        <details class="topic">
          <summary><a href="{{ topic_url }}">{{ topic.title }}</a></summary>
          <ul class="post-list">
            {% for section in topic.sections %}
              <li><a href="{{ topic_url | append: '#' | append: section.id }}">{{ section.title }}</a></li>
            {% endfor %}
          </ul>
        </details>
      {% else %}
        <p class="topic"><a href="{{ topic_url }}">{{ topic.title }}</a></p>
      {% endif %}
    {% endfor %}
  </section>
{% endfor %}
