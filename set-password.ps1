<#
.SYNOPSIS
  Salama Estates - Admin Password Reset Tool
.DESCRIPTION
  Allows you to change the admin password permanently across the platform:
  - Updates assets/js/auth.js default hash
  - Updates publish-news.ps1 expected hash
#>

$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  🔑 SALAMA ESTATES - PASSWORD MANAGEMENT TOOL            " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$NewPassInput = Read-Host "Enter New Admin Password" -AsSecureString
$BSTR1 = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($NewPassInput)
$PlainPass1 = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR1)

if ($PlainPass1.Length -lt 6) {
    Write-Host "❌ Password must be at least 6 characters long." -ForegroundColor Red
    exit 1
}

$ConfirmPassInput = Read-Host "Confirm New Admin Password" -AsSecureString
$BSTR2 = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($ConfirmPassInput)
$PlainPass2 = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR2)

if ($PlainPass1 -ne $PlainPass2) {
    Write-Host "❌ Passwords do not match. Please try again." -ForegroundColor Red
    exit 1
}

# Compute SHA-256 Hash
$Hasher = [System.Security.Cryptography.SHA256]::Create()
$Bytes = [System.Text.Encoding]::UTF8.GetBytes($PlainPass1)
$NewHash = [BitConverter]::ToString($Hasher.ComputeHash($Bytes)).Replace("-", "").ToLower()

# 1. Update assets/js/auth.js
$AuthJsPath = Join-Path $ProjectRoot "assets\js\auth.js"
if (Test-Path $AuthJsPath) {
    $Content = Get-Content $AuthJsPath -Raw
    $Content = $Content -replace "const DEFAULT_HASH = '[a-f0-9]{64}';", "const DEFAULT_HASH = '$NewHash';"
    Set-Content $AuthJsPath -Value $Content -Encoding UTF8
    Write-Host "✅ Updated: assets/js/auth.js" -ForegroundColor Green
}

# 2. Update publish-news.ps1
$PublishPsPath = Join-Path $ProjectRoot "publish-news.ps1"
if (Test-Path $PublishPsPath) {
    $Content = Get-Content $PublishPsPath -Raw
    $Content = $Content -replace '\$ExpectedHash = "[a-f0-9]{64}"', "`$ExpectedHash = `"$NewHash`""
    Set-Content $PublishPsPath -Value $Content -Encoding UTF8
    Write-Host "✅ Updated: publish-news.ps1" -ForegroundColor Green
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  🎉 PASSWORD CHANGED SUCCESSFULLY!                       " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Your new password is now active for both the Web Studio (admin.html) and CLI (publish-news.ps1)." -ForegroundColor Green
Write-Host ""
