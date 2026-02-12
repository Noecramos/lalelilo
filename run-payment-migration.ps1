# Run Payment Migration

Write-Host "Running Payment Support Migration..." -ForegroundColor Cyan

# Load .env.local
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim('"')
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
}

# Run migration
node scripts/run-migration.mjs supabase/migrations/add_payment_support.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migration completed successfully!" -ForegroundColor Green
}
else {
    Write-Host "Migration failed!" -ForegroundColor Red
}
