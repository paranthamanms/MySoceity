# ============================================================================
# Restart Services with New Environment Variables
# ============================================================================
# This script stops all services and restarts them to pick up new env vars
# ============================================================================

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  Restart Services with New Config" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Step 1: Stop all existing services
Write-Host "Step 1: Stopping all services..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Write-Host "  All services stopped`n" -ForegroundColor Green

# Step 2: Verify environment variables
Write-Host "Step 2: Verifying environment variables..." -ForegroundColor Yellow
$twilioSid = [System.Environment]::GetEnvironmentVariable('TWILIO_ACCOUNT_SID', 'User')
$twilioToken = [System.Environment]::GetEnvironmentVariable('TWILIO_AUTH_TOKEN', 'User')
$twilioPhone = [System.Environment]::GetEnvironmentVariable('TWILIO_PHONE_NUMBER', 'User')
$mailUser = [System.Environment]::GetEnvironmentVariable('MAIL_USERNAME', 'User')
$mailPass = [System.Environment]::GetEnvironmentVariable('MAIL_PASSWORD', 'User')

$allSet = $true

if ($twilioSid) {
    Write-Host "  TWILIO_ACCOUNT_SID: SET" -ForegroundColor Green
} else {
    Write-Host "  TWILIO_ACCOUNT_SID: NOT SET" -ForegroundColor Red
    $allSet = $false
}

if ($twilioToken) {
    Write-Host "  TWILIO_AUTH_TOKEN: SET" -ForegroundColor Green
} else {
    Write-Host "  TWILIO_AUTH_TOKEN: NOT SET" -ForegroundColor Red
    $allSet = $false
}

if ($twilioPhone) {
    Write-Host "  TWILIO_PHONE_NUMBER: SET" -ForegroundColor Green
} else {
    Write-Host "  TWILIO_PHONE_NUMBER: NOT SET" -ForegroundColor Red
    $allSet = $false
}

if ($mailUser) {
    Write-Host "  MAIL_USERNAME: SET" -ForegroundColor Green
} else {
    Write-Host "  MAIL_USERNAME: NOT SET" -ForegroundColor Red
    $allSet = $false
}

if ($mailPass) {
    Write-Host "  MAIL_PASSWORD: SET" -ForegroundColor Green
} else {
    Write-Host "  MAIL_PASSWORD: NOT SET (Email notifications will fail!)" -ForegroundColor Yellow
}

Write-Host ""

if (-not $allSet) {
    Write-Host "WARNING: Some environment variables are not set!" -ForegroundColor Red
    Write-Host "Services will start but notifications may not work properly.`n" -ForegroundColor Yellow
}

# Step 3: Start services
Write-Host "Step 3: Starting services..." -ForegroundColor Yellow

Write-Host "  Starting auth-service (port 8001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\AMP\Projects\MySoceity\backend\auth-service; java -jar target\auth-service-1.0.0.jar"
Start-Sleep -Seconds 8

Write-Host "  Starting user-service (port 8002)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\AMP\Projects\MySoceity\backend\user-service; java -jar target\user-service-1.0.0.jar"
Start-Sleep -Seconds 10

Write-Host "  Starting login-mfe (port 4201)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\AMP\Projects\MySoceity\frontend\login-mfe; npm start"
Start-Sleep -Seconds 5

Write-Host "  Starting dashboard-mfe (port 4203)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\AMP\Projects\MySoceity\frontend\dashboard-mfe; npm start"

Write-Host "`n  Services are starting... (this takes 30-45 seconds)" -ForegroundColor Yellow
Write-Host "  Check the new PowerShell windows for startup logs`n" -ForegroundColor White

# Step 4: Wait and verify
Write-Host "Step 4: Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "  Verifying services..." -ForegroundColor Yellow
$ports = @{8001='auth-service'; 8002='user-service'; 4201='login-mfe'; 4203='dashboard-mfe'}
foreach($port in 8001,8002,4201,4203) {
    $listening = netstat -ano 2>$null | Select-String ":$port\s" | Select-String "LISTENING"
    if($listening) {
        Write-Host "    Port $port ($($ports[$port])): RUNNING" -ForegroundColor Green
    } else {
        Write-Host "    Port $port ($($ports[$port])): NOT RUNNING" -ForegroundColor Red
    }
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  Services Restarted!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan

Write-Host "`nAccess your application:" -ForegroundColor Yellow
Write-Host "  Login: http://localhost:4201" -ForegroundColor Cyan
Write-Host "  Dashboard: http://localhost:4203`n" -ForegroundColor Cyan

if (-not $mailPass) {
    Write-Host "REMINDER: Set Gmail App Password to enable email notifications!" -ForegroundColor Yellow
    Write-Host "Run: .\CONFIGURE_GMAIL_APP_PASSWORD.ps1`n" -ForegroundColor Cyan
}
