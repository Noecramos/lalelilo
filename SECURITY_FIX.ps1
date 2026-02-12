# URGENT: Security Fix - Remove Exposed Credentials
# This script helps you remove sensitive files from Git history

Write-Host "🚨 SECURITY FIX - Removing Sensitive Files from Git" -ForegroundColor Red
Write-Host ""

# Files to remove from lalelilo repository
$lalelilo_files = @(
    "supabase/novix_complete_setup.sql",
    "supabase/complete_auth_setup.sql",
    "waha-cloudrun/deploy.ps1",
    "scripts/run-migration.mjs"
)

# Files to remove from Olinshop repository
$olinshop_files = @(
    "n8n-ai-simple-ready.json",
    "create-default-session.ps1",
    "waha-quick-login.ps1",
    "setup-waha-noweb.ps1",
    "LATEST-PASSWORD.ps1"
)

Write-Host "⚠️  WARNING: This will rewrite Git history!" -ForegroundColor Yellow
Write-Host "   Make sure you have backups before proceeding." -ForegroundColor Yellow
Write-Host ""
Write-Host "Files to remove from lalelilo:" -ForegroundColor Cyan
$lalelilo_files | ForEach-Object { Write-Host "  - $_" }
Write-Host ""
Write-Host "Files to remove from Olinshop:" -ForegroundColor Cyan
$olinshop_files | ForEach-Object { Write-Host "  - $_" }
Write-Host ""

$confirm = Read-Host "Do you want to proceed? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "❌ Aborted" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "📋 MANUAL STEPS REQUIRED:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Install BFG Repo-Cleaner:" -ForegroundColor Cyan
Write-Host "   Download from: https://rtyley.github.io/bfg-repo-cleaner/" -ForegroundColor Gray
Write-Host ""
Write-Host "2. For LALELILO repository:" -ForegroundColor Cyan
Write-Host "   cd D:\Antigravity\lalelilo" -ForegroundColor Gray
Write-Host "   git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch supabase/novix_complete_setup.sql supabase/complete_auth_setup.sql waha-cloudrun/deploy.ps1' --prune-empty --tag-name-filter cat -- --all" -ForegroundColor Gray
Write-Host "   git push origin --force --all" -ForegroundColor Gray
Write-Host ""
Write-Host "3. For OLINSHOP repository:" -ForegroundColor Cyan
Write-Host "   cd D:\Antigravity\Olinshop" -ForegroundColor Gray
Write-Host "   git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch n8n-ai-simple-ready.json create-default-session.ps1 waha-quick-login.ps1 setup-waha-noweb.ps1 LATEST-PASSWORD.ps1' --prune-empty --tag-name-filter cat -- --all" -ForegroundColor Gray
Write-Host "   git push origin --force --all" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Rotate ALL credentials immediately!" -ForegroundColor Red
Write-Host ""
