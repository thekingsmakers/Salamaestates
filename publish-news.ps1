<#
.SYNOPSIS
  Salama Estates - Automated News Publisher & Sharable Link Generator
.DESCRIPTION
  Automates the complete workflow:
  1. Verifies Qatar IP Geolocation
  2. Validates admin password (G@ngstar36)
  3. Clones news/template/ to news/<slug>/index.html
  4. Injects title, category, date, meta tags, and content
  5. Appends to news/articles.json
  6. Optionally commits to Git
  7. Generates and copies the live sharable link to your clipboard!
#>

[CmdletBinding()]
param()

$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  SALAMA ESTATES - AUTOMATED NEWS PUBLISHER STUDIO        " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 0. Regional Security Gate
Write-Host "Verifying regional security gate..." -ForegroundColor Gray
try {
    $Geo = Invoke-RestMethod -Uri "https://api.country.is/" -TimeoutSec 4 -ErrorAction Stop
    if ($Geo.country -ne "QA") {
        Write-Host ""
        Write-Host "[Access Restricted] Your country has been restricted. Please contact platform administration." -ForegroundColor Red
        Write-Host "Help Center - Salama Estates: https://salamaestates.com/help" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
    Write-Host "[Verified] Secure network connection established." -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "[Notice] Geo-check offline or local network. Proceeding." -ForegroundColor Gray
    Write-Host ""
}

# 1. Two-Layer Multi-Factor Authentication (MFA)
$Layer1Hash = "5470c8db55655bf4e75a31c2a5a0d3ff0188afd091e48c73e534d6284d77a2e5"
$MfaUserHash = "c9304b095360e458dc217e1a44bfd9484ebb11493377ffdb0854906db062176a"
$MfaPinHash  = "66eba0f8578c53acb353d399405165153f066adaf9c6567bdd25b31fceb8a83e"

$Hasher = [System.Security.Cryptography.SHA256]::Create()
function Compute-Sha256($val) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($val)
    return [BitConverter]::ToString($Hasher.ComputeHash($bytes)).Replace("-", "").ToLower()
}

Write-Host "--- Layer 1: Master Key ---" -ForegroundColor Cyan
$PasswordInput = Read-Host "Enter Master Admin Password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($PasswordInput)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

if ((Compute-Sha256 $PlainPassword) -ne $Layer1Hash) {
    Write-Host "[Error] Incorrect master password. Access denied." -ForegroundColor Red
    exit 1
}
Write-Host "[Verified] Layer 1 Authenticated!" -ForegroundColor Green
Write-Host ""

Write-Host "--- Layer 2: MFA Credentials ---" -ForegroundColor Cyan
$AdminUser = Read-Host "Enter Administrator Username"
$PinInput = Read-Host "Enter 4-Digit Security PIN" -AsSecureString
$BSTR2 = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($PinInput)
$PlainPin = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR2)

$UserValid = (Compute-Sha256 ($AdminUser.Trim().ToLower())) -eq $MfaUserHash
$PinValid = (Compute-Sha256 ($PlainPin.Trim())) -eq $MfaPinHash

if (-not ($UserValid -and $PinValid)) {
    Write-Host "[Error] Invalid administrator username or security PIN. Access denied." -ForegroundColor Red
    exit 1
}

Write-Host "[Success] MFA Authenticated! Access granted." -ForegroundColor Green
Write-Host ""

# Admin Action Selection
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  SALAMA ESTATES - NEWS MANAGEMENT MENU                   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  1) Publish New Article & Generate Sharable Link"
Write-Host "  2) Edit an Existing Article"
Write-Host "  3) List & Delete Existing Articles"
Write-Host "  4) Exit"
Write-Host ""
$MenuChoice = Read-Host "Select option (1-4) [Default: 1]"
if ([string]::IsNullOrWhiteSpace($MenuChoice)) { $MenuChoice = "1" }

if ($MenuChoice -eq "4") {
    Write-Host "Exiting News Studio." -ForegroundColor Gray
    exit 0
}

# -------------------------------------------------------------
# OPTION 2: EDIT AN EXISTING ARTICLE
# -------------------------------------------------------------
if ($MenuChoice -eq "2") {
    $ArticlesJsonPath = Join-Path $ProjectRoot "news\articles.json"
    $Articles = @()
    if (Test-Path $ArticlesJsonPath) {
        try {
            $JsonRaw = Get-Content -Path $ArticlesJsonPath -Raw
            $Articles = @($JsonRaw | ConvertFrom-Json)
        } catch {
            $Articles = @()
        }
    }

    if ($Articles.Count -eq 0) {
        Write-Host ""
        Write-Host "[Notice] No articles found in news\articles.json." -ForegroundColor Yellow
        exit 0
    }

    Write-Host ""
    Write-Host "Current Articles Manifest:" -ForegroundColor Cyan
    Write-Host "----------------------------------------------------------" -ForegroundColor Gray
    for ($i = 0; $i -lt $Articles.Count; $i++) {
        $art = $Articles[$i]
        Write-Host " [$($i + 1)] $($art.title)" -ForegroundColor White
        Write-Host "     Slug: news/$($art.slug) | Category: $($art.category) | Date: $($art.date)" -ForegroundColor Gray
    }
    Write-Host "----------------------------------------------------------" -ForegroundColor Gray
    Write-Host ""
    $EditIdxInput = Read-Host "Enter the number of the article to EDIT (or press Enter to cancel)"
    if ([string]::IsNullOrWhiteSpace($EditIdxInput)) {
        Write-Host "Operation cancelled." -ForegroundColor Yellow
        exit 0
    }

    $EditIdx = [int]$EditIdxInput - 1
    if ($EditIdx -lt 0 -or $EditIdx -ge $Articles.Count) {
        Write-Host "[Error] Invalid selection." -ForegroundColor Red
        exit 1
    }

    $TargetArticle = $Articles[$EditIdx]
    $OldSlug = $TargetArticle.slug

    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "  EDIT ARTICLE: $($TargetArticle.title)" -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "[Tip: Press Enter without typing to keep existing value]" -ForegroundColor Gray
    Write-Host ""

    $NewTitleInput = Read-Host "Title [$($TargetArticle.title)]"
    $NewTitle = if ([string]::IsNullOrWhiteSpace($NewTitleInput)) { $TargetArticle.title } else { $NewTitleInput }

    $NewCatInput = Read-Host "Category [$($TargetArticle.category)]"
    $NewCategory = if ([string]::IsNullOrWhiteSpace($NewCatInput)) { $TargetArticle.category } else { $NewCatInput }

    $NewDateInput = Read-Host "Publish Date [$($TargetArticle.date)]"
    $NewDate = if ([string]::IsNullOrWhiteSpace($NewDateInput)) { $TargetArticle.date } else { $NewDateInput }

    $NewSummaryInput = Read-Host "Summary [$($TargetArticle.summary)]"
    $NewSummary = if ([string]::IsNullOrWhiteSpace($NewSummaryInput)) { $TargetArticle.summary } else { $NewSummaryInput }

    $CurImg = if ($TargetArticle.image) { $TargetArticle.image } else { "assets/images/marketplace-launch-banner.svg" }
    $NewImgInput = Read-Host "Hero Image [$CurImg]"
    $NewImage = if ([string]::IsNullOrWhiteSpace($NewImgInput)) { $CurImg } else { $NewImgInput }

    # Update article object
    $TargetArticle.title = $NewTitle
    $TargetArticle.category = $NewCategory
    $TargetArticle.categorySlug = $NewCategory.ToLower() -replace '[^\w]', '-'
    $TargetArticle.date = $NewDate
    $TargetArticle.summary = $NewSummary
    $TargetArticle.image = $NewImage

    # Save to news/articles.json
    $UpdatedJson = $Articles | ConvertTo-Json -Depth 5
    Set-Content -Path $ArticlesJsonPath -Value $UpdatedJson -Encoding UTF8
    Write-Host "[Success] Updated news\articles.json" -ForegroundColor Green

    # Update HTML file if exists
    $ArticleHtmlPath = Join-Path $ProjectRoot "news\$OldSlug\index.html"
    if (Test-Path $ArticleHtmlPath) {
        $Html = Get-Content -Path $ArticleHtmlPath -Raw -Encoding UTF8
        $Html = [System.Text.RegularExpressions.Regex]::Replace($Html, '<title>.*?</title>', "<title>$NewTitle - Salama Estates</title>")
        $Html = [System.Text.RegularExpressions.Regex]::Replace($Html, '<h1 class="article-main-title">[\s\S]*?</h1>', "<h1 class=`"article-main-title`">$NewTitle</h1>")
        $Html = [System.Text.RegularExpressions.Regex]::Replace($Html, '<span class="badge-tag badge-date">[\s\S]*?</span>', "<span class=`"badge-tag badge-date`">$NewDate</span>")
        $Html = [System.Text.RegularExpressions.Regex]::Replace($Html, '<span class="badge-tag badge-primary">[\s\S]*?</span>', "<span class=`"badge-tag badge-primary`">$NewCategory</span>")
        
        $ResolvedImg = $NewImage
        if ($ResolvedImg -notmatch '^(https?:\/\/|data:|\.\.\/)') {
            $ResolvedImg = "../../" + ($ResolvedImg -replace '^\.?\/?', '')
        }
        
        if ($Html -match '<div style="margin-bottom: 2rem; border-radius: 12px;') {
            $Html = [System.Text.RegularExpressions.Regex]::Replace($Html, '<div style="margin-bottom: 2rem; border-radius: 12px;[\s\S]*?</div>\s*</div>', @"
<div style="margin-bottom: 2rem; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); max-height: 440px; background: #f8fafc;">
          <img src="$ResolvedImg" alt="$NewTitle" style="width: 100%; height: 100%; object-fit: cover; max-height: 440px; display: block;" onerror="this.onerror=null; this.src='../../assets/images/marketplace-launch-banner.svg';">
        </div>
"@)
        }
        Set-Content -Path $ArticleHtmlPath -Value $Html -Encoding UTF8
        Write-Host "[Success] Updated HTML: news\$OldSlug\index.html" -ForegroundColor Green
    }

    # Commit and Push
    Write-Host ""
    $GitPush = Read-Host "Do you want to commit & push this update to GitHub? (Y/N) [Default: Y]"
    if ([string]::IsNullOrWhiteSpace($GitPush) -or $GitPush -eq "Y" -or $GitPush -eq "y") {
        git add -A
        git commit -m "Update news article: $NewTitle"
        git push origin master
        git push origin main
        Write-Host "[Success] Pushed update to origin/master and origin/main!" -ForegroundColor Green
    }

    $GhUser = "thekingsmakers"
    $GhRepo = "Salamaestates"
    try {
        $RemoteUrl = git config --get remote.origin.url
        if ($RemoteUrl -match "github\.com[:/]([^/]+)/([^/\.]+)") {
            $GhUser = $Matches[1]
            $GhRepo = $Matches[2]
        }
    } catch {}

    $PublicUrl = "https://$GhUser.github.io/$GhRepo/news/$OldSlug/"
    try {
        Set-Clipboard -Value $PublicUrl
        $CopiedMsg = "(Copied to Clipboard!)"
    } catch {
        $CopiedMsg = ""
    }

    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "  ARTICLE UPDATED SUCCESSFULLY!                           " -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "Live Sharable Link: " -NoNewline -ForegroundColor Yellow
    Write-Host $PublicUrl -ForegroundColor Cyan
    Write-Host "   $CopiedMsg" -ForegroundColor Magenta
    Write-Host ""
    exit 0
}

# -------------------------------------------------------------
# OPTION 3: LIST & DELETE EXISTING ARTICLES
# -------------------------------------------------------------
if ($MenuChoice -eq "3") {
    $ArticlesJsonPath = Join-Path $ProjectRoot "news\articles.json"
    $Articles = @()
    if (Test-Path $ArticlesJsonPath) {
        try {
            $JsonRaw = Get-Content -Path $ArticlesJsonPath -Raw
            $Articles = @($JsonRaw | ConvertFrom-Json)
        } catch {
            $Articles = @()
        }
    }

    if ($Articles.Count -eq 0) {
        Write-Host ""
        Write-Host "[Notice] No articles found in news\articles.json." -ForegroundColor Yellow
        exit 0
    }

    Write-Host ""
    Write-Host "Current Articles Manifest:" -ForegroundColor Cyan
    Write-Host "----------------------------------------------------------" -ForegroundColor Gray
    for ($i = 0; $i -lt $Articles.Count; $i++) {
        $art = $Articles[$i]
        Write-Host " [$($i + 1)] $($art.title)" -ForegroundColor White
        Write-Host "     Slug: news/$($art.slug) | Category: $($art.category) | Date: $($art.date)" -ForegroundColor Gray
    }
    Write-Host "----------------------------------------------------------" -ForegroundColor Gray
    Write-Host ""
    $DeleteIdxInput = Read-Host "Enter the number of the article to DELETE (or press Enter to cancel)"
    if ([string]::IsNullOrWhiteSpace($DeleteIdxInput)) {
        Write-Host "Operation cancelled." -ForegroundColor Yellow
        exit 0
    }

    $DeleteIdx = [int]$DeleteIdxInput - 1
    if ($DeleteIdx -lt 0 -or $DeleteIdx -ge $Articles.Count) {
        Write-Host "[Error] Invalid selection." -ForegroundColor Red
        exit 1
    }

    $TargetArticle = $Articles[$DeleteIdx]
    $TargetSlug = $TargetArticle.slug

    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Red
    Write-Host "  CONFIRM ARTICLE DELETION                                " -ForegroundColor Red
    Write-Host "==========================================================" -ForegroundColor Red
    Write-Host "Title:  $($TargetArticle.title)" -ForegroundColor White
    Write-Host "Folder: news\$TargetSlug" -ForegroundColor White
    Write-Host ""
    $Confirm = Read-Host "Type 'DELETE' to permanently delete this article"
    if ($Confirm -ne "DELETE") {
        Write-Host "Deletion cancelled." -ForegroundColor Yellow
        exit 0
    }

    # 1. Delete directory news/<slug>
    $DirToDelete = Join-Path $ProjectRoot "news\$TargetSlug"
    if (Test-Path $DirToDelete) {
        Remove-Item -Path $DirToDelete -Recurse -Force
        Write-Host "[Success] Deleted directory: news\$TargetSlug" -ForegroundColor Green
    }

    # 2. Update news/articles.json
    $UpdatedArticles = @($Articles | Where-Object { $_.slug -ne $TargetSlug })
    $UpdatedJson = $UpdatedArticles | ConvertTo-Json -Depth 5
    Set-Content -Path $ArticlesJsonPath -Value $UpdatedJson -Encoding UTF8
    Write-Host "[Success] Removed from news\articles.json" -ForegroundColor Green

    # 3. Commit and Push
    Write-Host ""
    $GitPush = Read-Host "Do you want to commit & push this deletion to GitHub? (Y/N) [Default: Y]"
    if ([string]::IsNullOrWhiteSpace($GitPush) -or $GitPush -eq "Y" -or $GitPush -eq "y") {
        git add -A
        git commit -m "Delete news article: $($TargetArticle.title)"
        git push origin master
        git push origin main
        Write-Host "[Success] Pushed deletion to origin/master and origin/main!" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "Article successfully removed from Salama Estates!" -ForegroundColor Green
    exit 0
}

# -------------------------------------------------------------
# OPTION 1: PUBLISH NEW ARTICLE
# -------------------------------------------------------------
# 2. Gather Article Information
$Title = Read-Host "Article Title (e.g. October 2026: Agency Verification Program)"
if ([string]::IsNullOrWhiteSpace($Title)) {
    Write-Host "[Error] Title cannot be empty." -ForegroundColor Red
    exit 1
}

# Auto-generate slug
$Slug = $Title.ToLower() -replace '[^\w\s-]', '' -replace '[\s_-]+', '-' -replace '^-+|-+$', ''
$CustomSlug = Read-Host "Folder/URL Slug [Press Enter for: $Slug]"
if (-not [string]::IsNullOrWhiteSpace($CustomSlug)) {
    $Slug = $CustomSlug.ToLower() -replace '[^\w\s-]', '' -replace '[\s_-]+', '-'
}

Write-Host ""
Write-Host "Select Category:" -ForegroundColor Yellow
Write-Host "  1) Platform Development"
Write-Host "  2) Agency Verification"
Write-Host "  3) Property Owners"
Write-Host "  4) Roadmap"
Write-Host "  5) Policy and Standards"
Write-Host "  6) Custom Category"
$CatChoice = Read-Host "Enter choice (1-6) [Default: 1]"

$Category = switch ($CatChoice) {
    "2" { "Agency Verification" }
    "3" { "Property Owners" }
    "4" { "Roadmap" }
    "5" { "Policy & Standards" }
    "6" { Read-Host "Enter Custom Category" }
    Default { "Platform Development" }
}

$CurrentDate = Get-Date -Format "MMMM yyyy"
$DateInput = Read-Host "Publish Date [Press Enter for: $CurrentDate]"
$Date = if ([string]::IsNullOrWhiteSpace($DateInput)) { $CurrentDate } else { $DateInput }

$Summary = Read-Host "Summary / Excerpt (1-2 sentences for preview card)"
if ([string]::IsNullOrWhiteSpace($Summary)) {
    $Summary = "Official announcement and policy disclosure from Salama Estates administration."
}

$Quote = Read-Host "Impact Quote (Optional, press Enter to skip)"

$ImgInput = Read-Host "Hero Image Path [Press Enter for: assets/images/marketplace-launch-banner.svg]"
$Image = if ([string]::IsNullOrWhiteSpace($ImgInput)) { "assets/images/marketplace-launch-banner.svg" } else { $ImgInput }

# 3. Create the Directory and index.html
$TargetDir = Join-Path $ProjectRoot "news\$Slug"
if (Test-Path $TargetDir) {
    Write-Host "[Warning] Directory news\$Slug already exists. Overwrite? (Y/N)" -ForegroundColor Yellow
    $Confirm = Read-Host
    if ($Confirm -ne "Y" -and $Confirm -ne "y") {
        Write-Host "Aborted by user." -ForegroundColor Yellow
        exit 0
    }
} else {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

$TemplatePath = Join-Path $ProjectRoot "news\template\index.html"
if (-not (Test-Path $TemplatePath)) {
    Write-Host "[Error] Template file news\template\index.html not found!" -ForegroundColor Red
    exit 1
}

$HtmlContent = Get-Content -Path $TemplatePath -Raw -Encoding UTF8

# Injections
$HtmlContent = $HtmlContent -replace "<title>Official Notice Template - Salama Estates</title>", "<title>$Title - Salama Estates</title>"
$HtmlContent = $HtmlContent -replace '<span class="badge-tag badge-primary">Platform Notice</span>', "<span class=`"badge-tag badge-primary`">$Category</span>"
$HtmlContent = $HtmlContent -replace '<span class="badge-tag badge-date">October 2026</span>', "<span class=`"badge-tag badge-date`">$Date</span>"
$HtmlContent = $HtmlContent -replace '<h1 class="article-main-title">Official Notice &amp; Platform Update Title Goes Here</h1>', "<h1 class=`"article-main-title`">$Title</h1>"
$HtmlContent = $HtmlContent -replace '<span><strong>Category:</strong> Official Release</span>', "<span><strong>Category:</strong> $Category</span>"
$HtmlContent = $HtmlContent -replace '<span>Official Notice Template</span>', "<span>$Title</span>"

$SummaryReplacement = "<p style=`"font-size: 1.15rem; color: var(--slate-800); font-weight: 500; line-height: 1.7;`">$Summary</p>"
$HtmlContent = $HtmlContent -replace '<p style="font-size: 1\.15rem; color: var\(--slate-800\); font-weight: 500; line-height: 1\.7;">[\s\S]*?</p>', $SummaryReplacement

$ResolvedImg = $Image
if ($ResolvedImg -notmatch '^(https?:\/\/|data:|\.\.\/)') {
    $ResolvedImg = "../../" + ($ResolvedImg -replace '^\.?\/?', '')
}
$HeroImgTag = @"
        <div style="margin-bottom: 2rem; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); max-height: 440px; background: #f8fafc;">
          <img src="$ResolvedImg" alt="$Title" style="width: 100%; height: 100%; object-fit: cover; max-height: 440px; display: block;" onerror="this.onerror=null; this.src='../../assets/images/marketplace-launch-banner.svg';">
        </div>
"@
$HtmlContent = $HtmlContent -replace '</header>', "</header>`n$HeroImgTag"

if (-not [string]::IsNullOrWhiteSpace($Quote)) {
    $QuoteBlock = @"
            <blockquote style="margin: 24px 0; padding: 18px 24px; border-left: 4px solid var(--color-primary); background: var(--teal-50); border-radius: 0 var(--radius-md) var(--radius-md) 0; font-style: italic; color: var(--teal-900);">
              "$Quote"
            </blockquote>
"@
    $HtmlContent = $HtmlContent -replace '&ldquo;Add an impactful quote or guiding principle here\.&rdquo;', $Quote
}

$TargetHtmlPath = Join-Path $TargetDir "index.html"
Set-Content -Path $TargetHtmlPath -Value $HtmlContent -Encoding UTF8

Write-Host "[Success] Created: news\$Slug\index.html" -ForegroundColor Green

# 4. Append to news/articles.json
$ArticlesJsonPath = Join-Path $ProjectRoot "news\articles.json"
$Articles = @()

if (Test-Path $ArticlesJsonPath) {
    try {
        $JsonRaw = Get-Content -Path $ArticlesJsonPath -Raw
        $Articles = $JsonRaw | ConvertFrom-Json
    } catch {
        $Articles = @()
    }
}

# Remove existing with same slug if re-publishing
$Articles = @($Articles | Where-Object { $_.slug -ne $Slug })

$NewArticle = [PSCustomObject]@{
    id           = $Slug
    slug         = $Slug
    path         = "news/$Slug/index.html"
    image        = $Image
    title        = $Title
    subtitle     = "Platform Announcement"
    category     = $Category
    categorySlug = $Category.ToLower() -replace '[^\w]', '-'
    date         = $Date
    isoDate      = (Get-Date -Format "yyyy-MM-dd")
    readTime     = "4 min read"
    featured     = $false
    summary      = $Summary
    status       = "Verified Release"
    badge        = "Official Announcement"
    tags         = @($Category, "Announcement")
}

$UpdatedArticles = @($NewArticle) + $Articles
$UpdatedJson = $UpdatedArticles | ConvertTo-Json -Depth 5
Set-Content -Path $ArticlesJsonPath -Value $UpdatedJson -Encoding UTF8

Write-Host "[Success] Updated: news\articles.json" -ForegroundColor Green

# 5. Git Commit & Push (Optional)
Write-Host ""
$GitPush = Read-Host "Do you want to git commit & push to GitHub now? (Y/N)"
if ($GitPush -eq "Y" -or $GitPush -eq "y") {
    git add .
    git commit -m "Publish news: $Title"
    git push origin master
    git push origin main
    Write-Host "[Success] Pushed to GitHub master and main!" -ForegroundColor Green
}

# 6. Generate Sharable Link
$GhUser = "thekingsmakers"
$GhRepo = "Salamaestates"

try {
    $RemoteUrl = git config --get remote.origin.url
    if ($RemoteUrl -match "github\.com[:/]([^/]+)/([^/\.]+)") {
        $GhUser = $Matches[1]
        $GhRepo = $Matches[2]
    }
} catch {}

$PublicUrl = "https://$GhUser.github.io/$GhRepo/news/$Slug/"
$LocalUrl = "news/$Slug/index.html"

# Copy to clipboard
try {
    Set-Clipboard -Value $PublicUrl
    $CopiedMsg = "(Copied to Clipboard!)"
} catch {
    $CopiedMsg = ""
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  ARTICLE PUBLISHED SUCCESSFULLY!                         " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Live Sharable Link: " -NoNewline -ForegroundColor Yellow
Write-Host $PublicUrl -ForegroundColor Cyan
Write-Host "   $CopiedMsg" -ForegroundColor Magenta
Write-Host ""
Write-Host "Local File Path: news/$Slug/index.html" -ForegroundColor Gray
Write-Host "Live Feed: Both index.html and news/index.html will now fetch and display this article automatically!" -ForegroundColor Green
Write-Host ""
