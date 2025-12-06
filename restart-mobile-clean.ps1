Write-Host "========================================"
Write-Host " Cleaning and Restarting Mobile App"
Write-Host "========================================"
Write-Host ""

Set-Location mobile

Write-Host "Step 1: Clearing Expo cache..."
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
Write-Host "✓ Expo cache cleared"

Write-Host ""
Write-Host "Step 2: Clearing Metro bundler cache..."
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
Write-Host "✓ Metro cache cleared"

Write-Host ""
Write-Host "Step 3: Clearing watchman (if installed)..."
watchman watch-del-all 2>$null
Write-Host "✓ Watchman cleared"

Write-Host ""
Write-Host "Step 4: Starting Expo with clean cache..."
Write-Host ""
Write-Host "========================================"
Write-Host " Mobile app starting with clean cache"
Write-Host " Press Ctrl+C to stop"
Write-Host "========================================"
Write-Host ""

npx expo start --clear
