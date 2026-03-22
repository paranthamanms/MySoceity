#!/usr/bin/env pwsh
# Start Backend Services with PostgreSQL Database
Write-Host "`nâ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—" -ForegroundColor Cyan
Write-Host "â•‘  NammaSociety Backend Services - PostgreSQL Migration           â•‘" -ForegroundColor Cyan
Write-Host "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•`n" -ForegroundColor Cyan

# 1. Stop any existing Java processes
Write-Host "[1/6] Stopping existing services..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -eq 'java'} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "  [OK] Cleaned up old processes`n" -ForegroundColor Green

# 2. Check if PostgreSQL is accessible
Write-Host "[2/6] Checking PostgreSQL connection..." -ForegroundColor Yellow
try {
    $pgTest = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue
    if ($pgTest.TcpTestSucceeded) {
        Write-Host "  [OK] PostgreSQL is accessible on port 5432`n" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] PostgreSQL is NOT accessible on port 5432" -ForegroundColor Red
        Write-Host "    Please ensure PostgreSQL 18 is running`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [WARN] Unable to verify PostgreSQL connection`n" -ForegroundColor Yellow
}

# 3. Verify JAR files exist
Write-Host "[3/6] Verifying JAR files..." -ForegroundColor Yellow
$authJar = "C:\AMP\Projects\MySoceity\backend\auth-service\target\auth-service-1.0.0.jar"
$userJar = "C:\AMP\Projects\MySoceity\backend\user-service\target\user-service-1.0.0.jar"

if (Test-Path $authJar) {
    Write-Host "  [OK] auth-service-1.0.0.jar found" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] auth-service-1.0.0.jar NOT FOUND" -ForegroundColor Red
    exit 1
}

if (Test-Path $userJar) {
    Write-Host "  [OK] user-service-1.0.0.jar found`n" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] user-service-1.0.0.jar NOT FOUND" -ForegroundColor Red
    exit 1
}

# 4. Start Auth Service
Write-Host "[4/6] Starting Auth Service (port 8001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    "Write-Host '==== AUTH SERVICE - Port 8001 ====' -ForegroundColor Cyan; cd C:\AMP\Projects\MySoceity\backend\auth-service; java -jar target\auth-service-1.0.0.jar"
)
Start-Sleep -Seconds 12
Write-Host "  [OK] Auth Service started`n" -ForegroundColor Green

# 5. Start User Service
Write-Host "[5/6] Starting User Service (port 8002)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    "Write-Host '==== USER SERVICE - Port 8002 ====' -ForegroundColor Cyan; cd C:\AMP\Projects\MySoceity\backend\user-service; java -jar target\user-service-1.0.0.jar"
)
Start-Sleep -Seconds 12
Write-Host "  [OK] User Service started`n" -ForegroundColor Green

# 6. Verify services are running
Write-Host "[6/6] Verifying service status..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$authStatus = try {
    $response = Invoke-WebRequest -Uri 'http://localhost:8001/actuator/health' -TimeoutSec 3 -ErrorAction Stop
    "OK RUNNING - HTTP $($response.StatusCode)"
} catch {
    "ERROR NOT RESPONDING"
}

$userStatus = try {
    $response = Invoke-WebRequest -Uri 'http://localhost:8002/actuator/health' -TimeoutSec 3 -ErrorAction Stop
    "OK RUNNING - HTTP $($response.StatusCode)"
} catch {
    "ERROR NOT RESPONDING"
}

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "  Service Status Summary" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
if ($authStatus -like "*OK*") {
    Write-Host "  Auth Service (8001): $authStatus" -ForegroundColor Green
} else {
    Write-Host "  Auth Service (8001): $authStatus" -ForegroundColor Red
}
if ($userStatus -like "*OK*") {
    Write-Host "  User Service (8002): $userStatus" -ForegroundColor Green
} else {
    Write-Host "  User Service (8002): $userStatus" -ForegroundColor Red
}
Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  Database: PostgreSQL 18 (localhost:5432)" -ForegroundColor Cyan
Write-Host "  Database Name: postgres" -ForegroundColor Cyan
Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  Check the service windows for startup logs" -ForegroundColor Cyan
Write-Host "  Look for: 'Hibernate: create table...' messages" -ForegroundColor Cyan
Write-Host "  and '[AdminInit] DEFAULT ADMIN USER CREATED'" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

if ($authStatus -notlike "*OK*" -or $userStatus -notlike "*OK*") {
    Write-Host "WARNING: Some services failed to start. Check the service windows for errors." -ForegroundColor Yellow
    Write-Host "  Common issues:" -ForegroundColor Yellow
    Write-Host "  - PostgreSQL not running - check pgAdmin4" -ForegroundColor Yellow
    Write-Host "  - Wrong database credentials in application.yml" -ForegroundColor Yellow
    Write-Host "  - Port already in use - ports 8001 or 8002" -ForegroundColor Yellow
    Write-Host ""
}

