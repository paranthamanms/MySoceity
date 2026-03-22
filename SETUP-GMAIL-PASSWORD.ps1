# ========================================
# UPDATE GMAIL APP PASSWORD IN .ENV
# ========================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  GMAIL APP PASSWORD SETUP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Gmail is REQUIRED for:" -ForegroundColor Yellow
Write-Host "  - Email OTP (Forgot Password)" -ForegroundColor White
Write-Host "  - Announcement notifications" -ForegroundColor White
Write-Host "  - System alerts`n" -ForegroundColor White

# Check if .env.production exists
if(-not (Test-Path ".env.production")) {
    Write-Host "Error: .env.production not found!" -ForegroundColor Red
    Write-Host "Make sure you're in the project root directory" -ForegroundColor Yellow
    exit 1
}

# Read current content
$envContent = Get-Content ".env.production" -Raw

# Check if Gmail password is already set
if($envContent -notmatch "YOUR_GMAIL_APP_PASSWORD_HERE") {
    Write-Host " Gmail App Password already configured!`n" -ForegroundColor Green
    $currentPassword = ($envContent | Select-String -Pattern "GMAIL_APP_PASSWORD=(.+)" -AllMatches).Matches[0].Groups[1].Value
    
    if($currentPassword.Length -eq 16) {
        Write-Host "Current password: $currentPassword (looks valid)`n" -ForegroundColor Green
    } else {
        Write-Host "Current password: $currentPassword (may be invalid - should be 16 chars)`n" -ForegroundColor Yellow
    }
    
    $update = Read-Host "Do you want to update it? (y/n)"
    if($update -ne "y") {
        Write-Host "No changes made" -ForegroundColor Gray
        exit 0
    }
}

# Instructions
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "HOW TO GET GMAIL APP PASSWORD" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Follow these steps:`n" -ForegroundColor Yellow

Write-Host "[1] Go to Google Account Security:" -ForegroundColor White
Write-Host "    https://myaccount.google.com/security`n" -ForegroundColor Cyan

Write-Host "[2] Enable 2-Step Verification (if not already enabled):" -ForegroundColor White
Write-Host "    - Scroll to 'Signing in to Google'" -ForegroundColor Gray
Write-Host "    - Click '2-Step Verification'" -ForegroundColor Gray
Write-Host "    - Follow the setup process`n" -ForegroundColor Gray

Write-Host "[3] Create App Password:" -ForegroundColor White
Write-Host "    - Search for 'App passwords' in the security page" -ForegroundColor Gray
Write-Host "    - Click 'App passwords'" -ForegroundColor Gray
Write-Host "    - Select app: 'Mail'" -ForegroundColor Gray
Write-Host "    - Select device: 'Other (Custom name)'" -ForegroundColor Gray
Write-Host "    - Enter name: 'NammaSociety'" -ForegroundColor Gray
Write-Host "    - Click 'Generate'" -ForegroundColor Gray
Write-Host "    - You'll see a 16-character password (no spaces)`n" -ForegroundColor Gray

Write-Host "[4] Copy the 16-character password`n" -ForegroundColor White

Write-Host "========================================`n" -ForegroundColor Cyan

# Prompt for Gmail address
Write-Host "Enter Gmail address to use for notifications:" -ForegroundColor Yellow
Write-Host "(Currently configured: NammaSociety.notifications@gmail.com)" -ForegroundColor Gray
$gmailInput = Read-Host "Gmail address (press Enter to keep current)"

if($gmailInput -eq "") {
    $gmail = "NammaSociety.notifications@gmail.com"
    Write-Host "Using: $gmail" -ForegroundColor Green
} else {
    $gmail = $gmailInput
}

# Prompt for App Password
Write-Host "`nEnter the 16-character App Password:" -ForegroundColor Yellow
Write-Host "(Format: abcdefghijklmnop - no spaces)" -ForegroundColor Gray
$appPassword = Read-Host "App Password"

# Validate password
if($appPassword.Length -ne 16) {
    Write-Host "`nWarning: App Password should be exactly 16 characters!" -ForegroundColor Yellow
    Write-Host "You entered: $($appPassword.Length) characters" -ForegroundColor Red
    $continue = Read-Host "Continue anyway? (y/n)"
    if($continue -ne "y") {
        Write-Host "Cancelled" -ForegroundColor Gray
        exit 0
    }
}

# Remove spaces (in case user included them)
$appPassword = $appPassword.Replace(" ", "")

# Update .env.production
Write-Host "`nUpdating .env.production..." -ForegroundColor Yellow

# Update Gmail username
$envContent = $envContent -replace "GMAIL_USERNAME=.*", "GMAIL_USERNAME=$gmail"

# Update Gmail App Password
$envContent = $envContent -replace "GMAIL_APP_PASSWORD=.*", "GMAIL_APP_PASSWORD=$appPassword"

# Save file
$envContent | Set-Content ".env.production" -NoNewline

Write-Host " Configuration updated successfully!`n" -ForegroundColor Green

# Show summary
Write-Host "========================================" -ForegroundColor Green
Write-Host "Current Configuration:" -ForegroundColor White
Write-Host "   Gmail: $gmail" -ForegroundColor Cyan
Write-Host "   App Password: $appPassword" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: .\AWS_DEPLOYMENT_CHECKLIST.ps1" -ForegroundColor White
Write-Host "2. Create EC2 instance (follow EC2-CREATION-GUIDE.md)" -ForegroundColor White
Write-Host "3. Deploy with: .\AWS-DEPLOY-HELPER.ps1`n" -ForegroundColor White

