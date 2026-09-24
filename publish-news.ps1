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

# 0. Qatar IP Geolocation Gate
Write-Host "Verifying regional IP access..." -ForegroundColor Gray
try {
    $Geo = Invoke-RestMethod -Uri "https://api.country.is/" -TimeoutSec 4 -ErrorAction Stop
    if ($Geo.country -ne "QA") {
        Write-Host "[Access Denied] Admin access is strictly restricted to Qatar IP addresses (QA)." -ForegroundColor Red
        Write-Host "Detected Country: $($Geo.country) ($($Geo.ip))" -ForegroundColor Red
        exit 1
    }
    Write-Host "[Verified] Qatar IP Verified: $($Geo.ip)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "[Notice] Geo-check offline or local network. Proceeding." -ForegroundColor Gray
    Write-Host ""
}

# 1. Password Verification
$ExpectedHash = "5470c8db55655bf4e75a31c2a5a0d3ff0188afd091e48c73e534d6284d77a2e5" # G@ngstar36

$PasswordInput = Read-Host "Enter Admin Password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($PasswordInput)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$Hasher = [System.Security.Cryptography.SHA256]::Create()
$Bytes = [System.Text.Encoding]::UTF8.GetBytes($PlainPassword)
$Hash = [BitConverter]::ToString($Hasher.ComputeHash($Bytes)).Replace("-", "").ToLower()

if ($Hash -ne $ExpectedHash) {
    Write-Host "[Error] Incorrect password. Access denied." -ForegroundColor Red
    exit 1
}

Write-Host "[Success] Access granted!" -ForegroundColor Green
Write-Host ""

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
    Write-Host "[Success] Pushed to GitHub!" -ForegroundColor Green
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
