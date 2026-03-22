# Setup OTP Environment Variables and Restart Services
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  OTP ENVIRONMENT SETUP & SERVICE RESTART" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Set Twilio Environment Variables
Write-Host "[1/4] Setting Twilio environment variables..." -ForegroundColor Yellow
$env:TWILIO_ACCOUNT_SID = "YOUR_TWILIO_ACCOUNT_SID"
$env:TWILIO_AUTH_TOKEN = "YOUR_TWILIO_AUTH_TOKEN"
$env:TWILIO_PHONE_NUMBER = "YOUR_TWILIO_PHONE_NUMBER"
Write-Host "  [OK] TWILIO_ACCOUNT_SID set" -ForegroundColor Green
Write-Host "  [OK] TWILIO_AUTH_TOKEN set" -ForegroundColor Green
Write-Host "  [OK] TWILIO_PHONE_NUMBER set" -ForegroundColor Green

# Set Gmail Environment Variables
Write-Host "`n[2/4] Setting Gmail environment variables..." -ForegroundColor Yellow
$env:MAIL_USERNAME = "NammaSociety.notifications@gmail.com"
$env:MAIL_PASSWORD = "YOUR_GMAIL_APP_PASSWORD"
Write-Host "  [OK] MAIL_USERNAME set" -ForegroundColor Green
Write-Host "  [OK] MAIL_PASSWORD set" -ForegroundColor Green

# Stop existing services
Write-Host "`n[3/4] Stopping existing services..." -ForegroundColor Yellow
Get-Process -Name java -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "  Stopping Java process (PID: $($_.Id))..." -ForegroundColor Gray
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 3
Write-Host "  [OK] Services stopped" -ForegroundColor Green

# Start services with environment variables
Write-Host "`n[4/4] Starting services with OTP configuration..." -ForegroundColor Yellow

# Start auth-service
Write-Host "`n  Starting auth-service on port 8001..." -ForegroundColor Gray
Start-Process powershell -ArgumentList @"
-NoExit -Command `
  cd 'C:\AMP\Projects\MySoceity\backend\auth-service'; `
  Write-Host '========================================' -ForegroundColor Cyan; `
  Write-Host '  AUTH-SERVICE (Port 8001)' -ForegroundColor Cyan; `
  Write-Host '  OTP Services: SMS + Email Enabled' -ForegroundColor Green; `
  Write-Host '========================================' -ForegroundColor Cyan; `
  `$env:TWILIO_ACCOUNT_SID='YOUR_TWILIO_ACCOUNT_SID'; `
  `$env:TWILIO_AUTH_TOKEN='YOUR_TWILIO_AUTH_TOKEN'; `
  `$env:TWILIO_PHONE_NUMBER='YOUR_TWILIO_PHONE_NUMBER'; `
  `$env:MAIL_USERNAME='NammaSociety.notifications@gmail.com'; `
  `$env:MAIL_PASSWORD='YOUR_GMAIL_APP_PASSWORD'; `
  mvn spring-boot:run
"@

Start-Sleep -Seconds 10
Write-Host "  [OK] auth-service started (port 8001)" -ForegroundColor Green

# Start user-service
Write-Host "`n  Starting user-service on port 8002..." -ForegroundColor Gray
Start-Process powershell -ArgumentList @"
-NoExit -Command `
  cd 'C:\AMP\Projects\MySoceity\backend\user-service'; `
  Write-Host '========================================' -ForegroundColor Cyan; `
  Write-Host '  USER-SERVICE (Port 8002)' -ForegroundColor Cyan; `
  Write-Host '========================================' -ForegroundColor Cyan; `
  `$env:TWILIO_ACCOUNT_SID='YOUR_TWILIO_ACCOUNT_SID'; `
  `$env:TWILIO_AUTH_TOKEN='YOUR_TWILIO_AUTH_TOKEN'; `
  `$env:TWILIO_PHONE_NUMBER='YOUR_TWILIO_PHONE_NUMBER'; `
  `$env:MAIL_USERNAME='NammaSociety.notifications@gmail.com'; `
  `$env:MAIL_PASSWORD='YOUR_GMAIL_APP_PASSWORD'; `
  mvn spring-boot:run
"@

Start-Sleep -Seconds 5
Write-Host "  [OK] user-service started (port 8002)" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  [SUCCESS] ALL SERVICES RESTARTED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nSMS Configuration:" -ForegroundColor Cyan
Write-Host "  Twilio Account: YOUR_TWILIO_ACCOUNT_SID" -ForegroundColor White
Write-Host "  Sender Number: YOUR_TWILIO_PHONE_NUMBER" -ForegroundColor White

Write-Host "`nEmail Configuration:" -ForegroundColor Cyan
Write-Host "  Gmail Account: NammaSociety.notifications@gmail.com" -ForegroundColor White

Write-Host "`nIMPORTANT NOTES:" -ForegroundColor Yellow
Write-Host "  1. If using Gmail App Password, update MAIL_PASSWORD in this script" -ForegroundColor Gray
Write-Host "  2. For Twilio trial accounts, verify recipient phone numbers" -ForegroundColor Gray
Write-Host "  3. Wait 30 seconds for services to fully start" -ForegroundColor Gray

Write-Host "`nCheck service logs in the opened PowerShell windows" -ForegroundColor Cyan
Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

