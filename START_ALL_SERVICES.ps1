#!/usr/bin/env powershell

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   MySoceity Complete Service Startup Script              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`nStep 1: Kill existing services..."
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✓ Done`n" -ForegroundColor Green

$workspaceRoot = "C:\AMP\Projects\MySoceity"

Write-Host "Step 2: Starting Backend Services..." -ForegroundColor Yellow
Write-Host "  → auth-service on port 8001"
Start-Process powershell -WindowStyle Hidden -ArgumentList '-NoExit', '-Command', "cd '$workspaceRoot\backend\auth-service'; Write-Host 'Starting auth-service...'; java -jar target/auth-service-1.0.0.jar"
Start-Sleep -Seconds 3

Write-Host "  → user-service on port 8002"
Start-Process powershell -WindowStyle Hidden -ArgumentList '-NoExit', '-Command', "cd '$workspaceRoot\backend\user-service'; Write-Host 'Starting user-service...'; java -jar target/user-service-1.0.0.jar"
Start-Sleep -Seconds 5

Write-Host "`nStep 3: Starting Frontend Services..." -ForegroundColor Yellow
Write-Host "  → login-mfe on port 4201"
Start-Process powershell -NoExit -ArgumentList '-Command', "cd '$workspaceRoot\frontend\login-mfe'; Write-Host 'Starting login-mfe...'; npm run start:direct"
Start-Sleep -Seconds 4

Write-Host "  → dashboard-mfe on port 4203"
Start-Process powershell -NoExit -ArgumentList '-Command', "cd '$workspaceRoot\frontend\dashboard-mfe'; Write-Host 'Starting dashboard-mfe...'; npm run start:direct"
Start-Sleep -Seconds 4

Write-Host "`n⏳ Waiting 30 seconds for services to fully initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "`n" -ForegroundColor Green
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   SERVICE STATUS REPORT                                   ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`nBackend Services:"
@(8001, 8002) | ForEach-Object {
    $port = $_
    $name = if ($port -eq 8001) { "auth-service" } else { "user-service" }
    if (netstat -ano 2>$null | Select-String ":$port\s" | Select-String "LISTENING") {
        Write-Host "  ✓ Port $port ($name) - LISTENING" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Port $port ($name) - NOT LISTENING" -ForegroundColor Red
    }
}

Write-Host "`nFrontend Services:"
@(4201, 4203) | ForEach-Object {
    $port = $_
    $name = if ($port -eq 4201) { "login-mfe" } else { "dashboard-mfe" }
    if (netstat -ano 2>$null | Select-String ":$port\s" | Select-String "LISTENING") {
        Write-Host "  ✓ Port $port ($name) - LISTENING" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Port $port ($name) - NOT LISTENING" -ForegroundColor Red
    }
}

Write-Host "`nAccess URLs:"
Write-Host "  • Login MFE:      http://localhost:4201" -ForegroundColor Cyan
Write-Host "  • Dashboard MFE:  http://localhost:4203" -ForegroundColor Cyan
Write-Host "  • Auth Service:   http://localhost:8001" -ForegroundColor Cyan
Write-Host "  • User Service:   http://localhost:8002" -ForegroundColor Cyan
Write-Host "`n"
