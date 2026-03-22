#!/usr/bin/env pwsh
# Quick SSH Connection Fixer for AWS EC2

$ErrorActionPreference = "Continue"

Clear-Host
Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host "   SSH Connection Troubleshooter" -ForegroundColor Cyan  
Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host ""

$EC2_IP = Read-Host "Enter your EC2 IP address"
$KEY_FILE = "C:\AMP\Projects\NammaSociety-key.pem"

if (!(Test-Path $KEY_FILE)) {
    $KEY_FILE = Read-Host "Enter path to your .pem key file"
}

Write-Host ""
Write-Host "Testing connection to $EC2_IP..." -ForegroundColor Yellow

$testResult = ssh -i $KEY_FILE -o ConnectTimeout=5 -o StrictHostKeyChecking=no ubuntu@$EC2_IP "echo 'Connected!'" 2>&1

if ($testResult -like "*Connected!*") {
    Write-Host "âœ“ SUCCESS! Connection works!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now connect with:" -ForegroundColor White
    Write-Host "ssh -i $KEY_FILE ubuntu@$EC2_IP" -ForegroundColor Gray
    exit 0
}

Write-Host "âœ— Connection failed" -ForegroundColor Red
Write-Host ""

# Get user's public IP
Write-Host "Getting your public IP..." -ForegroundColor Yellow
try {
    $myIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 5).Content
    Write-Host "âœ“ Your public IP: $myIP" -ForegroundColor Green
} catch {
    Write-Host "âœ— Couldn't detect your IP automatically" -ForegroundColor Red
    $myIP = "UNKNOWN"
}

Write-Host ""
Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Yellow
Write-Host "   FIX REQUIRED: Security Group" -ForegroundColor Yellow
Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Yellow
Write-Host ""
Write-Host "Your EC2 instance's security group is blocking SSH." -ForegroundColor White
Write-Host ""
Write-Host "STEP-BY-STEP FIX:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open this link in your browser:" -ForegroundColor White
Write-Host "   https://console.aws.amazon.com/ec2/v2/home#SecurityGroups:" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Find your security group (usually named something like 'launch-wizard-1')" -ForegroundColor White
Write-Host ""
Write-Host "3. Click on it, then click 'Edit inbound rules' button" -ForegroundColor White
Write-Host ""
Write-Host "4. Add or modify these rules:" -ForegroundColor White
Write-Host ""
Write-Host "   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”" -ForegroundColor Gray
Write-Host "   â”‚ Type    â”‚ Port â”‚ Source         â”‚ Description     â”‚" -ForegroundColor Gray
Write-Host "   â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤" -ForegroundColor Gray

if ($myIP -ne "UNKNOWN") {
    Write-Host "   â”‚ SSH     â”‚ 22   â”‚ $myIP/32   â”‚ My computer     â”‚" -ForegroundColor Green
} else {
    Write-Host "   â”‚ SSH     â”‚ 22   â”‚ My IP          â”‚ My computer     â”‚" -ForegroundColor Green
}
Write-Host "   â”‚ HTTP    â”‚ 80   â”‚ 0.0.0.0/0      â”‚ Web access      â”‚" -ForegroundColor Green
Write-Host "   â”‚ HTTPS   â”‚ 443  â”‚ 0.0.0.0/0      â”‚ Secure web      â”‚" -ForegroundColor Green
Write-Host "   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜" -ForegroundColor Gray
Write-Host ""
Write-Host "   TIP: For 'Source' in SSH rule, select 'My IP' from dropdown" -ForegroundColor Yellow
Write-Host "        (it will auto-fill with your current IP)" -ForegroundColor Yellow
Write-Host ""
Write-Host "5. Click 'Save rules'" -ForegroundColor White
Write-Host ""
Write-Host "6. Wait 10-15 seconds for changes to apply" -ForegroundColor White
Write-Host ""

$retry = Read-Host "Press Enter when you've updated the security group (or 'q' to quit)"
if ($retry -eq 'q') { exit 0 }

Write-Host ""
Write-Host "Testing connection again..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

$testResult2 = ssh -i $KEY_FILE -o ConnectTimeout=10 -o StrictHostKeyChecking=no ubuntu@$EC2_IP "echo 'Connected!'" 2>&1

if ($testResult2 -like "*Connected!*") {
    Write-Host ""
    Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Green
    Write-Host "   âœ“ SUCCESS! Connection works now!" -ForegroundColor Green
    Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now connect with:" -ForegroundColor White
    Write-Host "ssh -i $KEY_FILE ubuntu@$EC2_IP" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Ready to deploy? Run:" -ForegroundColor White
    Write-Host ".\AWS_DEPLOY_ASSISTANT.ps1" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "âœ— Still cannot connect" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $testResult2 -ForegroundColor Gray
    Write-Host ""
    Write-Host "Additional things to check:" -ForegroundColor Yellow
    Write-Host "1. Is your EC2 instance running? (Check AWS Console)" -ForegroundColor White
    Write-Host "2. Is the IP address correct? ($EC2_IP)" -ForegroundColor White
    Write-Host "3. Is the key file correct? ($KEY_FILE)" -ForegroundColor White
    Write-Host "4. Did you save the security group rules?" -ForegroundColor White
    Write-Host ""
    Write-Host "Try again in 1 minute (security rules need time to apply)" -ForegroundColor Cyan
    Write-Host ""
}

