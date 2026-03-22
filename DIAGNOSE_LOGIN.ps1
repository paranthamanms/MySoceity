Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LOGIN ISSUE DIAGNOSTIC" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Auth Service Health
Write-Host "1. Testing Auth Service (port 8001)..." -ForegroundColor Cyan
try {
    $authHealth = Invoke-WebRequest -Uri "http://localhost:8001/actuator/health" -UseBasicParsing -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   SUCCESS: Auth Service RUNNING (Status $($authHealth.StatusCode))" -ForegroundColor Green
    $authServiceOk = $true
} catch {
    Write-Host "   FAILED: Auth Service  NOT RESPONDING" -ForegroundColor Red
    Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Red
    $authServiceOk = $false
}

# Test 2: User Service Health
Write-Host ""
Write-Host "2. Testing User Service (port 8002)..." -ForegroundColor Cyan
try {
    $userHealth = Invoke-WebRequest -Uri "http://localhost:8002/actuator/health" -UseBasicParsing -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   SUCCESS: User Service RUNNING (Status $($userHealth.StatusCode))" -ForegroundColor Green
    $userServiceOk = $true
} catch {
    Write-Host "   FAILED: User Service NOT RESPONDING" -ForegroundColor Red
    Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Red
    $userServiceOk = $false
}

# Test 3: Frontend Host App
Write-Host ""
Write-Host "3. Testing Frontend Host App (port 4200)..." -ForegroundColor Cyan
try {
    $hostApp = Invoke-WebRequest -Uri "http://localhost:4200" -UseBasicParsing -Method Head -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   SUCCESS: Host App ACCESSIBLE (Status $($hostApp.StatusCode))" -ForegroundColor Green
    $hostAppOk = $true
} catch {
    Write-Host "   FAILED: Host App NOT ACCESSIBLE" -ForegroundColor Red
    Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Red
    $hostAppOk = $false
}

# Test 4: Login MFE
Write-Host ""
Write-Host "4. Testing Login MFE (port 4201)..." -ForegroundColor Cyan
try {
    $loginMfe = Invoke-WebRequest -Uri "http://localhost:4201" -UseBasicParsing -Method Head -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   SUCCESS: Login MFE ACCESSIBLE (Status $($loginMfe.StatusCode))" -ForegroundColor Green
    $loginMfeOk = $true
} catch {
    Write-Host "   FAILED: Login MFE NOT ACCESSIBLE" -ForegroundColor Red
    Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Red
    $loginMfeOk = $false
}

# Test 5: Direct Auth Service Login Test
if ($authServiceOk) {
    Write-Host ""
    Write-Host "5. Testing Direct Backend Login (Admin credentials)..." -ForegroundColor Cyan
    try {
        $headers = @{
            'Content-Type' = 'application/json'
        }
        $body = @{
            username = 'admin'
            password = 'Admin@123'
        } | ConvertTo-Json

        $loginResponse = Invoke-WebRequest -Uri "http://localhost:8001/auth/login" -Method POST -Headers $headers -Body $body -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop

        Write-Host "   SUCCESS: Backend Login WORKS (Status $($loginResponse.StatusCode))" -ForegroundColor Green
        $responsePreview = $loginResponse.Content.Substring(0, [Math]::Min(100, $loginResponse.Content.Length))
        Write-Host "      Response: $responsePreview..." -ForegroundColor Gray
        $backendLoginOk = $true
    } catch {
        Write-Host "   FAILED: Backend Login DOES NOT WORK" -ForegroundColor Red
        Write-Host "      Status: $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red
        Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Red
        $backendLoginOk = $false
    }
} else {
    Write-Host ""
    Write-Host "5. Skipping Backend Login Test (Auth Service not running)" -ForegroundColor Yellow
    $backendLoginOk = $false
}

# Test 6: Check for port status
Write-Host ""
Write-Host "6. Checking all service ports..." -ForegroundColor Cyan
$ports = @(8001, 8002, 4200, 4201, 4202, 4203)
foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($process) {
        Write-Host "   Port $port - ACTIVE" -ForegroundColor Green
    } else {
        Write-Host "   Port $port - FREE (service not running)" -ForegroundColor Yellow
    }
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DIAGNOSTIC SUMMARY" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

$allOk = $authServiceOk -and $userServiceOk -and $hostAppOk -and $loginMfeOk -and $backendLoginOk

if ($allOk) {
    Write-Host ""
    Write-Host "SUCCESS: ALL BACKEND SERVICES ARE WORKING!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Problem is likely in the BROWSER:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   SOLUTION:" -ForegroundColor Cyan
    Write-Host "   1. Open browser at: http://localhost:4200" -ForegroundColor White
    Write-Host "   2. Press: Ctrl + Shift + R (hard refresh)" -ForegroundColor White
    Write-Host "   3. If still failing press F12 and check Console tab" -ForegroundColor White
    Write-Host "   4. Share any RED error messages you see" -ForegroundColor White
    Write-Host ""
    Write-Host "   OR try Incognito mode:" -ForegroundColor Cyan
    Write-Host "   - Press Ctrl + Shift + N (Chrome)" -ForegroundColor White
    Write-Host "   - Go to http://localhost:4200" -ForegroundColor White
    Write-Host "   - Try logging in" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "ISSUES DETECTED:" -ForegroundColor Red
    if (-not $authServiceOk) { Write-Host "   - Auth Service not running" -ForegroundColor Red }
    if (-not $userServiceOk) { Write-Host "   - User Service not running" -ForegroundColor Red }
    if (-not $hostAppOk) { Write-Host "   - Host App not accessible" -ForegroundColor Red }
    if (-not $loginMfeOk) { Write-Host "   - Login MFE not accessible" -ForegroundColor Red }
    if (-not $backendLoginOk) { Write-Host "   - Backend login endpoint failing" -ForegroundColor Red }
    
    Write-Host ""
    Write-Host "   SOLUTION:" -ForegroundColor Cyan
    Write-Host "   Run: .\START_ALL_SERVICES.ps1" -ForegroundColor White
    Write-Host "   Wait 30 seconds then run this diagnostic again" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
