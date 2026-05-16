# ═══════════════════════════════════════════════════════════════════════════
# ADD SURVEILLANCE BLOCKS TO HOSTS FILE
# Run this script as Administrator
# ═══════════════════════════════════════════════════════════════════════════

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"

$newEntries = @"

# === GTM/PARTYTOWN SURVEILLANCE BLOCK - Added $(Get-Date -Format 'yyyy-MM-dd HH:mm') ===
# Google Tag Manager - surveillance/tracking framework
0.0.0.0 www.googletagmanager.com
0.0.0.0 googletagmanager.com
0.0.0.0 tagmanager.google.com

# Kyndryl GTM (Jorge's employer - never visited this domain)
0.0.0.0 gtm-msr.kyndryl.com

# Wrong-country Airbnb domain (Colombia instead of Costa Rica)
0.0.0.0 www.airbnb.com.co
0.0.0.0 airbnb.com.co

# Google Analytics
0.0.0.0 www.google-analytics.com
0.0.0.0 google-analytics.com
0.0.0.0 ssl.google-analytics.com
0.0.0.0 analytics.google.com
"@

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: Must run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'"
    exit 1
}

Write-Host "Adding surveillance blocks to hosts file..." -ForegroundColor Yellow
Add-Content -Path $hostsPath -Value $newEntries -Encoding UTF8
Write-Host "Done! Added entries:" -ForegroundColor Green
Write-Host $newEntries

# Flush DNS cache
Write-Host "`nFlushing DNS cache..." -ForegroundColor Yellow
ipconfig /flushdns
Write-Host "DNS cache flushed!" -ForegroundColor Green
