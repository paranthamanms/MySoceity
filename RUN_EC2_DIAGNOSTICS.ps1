#!/usr/bin/env pwsh
# ================================================================
# Run EC2 Health Diagnostics via Session Manager
# ================================================================

param(
    [string]$InstanceId = "",
    [string]$EC2_IP = "44.222.193.230",
    [string]$KeyFile = "C:\AMP\Projects\NammaSociety-key.pem"
)

Clear-Host
Write-Host "â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—" -ForegroundColor Cyan
Write-Host "â•‘                                                              â•‘" -ForegroundColor Cyan
Write-Host "â•‘         EC2 Instance Failure Diagnosis ðŸ”                   â•‘" -ForegroundColor Cyan
Write-Host "â•‘                                                              â•‘" -ForegroundColor Cyan
Write-Host "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will help diagnose why your EC2 instance keeps failing." -ForegroundColor Yellow
Write-Host ""

# ================================================================
# Step 1: Check if instance is accessible
# ================================================================
Write-Host "[Step 1/3] Checking if instance is reachable..." -ForegroundColor Yellow
Write-Host ""

$pingTest = Test-Connection -ComputerName $EC2_IP -Count 1 -Quiet -ErrorAction SilentlyContinue

if ($pingTest) {
    Write-Host "âœ“ Instance is reachable at $EC2_IP" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "âœ— Instance is NOT reachable at $EC2_IP" -ForegroundColor Red
    Write-Host ""
    Write-Host "The instance is currently DOWN. You need to:" -ForegroundColor Yellow
    Write-Host "  1. Go to AWS Console: https://console.aws.amazon.com/ec2/v2/home#Instances:" -ForegroundColor White
    Write-Host "  2. Check instance state" -ForegroundColor White
    Write-Host "  3. If stopped, start it" -ForegroundColor White
    Write-Host "  4. Check system logs (Actions â†’ Get system log)" -ForegroundColor White
    Write-Host "  5. Run this script again when instance is UP" -ForegroundColor White
    Write-Host ""
    Write-Host "Looking at system logs now can tell you WHY it crashed!" -ForegroundColor Cyan
    Write-Host ""
    
    # Try to get instance ID from AWS CLI
    try {
        Write-Host "Checking AWS for instance information..." -ForegroundColor Gray
        $instances = aws ec2 describe-instances --filters "Name=private-ip-address,Values=$EC2_IP" --query 'Reservations[].Instances[].[InstanceId,State.Name]' --output json 2>$null | ConvertFrom-Json
        
        if ($instances) {
            $instId = $instances[0][0]
            $state = $instances[0][1]
            Write-Host "  Instance ID: $instId" -ForegroundColor White
            Write-Host "  State: $state" -ForegroundColor $(if ($state -eq "running") { "Green" } else { "Red" })
            Write-Host ""
            
            if ($state -ne "running") {
                Write-Host "To start the instance:" -ForegroundColor Yellow
                Write-Host "  aws ec2 start-instances --instance-ids $instId" -ForegroundColor White
                Write-Host ""
            }
        }
    } catch {
        # Silently ignore if AWS CLI not configured
    }
    
    exit 1
}

# ================================================================
# Step 2: Upload diagnostic script
# ================================================================
Write-Host "[Step 2/3] Uploading diagnostic script to EC2..." -ForegroundColor Yellow
Write-Host ""

$scriptPath = Join-Path $PSScriptRoot "ec2-health-check.sh"

if (-not (Test-Path $scriptPath)) {
    Write-Host "âœ— Diagnostic script not found: $scriptPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please make sure ec2-health-check.sh is in the same directory." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "Copying script to EC2..." -ForegroundColor Gray
try {
    scp -i $KeyFile -o StrictHostKeyChecking=no -o ConnectTimeout=10 $scriptPath "ubuntu@${EC2_IP}:/tmp/health-check.sh" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "âœ“ Script uploaded successfully" -ForegroundColor Green
        Write-Host ""
    } else {
        throw "SCP failed"
    }
} catch {
    Write-Host "âœ— Could not upload script via SCP" -ForegroundColor Red
    Write-Host ""
    Write-Host "This usually means SSH is blocked. Use Session Manager instead:" -ForegroundColor Yellow
    Write-Host "  1. Go to: https://console.aws.amazon.com/ec2/v2/home#Instances:" -ForegroundColor White
    Write-Host "  2. Select your instance â†’ Connect â†’ Session Manager" -ForegroundColor White
    Write-Host "  3. Run these commands:" -ForegroundColor White
    Write-Host ""
    Write-Host "     curl -o /tmp/health-check.sh https://raw.githubusercontent.com/YOUR_REPO/ec2-health-check.sh" -ForegroundColor Gray
    Write-Host "     chmod +x /tmp/health-check.sh" -ForegroundColor Gray
    Write-Host "     /tmp/health-check.sh" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or copy-paste this script manually into Session Manager terminal" -ForegroundColor White
    Write-Host ""
    exit 1
}

# ================================================================
# Step 3: Run diagnostic script
# ================================================================
Write-Host "[Step 3/3] Running diagnostics on EC2..." -ForegroundColor Yellow
Write-Host ""
Write-Host "This will take 30-60 seconds..." -ForegroundColor Gray
Write-Host ""

try {
    $sshCommand = "chmod +x /tmp/health-check.sh && /tmp/health-check.sh"
    
    Write-Host "Executing diagnostic script..." -ForegroundColor Gray
    Write-Host "â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€" -ForegroundColor DarkGray
    Write-Host ""
    
    ssh -i $KeyFile -o StrictHostKeyChecking=no ubuntu@$EC2_IP $sshCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€" -ForegroundColor DarkGray
        Write-Host "âœ“ Diagnostics completed successfully!" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "âš  Diagnostics completed with warnings" -ForegroundColor Yellow
        Write-Host ""
    }
    
} catch {
    Write-Host "âœ— Failed to run diagnostics" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# ================================================================
# Summary
# ================================================================
Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host "NEXT STEPS" -ForegroundColor Cyan
Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host ""

Write-Host "The diagnostic report has been saved on your EC2 instance." -ForegroundColor White
Write-Host ""

Write-Host "To download the report to your computer:" -ForegroundColor Yellow
Write-Host "  scp -i $KeyFile ubuntu@${EC2_IP}:/tmp/health-diagnostic-*.txt ." -ForegroundColor White
Write-Host ""

Write-Host "Common fixes based on diagnostics:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. If DISK FULL:" -ForegroundColor Cyan
Write-Host "   ssh -i $KeyFile ubuntu@$EC2_IP" -ForegroundColor Gray
Write-Host "   docker system prune -a -f" -ForegroundColor Gray
Write-Host "   sudo journalctl --vacuum-time=3d" -ForegroundColor Gray
Write-Host ""

Write-Host "2. If OUT OF MEMORY:" -ForegroundColor Cyan
Write-Host "   â†’ Upgrade instance type to t3.medium (4GB RAM)" -ForegroundColor Gray
Write-Host "   â†’ EC2 Console â†’ Stop â†’ Change instance type â†’ Start" -ForegroundColor Gray
Write-Host ""

Write-Host "3. If CONTAINERS CRASHING:" -ForegroundColor Cyan
Write-Host "   ssh -i $KeyFile ubuntu@$EC2_IP" -ForegroundColor Gray
Write-Host "   cd /opt/NammaSociety" -ForegroundColor Gray
Write-Host "   docker-compose logs --tail=100" -ForegroundColor Gray
Write-Host "   docker-compose restart" -ForegroundColor Gray
Write-Host ""

Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host ""

Write-Host "ðŸ“Š Based on the diagnostic output above:" -ForegroundColor Cyan
Write-Host "   Look for RED âŒ or YELLOW âš ï¸ warnings" -ForegroundColor White
Write-Host "   Check the SUMMARY & RECOMMENDATIONS section" -ForegroundColor White
Write-Host ""

Write-Host "Need help? Share the diagnostic report!" -ForegroundColor Yellow
Write-Host ""

