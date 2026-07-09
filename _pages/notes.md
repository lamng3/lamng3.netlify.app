---
layout: default
permalink: /notes/
title: notes
nav: false
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
    {% comment %} Always use site.notes to ensure we only show notes from the notes collection, not blog posts {% endcomment %}
    {% comment %} With jekyll-paginate-v2, when collection: notes is set, paginator.posts should contain notes {% endcomment %}
    {% comment %} However, to ensure we only show notes, we'll use site.notes directly {% endcomment %}
    {% if page.pagination.enabled %}
      {% assign notelist = paginator.posts %}
    {% else %}
      {% assign notelist = site.notes | sort: 'date' | reverse %}
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
