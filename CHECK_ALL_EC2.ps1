#!/usr/bin/env pwsh
# ================================================================
# Check All EC2 Instances Status
# ================================================================

Clear-Host
Write-Host "â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—" -ForegroundColor Cyan
Write-Host "â•‘                                                              â•‘" -ForegroundColor Cyan
Write-Host "â•‘         EC2 Instance Status Checker ðŸ”                      â•‘" -ForegroundColor Cyan
Write-Host "â•‘                                                              â•‘" -ForegroundColor Cyan
Write-Host "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host ""

# Check if AWS CLI is installed
try {
    $awsVersion = aws --version 2>&1
    Write-Host "âœ“ AWS CLI installed: $awsVersion" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "âœ— AWS CLI not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install AWS CLI:" -ForegroundColor Yellow
    Write-Host "  https://aws.amazon.com/cli/" -ForegroundColor White
    Write-Host ""
    Write-Host "Or check manually via AWS Console:" -ForegroundColor Yellow
    Write-Host "  https://console.aws.amazon.com/ec2/v2/home#Instances:" -ForegroundColor White
    Write-Host ""
    exit
}

# Check if AWS is configured
try {
    $identity = aws sts get-caller-identity 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "âœ“ AWS credentials configured" -ForegroundColor Green
        Write-Host ""
    } else {
        throw "Not configured"
    }
} catch {
    Write-Host "âš  AWS credentials not configured!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Configure AWS CLI with:" -ForegroundColor Yellow
    Write-Host "  aws configure" -ForegroundColor White
    Write-Host ""
    Write-Host "Or check manually via AWS Console:" -ForegroundColor Yellow
    Write-Host "  https://console.aws.amazon.com/ec2/v2/home#Instances:" -ForegroundColor White
    Write-Host ""
    exit
}

# Get all EC2 instances
Write-Host "Fetching EC2 instances..." -ForegroundColor Yellow
Write-Host ""

try {
    $instances = aws ec2 describe-instances --query 'Reservations[].Instances[].[InstanceId,State.Name,PublicIpAddress,PrivateIpAddress,Tags[?Key==`Name`].Value|[0],InstanceType]' --output json | ConvertFrom-Json
    
    if ($instances.Count -eq 0) {
        Write-Host "âš  No EC2 instances found!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Either:" -ForegroundColor Gray
        Write-Host "  1. You have no instances in this region" -ForegroundColor White
        Write-Host "  2. Wrong AWS region selected" -ForegroundColor White
        Write-Host "  3. Wrong AWS account" -ForegroundColor White
        Write-Host ""
        Write-Host "Check your region:" -ForegroundColor Yellow
        Write-Host "  aws configure get region" -ForegroundColor White
        Write-Host ""
        Write-Host "Change region:" -ForegroundColor Yellow
        Write-Host "  aws configure set region us-east-1" -ForegroundColor White
        Write-Host ""
        exit
    }
    
    Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
    Write-Host "  EC2 INSTANCES STATUS" -ForegroundColor Cyan
    Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
    Write-Host ""
    
    $runningCount = 0
    $stoppedCount = 0
    $targetIP = "44.222.193.230"
    $foundTarget = $false
    
    foreach ($instance in $instances) {
        $instanceId = $instance[0]
        $state = $instance[1]
        $publicIp = $instance[2]
        $privateIp = $instance[3]
        $name = $instance[4]
        $type = $instance[5]
        
        if (-not $publicIp) { $publicIp = "N/A" }
        if (-not $name) { $name = "Unnamed" }
        
        # Color code by state
        $stateColor = switch ($state) {
            "running" { "Green"; $runningCount++; "Green" }
            "stopped" { "Yellow"; $stoppedCount++; "Yellow" }
            "terminated" { "Red"; "Red" }
            "stopping" { "Yellow"; "Yellow" }
            "pending" { "Cyan"; "Cyan" }
            default { "Gray"; "Gray" }
        }
        
        # Check if this is our target IP
        $isTarget = $publicIp -eq $targetIP
        if ($isTarget) { $foundTarget = $true }
        
        Write-Host "â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€" -ForegroundColor Gray
        
        if ($isTarget) {
            Write-Host ">>> THIS IS YOUR TARGET INSTANCE <<<" -ForegroundColor Magenta
        }
        
        Write-Host "Name:           $name" -ForegroundColor White
        Write-Host "Instance ID:    $instanceId" -ForegroundColor Gray
        Write-Host "State:          " -NoNewline
        Write-Host $state.ToUpper() -ForegroundColor $stateColor
        Write-Host "Public IP:      $publicIp" -ForegroundColor $(if ($isTarget) { "Cyan" } else { "Gray" })
        Write-Host "Private IP:     $privateIp" -ForegroundColor Gray
        Write-Host "Type:           $type" -ForegroundColor Gray
        
        # Action required?
        if ($state -eq "stopped" -and $isTarget) {
            Write-Host ""
            Write-Host "âš  ACTION REQUIRED: START THIS INSTANCE!" -ForegroundColor Red
            Write-Host "  Quick start command:" -ForegroundColor Yellow
            Write-Host "    aws ec2 start-instances --instance-ids $instanceId" -ForegroundColor White
        }
        
        if ($state -eq "running" -and $isTarget) {
            Write-Host ""
            Write-Host "âœ“ This instance is RUNNING" -ForegroundColor Green
            Write-Host "  But it's not reachable. Check:" -ForegroundColor Yellow
            Write-Host "    1. Security group allows your IP" -ForegroundColor White
            Write-Host "    2. Status checks are passing" -ForegroundColor White
        }
        
        Write-Host ""
    }
    
    Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "SUMMARY:" -ForegroundColor Cyan
    Write-Host "  Running:  $runningCount" -ForegroundColor Green
    Write-Host "  Stopped:  $stoppedCount" -ForegroundColor Yellow
    Write-Host "  Total:    $($instances.Count)" -ForegroundColor White
    Write-Host ""
    
    # Check if we found the target
    if (-not $foundTarget) {
        Write-Host "âš  WARNING: Target IP $targetIP NOT FOUND!" -ForegroundColor Red
        Write-Host ""
        Write-Host "This means either:" -ForegroundColor Yellow
        Write-Host "  1. Instance was terminated (deleted)" -ForegroundColor White
        Write-Host "  2. IP changed after stop/start" -ForegroundColor White
        Write-Host "  3. Wrong region (check region above)" -ForegroundColor White
        Write-Host ""
        Write-Host "If you recently stopped/started, IP may have changed." -ForegroundColor Yellow
        Write-Host "Look for 'NammaSociety' or similar name above." -ForegroundColor White
        Write-Host ""
    }
    
} catch {
    Write-Host "âœ— Error fetching instances!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Check manually:" -ForegroundColor Yellow
    Write-Host "  https://console.aws.amazon.com/ec2/v2/home#Instances:" -ForegroundColor White
    Write-Host ""
}

Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host ""
Write-Host "ðŸ“‹ QUICK ACTIONS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Start a stopped instance:" -ForegroundColor Yellow
Write-Host "  aws ec2 start-instances --instance-ids i-xxxxx" -ForegroundColor White
Write-Host ""
Write-Host "Get instance status:" -ForegroundColor Yellow
Write-Host "  aws ec2 describe-instance-status --instance-ids i-xxxxx" -ForegroundColor White
Write-Host ""
Write-Host "Open AWS Console:" -ForegroundColor Yellow
Write-Host "  https://console.aws.amazon.com/ec2/v2/home#Instances:" -ForegroundColor White
Write-Host ""
Write-Host "Connect via Session Manager (no SSH needed):" -ForegroundColor Yellow
Write-Host "  1. Open AWS Console" -ForegroundColor White
Write-Host "  2. Select instance â†’ Connect â†’ Session Manager" -ForegroundColor White
Write-Host ""

