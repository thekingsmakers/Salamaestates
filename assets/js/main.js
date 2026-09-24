/**
 * Salama Estates - Portal Fixed Sidemenu & Interactive Engine
 * Provides:
 * - Persistent Fixed Left Sidebar on Desktop (always visible, no clicking required!)
 * - Responsive Slide-out Sidebar on Mobile with Hamburger Button
 * - Crisp Modern Vector SVG Icons (No Emojis!)
 * - External Routing for Sign In (salamaestates.com/login) & Help (salamaestates.com/help)
 * - FAQ Accordions & Reading Progress Bar
 */

document.addEventListener('DOMContentLoaded', () => {

  // 1. Initialize Fixed Sidemenu Architecture
  initFixedSidebar();

  // 2. FAQ Accordion Interaction
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const questionBtn = item.querySelector('.faq-question');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        if (!isActive) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }
  });

  // 3. Reading Progress Bar (For Article Pages)
  const progressBar = document.getElementById('reading-progress');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progressPercent = (window.scrollY / totalHeight) * 100;
        progressBar.style.width = `${Math.min(100, Math.max(0, progressPercent))}%`;
      }
    });
  }

  // 4. In-Page Table of Contents Active Highlighting
  const tocLinks = document.querySelectorAll('.article-toc a');
  if (tocLinks.length > 0) {
    const sections = Array.from(tocLinks).map((link) => {
      const targetId = link.getAttribute('href').substring(1);
      return document.getElementById(targetId);
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
});

/**
 * Build and attach the Fixed Sidebar Navigation
 */
function initFixedSidebar() {
  // Determine relative root prefix
  let root = './';
  const path = window.location.pathname;
  if (path.includes('/news/') && !path.endsWith('/news/') && !path.endsWith('/news/index.html')) {
    root = '../../';
  } else if (path.includes('/news')) {
    root = '../';
  }

  // Check if sidebar already exists
  if (document.getElementById('portal-fixed-sidebar')) return;

  // Modern Vector SVG Icons (Stroke currentColor, 20x20)
  const icons = {
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

  // 1. Create Mobile Topbar (for mobile screens only)
  const mobileBar = document.createElement('div');
  mobileBar.className = 'mobile-topbar';
  mobileBar.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <button class="btn-mobile-toggle" aria-label="Toggle navigation">${icons.menu}</button>
      <a href="${root}index.html" style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--slate-900);">
        <img src="${root}assets/images/logo.svg" alt="Salama Estates" width="30" height="30">
        <span>Salama Estates</span>
      </a>
    </div>
    <a href="https://salamaestates.com/login" target="_blank" class="nav-btn" style="padding: 6px 12px !important; font-size: 0.85rem;">
      Sign In
    </a>
  `;
  document.body.insertBefore(mobileBar, document.body.firstChild);

  // 2. Create Backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'sidebar-backdrop';
  document.body.insertBefore(backdrop, document.body.firstChild);

  // 3. Create Fixed Sidebar
  const sidebar = document.createElement('aside');
  sidebar.id = 'portal-fixed-sidebar';
  sidebar.className = 'portal-fixed-sidebar';
  sidebar.setAttribute('aria-label', 'Primary Portal Navigation');

  sidebar.innerHTML = `
    <div class="sidebar-brand-box">
      <a href="${root}index.html" class="sidebar-brand-link">
        <img src="${root}assets/images/logo.svg" alt="Salama Estates Logo" width="36" height="36">
        <div>
          <div class="sidebar-brand-title">Salama Estates</div>
          <div class="sidebar-brand-subtitle">Information &amp; News</div>
        </div>
      </a>
      <button class="btn-sidebar-close" aria-label="Close sidebar">&times;</button>
    </div>

    <!-- Quick Action / Login Button -->
    <div style="padding: 16px 18px 8px;">
      <a href="https://salamaestates.com/login" target="_blank" class="sidebar-cta-btn">
        <span>Sign In / Register</span>
        ${icons.external}
      </a>
    </div>

    <div class="sidebar-scrollable-body">

      <!-- Group 1: Platform Core -->
      <div class="sidebar-nav-group">
        <div class="sidebar-group-label">Platform Core</div>
        <ul class="sidebar-nav-list">
          <li>
            <a href="${root}index.html" class="sidebar-link" data-page="home">
              ${icons.home}
              <span>Home &amp; Live Feed</span>
            </a>
          </li>
          <li>
            <a href="${root}docs.html" class="sidebar-link" data-page="docs">
              ${icons.docs}
              <span>Documentation &amp; Goals</span>
            </a>
          </li>
          <li>
            <a href="${root}overview.html" class="sidebar-link" data-page="overview">
              ${icons.compass}
              <span>Overview &amp; Mission</span>
            </a>
          </li>
          <li>
            <a href="${root}transparency.html" class="sidebar-link" data-page="transparency">
              ${icons.shield}
              <span>Data Quality &amp; Policy</span>
            </a>
          </li>
        </ul>
      </div>

      <!-- Group 2: Stakeholders -->
      <div class="sidebar-nav-group">
        <div class="sidebar-group-label">Stakeholders</div>
        <ul class="sidebar-nav-list">
          <li>
            <a href="${root}owners.html" class="sidebar-link" data-page="owners">
              ${icons.key}
              <span>Why Post Directly?</span>
            </a>
          </li>
          <li>
            <a href="${root}roadmap.html" class="sidebar-link" data-page="roadmap">
              ${icons.trending}
              <span>Growth Roadmap</span>
            </a>
          </li>
          <li>
            <a href="${root}faq.html" class="sidebar-link" data-page="faq">
              ${icons.help}
              <span>Frequently Asked Questions</span>
            </a>
          </li>
        </ul>
      </div>

      <!-- Group 3: Newsroom -->
      <div class="sidebar-nav-group">
        <div class="sidebar-group-label">Newsroom</div>
        <ul class="sidebar-nav-list">
          <li>
            <a href="${root}news/index.html" class="sidebar-link" data-page="news">
              ${icons.newspaper}
              <span>All News &amp; Updates</span>
            </a>
          </li>
          <li>
            <a href="${root}news/platform-launch-initiative/index.html" class="sidebar-link" data-page="launch">
              ${icons.trending}
              <span>Launch Initiative (Sept 2026)</span>
            </a>
          </li>
        </ul>
      </div>

      <!-- Group 4: Support & External -->
      <div class="sidebar-nav-group">
        <div class="sidebar-group-label">Support &amp; Inquiries</div>
        <ul class="sidebar-nav-list">
          <li>
            <a href="https://salamaestates.com/help" target="_blank" class="sidebar-link" style="color: var(--teal-700); font-weight: 600;">
              ${icons.support}
              <span>Salama Help Desk</span>
              ${icons.external}
            </a>
          </li>
          <li>
            <a href="${root}contact.html?type=agency" class="sidebar-link" data-page="agency">
              ${icons.building}
              <span>Agency Verification Desk</span>
            </a>
          </li>
          <li>
            <a href="${root}contact.html" class="sidebar-link" data-page="contact">
              ${icons.mail}
              <span>General Inquiries Desk</span>
            </a>
          </li>
        </ul>
      </div>

      <!-- Group 5: Administration -->
      <div class="sidebar-nav-group">
        <div class="sidebar-group-label">Administration</div>
        <ul class="sidebar-nav-list">
          <li>
            <a href="${root}admin.html" class="sidebar-link" data-page="admin" style="color: var(--slate-600);">
              ${icons.lock}
              <span>Admin Publishing Studio</span>
            </a>
          </li>
        </ul>
      </div>

    </div>

    <!-- Sidebar Footer -->
    <div class="sidebar-footer-box">
      <div>&copy; 2026 Salama Estates</div>
      <div style="font-size: 0.72rem; color: var(--slate-500); margin-top: 2px;">Public Information Platform</div>
    </div>
  `;

  document.body.insertBefore(sidebar, document.body.firstChild);

  // Active state matching
  const currentPath = window.location.pathname.toLowerCase();
  const sidebarLinks = sidebar.querySelectorAll('.sidebar-link');
  sidebarLinks.forEach((link) => {
    const href = link.getAttribute('href').toLowerCase();
    if (
      (currentPath.endsWith('/') && href.includes('index.html') && !href.includes('news/')) ||
      (currentPath.endsWith('index.html') && href.endsWith('index.html') && !currentPath.includes('news/') && !href.includes('news/')) ||
      (currentPath.includes('docs') && href.includes('docs')) ||
      (currentPath.includes('overview') && href.includes('overview')) ||
      (currentPath.includes('transparency') && href.includes('transparency')) ||
      (currentPath.includes('owners') && href.includes('owners')) ||
      (currentPath.includes('roadmap') && href.includes('roadmap')) ||
      (currentPath.includes('faq') && href.includes('faq')) ||
      (currentPath.includes('contact') && href.includes('contact')) ||
      (currentPath.includes('admin') && href.includes('admin')) ||
      (currentPath.includes('platform-launch') && href.includes('platform-launch')) ||
      (currentPath.endsWith('news/') && href.endsWith('news/index.html')) ||
      (currentPath.endsWith('news/index.html') && href.endsWith('news/index.html'))
    ) {
      link.classList.add('active');
    }
  });

  // Mobile drawer toggle handlers
  const mobileToggle = mobileBar.querySelector('.btn-mobile-toggle');
  const closeBtn = sidebar.querySelector('.btn-sidebar-close');

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
