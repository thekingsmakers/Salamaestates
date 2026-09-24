/**
 * Salama Estates - Dynamic News & Information Auto-Fetcher
 * Automatically discovers, fetches, and renders news articles
 * Supports:
 * - Direct parsing of HTML index.html articles (DOMParser)
 * - Manifest-based catalog (articles.json)
 * - Dynamic client-side search and category filtering
 * - GitHub Pages auto-discovery via GitHub REST API (if on github.io)
 */

(function () {
  'use strict';

  // Determine root path for relative asset/data resolution
  const isInsideNewsSubdir = window.location.pathname.includes('/news/') && !window.location.pathname.endsWith('/news/') && !window.location.pathname.endsWith('/news/index.html');
  const basePath = window.location.pathname.includes('/news') ? '../' : './';
  const manifestPath = window.location.pathname.includes('/news') ? './articles.json' : './news/articles.json';

  let allArticles = [];
  let activeCategory = 'all';
  let searchQuery = '';

  const container = document.getElementById('news-articles-container');
  const searchInput = document.getElementById('news-search-input');
  const categoryChips = document.querySelectorAll('.chip[data-category]');
  const countDisplay = document.getElementById('news-count-display');

  // Initialize
  async function init() {
    if (!container) return;

    renderSkeleton();

    try {
      // 1. Fetch articles manifest
      const res = await fetch(manifestPath, { cache: 'no-cache' });
      if (!res.ok) throw new Error('Could not load articles manifest');
      const manifestArticles = await res.json();

      // 2. Hydrate each article (fetch its HTML if full details are missing)
      const hydratedArticles = await Promise.all(
        manifestArticles.map(async (art) => {
          // If metadata is already present, return it
          if (art.title && art.summary && art.category && art.date) {
            return art;
          }
          // Otherwise, auto-fetch the article's index.html and parse its <meta> tags
          return await fetchArticleMetadata(art);
        })
      );

      // 3. Optional: GitHub API auto-scanner if hosted on GitHub Pages
      const ghArticles = await scanGitHubPagesRepo();
      const combined = mergeArticles(hydratedArticles, ghArticles);

      // Sort by date (newest first)
      allArticles = combined.sort((a, b) => new Date(b.isoDate || b.date) - new Date(a.isoDate || a.date));

      renderArticles();
      setupEventListeners();
    } catch (err) {
      console.warn('Auto-fetcher note:', err);
      // Fallback static rendering if offline or fetch restricted
      renderFallbackNotice();
    }
  }

  // Fetch and parse HTML file for metadata
  async function fetchArticleMetadata(articleRef) {
    try {
      const fetchUrl = window.location.pathname.includes('/news')
        ? (articleRef.path.startsWith('news/') ? articleRef.path.replace('news/', './') : articleRef.path)
        : (articleRef.path.startsWith('news/') ? './' + articleRef.path : './news/' + articleRef.path);

      const htmlRes = await fetch(fetchUrl);
      if (!htmlRes.ok) return articleRef;

      const htmlText = await htmlRes.text();
      const doc = new DOMParser().parseFromString(htmlText, 'text/html');

      const title = doc.querySelector('meta[name="news:title"]')?.content ||
                    doc.querySelector('meta[property="og:title"]')?.content ||
                    doc.querySelector('h1')?.innerText ||
                    articleRef.title || 'Untitled Article';

      const summary = doc.querySelector('meta[name="news:summary"]')?.content ||
                      doc.querySelector('meta[name="description"]')?.content ||
                      doc.querySelector('.article-excerpt')?.innerText ||
                      doc.querySelector('p')?.innerText ||
                      articleRef.summary || '';

      const category = doc.querySelector('meta[name="news:category"]')?.content ||
                       doc.querySelector('.card-category')?.innerText ||
                       articleRef.category || 'Platform Update';

      const date = doc.querySelector('meta[name="news:date"]')?.content ||
                   doc.querySelector('time')?.innerText ||
                   articleRef.date || 'Recent';

      const readTime = doc.querySelector('meta[name="news:readTime"]')?.content ||
                       articleRef.readTime || '3 min read';

      const status = doc.querySelector('meta[name="news:status"]')?.content ||
                     articleRef.status || 'Active';

      const badge = doc.querySelector('meta[name="news:badge"]')?.content ||
                    articleRef.badge || 'Official';

      return {
        ...articleRef,
        title,
        summary,
        category,
        date,
        readTime,
        status,
        badge
      };
    } catch (e) {
      console.error('Failed to parse HTML for', articleRef.path, e);
      return articleRef;
    }
  }

  // Scan GitHub Pages repo contents via GitHub API if running on github.io
  async function scanGitHubPagesRepo() {
    if (!window.location.hostname.includes('github.io')) return [];

    try {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts.length === 0) return [];
      const repoName = pathParts[0];
      const ownerName = window.location.hostname.split('.')[0];

      const apiEndpoint = `https://api.github.com/repos/${ownerName}/${repoName}/contents/news`;
      const res = await fetch(apiEndpoint);
      if (!res.ok) return [];

      const contents = await res.json();
      const discovered = [];

      for (const item of contents) {
        if (item.type === 'dir' && item.name !== 'template' && item.name !== 'assets') {
          const articleUrl = `news/${item.name}/index.html`;
          discovered.push({
            id: item.name,
            slug: item.name,
            path: articleUrl,
            title: item.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            category: 'Announcement',
            date: 'Live'
          });
        }
      }
      return discovered;
    } catch (e) {
      return [];
    }
  }

  function mergeArticles(baseList, ghList) {
    const map = new Map();
    baseList.forEach(a => map.set(a.slug || a.id || a.path, a));
    ghList.forEach(a => {
      const key = a.slug || a.id || a.path;
      if (!map.has(key)) {
        map.set(key, a);
      }
    });
    return Array.from(map.values());
  }

  // Render Skeleton while fetching
  function renderSkeleton() {
    container.innerHTML = `
      <div class="article-card skeleton-card">
        <div style="height: 16px; width: 120px; background: #e2e7e9; border-radius: 4px; margin-bottom: 12px;"></div>
        <div style="height: 24px; width: 80%; background: #e2e7e9; border-radius: 4px; margin-bottom: 12px;"></div>
        <div style="height: 16px; width: 100%; background: #EFF2F3; border-radius: 4px; margin-bottom: 8px;"></div>
        <div style="height: 16px; width: 60%; background: #EFF2F3; border-radius: 4px;"></div>
      </div>
    `;
  }

  // Render fallback in case of local file:/// restrictions
  function renderFallbackNotice() {
    container.innerHTML = `
      <div class="article-card featured-card">
        <div class="card-meta-top">
          <span class="card-category">Platform Development</span>
          <span class="article-date">📅 September 2026 • 5 min read</span>
        </div>
        <h3 class="card-title">
          <a href="${resolveArticleLink('news/platform-launch-initiative/index.html')}">
            Platform Launch Initiative: Building the Largest Property Marketplace
          </a>
        </h3>
        <p class="card-summary">
          As part of our mission to create a comprehensive and trusted real estate marketplace, we have introduced a temporary property data acquisition strategy to provide users with meaningful and valuable content from the first day of launch.
        </p>
        <div class="card-footer">
          <span class="official-stamp">✓ Official Platform Communication</span>
          <a class="card-read-more" href="${resolveArticleLink('news/platform-launch-initiative/index.html')}">
            Read Full Communique & Roadmap &rarr;
          </a>
        </div>
      </div>
    `;
    if (countDisplay) countDisplay.innerText = 'Showing 1 active update';
  }

  // Resolve proper relative URL for links
  function resolveArticleLink(articlePath) {
    if (window.location.pathname.includes('/news/')) {
      // We are already inside news/
      if (articlePath.startsWith('news/')) {
        return './' + articlePath.substring(5);
      }
      return './' + articlePath;
    }
    // We are at root
    if (articlePath.startsWith('news/')) {
      return './' + articlePath;
    }
    return './news/' + articlePath;
  }

  // Filter and Render
  function renderArticles() {
    const filtered = allArticles.filter((art) => {
      // Category filter
      const matchesCategory =
        activeCategory === 'all' ||
        (art.category && art.category.toLowerCase().includes(activeCategory.toLowerCase())) ||
        (art.categorySlug && art.categorySlug.toLowerCase() === activeCategory.toLowerCase());

      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (art.title && art.title.toLowerCase().includes(q)) ||
        (art.summary && art.summary.toLowerCase().includes(q)) ||
        (art.category && art.category.toLowerCase().includes(q)) ||
        (art.tags && art.tags.some((t) => t.toLowerCase().includes(q)));

      return matchesCategory && matchesSearch;
    });

    if (countDisplay) {
      countDisplay.innerText = `Showing ${filtered.length} update${filtered.length === 1 ? '' : 's'}`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="callout-box" style="text-align: center; padding: 40px 20px;">
          <h4 style="font-size: 1.2rem; color: var(--slate-700); margin-bottom: 8px;">No matching announcements found</h4>
          <p style="color: var(--slate-500); margin-bottom: 16px;">Try adjusting your keyword or switching category tabs.</p>
          <button class="chip" onclick="window.resetNewsFilter()">Reset Filters</button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered
      .map((art) => {
        const link = resolveArticleLink(art.path || art.slug + '/index.html');
        const isFeatured = art.featured ? 'featured-card' : '';
        const badgeHtml = art.badge
          ? `<span class="badge-tag badge-primary" style="margin-left: 8px;">${art.badge}</span>`
          : '';

        return `
          <article class="article-card ${isFeatured}" id="${art.slug || art.id || ''}">
            <div class="card-meta-top">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span class="card-category">${art.category || 'General'}</span>
                ${badgeHtml}
              </div>
              <span class="article-date">📅 ${art.date || ''} • ${art.readTime || '3 min read'}</span>
            </div>

            <h3 class="card-title">
              <a href="${link}">${art.title}</a>
            </h3>

            <p class="card-summary">
              ${art.summary || ''}
            </p>

            <div class="card-footer">
              <span class="official-stamp">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ${art.status || 'Verified Communication'}
              </span>
              <a class="card-read-more" href="${link}">
                Read Full Statement &rarr;
              </a>
            </div>
          </article>
        `;
      })
      .join('');
  }

  // Setup Event Listeners
  function setupEventListeners() {
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderArticles();
      });
    }

    categoryChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        categoryChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        activeCategory = chip.getAttribute('data-category');
        renderArticles();
      });
    });
  }

  // Global helper to reset filter
  window.resetNewsFilter = function () {
    activeCategory = 'all';
    searchQuery = '';
    if (searchInput) searchInput.value = '';
    categoryChips.forEach((c) => {
      if (c.getAttribute('data-category') === 'all') c.classList.add('active');
      else c.classList.remove('active');
    });
    renderArticles();
  };

  // Run on DOM loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
