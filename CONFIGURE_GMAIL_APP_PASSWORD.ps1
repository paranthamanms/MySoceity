# ============================================================================
# Gmail App Password Configuration Script
# ============================================================================
# This script helps you set up Gmail App Password for email notifications
#
# IMPORTANT: You need a Gmail App Password (not your regular password)
# ============================================================================

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  Gmail App Password Configuration" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "Current Email Configuration:" -ForegroundColor Yellow
Write-Host "  Email: NammaSociety.notifications@gmail.com`n" -ForegroundColor White

Write-Host "STEPS TO GET GMAIL APP PASSWORD:" -ForegroundColor Yellow
Write-Host "`n1. Open Gmail Security Settings:" -ForegroundColor White
Write-Host "   https://myaccount.google.com/security" -ForegroundColor Cyan

Write-Host "`n2. Enable 2-Factor Authentication (if not already enabled)" -ForegroundColor White
Write-Host "   - Click 'Security' in the left menu" -ForegroundColor Gray
Write-Host "   - Find '2-Step Verification' and turn it ON" -ForegroundColor Gray

Write-Host "`n3. Generate App Password:" -ForegroundColor White
Write-Host "   https://myaccount.google.com/apppasswords" -ForegroundColor Cyan
Write-Host "   - Select 'Mail' as the app" -ForegroundColor Gray
Write-Host "   - Select 'Windows Computer' as the device" -ForegroundColor Gray
Write-Host "   - Click 'Generate'" -ForegroundColor Gray

Write-Host "`n4. Copy the 16-character password (format: xxxx xxxx xxxx xxxx)" -ForegroundColor White

Write-Host "`n5. Paste it below when prompted`n" -ForegroundColor White

Write-Host "============================================" -ForegroundColor Cyan

# Prompt for App Password
$appPassword = Read-Host -Prompt "`nEnter your Gmail App Password (16 characters)"

if ($appPassword) {
    # Remove spaces if user copied with spaces
    $appPassword = $appPassword -replace '\s+', ''
    
    if ($appPassword.Length -eq 16) {
        # Set environment variable
        [System.Environment]::SetEnvironmentVariable('MAIL_PASSWORD', $appPassword, 'User')
        
        Write-Host "`n SUCCESS! Gmail App Password configured!" -ForegroundColor Green
        Write-Host "`nEnvironment Variable Set:" -ForegroundColor Yellow
        Write-Host "  MAIL_PASSWORD = ****************" -ForegroundColor Green
        
        Write-Host "`n NEXT STEPS:" -ForegroundColor Cyan
        Write-Host "  1. Restart PowerShell (close and reopen)" -ForegroundColor White
        Write-Host "  2. Restart your services (auth-service, user-service)" -ForegroundColor White
        Write-Host "  3. Test email notifications from your application`n" -ForegroundColor White
        
    } else {
        Write-Host "`n ERROR: App Password should be 16 characters!" -ForegroundColor Red
        Write-Host "  You entered: $($appPassword.Length) characters" -ForegroundColor Yellow
        Write-Host "  Please run this script again with the correct password`n" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n No password entered. Exiting...`n" -ForegroundColor Yellow
}

Write-Host "============================================`n" -ForegroundColor Cyan

