#!/usr/bin/env pwsh
# ================================================================
# ALB Quick Diagnostics - Find Why ALB Is Not Reachable
# ================================================================

param(
    [string]$ALB_DNS = "NammaSociety-alb-1234567890.us-east-1.elb.amazonaws.com",
    [string]$EC2_IP = "44.222.193.230",
    [string]$KeyFile = "C:\AMP\Projects\NammaSociety-key.pem"
)

$ErrorActionPreference = "Continue"

Clear-Host
Write-Host "â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—" -ForegroundColor Cyan
Write-Host "â•‘                                                              â•‘" -ForegroundColor Cyan
Write-Host "â•‘         ALB Troubleshooting Diagnostics ðŸ”                  â•‘" -ForegroundColor Cyan
Write-Host "â•‘                                                              â•‘" -ForegroundColor Cyan
Write-Host "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host ""

# ================================================================
# Test 1: DNS Resolution
# ================================================================
Write-Host "[Test 1/6] DNS Resolution" -ForegroundColor Yellow
Write-Host "Testing: $ALB_DNS" -ForegroundColor Gray
Write-Host ""

try {
    $resolved = Resolve-DnsName $ALB_DNS -ErrorAction Stop
    Write-Host "âœ“ PASS - DNS resolves to:" -ForegroundColor Green
    $resolved | Where-Object { $_.Type -eq 'A' } | ForEach-Object {
        Write-Host "  â†’ $($_.IPAddress)" -ForegroundColor Gray
    }
    $dnsWorks = $true
} catch {
    Write-Host "âœ— FAIL - DNS resolution failed" -ForegroundColor Red
    Write-Host "  Check: Is the ALB DNS name correct?" -ForegroundColor Yellow
    $dnsWorks = $false
}

Write-Host ""

# ================================================================
# Test 2: HTTP Connection to ALB
# ================================================================
Write-Host "[Test 2/6] HTTP Connection to ALB" -ForegroundColor Yellow
Write-Host "Testing: http://$ALB_DNS" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://$ALB_DNS" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "âœ“ PASS - HTTP connection successful!" -ForegroundColor Green
    Write-Host "  Status: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor Gray
    Write-Host "  Content Length: $($response.Content.Length) bytes" -ForegroundColor Gray
    $albWorks = $true
} catch {
    Write-Host "âœ— FAIL - Cannot connect to ALB" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  This is your main problem! See checks below..." -ForegroundColor Yellow
    $albWorks = $false
}

Write-Host ""

# ================================================================
# Test 3: Health Endpoint
# ================================================================
Write-Host "[Test 3/6] Health Endpoint" -ForegroundColor Yellow
Write-Host "Testing: http://$ALB_DNS/health" -ForegroundColor Gray
Write-Host ""

try {
    $health = Invoke-WebRequest -Uri "http://$ALB_DNS/health" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "âœ“ PASS - Health endpoint works!" -ForegroundColor Green
    Write-Host "  Response: $($health.Content)" -ForegroundColor Gray
    $healthWorks = $true
} catch {
    Write-Host "âœ— FAIL - Health endpoint not accessible" -ForegroundColor Red
    Write-Host "  This might be why targets are unhealthy" -ForegroundColor Yellow
    $healthWorks = $false
}

Write-Host ""

# ================================================================
# Test 4: Direct EC2 Access (if possible)
# ================================================================
Write-Host "[Test 4/6] Direct EC2 Access" -ForegroundColor Yellow
Write-Host "Testing: http://$EC2_IP" -ForegroundColor Gray
Write-Host ""

try {
    $ec2Response = Invoke-WebRequest -Uri "http://$EC2_IP" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "âœ“ PASS - EC2 is working!" -ForegroundColor Green
    Write-Host "  Status: $($ec2Response.StatusCode)" -ForegroundColor Gray
    Write-Host "  â†’ Your app is running, problem is ALB configuration" -ForegroundColor Yellow
    $ec2Works = $true
} catch {
    Write-Host "âš  Cannot ACCESS - EC2 might not allow direct access" -ForegroundColor Yellow
    Write-Host "  This is OK if security group only allows ALB" -ForegroundColor Gray
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor DarkGray
    $ec2Works = $false
}

Write-Host ""

# ================================================================
# Test 5: SSH Connection to Check Services
# ================================================================
Write-Host "[Test 5/6] SSH to EC2 - Check Running Services" -ForegroundColor Yellow
Write-Host "Connecting to: ubuntu@$EC2_IP" -ForegroundColor Gray
Write-Host ""

if (Test-Path $KeyFile) {
    $sshTest = ssh -i $KeyFile -o ConnectTimeout=5 -o StrictHostKeyChecking=no ubuntu@$EC2_IP "cd /opt/NammaSociety 2>/dev/null && docker-compose ps --services --filter 'status=running' 2>/dev/null" 2>&1
    
    if ($LASTEXITCODE -eq 0 -and $sshTest) {
        Write-Host "âœ“ PASS - SSH works, Docker services running:" -ForegroundColor Green
        $sshTest | ForEach-Object { Write-Host "  â†’ $_" -ForegroundColor Gray }
        $sshWorks = $true
    } else {
        Write-Host "âœ— FAIL - Cannot SSH or services not running" -ForegroundColor Red
        Write-Host "  Check: Is EC2 instance running? Is security group allowing SSH?" -ForegroundColor Yellow
        $sshWorks = $false
    }
} else {
    Write-Host "âš  SKIP - SSH key file not found: $KeyFile" -ForegroundColor Yellow
    $sshWorks = $null
}

Write-Host ""

# ================================================================
# Test 6: Check Local Health Endpoint via SSH
# ================================================================
Write-Host "[Test 6/6] Local Health Check on EC2" -ForegroundColor Yellow
Write-Host "Testing localhost:80/health on EC2" -ForegroundColor Gray
Write-Host ""

if (Test-Path $KeyFile) {
    $localHealth = ssh -i $KeyFile -o ConnectTimeout=5 -o StrictHostKeyChecking=no ubuntu@$EC2_IP "curl -s -o /dev/null -w '%{http_code}' http://localhost:80/health 2>/dev/null" 2>&1
    
    if ($localHealth -eq "200") {
        Write-Host "âœ“ PASS - Health endpoint works locally (curl from EC2)" -ForegroundColor Green
        Write-Host "  â†’ App is healthy, problem is ALB â†’ EC2 communication" -ForegroundColor Yellow
    } elseif ($localHealth -eq "000" -or $localHealth -like "*Connection refused*") {
        Write-Host "âœ— FAIL - Health endpoint not responding on EC2" -ForegroundColor Red
        Write-Host "  â†’ Your app/nginx might not be running properly" -ForegroundColor Yellow
    } else {
        Write-Host "âš  UNKNOWN - Got response code: $localHealth" -ForegroundColor Yellow
    }
} else {
    Write-Host "âš  SKIP - Cannot test (SSH key not available)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host ""

# ================================================================
# Summary & Recommendations
# ================================================================
Write-Host "â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—" -ForegroundColor Cyan
Write-Host "â•‘  DIAGNOSIS SUMMARY                                           â•‘" -ForegroundColor Cyan
Write-Host "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host ""

if ($albWorks) {
    Write-Host "ðŸŽ‰ GREAT NEWS! Your ALB is working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your application is accessible at:" -ForegroundColor White
    Write-Host "  http://$ALB_DNS" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Setup SSL certificate in ACM" -ForegroundColor White
    Write-Host "  2. Add HTTPS:443 listener to ALB" -ForegroundColor White
    Write-Host "  3. Point your domain DNS to ALB" -ForegroundColor White
    
} else {
    Write-Host "âŒ ALB IS NOT WORKING - Here's what to check:" -ForegroundColor Red
    Write-Host ""
    
    # Scenario 1: DNS doesn't work
    if (-not $dnsWorks) {
        Write-Host "Issue 1: DNS Resolution Failed" -ForegroundColor Red
        Write-Host "  â†’ Check if ALB DNS name is correct" -ForegroundColor Yellow
        Write-Host "  â†’ Go to: AWS Console â†’ EC2 â†’ Load Balancers" -ForegroundColor White
        Write-Host "  â†’ Copy the correct DNS name" -ForegroundColor White
        Write-Host ""
    }
    
    # Scenario 2: EC2 works but ALB doesn't
    if ($ec2Works -and -not $albWorks) {
        Write-Host "Issue 2: EC2 Works But ALB Doesn't" -ForegroundColor Red
        Write-Host "  â†’ Target group health is likely UNHEALTHY" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  Fix steps:" -ForegroundColor Yellow
        Write-Host "  1. Go to: AWS Console â†’ EC2 â†’ Target Groups" -ForegroundColor White
        Write-Host "  2. Click your target group â†’ Targets tab" -ForegroundColor White
        Write-Host "  3. Check if targets are 'healthy' (green)" -ForegroundColor White
        Write-Host ""
        Write-Host "  If UNHEALTHY, common fixes:" -ForegroundColor Yellow
        Write-Host "  â†’ Add /health endpoint to nginx" -ForegroundColor White
        Write-Host "  â†’ Fix EC2 security group to allow ALB" -ForegroundColor White
        Write-Host "  â†’ Change health check path to '/'" -ForegroundColor White
        Write-Host ""
    }
    
    # Scenario 3: Neither EC2 nor ALB works
    if (-not $ec2Works -and -not $albWorks) {
        Write-Host "Issue 3: App Not Accessible" -ForegroundColor Red
        Write-Host "  â†’ Your application might not be running" -ForegroundColor Yellow
        Write-Host ""
        
        if ($sshWorks -eq $false) {
            Write-Host "  Critical: Cannot SSH to EC2" -ForegroundColor Red
            Write-Host "  1. Check EC2 instance is 'Running'" -ForegroundColor White
            Write-Host "  2. Check security group allows SSH from your IP" -ForegroundColor White
            Write-Host "  3. Verify key file: $KeyFile" -ForegroundColor White
            Write-Host ""
        } else {
            Write-Host "  Action Required: SSH to EC2 and check services" -ForegroundColor Yellow
            Write-Host "  Run these commands:" -ForegroundColor White
            Write-Host "    ssh -i $KeyFile ubuntu@$EC2_IP" -ForegroundColor Gray
            Write-Host "    cd /opt/NammaSociety" -ForegroundColor Gray
            Write-Host "    docker-compose ps" -ForegroundColor Gray
            Write-Host "    docker-compose up -d" -ForegroundColor Gray
            Write-Host ""
        }
    }
    
    # Scenario 4: Health endpoint doesn't work
    if (-not $healthWorks) {
        Write-Host "Issue 4: Health Endpoint Missing" -ForegroundColor Red
        Write-Host "  â†’ ALB cannot perform health checks" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  Quick fix: Add to nginx.conf" -ForegroundColor Yellow
        Write-Host '    location /health {' -ForegroundColor Gray
        Write-Host '        return 200 "OK";' -ForegroundColor Gray
        Write-Host '        add_header Content-Type text/plain;' -ForegroundColor Gray
        Write-Host '    }' -ForegroundColor Gray
        Write-Host ""
    }
}

Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host ""

# ================================================================
# Action Steps
# ================================================================
Write-Host "ðŸ“‹ IMMEDIATE ACTION STEPS:" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Check Target Group Health (MOST IMPORTANT):" -ForegroundColor Yellow
Write-Host "   â†’ AWS Console: https://console.aws.amazon.com/ec2/v2/home#TargetGroups:" -ForegroundColor White
Write-Host "   â†’ Look for: NammaSociety-target-group" -ForegroundColor Gray
Write-Host "   â†’ Check: Targets tab â†’ Health status" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Check ALB Configuration:" -ForegroundColor Yellow
Write-Host "   â†’ AWS Console: https://console.aws.amazon.com/ec2/v2/home#LoadBalancers:" -ForegroundColor White
Write-Host "   â†’ Check: State = Active" -ForegroundColor Gray
Write-Host "   â†’ Check: Listeners tab â†’ HTTP:80 exists" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Check Security Groups:" -ForegroundColor Yellow
Write-Host "   â†’ ALB security group: Allow HTTP:80 from 0.0.0.0/0" -ForegroundColor Gray
Write-Host "   â†’ EC2 security group: Allow HTTP:80 from ALB security group" -ForegroundColor Gray
Write-Host ""

Write-Host "4. If targets are unhealthy:" -ForegroundColor Yellow
Write-Host "   â†’ SSH to EC2 and add /health endpoint" -ForegroundColor Gray
Write-Host "   â†’ See: ALB_TROUBLESHOOTING.md for detailed steps" -ForegroundColor Gray
Write-Host ""

Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host ""

Write-Host "ðŸ“š Full troubleshooting guide:" -ForegroundColor Cyan
Write-Host "   ALB_TROUBLESHOOTING.md" -ForegroundColor White
Write-Host ""

Write-Host "Need help? Let me know:" -ForegroundColor Cyan
Write-Host "  1. What's the target group health status?" -ForegroundColor Gray
Write-Host "  2. Can you SSH to EC2?" -ForegroundColor Gray
Write-Host "  3. Are Docker services running?" -ForegroundColor Gray
Write-Host ""

