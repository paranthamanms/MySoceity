#!/usr/bin/env pwsh
# MySoceity Service Restart

Write-Host "===== MySoceity Service Restart =====" -ForegroundColor Cyan

# Kill services
Write-Host "`n[1] Stopping all existing services..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null | Out-Null
taskkill /F /IM java.exe 2>$null | Out-Null
Start-Sleep -Seconds 2
Write-Host "OK" -ForegroundColor Green

# Clean and install dependencies
Write-Host "`n[2] Cleaning and reinstalling frontend dependencies..." -ForegroundColor Yellow
$services = @("host-app", "login-mfe", "register-mfe", "dashboard-mfe")
foreach ($service in $services) {
    $path = "C:\AMP\Projects\MySoceity\frontend\$service"
    if (Test-Path "$path\node_modules") { Remove-Item -Recurse -Force "$path\node_modules" -ErrorAction SilentlyContinue }
    if (Test-Path "$path\package-lock.json") { Remove-Item -Force "$path\package-lock.json" -ErrorAction SilentlyContinue }
}
Write-Host "OK" -ForegroundColor Green

Write-Host "`n[3] Installing npm packages..." -ForegroundColor Yellow
foreach ($service in $services) {
    $path = "C:\AMP\Projects\MySoceity\frontend\$service"
    Write-Host "  $service..." -ForegroundColor Cyan
    Push-Location $path
    npm install 2>&1 | Out-Null
    Pop-Location
}
Write-Host "OK" -ForegroundColor Green

# Start backend
Write-Host "`n[4] Starting backend services..." -ForegroundColor Yellow
Start-Job -ScriptBlock { cd "C:\AMP\Projects\MySoceity\backend\auth-service"; java -jar target/auth-service-1.0.0.jar } -Name "auth-service" | Out-Null
Start-Sleep -Seconds 2
Start-Job -ScriptBlock { cd "C:\AMP\Projects\MySoceity\backend\user-service"; java -jar target/user-service-1.0.0.jar } -Name "user-service" | Out-Null
Write-Host "OK" -ForegroundColor Green

Start-Sleep -Seconds 30

# Start frontend
Write-Host "`n[5] Starting frontend services..." -ForegroundColor Yellow
Start-Job -ScriptBlock { cd "C:\AMP\Projects\MySoceity\frontend\host-app"; npm start } -Name "host-app" | Out-Null
Start-Sleep -Seconds 3
Start-Job -ScriptBlock { cd "C:\AMP\Projects\MySoceity\frontend\login-mfe"; npm run start:direct } -Name "login-mfe" | Out-Null
Start-Sleep -Seconds 3
Start-Job -ScriptBlock { cd "C:\AMP\Projects\MySoceity\frontend\register-mfe"; npm start } -Name "register-mfe" | Out-Null
Start-Sleep -Seconds 3
Start-Job -ScriptBlock { cd "C:\AMP\Projects\MySoceity\frontend\dashboard-mfe"; npm run start:direct } -Name "dashboard-mfe" | Out-Null
Write-Host "OK" -ForegroundColor Green

Start-Sleep -Seconds 60

# Check status
Write-Host "`n===== SERVICE STATUS =====" -ForegroundColor Cyan
$ports = @("4200","4201","4202","4203","8001","8002")
foreach ($port in $ports) {
    $status = netstat -ano 2>$null | Select-String ":$port" | Select-String "LISTEN"
    if ($status) {
        Write-Host "Port $port - OK" -ForegroundColor Green
    } else {
        Write-Host "Port $port - FAILED" -ForegroundColor Red
    }
}
Write-Host "`nAccess: http://localhost:4200" -ForegroundColor Cyan
