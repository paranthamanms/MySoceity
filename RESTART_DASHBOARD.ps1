#!/usr/bin/env pwsh

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Restarting Dashboard MFE Service" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Kill Dashboard process
Write-Host "🔍 Finding Dashboard MFE process on port 4203..." -ForegroundColor Yellow
$dashboardPort = Get-NetTCPConnection -LocalPort 4203 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1

if ($dashboardPort) {
    Write-Host "✅ Found process: $dashboardPort" -ForegroundColor Green
    Write-Host "🛑 Stopping Dashboard MFE..." -ForegroundColor Yellow
    Stop-Process -Id $dashboardPort -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "✅ Dashboard MFE stopped" -ForegroundColor Green
} else {
    Write-Host "⚠️  No process found on port 4203" -ForegroundColor Yellow
}

# Step 2: Clear Angular cache
Write-Host "`n🧹 Clearing Angular cache..." -ForegroundColor Yellow
$dashboardPath = Join-Path $PSScriptRoot "frontend\dashboard-mfe"

if (Test-Path (Join-Path $dashboardPath ".angular")) {
    Remove-Item -Path (Join-Path $dashboardPath ".angular") -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Cleared .angular cache" -ForegroundColor Green
}

if (Test-Path (Join-Path $dashboardPath "dist")) {
    Remove-Item -Path (Join-Path $dashboardPath "dist") -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Cleared dist folder" -ForegroundColor Green
}

# Step 3: Restart Dashboard
Write-Host "`n🚀 Starting Dashboard MFE (port 4203)..." -ForegroundColor Yellow
Set-Location -Path $dashboardPath

$dashboardProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -PassThru -WindowStyle Normal
Write-Host "✅ Dashboard MFE starting (PID: $($dashboardProcess.Id))" -ForegroundColor Green

Write-Host "`n⏳ Waiting 15 seconds for compilation..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Step 4: Verify
Write-Host "`n🔍 Verifying Dashboard MFE..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4203" -UseBasicParsing -Method Head -TimeoutSec 5
    Write-Host "✅ Dashboard MFE is RUNNING (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Dashboard MFE not yet ready. Wait 10 more seconds and check http://localhost:4203" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  NEXT STEPS:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Wait for compilation to complete" -ForegroundColor White
Write-Host "2. Go to: http://localhost:4200" -ForegroundColor White
Write-Host "3. Press: Ctrl + Shift + R (hard refresh)" -ForegroundColor White
Write-Host "4. Try logging in again" -ForegroundColor White
Write-Host "`n💡 If still failing:" -ForegroundColor Cyan
Write-Host "   • Press F12 in browser" -ForegroundColor White
Write-Host "   • Check Console tab for errors" -ForegroundColor White
Write-Host "   • Share the error message`n" -ForegroundColor White
