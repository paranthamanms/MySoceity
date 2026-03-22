Write-Host ""
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "  COMPLETE BACKEND RESTART & TEST" -ForegroundColor Yellow
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop all backend services
Write-Host "Step 1: Stopping all backend services..." -ForegroundColor Cyan
$authPid = (Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue).OwningProcess | Select-Object -First 1
$userPid = (Get-NetTCPConnection -LocalPort 8002 -ErrorAction SilentlyContinue).OwningProcess | Select-Object -First 1

if ($authPid) {
    Write-Host "  Stopping Auth Service (PID: $authPid)..." -ForegroundColor Yellow
    Stop-Process -Id $authPid -Force -ErrorAction SilentlyContinue
}
if ($userPid) {
    Write-Host "  Stopping User Service (PID: $userPid)..." -ForegroundColor Yellow
    Stop-Process -Id $userPid -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 3
Write-Host "  Services stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Start Auth Service
Write-Host "Step 2: Starting Auth Service..." -ForegroundColor Cyan
Set-Location "C:\AMP\Projects\MySoceity\backend\auth-service"
$authProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'AUTH SERVICE STARTING...' -ForegroundColor Cyan; java -jar target/auth-service-1.0.0.jar" -PassThru -WindowStyle Normal
Write-Host "  Auth Service started (PID: $($authProcess.Id))" -ForegroundColor Green
Write-Host "  Watch the Auth Service window for startup logs" -ForegroundColor Gray
Write-Host ""

# Step 3: Wait
Write-Host "Step 3: Waiting 20 seconds for Auth Service..." -ForegroundColor Cyan
for ($i=20; $i -gt 0; $i--) {
    Write-Host "  $i seconds..." -NoNewline -ForegroundColor Yellow
    Start-Sleep -Seconds 1
    Write-Host "`r                      `r" -NoNewline
}
Write-Host "  Auth Service should be ready" -ForegroundColor Green
Write-Host ""

# Step 4: Start User Service
Write-Host "Step 4: Starting User Service..." -ForegroundColor Cyan
Set-Location "C:\AMP\Projects\MySoceity\backend\user-service"
$userProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'USER SERVICE STARTING...' -ForegroundColor Cyan; java -jar target/user-service-1.0.0.jar" -PassThru -WindowStyle Normal
Write-Host "  User Service started (PID: $($userProcess.Id))" -ForegroundColor Green
Write-Host ""

# Step 5: Wait
Write-Host "Step 5: Waiting 15 seconds for User Service..." -ForegroundColor Cyan
for ($i=15; $i -gt 0; $i--) {
    Write-Host "  $i seconds..." -NoNewline -ForegroundColor Yellow
    Start-Sleep -Seconds 1
    Write-Host "`r                      `r" -NoNewline
}
Write-Host "  User Service should be ready" -ForegroundColor Green
Write-Host ""

# Step 6: Test Auth Service
Write-Host "Step 6: Testing Auth Service..." -ForegroundColor Cyan
try {
    $headers = @{'Content-Type'='application/json'}
    $body = @{username='admin';password='admin@123'} | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "http://localhost:8001/api/auth/login" `
        -Method POST -Headers $headers -Body $body -UseBasicParsing -TimeoutSec 15
    
    Write-Host "  SUCCESS! Auth Service login working" -ForegroundColor Green
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
    $loginWorking = $true
} catch {
    Write-Host "  FAILED! Auth Service not responding correctly" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    $statusCode = $_.Exception.Response.StatusCode.Value__
    Write-Host "  Status Code: $statusCode" -ForegroundColor Yellow
    
    if ($statusCode -eq 401) {
        Write-Host ""
        Write-Host "  401 = Wrong password or user not found" -ForegroundColor Yellow
        Write-Host "  Check the Auth Service window for the correct password" -ForegroundColor Yellow
        Write-Host "  Look for: 'Default admin created: admin / xxxxx'" -ForegroundColor Yellow
    }
    $loginWorking = $false
}

Write-Host ""

# Step 7: Final Status
Set-Location "C:\AMP\Projects\MySoceity"
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "  FINAL STATUS" -ForegroundColor Yellow
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host ""

if ($loginWorking) {
    Write-Host "SUCCESS! Backend is ready for login" -ForegroundColor Green
    Write-Host ""
    Write-Host "HOW TO LOGIN:" -ForegroundColor Cyan
    Write-Host "  1. Go to: http://localhost:4200" -ForegroundColor White
    Write-Host "  2. Press: Ctrl + Shift + R (hard refresh)" -ForegroundColor White
    Write-Host "  3. Login with:" -ForegroundColor White
    Write-Host "     Username: admin" -ForegroundColor White
    Write-Host "     Password: admin@123" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "PROBLEM DETECTED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Check the Auth Service console window" -ForegroundColor Yellow
    Write-Host "  Look for error messages or the admin password message" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  If you see: 'Default admin created: admin / XXXXX'" -ForegroundColor Cyan
    Write-Host "  Use XXXXX as the password (not 'admin@123')" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "========================================"  -ForegroundColor Cyan
Write-Host ""
