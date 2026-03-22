# Setup Gmail App Password for OTP Email Service
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  GMAIL APP PASSWORD SETUP WIZARD" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Gmail Account: NammaSociety.notifications@gmail.com" -ForegroundColor White
Write-Host "Current Issue: Regular password doesn't work, need App Password`n" -ForegroundColor Yellow

Write-Host "Opening Gmail App Password setup page..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process "https://myaccount.google.com/apppasswords"

Write-Host "`nFOLLOW THESE STEPS IN THE BROWSER:" -ForegroundColor Cyan
Write-Host "â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€" -ForegroundColor Gray
Write-Host "1. Sign in with: NammaSociety.notifications@gmail.com" -ForegroundColor White
Write-Host "2. Enable 2-Factor Authentication if not enabled" -ForegroundColor White
Write-Host "3. Select app: Mail" -ForegroundColor White
Write-Host "4. Select device: Windows Computer (or Other)" -ForegroundColor White
Write-Host "5. Click: Generate" -ForegroundColor White
Write-Host "6. COPY the 16-character password displayed" -ForegroundColor Yellow
Write-Host "   (Format: abcd efgh ijkl mnop)" -ForegroundColor Gray
Write-Host "`n" -ForegroundColor White

Write-Host "After generating, paste the App Password here:" -ForegroundColor Cyan
$appPassword = Read-Host "App Password"

if ($appPassword -and $appPassword.Replace(' ', '').Length -eq 16) {
    # Clean the password (remove spaces)
    $cleanPassword = $appPassword.Replace(' ', '')
    
    Write-Host "`nâœ“ Valid App Password format detected!" -ForegroundColor Green
    Write-Host "`nUpdating configuration..." -ForegroundColor Yellow
    
    # Update SETUP_OTP_ENVIRONMENT.ps1
    $scriptPath = "C:\AMP\Projects\MySoceity\SETUP_OTP_ENVIRONMENT.ps1"
    
    if (Test-Path $scriptPath) {
        $content = Get-Content $scriptPath -Raw
        
        # Replace the MAIL_PASSWORD line
        $oldLine = '$env:MAIL_PASSWORD = "Chennai@2006"'
        $newLine = '$env:MAIL_PASSWORD = "' + $cleanPassword + '"'
        
        $content = $content.Replace($oldLine, $newLine)
        
        Set-Content $scriptPath -Value $content -NoNewline
        
        Write-Host "âœ“ Updated SETUP_OTP_ENVIRONMENT.ps1" -ForegroundColor Green
        Write-Host "`nNew configuration:" -ForegroundColor White
        Write-Host "  Email: NammaSociety.notifications@gmail.com" -ForegroundColor Gray
        Write-Host "  App Password: $cleanPassword" -ForegroundColor Gray
        
        Write-Host "`n========================================" -ForegroundColor Cyan
        Write-Host "  CONFIGURATION UPDATED!" -ForegroundColor Green
        Write-Host "========================================`n" -ForegroundColor Cyan
        
        Write-Host "NEXT STEPS:" -ForegroundColor Yellow
        Write-Host "1. Restart services with new configuration:" -ForegroundColor White
        Write-Host "   .\SETUP_OTP_ENVIRONMENT.ps1`n" -ForegroundColor Cyan
        
        Write-Host "2. Test Email OTP:" -ForegroundColor White
        Write-Host "   - Go to Forgot Password" -ForegroundColor Gray
        Write-Host "   - Select Email option" -ForegroundColor Gray
        Write-Host "   - You should receive OTP email now!`n" -ForegroundColor Green
        
    } else {
        Write-Host "âœ— Error: SETUP_OTP_ENVIRONMENT.ps1 not found" -ForegroundColor Red
    }
    
} else {
    Write-Host "`nâœ— Invalid App Password format!" -ForegroundColor Red
    Write-Host "App Password should be exactly 16 characters." -ForegroundColor Yellow
    Write-Host "Example: abcdefghijklmnop or abcd efgh ijkl mnop" -ForegroundColor Gray
    Write-Host "`nPlease run this script again." -ForegroundColor White
}

Write-Host "`nPress any key to close..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

