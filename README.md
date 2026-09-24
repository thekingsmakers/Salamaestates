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

## 🔐 Admin Studio & Multi-Factor Access Security

The publishing studio is fortified with multi-layered administrative security:
- **Two-Layer MFA Authentication:** Requires both the Master Password and secondary Administrator Verification Credentials (Username & Security PIN).
- **Session Auto-Lock:** Strict 5-minute inactivity session timeout with automatic termination.
- **Geo-Fence Security:** Access is strictly restricted to verified **Qatar IP addresses (QA)**.
- **Default Site Access:** Public information portal (optional private site lock configurable in Settings).

### 🌟 Option 1: Browser News Studio (`admin.html`)
1. Open [`admin.html`](admin.html) in your browser.
2. Verified Qatar IP gate authenticates regional network access.
3. Authenticate using your 2-Layer Administrator MFA credentials.
4. Compose your news release, category, date, and media attachments.
5. Click **"🚀 Publish & Generate Sharable Link"**:
   - Automatically builds the article `index.html`.
   - Adds the entry to `news/articles.json`.
   - Generates the live GitHub Pages link with an instant **"Copy Link"** button.

### 🌟 Option 2: 1-Command PowerShell Automation (`publish-news.ps1`)
Run in PowerShell:
```powershell
.\publish-news.ps1
```
1. Verifies Qatar IP address access.
2. Authenticates 2-Layer Administrator MFA credentials.
3. Prompts for Title, Category, and Summary.
4. Injects content into `news/<slug>/index.html`, updates `news/articles.json`, and **copies the live link to your Windows Clipboard!**

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
