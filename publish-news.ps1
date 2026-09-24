<#
.SYNOPSIS
  Salama Estates - Automated News Publisher & Sharable Link Generator
.DESCRIPTION
  Automates the complete workflow:
  1. Validates admin password
  2. Clones news/template/ to news/<slug>/index.html
  3. Injects title, category, date, meta tags, and content
  4. Appends to news/articles.json
  5. Optionally commits to Git
  6. Generates and copies the live sharable link to your clipboard!
#>

[CmdletBinding()]
param()

$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  🏛️  SALAMA ESTATES - AUTOMATED NEWS PUBLISHER STUDIO   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Password Verification
$ExpectedHash = "732f9678b838fba7561778d948d001d023916f0fde2b36d446a9df3321b61568" # salama2026

$PasswordInput = Read-Host "🔐 Enter Admin Password (default: salama2026)" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($PasswordInput)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$Hasher = [System.Security.Cryptography.SHA256]::Create()
$Bytes = [System.Text.Encoding]::UTF8.GetBytes($PlainPassword)
$Hash = [BitConverter]::ToString($Hasher.ComputeHash($Bytes)).Replace("-", "").ToLower()

if ($Hash -ne $ExpectedHash) {
    Write-Host "❌ Incorrect password. Access denied." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Access granted!" -ForegroundColor Green
Write-Host ""

# 2. Gather Article Information
$Title = Read-Host "📰 Article Title (e.g. October 2026: Agency Verification Program)"
if ([string]::IsNullOrWhiteSpace($Title)) {
    Write-Host "❌ Title cannot be empty." -ForegroundColor Red
    exit 1
}

# Auto-generate slug
$Slug = $Title.ToLower() -replace '[^\w\s-]', '' -replace '[\s_-]+', '-' -replace '^-+|-+$', ''
$CustomSlug = Read-Host "🔗 Folder/URL Slug [Press Enter for: $Slug]"
if (-not [string]::IsNullOrWhiteSpace($CustomSlug)) {
    $Slug = $CustomSlug.ToLower() -replace '[^\w\s-]', '' -replace '[\s_-]+', '-'
}

Write-Host ""
Write-Host "Select Category:" -ForegroundColor Yellow
Write-Host "  1) Platform Development"
Write-Host "  2) Agency Verification"
Write-Host "  3) Property Owners"
Write-Host "  4) Roadmap & Milestones"
Write-Host "  5) Policy & Standards"
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
$DateInput = Read-Host "📅 Publish Date [Press Enter for: $CurrentDate]"
$Date = if ([string]::IsNullOrWhiteSpace($DateInput)) { $CurrentDate } else { $DateInput }

$Summary = Read-Host "📝 Summary / Excerpt (1-2 sentences for preview card)"
if ([string]::IsNullOrWhiteSpace($Summary)) {
    $Summary = "Official announcement and policy disclosure from Salama Estates administration."
}

$Quote = Read-Host "💬 Impact Quote (Optional, press Enter to skip)"

# 3. Create the Directory and index.html
$TargetDir = Join-Path $ProjectRoot "news\$Slug"
if (Test-Path $TargetDir) {
    Write-Host "⚠️ Warning: Directory news\$Slug already exists. Overwrite? (Y/N)" -ForegroundColor Yellow
    $Confirm = Read-Host
    if ($Confirm -ne "Y" -and $Confirm -ne "y") {
        Write-Host "Aborted." -ForegroundColor Red
        exit 0
    }
} else {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

$TemplatePath = Join-Path $ProjectRoot "news\template\index.html"
$TargetHtml = Join-Path $TargetDir "index.html"

if (-not (Test-Path $TemplatePath)) {
    Write-Host "❌ Error: Template file not found at $TemplatePath" -ForegroundColor Red
    exit 1
}

$HtmlContent = Get-Content -Path $TemplatePath -Raw

# Replace placeholders
$HtmlContent = $HtmlContent -replace '<title>Article Title Here \| Salama Estates News</title>', "<title>$Title | Salama Estates News</title>"
$HtmlContent = $HtmlContent -replace '<meta name="news:title" content="[^"]*">', "<meta name=\"news:title\" content=\"$Title\">"
$HtmlContent = $HtmlContent -replace '<meta name="news:category" content="[^"]*">', "<meta name=\"news:category\" content=\"$Category\">"
$HtmlContent = $HtmlContent -replace '<meta name="news:date" content="[^"]*">', "<meta name=\"news:date\" content=\"$Date\">"
$HtmlContent = $HtmlContent -replace '<meta name="description" content="[^"]*">', "<meta name=\"description\" content=\"$Summary\">"
$HtmlContent = $HtmlContent -replace '<meta property="og:title" content="[^"]*">', "<meta property=\"og:title\" content=\"$Title\">"
$HtmlContent = $HtmlContent -replace '<meta property="og:description" content="[^"]*">', "<meta property=\"og:description\" content=\"$Summary\">"
$HtmlContent = $HtmlContent -replace 'Your Article Headline Goes Here', $Title
$HtmlContent = $HtmlContent -replace 'Published: October 2026', "Published: $Date"
$HtmlContent = $HtmlContent -replace 'Write your main opening paragraph here\..*?(?=</p>)', $Summary

if (-not [string]::IsNullOrWhiteSpace($Quote)) {
    $HtmlContent = $HtmlContent -replace '&ldquo;Add an impactful quote or guiding principle here\.&rdquo;', "&ldquo;$Quote&rdquo;"
}

Set-Content -Path $TargetHtml -Value $HtmlContent -Encoding UTF8

Write-Host "✅ Created: news\$Slug\index.html" -ForegroundColor Green

# 4. Update news/articles.json
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

Write-Host "✅ Updated: news\articles.json" -ForegroundColor Green

# 5. Git Commit & Push (Optional)
Write-Host ""
$GitPush = Read-Host "🚀 Do you want to git commit & push to GitHub now? (Y/N)"
if ($GitPush -eq "Y" -or $GitPush -eq "y") {
    git add .
    git commit -m "Publish news: $Title"
    git push origin main
    Write-Host "✅ Pushed to GitHub!" -ForegroundColor Green
}

# 6. Generate Sharable Link
$GhUser = "YOUR_USERNAME"
$GhRepo = "salama-estate-news"

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
Write-Host "  🎉 ARTICLE PUBLISHED SUCCESSFULLY!                      " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Live Sharable Link: " -NoNewline -ForegroundColor Yellow
Write-Host $PublicUrl -ForegroundColor Cyan
Write-Host "   $CopiedMsg" -ForegroundColor Magenta
Write-Host ""
Write-Host "📂 Local File Path: news/$Slug/index.html" -ForegroundColor Gray
Write-Host "🌐 Live Feed: Both index.html and news/index.html will now fetch and display this article automatically!" -ForegroundColor Green
Write-Host ""
