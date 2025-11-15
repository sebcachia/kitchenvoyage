(() => {
  const body = document.body;
  const overlay = document.querySelector('[data-search-overlay]');
  const overlayForm = overlay?.querySelector('[data-search-form]');
  const overlayInput = overlay?.querySelector('[data-search-input]');
  const searchToggles = document.querySelectorAll('[data-search-toggle]');
  const closeControls = overlay ? overlay.querySelectorAll('[data-search-close]') : [];
  const searchIndexURL = body?.dataset.searchIndex;
  let overlayIsOpen = false;
  let searchIndexPromise;

  const openOverlay = () => {
    if (!overlay) return;
    overlay.classList.add('is-visible');
    body?.classList.add('search-is-open');
    overlay.setAttribute('aria-hidden', 'false');
    overlayIsOpen = true;
    requestAnimationFrame(() => {
      overlayInput?.focus();
    });
  };

  const closeOverlay = () => {
    if (!overlay) return;
    overlay.classList.remove('is-visible');
    body?.classList.remove('search-is-open');
    overlay.setAttribute('aria-hidden', 'true');
    overlayIsOpen = false;
    overlayInput?.blur();
  };

  searchToggles.forEach((button) => {
    button.addEventListener('click', () => {
      if (overlayIsOpen) {
        closeOverlay();
      } else {
        openOverlay();
      }
    });
  });

  closeControls.forEach((button) => {
    button.addEventListener('click', () => closeOverlay());
  });

  overlay?.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeOverlay();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlayIsOpen) {
      closeOverlay();
    }
  });

  overlayForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = overlayInput?.value.trim();
    if (!query) {
      overlayInput?.focus();
      return;
    }
    const targetURL = new URL(overlayForm.getAttribute('action'), window.location.origin);
    targetURL.searchParams.set('q', query);
    window.location.assign(targetURL.toString());
  });

  const loadIndex = async () => {
    if (searchIndexPromise) {
      return searchIndexPromise;
    }
    if (!searchIndexURL) {
      return [];
    }
    searchIndexPromise = fetch(searchIndexURL, { credentials: 'same-origin' })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to load search index');
        }
        return response.json();
      })
      .catch((error) => {
        console.error(error);
        return [];
      });
    return searchIndexPromise;
  };

  const resultsContainer = document.querySelector('[data-search-results]');
  if (!resultsContainer) {
    return;
  }

  const summary = document.querySelector('[data-search-summary]');
  const status = document.querySelector('[data-search-status]');
  const emptyState = document.querySelector('[data-search-empty]');
  const pageForm = document.querySelector('[data-search-page-form]');
  const pageInput = document.querySelector('[data-search-page-input]');

  const renderSummary = (query, count) => {
    if (!summary) return;
    if (!query) {
      summary.textContent = 'Type a keyword to find matching titles or tags.';
      return;
    }
    summary.textContent = `Showing ${count} result${count === 1 ? '' : 's'} for "${query}".`;
  };

  const renderStatus = (message) => {
    if (status) {
      status.textContent = message;
    }
  };

  const clearResults = () => {
    resultsContainer.innerHTML = '';
    if (emptyState) {
      resultsContainer.appendChild(emptyState);
      emptyState.style.display = '';
    }
  };

  const createTagList = (tags) => {
    if (!tags || !tags.length) {
      return null;
    }
    const wrapper = document.createElement('div');
    wrapper.className = 'search-results__tags';
    tags.forEach((tag) => {
      const span = document.createElement('span');
      span.textContent = `#${tag}`;
      wrapper.appendChild(span);
    });
    return wrapper;
  };

  const renderResults = (matches) => {
    resultsContainer.innerHTML = '';
    if (!matches.length) {
      if (emptyState) {
        emptyState.textContent = 'No matches yet. Try another keyword or tag.';
        resultsContainer.appendChild(emptyState);
      }
      return;
    }
    matches.forEach((item) => {
      const article = document.createElement('article');
      article.className = 'post-card';

      const link = document.createElement('a');
      link.className = 'post-card__link';
      link.href = item.permalink;

      const media = document.createElement('div');
      media.className = 'post-card__media';
      if (item.image) {
        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.imageAlt || item.title;
        media.appendChild(img);
      } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'post-card__placeholder';
        placeholder.textContent = item.title.slice(0, 1).toUpperCase();
        media.appendChild(placeholder);
      }

      const content = document.createElement('div');
      content.className = 'post-card__content';

      const heading = document.createElement('h3');
      heading.textContent = item.title;

      const description = document.createElement('p');
      description.textContent = item.description || '';

      content.appendChild(heading);
      if (item.description) {
        content.appendChild(description);
      }

      const tags = createTagList(item.tags);
      if (tags) {
        content.appendChild(tags);
      }

      link.appendChild(media);
      link.appendChild(content);
      article.appendChild(link);
      resultsContainer.appendChild(article);
    });
  };

  const matchesQuery = (item, query) => {
    const lowerQuery = query.toLowerCase();
    if (item.title && item.title.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    if (Array.isArray(item.tags)) {
      return item.tags.some((tag) => tag && tag.toLowerCase().includes(lowerQuery));
    }
    return false;
  };

  const runSearch = async (query) => {
    const trimmed = query.trim();
    if (!trimmed) {
      clearResults();
      renderSummary('', 0);
      renderStatus('Awaiting your first search...');
      return;
    }
    renderStatus('Searching...');
    const index = await loadIndex();
    const matches = index.filter((item) => matchesQuery(item, trimmed));
    renderResults(matches);
    renderSummary(trimmed, matches.length);
    renderStatus(
      matches.length
        ? `Found ${matches.length} match${matches.length === 1 ? '' : 'es'}.`
        : 'No matches found.'
    );
  };

  pageForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = pageInput?.value || '';
    const params = new URLSearchParams(window.location.search);
    if (query.trim()) {
      params.set('q', query.trim());
    } else {
      params.delete('q');
    }
    const paramString = params.toString();
    const newURL = paramString ? `${window.location.pathname}?${paramString}` : window.location.pathname;
    window.history.replaceState({}, '', newURL);
    runSearch(query);
  });

  const initialQuery = new URLSearchParams(window.location.search).get('q') || '';
  if (pageInput) {
    pageInput.value = initialQuery;
  }
  runSearch(initialQuery);
})();
