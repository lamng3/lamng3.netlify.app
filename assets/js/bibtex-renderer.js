/**
 * Simple BibTeX parser and renderer for GitHub Pages
 * Parses BibTeX entries and renders them in the al-folio publication format
 */

(function () {
  'use strict';

  // Simple BibTeX parser
  function parseBibTeX(bibtexText) {
    const entries = [];
    // Remove front matter if present
    let cleanText = bibtexText.replace(/^---[\s\S]*?---\s*/, '');
    
    // Match BibTeX entries - handle multiline entries
    const entryRegex = /@(\w+)\{([^,]+),([\s\S]*?)\n\}/g;
    let match;

    while ((match = entryRegex.exec(cleanText)) !== null) {
      const type = match[1];
      const key = match[2].trim();
      const fieldsText = match[3];

      const entry = { type, key, fields: {} };

      // Parse fields - handle multiline and nested braces
      const fieldRegex = /(\w+)\s*=\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
      let fieldMatch;
      while ((fieldMatch = fieldRegex.exec(fieldsText)) !== null) {
        const fieldName = fieldMatch[1];
        let fieldValue = fieldMatch[2];
        // Remove extra whitespace and newlines
        fieldValue = fieldValue.replace(/\s+/g, ' ').trim();
        entry.fields[fieldName] = fieldValue;
      }

      entries.push(entry);
    }

    return entries;
  }

  // Format authors
  function formatAuthors(authorString) {
    if (!authorString) return '';
    const authors = authorString.split(' and ').map((author) => {
      const parts = author.trim().split(',').map((p) => p.trim());
      if (parts.length === 2) {
        return parts[1] + ' ' + parts[0];
      }
      return author.trim();
    });
    return authors.join(', ');
  }

  // Render a single publication entry
  function renderPublication(entry, index) {
    const title = entry.title || '';
    const authors = formatAuthors(entry.author);
    const journal = entry.journal || entry.booktitle || '';
    const year = entry.year || '';
    const abbr = entry.abbr || '';
    const selected = entry.selected === true;

    let html = '<div class="row" id="' + entry.key + '">';

    // Abbreviation/thumbnail column
    if (abbr) {
      html += '<div class="col col-sm-2 abbr">';
      html += '<abbr class="badge rounded w-100">' + abbr + '</abbr>';
      html += '</div>';
    }

    // Main content column
    const colClass = abbr ? 'col-sm-8' : 'col-sm-10';
    html += '<div class="' + colClass + '">';

    // Title
    html += '<div class="title">' + title + '</div>';

    // Authors
    if (authors) {
      html += '<div class="author">' + authors + '</div>';
    }

    // Journal/venue and year
    if (journal || year) {
      html += '<div class="periodical">';
      if (journal) {
        html += '<em>' + journal + '</em>';
      }
      if (journal && year) {
        html += ', ';
      }
      if (year) {
        html += year;
      }
      html += '</div>';
    }

    // Links (if any)
    const links = [];
    if (entry.pdf) links.push({ text: 'PDF', url: entry.pdf });
    if (entry.code) links.push({ text: 'Code', url: entry.code });
    if (entry.html) links.push({ text: 'HTML', url: entry.html });
    if (entry.arxiv) links.push({ text: 'arXiv', url: entry.arxiv });
    if (entry.doi) links.push({ text: 'DOI', url: 'https://doi.org/' + entry.doi });

    if (links.length > 0) {
      html += '<div class="links">';
      links.forEach((link, i) => {
        html += '<a href="' + link.url + '" target="_blank" class="btn btn-sm z-depth-0" role="button">' + link.text + '</a>';
        if (i < links.length - 1) html += ' ';
      });
      html += '</div>';
    }

    html += '</div>'; // Close main content column
    html += '</div>'; // Close row

    return html;
  }

  // Main function to load and render publications
  function loadPublications() {
    const container = document.querySelector('.publications');
    if (!container) return;

    // Fetch the publications JSON file
    fetch('/assets/json/publications.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load publications');
        }
        return response.json();
      })
      .then((entries) => {
        // Sort by year (descending)
        entries.sort((a, b) => {
          const yearA = parseInt(a.year) || 0;
          const yearB = parseInt(b.year) || 0;
          return yearB - yearA;
        });

        // Render publications
        let html = '';
        entries.forEach((entry, index) => {
          html += renderPublication(entry, index);
        });

        container.innerHTML = html;
      })
      .catch((error) => {
        console.error('Error loading publications:', error);
        container.innerHTML = '<p>Unable to load publications. Please check the publications file.</p>';
      });
  }

  // Load publications when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPublications);
  } else {
    loadPublications();
  }
})();

