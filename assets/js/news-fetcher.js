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

  let allArticles = [];
  let activeCategory = 'all';
  let searchQuery = '';

  let container = null;
  let searchInput = null;
  let categoryChips = [];
  let countDisplay = null;

  const DEFAULT_FALLBACK_ARTICLES = [
    {
      "id": "platform-launch-initiative",
      "slug": "platform-launch-initiative",
      "path": "news/platform-launch-initiative/index.html",
      "image": "assets/images/marketplace-launch-banner.svg",
      "title": "Platform Launch Initiative: Building the Largest Property Marketplace",
      "subtitle": "Platform News & Announcements",
      "category": "Platform Development",
      "categorySlug": "platform-development",
      "date": "September 2026",
      "isoDate": "2026-09-01",
      "readTime": "5 min read",
      "featured": true,
      "summary": "As part of our mission to create a comprehensive and trusted real estate marketplace, we have introduced a temporary property data acquisition strategy to provide users with meaningful and valuable content from day one.",
      "status": "Active Platform Growth Initiative",
      "badge": "Official Announcement",
      "tags": ["Marketplace Launch", "Data Accuracy", "Roadmap", "Property Owners", "Agency Verification"]
    }
  ];

  // Initialize
  async function init() {
    container = document.getElementById('news-articles-container');
    if (!container) return;

    searchInput = document.getElementById('news-search-input');
    categoryChips = document.querySelectorAll('.chip[data-category]');
    countDisplay = document.getElementById('news-count-display');

    // Check if any deleted articles exist in localStorage
    let deletedSlugs = [];
    try {
      deletedSlugs = JSON.parse(localStorage.getItem('salama_deleted_articles') || '[]');
    } catch (e) {
      deletedSlugs = [];
    }

    // Clean initial pre-rendered static content if it matches deleted slugs
    if (deletedSlugs.includes('platform-launch-initiative')) {
      const staticCard = container.querySelector('.featured-card');
      if (staticCard) staticCard.remove();
    }

    renderSkeleton();

    try {
      // 1. Fetch articles manifest
      let manifestArticles = [];
      try {
        let res = await fetch('news/articles.json', { cache: 'no-cache' });
        if (!res.ok) {
          res = await fetch('./articles.json', { cache: 'no-cache' });
        }
        if (res.ok) {
          manifestArticles = await res.json();
        }
      } catch (e) {
        try {
          const res2 = await fetch('./articles.json', { cache: 'no-cache' });
          if (res2.ok) manifestArticles = await res2.json();
        } catch (e2) {}
      }

      // If manifest is empty or failed to load, fallback to DEFAULT_FALLBACK_ARTICLES
      if (!manifestArticles || manifestArticles.length === 0) {
        manifestArticles = DEFAULT_FALLBACK_ARTICLES.slice();
      }

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

      // 4. Merge locally created articles from admin dashboard (if any)
      let localCreated = [];
      try {
        const stored = localStorage.getItem('salama_custom_articles');
        if (stored) localCreated = JSON.parse(stored);
      } catch (e) {}

      const combined = mergeArticles(mergeArticles(hydratedArticles, ghArticles), localCreated);

      // 5. Exclude deleted articles
      allArticles = combined.filter(art => {
        const slug = art.slug || art.id;
        return !deletedSlugs.includes(slug);
      });

      // Sort by date (newest first)
      allArticles.sort((a, b) => new Date(b.isoDate || b.date) - new Date(a.isoDate || a.date));

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

      const image = doc.querySelector('meta[name="news:image"]')?.content ||
                    doc.querySelector('meta[property="og:image"]')?.content ||
                    articleRef.image || '';

      return {
        ...articleRef,
        title,
        summary,
        category,
        date,
        readTime,
        status,
        badge,
        image
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
    let deletedSlugs = [];
    try {
      deletedSlugs = JSON.parse(localStorage.getItem('salama_deleted_articles') || '[]');
    } catch (e) {}

    if (deletedSlugs.includes('platform-launch-initiative')) {
      container.innerHTML = `
        <div class="callout-box" style="text-align: center; padding: 40px 20px;">
          <h4 style="font-size: 1.15rem; color: var(--slate-700); margin-bottom: 8px;">No active announcements</h4>
          <p style="color: var(--slate-500);">All announcements have been archived or removed by administrator.</p>
        </div>
      `;
      if (countDisplay) countDisplay.innerText = 'Showing 0 updates';
      return;
    }

    container.innerHTML = `
      <div class="article-card featured-card">
        <div class="card-meta-top">
          <span class="card-category">Platform Development</span>
          <span class="article-date">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            September 2026 • 5 min read
          </span>
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
          <span class="official-stamp">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Official Platform Communication
          </span>
          <a class="card-read-more" href="${resolveArticleLink('news/platform-launch-initiative/index.html')}">
            Read Full Communique &amp; Roadmap &rarr;
          </a>
        </div>
      </div>
    `;
    if (countDisplay) countDisplay.innerText = 'Showing 1 active update';
  }

  // Resolve proper relative URL for links
  function resolveArticleLink(articlePath) {
    let p = (articlePath || '').trim().replace(/^\.\//, '').replace(/^\/+/, '');
    if (!p.startsWith('news/')) {
      p = 'news/' + p;
    }
    return p;
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

    function resolveImageLink(imgPath) {
      if (!imgPath || typeof imgPath !== 'string') return '';
      const trimmed = imgPath.trim();
      if (!trimmed) return '';

      // Direct external URL or inline data URI
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('//')) {
        return trimmed;
      }

      // Strip any leading ./ or ../ or /
      return trimmed.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '').replace(/^\//, '');
    }

    const fallbackBanner = resolveImageLink('assets/images/marketplace-launch-banner.svg');

    container.innerHTML = filtered
      .map((art) => {
        const link = resolveArticleLink(art.path || art.slug + '/index.html');
        const isFeatured = art.featured ? 'featured-card' : '';
        const badgeHtml = art.badge
          ? `<span class="badge-tag badge-primary" style="margin-left: 8px;">${art.badge}</span>`
          : '';

        const cardContent = `
          <div class="card-meta-top">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="card-category">${art.category || 'General'}</span>
              ${badgeHtml}
            </div>
            <span class="article-date">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${art.date || ''} • ${art.readTime || '3 min read'}
            </span>
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
        `;

        if (art.image) {
          const imgUrl = resolveImageLink(art.image);
          return `
            <article class="article-card ${isFeatured}" id="${art.slug || art.id || ''}">
              <div class="article-card-with-thumb">
                <div class="article-card-thumb-wrap">
                  <img src="${imgUrl}" alt="${art.title}" class="article-card-thumb-img" loading="lazy" onerror="this.onerror=null; this.src='${fallbackBanner}';">
                </div>
                <div>
                  ${cardContent}
                </div>
              </div>
            </article>
          `;
        }

        return `
          <article class="article-card ${isFeatured}" id="${art.slug || art.id || ''}">
            ${cardContent}
          </article>
        `;
      })
      .join('');

    // Hook card links into SPA router if present
    if (window.salamaNavigate && container) {
      container.querySelectorAll('a[href]').forEach((link) => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('#')) {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            window.salamaNavigate(href, true);
          });
        }
      });
    }
  }

  // Setup Event Listeners
  function setupEventListeners() {
    if (searchInput && !searchInput._hasSearchListener) {
      searchInput._hasSearchListener = true;
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderArticles();
      });
    }

    categoryChips.forEach((chip) => {
      if (!chip._hasChipListener) {
        chip._hasChipListener = true;
        chip.addEventListener('click', () => {
          categoryChips.forEach((c) => c.classList.remove('active'));
          chip.classList.add('active');
          activeCategory = chip.getAttribute('data-category');
          renderArticles();
        });
      }
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

  // Expose global initializer for SPA transitions
  window.initNewsFetcher = init;

  // Run on DOM loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
