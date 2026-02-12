# Create Test Order

Write-Host "Creating test order..." -ForegroundColor Cyan

# Load .env.local
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim('"')
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
}

# Run script
node create-test-order.mjs
