# 🏛️ Salama Estates - Public Information & News Portal

Official public information portal, transparency registry, and newsroom for **Salama Estates**. 
This is a 100% static website built for direct deployment to **GitHub Pages**, Netlify, Vercel, or any standard web server.

---

## 📂 Project Structure

```text
salama-estate-news/
├── .nojekyll                           # Bypasses Jekyll on GitHub Pages
├── index.html                          # Main Public Information Portal & Live News Feed
├── overview.html                       # Platform Overview & Foundational Mission
├── transparency.html                   # Data Quality Standards & Transparency Disclosures
├── owners.html                         # Guide for Property Owners: Why Post Directly?
├── roadmap.html                        # Growth Roadmap & Future Vision
├── faq.html                            # Interactive Frequently Asked Questions
├── contact.html                        # Contact Us & Agency Verification Desk
├── README.md                           # Documentation & Deployment Guide
├── assets/
│   ├── css/
│   │   └── style.css                   # Salama Estates branding, typography, responsive styling
│   ├── js/
│   │   ├── main.js                     # Mobile navbar, FAQ accordions, reading progress bar
│   │   └── news-fetcher.js             # Dynamic news auto-fetcher, DOMParser, search & filter
│   └── images/
│       └── logo.svg                    # Official SVG brand mark
└── news/
    ├── index.html                      # Dedicated Newsroom Hub
    ├── articles.json                   # News manifest catalog
    ├── platform-launch-initiative/
    │   └── index.html                  # 1st News: Platform Launch Initiative (Sept 2026)
    └── template/
        └── index.html                  # Reusable template for future news articles
```

---

## ⚡ How the Automated News System Works

Every news article is stored as a clean, standalone HTML page (`index.html`) inside its own folder under `news/`:

### 1. Reusable Article Template
Inside [`news/template/index.html`](news/template/index.html), you have a pre-formatted article page equipped with:
- Canonical news `<meta>` tags:
  ```html
  <meta name="news:title" content="Article Title">
  <meta name="news:category" content="Platform Development">
  <meta name="news:date" content="October 2026">
  <meta name="news:readTime" content="4 min read">
  <meta name="news:status" content="Active Initiative">
  <meta name="news:badge" content="Official">
  <meta name="description" content="Brief summary for cards and search">
  ```
- Sticky in-page table of contents
- Reading progress bar
- Responsive typography, checklists, and official statement banners

### 2. How to Add a New News Article in 60 Seconds
1. Duplicate the `news/template/` folder and rename it to your article slug, e.g.:
   `news/october-2026-agency-verification/`
2. Open its `index.html` and update the `<meta>` tags and article content.
3. Add the entry to [`news/articles.json`](news/articles.json):
   ```json
   {
     "id": "october-2026-agency-verification",
     "slug": "october-2026-agency-verification",
     "path": "october-2026-agency-verification/index.html",
     "title": "Agency Verification Program Launch",
     "category": "Agency",
     "date": "October 2026",
     "summary": "Announcing credential verification and dedicated badges for licensed real estate agencies."
   }
   ```
4. **Done!** The homepage (`index.html`) and Newsroom (`news/index.html`) automatically fetch, parse, and render the new article card with instant search and category filtering.

---

## 🚀 Deploying to GitHub Pages

1. **Initialize Git Repository**:
   ```bash
   cd "C:\Users\THE KINGS MAKERS\Documents\salama-estate-news"
   git init
   git add .
   git commit -m "Initial commit of Salama Estates Public Information & News Portal"
   ```

2. **Push to GitHub**:
   Create a new public repository on GitHub (e.g. `salama-estate-news`) and run:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/salama-estate-news.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**:
   - Go to your repository on GitHub.
   - Click **Settings** > **Pages**.
   - Under **Build and deployment > Source**, select **Deploy from a branch**.
   - Select branch: `main` and folder: `/ (root)`.
   - Click **Save**.

Your static public information site will be live at:
`https://<YOUR_USERNAME>.github.io/salama-estate-news/`

---

## 💻 Local Preview

You can open [`index.html`](index.html) directly in any web browser, or serve it using any simple local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js (npx)
npx serve
```
Then visit `http://localhost:8000`.
