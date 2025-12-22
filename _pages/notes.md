---
layout: default
permalink: /notes/
title: notes
nav: true
nav_order: 4
pagination:
  enabled: true
  collection: notes
  permalink: /notes/page/:num/
  per_page: 10
  sort_field: date
  sort_reverse: true
---

<div class="notes-page">
  <div class="notes-header">
    <h1>Notes</h1>
    <p class="notes-subtitle">Reflections, thoughts, and contemplations</p>
  </div>

  <div class="notes-list">
    {% if page.pagination.enabled %}
      {% assign notelist = paginator.posts %}
    {% else %}
      {% assign notelist = site.notes %}
    {% endif %}

    {% for note in notelist %}
      <article class="note-item">
        <a href="{{ note.url | relative_url }}" class="note-link">
          <h2 class="note-title">{{ note.title }}</h2>
          <time class="note-date">{{ note.date | date: '%B %d, %Y' }}</time>
        </a>
      </article>
    {% endfor %}

  </div>

{% if page.pagination.enabled %}
{% include pagination.liquid %}
{% endif %}

</div>
