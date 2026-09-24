/**
 * Salama Estates - Portal Fixed Sidemenu, SPA Smooth Transition & Clean URL Engine
 * Features:
 * - Clean URL enforcement: Browser address bar displays only info.salamaestates.com
 * - Buttery-smooth client-side page transitions (no white flashes or jarring reloads)
 * - Persistent Fixed Left Sidebar on Desktop & Mobile Drawer
 * - Preserves state on browser refresh & handles Back/Forward history seamlessly
 * - Interactive widgets: FAQ Accordions, TOC Scroll-spy, Reading Progress Bar
 */

(function () {
  'use strict';

  // State
  let isTransitioning = false;

  // Modern Vector SVG Icons (Stroke currentColor, 20x20)
  const ICONS = {
    home: `<svg class="nav-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    docs: `<svg class="nav-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>`,
    compass: `<svg class="nav-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
    shield: `<svg class="nav-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
    key: `<svg class="nav-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>`,
    trending: `<svg class="nav-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
    help: `<svg class="nav-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,
    newspaper: `<svg class="nav-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>`,
    building: `<svg class="nav-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`,
    support: `<svg class="nav-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/></svg>`,
    mail: `<svg class="nav-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
    lock: `<svg class="nav-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    external: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
    menu: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`
  };

  /**
   * 1. Clean browser address bar immediately so it displays only info.salamaestates.com
   */
  function cleanBrowserUrl() {
    try {
      const loc = window.location;
      if (loc.pathname && loc.pathname !== '/' && loc.pathname !== '') {
        const rawPath = loc.pathname.replace(/^\/+/, '');
        // Keep in session storage so refresh preserves place
        try {
          if (!sessionStorage.getItem('salama_active_url')) {
            sessionStorage.setItem('salama_active_url', rawPath);
          }
        } catch (e) {}

        if (window.history && window.history.replaceState) {
          window.history.replaceState({ pageUrl: rawPath }, document.title, loc.origin + '/');
        }
      }
    } catch (e) {
      console.warn('URL cleaner note:', e);
    }
  }

  /**
   * 2. Wrap body content in #portal-app-root if not already wrapped
   */
  function ensureAppRoot() {
    let root = document.getElementById('portal-app-root');
    if (root) return root;

    root = document.createElement('div');
    root.id = 'portal-app-root';
    root.className = 'spa-content-wrapper';

    const nodesToMove = [];
    document.body.childNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node;
        if (
          el.id === 'portal-fixed-sidebar' ||
          el.classList.contains('mobile-topbar') ||
          el.classList.contains('sidebar-backdrop') ||
          el.tagName.toLowerCase() === 'script'
        ) {
          return;
        }
      }
      nodesToMove.push(node);
    });

    nodesToMove.forEach((node) => root.appendChild(node));
    document.body.appendChild(root);
    return root;
  }

  /**
   * 3. Build & Attach Persistent Fixed Sidemenu
   */
  function initFixedSidebar() {
    if (document.getElementById('portal-fixed-sidebar')) return;

    // Mobile Topbar
    const mobileBar = document.createElement('div');
    mobileBar.className = 'mobile-topbar';
    mobileBar.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <button class="btn-mobile-toggle" aria-label="Toggle navigation">${ICONS.menu}</button>
        <a href="index.html" class="spa-nav-item" style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--slate-900); text-decoration: none;">
          <img src="assets/images/logo.svg" alt="Salama Estates" width="30" height="30">
          <span>Salama Estates</span>
        </a>
      </div>
      <a href="https://salamaestates.com/login" target="_blank" class="nav-btn" style="padding: 6px 12px !important; font-size: 0.85rem;">
        Sign In
      </a>
    `;
    document.body.insertBefore(mobileBar, document.body.firstChild);

    // Sidebar Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.insertBefore(backdrop, document.body.firstChild);

    // Sidebar Element
    const sidebar = document.createElement('aside');
    sidebar.id = 'portal-fixed-sidebar';
    sidebar.className = 'portal-fixed-sidebar';
    sidebar.setAttribute('aria-label', 'Primary Portal Navigation');

    sidebar.innerHTML = `
      <div class="pfs-header">
        <a href="index.html" class="pfs-brand spa-nav-item">
          <img src="assets/images/logo.svg" alt="Salama Estates Logo" class="pfs-brand-logo" width="30" height="30">
          <div class="pfs-brand-meta">
            <div class="pfs-brand-title">Salama Estates</div>
            <div class="pfs-brand-subtitle">Information &amp; News</div>
          </div>
        </a>
        <button class="pfs-btn-close" aria-label="Close sidebar">&times;</button>
      </div>

      <!-- Quick Action / Login Button -->
      <div class="pfs-cta-wrap">
        <a href="https://salamaestates.com/login" target="_blank" class="pfs-cta-btn">
          <span>Sign In / Register</span>
          ${ICONS.external}
        </a>
      </div>

      <div class="pfs-nav-body">

        <!-- Group 1: Platform Core -->
        <div class="pfs-group">
          <div class="pfs-group-title">Platform Core</div>
          <ul class="pfs-list">
            <li>
              <a href="index.html" class="pfs-link" data-page="home">
                ${ICONS.home}
                <span>Home &amp; Live Feed</span>
              </a>
            </li>
            <li>
              <a href="docs.html" class="pfs-link" data-page="docs">
                ${ICONS.docs}
                <span>Documentation &amp; Goals</span>
              </a>
            </li>
            <li>
              <a href="overview.html" class="pfs-link" data-page="overview">
                ${ICONS.compass}
                <span>Overview &amp; Mission</span>
              </a>
            </li>
            <li>
              <a href="transparency.html" class="pfs-link" data-page="transparency">
                ${ICONS.shield}
                <span>Data Quality &amp; Policy</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Group 2: Stakeholders -->
        <div class="pfs-group">
          <div class="pfs-group-title">Stakeholders</div>
          <ul class="pfs-list">
            <li>
              <a href="owners.html" class="pfs-link" data-page="owners">
                ${ICONS.key}
                <span>Why Post Directly?</span>
              </a>
            </li>
            <li>
              <a href="roadmap.html" class="pfs-link" data-page="roadmap">
                ${ICONS.trending}
                <span>Growth Roadmap</span>
              </a>
            </li>
            <li>
              <a href="faq.html" class="pfs-link" data-page="faq">
                ${ICONS.help}
                <span>Frequently Asked Questions</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Group 3: Newsroom -->
        <div class="pfs-group">
          <div class="pfs-group-title">Newsroom</div>
          <ul class="pfs-list">
            <li>
              <a href="news/" class="pfs-link" data-page="news">
                ${ICONS.newspaper}
                <span>All News &amp; Updates</span>
              </a>
            </li>
            <li>
              <a href="news/policy-and-standards/index.html" class="pfs-link" data-page="policy">
                ${ICONS.shield}
                <span>Cybersecurity Policy (Oct 2026)</span>
              </a>
            </li>
            <li>
              <a href="news/platform-launch-initiative/index.html" class="pfs-link" data-page="launch">
                ${ICONS.trending}
                <span>Launch Initiative (Sept 2026)</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Group 4: Support & External -->
        <div class="pfs-group">
          <div class="pfs-group-title">Support &amp; Inquiries</div>
          <ul class="pfs-list">
            <li>
              <a href="https://salamaestates.com/help" target="_blank" class="pfs-link pfs-link-ext">
                ${ICONS.support}
                <span>Salama Help Desk</span>
                <span class="pfs-external-badge">${ICONS.external}</span>
              </a>
            </li>
            <li>
              <a href="https://salamaestates.com/register" target="_blank" class="pfs-link pfs-link-ext">
                ${ICONS.building}
                <span>Agent &amp; Agency Verification</span>
                <span class="pfs-external-badge">${ICONS.external}</span>
              </a>
            </li>
            <li>
              <a href="contact.html" class="pfs-link" data-page="contact">
                ${ICONS.mail}
                <span>General Inquiries Desk</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Group 5: Administration -->
        <div class="pfs-group">
          <div class="pfs-group-title">Administration</div>
          <ul class="pfs-list">
            <li>
              <a href="admin.html" class="pfs-link" data-page="admin">
                ${ICONS.lock}
                <span>Admin Publishing Studio</span>
              </a>
            </li>
          </ul>
        </div>

      </div>

      <div class="pfs-footer">
        <div class="pfs-footer-row">
          <span class="pfs-status-dot"></span>
          <span class="pfs-footer-copy">&copy; 2026 Salama Estates</span>
        </div>
        <div class="pfs-footer-meta">Public Information Platform</div>
      </div>
    `;

    document.body.insertBefore(sidebar, document.body.firstChild);

    // Sidebar drawer events
    const mobileToggle = mobileBar.querySelector('.btn-mobile-toggle');
    const closeBtn = sidebar.querySelector('.pfs-btn-close');

    function openSidebar() {
      sidebar.classList.add('open');
      backdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
      sidebar.classList.remove('open');
      backdrop.classList.remove('open');
      document.body.style.overflow = '';
    }

    if (mobileToggle) mobileToggle.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    backdrop.addEventListener('click', closeSidebar);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        closeSidebar();
      }
    });
  }

  /**
   * 4. Update Navigation Active States
   */
  function updateActiveNavLinks(targetPath) {
    const norm = (targetPath || '').toLowerCase().replace(/\\/g, '/');

    // Sidebar links
    const sidebarLinks = document.querySelectorAll('#portal-fixed-sidebar .pfs-link');
    sidebarLinks.forEach((link) => {
      const page = link.getAttribute('data-page');
      link.classList.remove('active');

      if (page === 'home' && (norm === '' || norm === '/' || norm === 'index.html')) {
        link.classList.add('active');
      } else if (page === 'docs' && norm.includes('docs')) {
        link.classList.add('active');
      } else if (page === 'overview' && norm.includes('overview')) {
        link.classList.add('active');
      } else if (page === 'transparency' && norm.includes('transparency')) {
        link.classList.add('active');
      } else if (page === 'owners' && norm.includes('owners')) {
        link.classList.add('active');
      } else if (page === 'roadmap' && norm.includes('roadmap')) {
        link.classList.add('active');
      } else if (page === 'faq' && norm.includes('faq')) {
        link.classList.add('active');
      } else if (page === 'contact' && norm.includes('contact')) {
        link.classList.add('active');
      } else if (page === 'admin' && norm.includes('admin')) {
        link.classList.add('active');
      } else if (page === 'policy' && norm.includes('policy-and-standards')) {
        link.classList.add('active');
      } else if (page === 'launch' && norm.includes('platform-launch')) {
        link.classList.add('active');
      } else if (page === 'news' && (norm.endsWith('news/') || norm.endsWith('news/index.html') || norm === 'news')) {
        link.classList.add('active');
      }
    });

    // Top Site Header Links
    const topNavLinks = document.querySelectorAll('.site-header .nav-links a');
    topNavLinks.forEach((link) => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      link.classList.remove('active');

      if (href.includes('docs') && norm.includes('docs')) {
        link.classList.add('active');
      } else if (href.includes('overview') && norm.includes('overview')) {
        link.classList.add('active');
      } else if (href.includes('transparency') && norm.includes('transparency')) {
        link.classList.add('active');
      } else if (href.includes('owners') && norm.includes('owners')) {
        link.classList.add('active');
      } else if (href.includes('roadmap') && norm.includes('roadmap')) {
        link.classList.add('active');
      } else if (href.includes('faq') && norm.includes('faq')) {
        link.classList.add('active');
      } else if (href.includes('news') && (norm.includes('news') || norm.includes('policy') || norm.includes('launch'))) {
        link.classList.add('active');
      } else if ((href.includes('index.html') || href === './' || href === '/') && (norm === '' || norm === '/' || norm === 'index.html')) {
        link.classList.add('active');
      }
    });
  }

  /**
   * 5. Interactive Component Initializers
   */
  function initFaqAccordions(container = document) {
    const faqItems = container.querySelectorAll('.faq-item');
    faqItems.forEach((item) => {
      const questionBtn = item.querySelector('.faq-question');
      if (questionBtn && !questionBtn._hasFaqListener) {
        questionBtn._hasFaqListener = true;
        questionBtn.addEventListener('click', () => {
          item.classList.toggle('active');
        });
      }
    });
  }

  function initReadingProgress() {
    const progressBar = document.getElementById('reading-progress');
    if (progressBar && !window._hasReadingListener) {
      window._hasReadingListener = true;
      window.addEventListener('scroll', () => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalHeight > 0) {
          const progressPercent = (window.scrollY / totalHeight) * 100;
          progressBar.style.width = `${Math.min(100, Math.max(0, progressPercent))}%`;
        }
      });
    }
  }

  function initTocScrollSpy(container = document) {
    const tocLinks = container.querySelectorAll('.article-toc a');
    if (tocLinks.length > 0 && !window._hasTocListener) {
      window._hasTocListener = true;
      const sections = Array.from(tocLinks).map((link) => {
        const href = link.getAttribute('href') || '';
        if (href.startsWith('#')) {
          return document.getElementById(href.substring(1));
        }
        return null;
      }).filter(Boolean);

      window.addEventListener('scroll', () => {
        let currentSectionId = '';
        const scrollPos = window.scrollY + 140;

        sections.forEach((section) => {
          if (section.offsetTop <= scrollPos) {
            currentSectionId = section.getAttribute('id');
          }
        });

        tocLinks.forEach((link) => {
          if (link.getAttribute('href') === `#${currentSectionId}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      });
    }
  }

  function initHeaderMenuToggle(container = document) {
    const menuToggle = container.querySelector('.site-header .menu-toggle');
    const navLinks = container.querySelector('.site-header .nav-links');
    if (menuToggle && navLinks && !menuToggle._hasToggleListener) {
      menuToggle._hasToggleListener = true;
      menuToggle.addEventListener('click', () => {
        const isOpen = navLinks.classList.contains('show');
        if (isOpen) {
          navLinks.classList.remove('show');
          menuToggle.setAttribute('aria-expanded', 'false');
        } else {
          navLinks.classList.add('show');
          menuToggle.setAttribute('aria-expanded', 'true');
        }
      });
    }
  }

  /**
   * 6. Smooth SPA Dynamic Navigation Engine
   */
  async function navigateToPage(rawTargetUrl, pushHistory = true) {
    if (isTransitioning) return;

    let targetUrl = rawTargetUrl.trim();
    // Normalize target URL relative to origin root
    targetUrl = targetUrl.replace(/^\.\//, '').replace(/^\/+/, '');
    if (targetUrl === '' || targetUrl === '/') {
      targetUrl = 'index.html';
    }

    // Direct bypass for Admin Studio or external URLs
    if (targetUrl.includes('admin.html') || targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      window.location.href = targetUrl;
      return;
    }

    isTransitioning = true;
    const appRoot = ensureAppRoot();

    try {
      // 1. Subtle fade out
      appRoot.classList.add('spa-transitioning');

      // 2. Fetch page HTML
      const fetchUrl = targetUrl.endsWith('/') ? targetUrl + 'index.html' : targetUrl;
      const res = await fetch(fetchUrl, { cache: 'no-cache' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} fetching ${fetchUrl}`);
      }

      const html = await res.text();
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(html, 'text/html');

      // Wait 130ms for transition
      await new Promise((resolve) => setTimeout(resolve, 130));

      // 3. Clean Document Title
      if (newDoc.title) {
        let cleanTitle = newDoc.title;
        if (cleanTitle.includes('Newsroom & Official Announcements')) {
          cleanTitle = 'Salama Estates | Official Newsroom';
        }
        document.title = cleanTitle;
      }

      // 4. Extract new document elements
      const newNodes = [];
      newDoc.body.childNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node;
          if (
            el.id === 'portal-fixed-sidebar' ||
            el.classList.contains('mobile-topbar') ||
            el.classList.contains('sidebar-backdrop') ||
            el.tagName.toLowerCase() === 'script'
          ) {
            return;
          }
        }
        newNodes.push(node.cloneNode(true));
      });

      // 5. Replace app root contents
      appRoot.innerHTML = '';
      newNodes.forEach((node) => appRoot.appendChild(node));

      // 6. Normalize relative asset and link paths based on target's directory
      const baseOrigin = window.location.origin;
      const baseFull = new URL(fetchUrl, baseOrigin).href;

      // Images
      appRoot.querySelectorAll('img[src]').forEach((img) => {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:') && !src.startsWith('//')) {
          try {
            const resolved = new URL(src, baseFull).pathname;
            img.src = resolved.replace(/^\//, '');
          } catch (e) {}
        }
      });

      // Links
      appRoot.querySelectorAll('a[href]').forEach((a) => {
        const href = a.getAttribute('href');
        if (
          href &&
          !href.startsWith('http://') &&
          !href.startsWith('https://') &&
          !href.startsWith('//') &&
          !href.startsWith('#') &&
          !href.startsWith('mailto:') &&
          !href.startsWith('tel:')
        ) {
          try {
            const resolved = new URL(href, baseFull).pathname;
            a.setAttribute('href', resolved.replace(/^\//, ''));
          } catch (e) {}
        }
      });

      // 7. Scroll to top instant
      window.scrollTo({ top: 0, behavior: 'instant' });

      // 8. Enforce URL bar cleanliness: Always show only info.salamaestates.com
      if (pushHistory && window.history && window.history.pushState) {
        window.history.pushState({ pageUrl: targetUrl }, document.title, window.location.origin + '/');
      }

      // 9. Update Session Storage for refresh preservation
      try {
        if (targetUrl === 'index.html' || targetUrl === '') {
          sessionStorage.removeItem('salama_active_url');
        } else {
          sessionStorage.setItem('salama_active_url', targetUrl);
        }
      } catch (e) {}

      // 10. Update Active Highlights in navigation
      updateActiveNavLinks(targetUrl);

      // 11. Reinitialize interactive components in new content
      initHeaderMenuToggle(appRoot);
      initFaqAccordions(appRoot);
      initReadingProgress();
      initTocScrollSpy(appRoot);

      // 12. If news container exists, trigger dynamic news fetcher
      if (document.getElementById('news-articles-container') && window.initNewsFetcher) {
        window.initNewsFetcher();
      }

      // 13. Rebind SPA link interception on new DOM
      bindSpaLinks(appRoot);

    } catch (err) {
      console.warn('SPA dynamic load error, fallback to direct route:', err);
      window.location.href = targetUrl;
    } finally {
      appRoot.classList.remove('spa-transitioning');
      isTransitioning = false;
    }
  }

  /**
   * 7. Intercept Internal Link Clicks for Smooth SPA Navigation
   */
  function bindSpaLinks(container = document) {
    const links = container.querySelectorAll('a[href]');
    links.forEach((link) => {
      if (link._hasSpaListener) return;
      link._hasSpaListener = true;

      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href) return;

        const trimmed = href.trim();
        const target = link.getAttribute('target');

        // External or special protocols
        if (
          target === '_blank' ||
          trimmed.startsWith('http://') ||
          trimmed.startsWith('https://') ||
          trimmed.startsWith('//') ||
          trimmed.startsWith('mailto:') ||
          trimmed.startsWith('tel:') ||
          trimmed.startsWith('javascript:')
        ) {
          return;
        }

        // In-page anchor scrolling
        if (trimmed.startsWith('#')) {
          const targetEl = document.querySelector(trimmed);
          if (targetEl) {
            e.preventDefault();
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
          return;
        }

        // Exclude admin publishing studio
        if (trimmed.includes('admin.html')) {
          return;
        }

        // Smooth SPA Navigation
        e.preventDefault();

        // Close mobile drawer if open
        const sidebar = document.getElementById('portal-fixed-sidebar');
        const backdrop = document.querySelector('.sidebar-backdrop');
        if (sidebar && sidebar.classList.contains('open')) {
          sidebar.classList.remove('open');
          if (backdrop) backdrop.classList.remove('open');
          document.body.style.overflow = '';
        }

        navigateToPage(trimmed, true);
      });
    });
  }

  /**
   * 8. Browser Back/Forward Popstate Handler
   */
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.pageUrl) {
      navigateToPage(e.state.pageUrl, false);
    } else {
      navigateToPage('index.html', false);
    }
  });

  /**
   * 9. Expose global navigation method
   */
  window.salamaNavigate = navigateToPage;

  /**
   * 10. Application Bootstrapper
   */
  document.addEventListener('DOMContentLoaded', () => {
    // Immediate URL cleanup to info.salamaestates.com
    cleanBrowserUrl();

    // Wrap page root
    ensureAppRoot();

    // Init persistent fixed sidebar
    initFixedSidebar();

    // Init components
    initHeaderMenuToggle();
    initFaqAccordions();
    initReadingProgress();
    initTocScrollSpy();

    // Determine current active path
    const curPath = window.location.pathname.replace(/^\/+/, '');
    updateActiveNavLinks(curPath || 'index.html');

    // Bind SPA link intercepts
    bindSpaLinks(document);

    // If on root index.html and session storage has an active view (from immediate reload), restore it smoothly
    try {
      const saved = sessionStorage.getItem('salama_active_url');
      if (
        saved &&
        saved !== 'index.html' &&
        saved !== '' &&
        saved !== '/' &&
        (curPath === '' || curPath === '/' || curPath === 'index.html')
      ) {
        navigateToPage(saved, false);
      }
    } catch (e) {}
  });

})();
