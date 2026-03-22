# Start Backend Services with PostgreSQL Database
Write-Host "`nStarting NammaSociety Backend Services with PostgreSQL..." -ForegroundColor Cyan

# Stop existing Java processes
Write-Host "[1/5] Stopping existing services..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -eq 'java'} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "  Done`n" -ForegroundColor Green

# Verify JAR files exist
Write-Host "[2/5] Verifying JAR files..." -ForegroundColor Yellow
$authJar = "C:\AMP\Projects\MySoceity\backend\auth-service\target\auth-service-1.0.0.jar"
$userJar = "C:\AMP\Projects\MySoceity\backend\user-service\target\user-service-1.0.0.jar"

if (!(Test-Path $authJar)) {
    Write-Host "  ERROR: auth-service JAR not found!" -ForegroundColor Red
    exit 1
}
if (!(Test-Path $userJar)) {
    Write-Host "  ERROR: user-service JAR not found!" -ForegroundColor Red
    exit 1
}
Write-Host "  Both JAR files found`n" -ForegroundColor Green

# Start Auth Service
Write-Host "[3/5] Starting Auth Service on port 8001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Write-Host '==== AUTH SERVICE ====' -ForegroundColor Cyan; cd C:\AMP\Projects\MySoceity\backend\auth-service; java -jar target\auth-service-1.0.0.jar"
Start-Sleep -Seconds 12

# Start User Service  
Write-Host "[4/5] Starting User Service on port 8002..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Write-Host '==== USER SERVICE ====' -ForegroundColor Cyan; cd C:\AMP\Projects\MySoceity\backend\user-service; java-jar target\user-service-1.0.0.jar"
Start-Sleep -Seconds 12

# Verify services
Write-Host "[5/5] Verifying services..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$authOk = $false
$userOk = $false

try {
    $r = Invoke-WebRequest -Uri 'http://localhost:8001/actuator/health' -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  Auth Service: RUNNING" -ForegroundColor Green
    $authOk = $true
} catch {
    Write-Host "  Auth Service: NOT RESPONDING" -ForegroundColor Red
}

try {
    $r = Invoke-WebRequest -Uri 'http://localhost:8002/actuator/health' -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  User Service: RUNNING" -ForegroundColor Green
    $userOk = $true
} catch {
    Write-Host "  User Service: NOT RESPONDING" -ForegroundColor Red
}

Write-Host "`n===================================" -ForegroundColor Cyan
if ($authOk -and $userOk) {
    Write-Host "SUCCESS: All services are running!" -ForegroundColor Green
    Write-Host "Database: PostgreSQL on localhost:5432" -ForegroundColor Cyan
} else {
    Write-Host "WARNING: Some services failed to start" -ForegroundColor Yellow
    Write-Host "Check the service windows for error messages" -ForegroundColor Yellow
}
Write-Host "===================================`n" -ForegroundColor Cyan

