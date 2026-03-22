# ========================================
# AWS DEPLOYMENT HELPER SCRIPT
# ========================================
# Interactive script to help deploy NammaSociety to AWS EC2

param(
    [string]$EC2_IP = "",
    [string]$KeyFile = "NammaSociety-key.pem"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AWS DEPLOYMENT HELPER" -ForegroundColor Cyan
Write-Host "  NammaSociety Application" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Get EC2 IP if not provided
if($EC2_IP -eq "") {
    Write-Host "Enter your EC2 Public IP address:" -ForegroundColor Yellow
    Write-Host "(Find this in AWS Console â†’ EC2 â†’ Instances â†’ Select your instance)" -ForegroundColor Gray
    $EC2_IP = Read-Host "EC2 IP"
    
    if($EC2_IP -eq "") {
        Write-Host "`nError: EC2 IP is required!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`nEC2 Instance: $EC2_IP" -ForegroundColor Green

# Step 2: Check if key file exists
Write-Host "`nChecking SSH key file..." -ForegroundColor Yellow
if(-not (Test-Path $KeyFile)) {
    Write-Host "Error: Key file '$KeyFile' not found!" -ForegroundColor Red
    Write-Host "Make sure you downloaded the .pem file when creating EC2 instance" -ForegroundColor Yellow
    exit 1
}
Write-Host "   Key file found: $KeyFile" -ForegroundColor Green

# Step 3: Set key file permissions
Write-Host "`nSetting correct permissions on key file..." -ForegroundColor Yellow
try {
    icacls $KeyFile /inheritance:r | Out-Null
    icacls $KeyFile /grant:r "$($env:USERNAME):(R)" | Out-Null
    Write-Host "   Permissions set correctly" -ForegroundColor Green
} catch {
    Write-Host "   Warning: Could not set permissions automatically" -ForegroundColor Yellow
}

# Step 4: Test SSH connection
Write-Host "`nTesting SSH connection to EC2..." -ForegroundColor Yellow
Write-Host "(This may take 10-15 seconds on first connection)" -ForegroundColor Gray

$testCmd = "echo 'Connection successful'"
$result = ssh -i $KeyFile -o ConnectTimeout=10 -o StrictHostKeyChecking=no ubuntu@$EC2_IP $testCmd 2>&1

if($result -like "*Connection successful*") {
    Write-Host "   SSH connection test PASSED" -ForegroundColor Green
} else {
    Write-Host "   SSH connection FAILED" -ForegroundColor Red
    Write-Host "`nPossible issues:" -ForegroundColor Yellow
    Write-Host "1. EC2 instance not fully started (wait 2-3 minutes)" -ForegroundColor White
    Write-Host "2. Security group doesn't allow SSH from your IP" -ForegroundColor White
    Write-Host "3. Wrong EC2 IP address" -ForegroundColor White
    Write-Host "`nError details:" -ForegroundColor Yellow
    Write-Host $result -ForegroundColor Gray
    
    $retry = Read-Host "`nDo you want to try testing connection again? (y/n)"
    if($retry -eq "y") {
        Write-Host "Testing again..." -ForegroundColor Yellow
        ssh -i $KeyFile ubuntu@$EC2_IP "echo 'Connection test'"
    }
    exit 1
}

# Step 5: Check DNS configuration
Write-Host "`nChecking DNS configuration..." -ForegroundColor Yellow
try {
    $dnsResult = Resolve-DnsName "nammasociety-amp.com" -ErrorAction Stop
    $dnsIP = $dnsResult[0].IPAddress
    
    if($dnsIP -eq $EC2_IP) {
        Write-Host "   DNS correctly points to EC2 IP: $dnsIP" -ForegroundColor Green
        $dnsReady = $true
    } else {
        Write-Host "   DNS points to different IP: $dnsIP (expected: $EC2_IP)" -ForegroundColor Yellow
        Write-Host "   SSL setup will fail. Update DNS A records first." -ForegroundColor Yellow
        $dnsReady = $false
    }
} catch {
    Write-Host "   DNS not yet propagated or not configured" -ForegroundColor Yellow
    Write-Host "   You need to update DNS before SSL setup" -ForegroundColor Yellow
    $dnsReady = $false
}

# Step 6: Deployment options menu
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT OPTIONS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Choose deployment method:`n" -ForegroundColor Yellow
Write-Host "[1] Full Automated Deployment (Recommended)" -ForegroundColor White
Write-Host "    - Uploads all files via SCP" -ForegroundColor Gray
Write-Host "    - Runs all setup scripts" -ForegroundColor Gray
Write-Host "    - Builds and starts services" -ForegroundColor Gray
Write-Host "    - Sets up SSL (if DNS is ready)`n" -ForegroundColor Gray

Write-Host "[2] Step-by-Step Manual Deployment" -ForegroundColor White
Write-Host "    - Shows commands to run" -ForegroundColor Gray
Write-Host "    - You execute each step manually" -ForegroundColor Gray
Write-Host "    - Better for learning/troubleshooting`n" -ForegroundColor Gray

Write-Host "[3] Open SSH Session Only" -ForegroundColor White
Write-Host "    - Just connect to EC2 via SSH" -ForegroundColor Gray
Write-Host "    - You handle everything manually`n" -ForegroundColor Gray

$choice = Read-Host "Enter choice (1, 2, or 3)"

switch($choice) {
    "1" {
        Write-Host "`n========================================" -ForegroundColor Cyan
        Write-Host "  FULL AUTOMATED DEPLOYMENT" -ForegroundColor Cyan
        Write-Host "========================================`n" -ForegroundColor Cyan
        
        Write-Host "This will:" -ForegroundColor Yellow
        Write-Host "1. Upload all files to EC2" -ForegroundColor White
        Write-Host "2. Install Docker, Docker Compose, etc." -ForegroundColor White
        Write-Host "3. Build backend services" -ForegroundColor White
        Write-Host "4. Build and start all Docker containers" -ForegroundColor White
        if($dnsReady) {
            Write-Host "5. Install SSL certificate`n" -ForegroundColor White
        } else {
            Write-Host "5. Skip SSL (DNS not ready)`n" -ForegroundColor White
        }
        
        Write-Host "Estimated time: 15-20 minutes`n" -ForegroundColor Gray
        
        $confirm = Read-Host "Continue with automated deployment? (y/n)"
        if($confirm -ne "y") {
            Write-Host "Deployment cancelled" -ForegroundColor Yellow
            exit 0
        }
        
        # Create deployment script
        Write-Host "`nCreating deployment package..." -ForegroundColor Yellow
        
        # Upload files
        Write-Host "`n[Step 1/5] Uploading files to EC2..." -ForegroundColor Cyan
        Write-Host "This may take 3-5 minutes depending on connection speed..." -ForegroundColor Gray
        
        # Create tar archive of necessary files
        Write-Host "   Compressing files..." -ForegroundColor Yellow
        $excludes = @("node_modules", ".angular", "target", "*.war", "*.log", ".git")
        
        # Use SCP to upload project
        Write-Host "   Uploading to EC2..." -ForegroundColor Yellow
        scp -i $KeyFile -r $PSScriptRoot ubuntu@${EC2_IP}:/tmp/NammaSociety
        
        # Run setup on EC2
        Write-Host "`n[Step 2/5] Running server setup..." -ForegroundColor Cyan
        ssh -i $KeyFile ubuntu@$EC2_IP @"
sudo mv /tmp/NammaSociety /opt/NammaSociety
cd /opt/NammaSociety
sudo chmod +x *.sh
sudo ./setup-ec2.sh
"@
        
        Write-Host "`n[Step 3/5] Rebooting server..." -ForegroundColor Cyan
        Write-Host "Server will reboot and be available in 30-60 seconds..." -ForegroundColor Yellow
        ssh -i $KeyFile ubuntu@$EC2_IP "sudo reboot" 2>$null
        
        Write-Host "Waiting for server to come back online..." -ForegroundColor Gray
        Start-Sleep -Seconds 45
        
        # Test connection after reboot
        $maxRetries = 10
        $retryCount = 0
        $serverOnline = $false
        
        while($retryCount -lt $maxRetries -and -not $serverOnline) {
            $testResult = ssh -i $KeyFile -o ConnectTimeout=5 ubuntu@$EC2_IP "echo 'online'" 2>&1
            if($testResult -like "*online*") {
                $serverOnline = $true
                Write-Host "   Server is back online!" -ForegroundColor Green
            } else {
                $retryCount++
                Write-Host "   Waiting... (attempt $retryCount/$maxRetries)" -ForegroundColor Gray
                Start-Sleep -Seconds 6
            }
        }
        
        if(-not $serverOnline) {
            Write-Host "`nServer didn't come back online. Check AWS Console." -ForegroundColor Red
            exit 1
        }
        
        Write-Host "`n[Step 4/5] Deploying application..." -ForegroundColor Cyan
        ssh -i $KeyFile ubuntu@$EC2_IP @"
cd /opt/NammaSociety
sudo chmod +x deploy.sh
sudo ./deploy.sh
"@
        
        if($dnsReady) {
            Write-Host "`n[Step 5/5] Installing SSL certificate..." -ForegroundColor Cyan
            ssh -i $KeyFile ubuntu@$EC2_IP @"
cd /opt/NammaSociety
sudo chmod +x setup-ssl.sh
sudo ./setup-ssl.sh
"@
        } else {
            Write-Host "`n[Step 5/5] Skipping SSL (DNS not ready)" -ForegroundColor Yellow
            Write-Host "After DNS propagates, run: sudo ./setup-ssl.sh on the server" -ForegroundColor Gray
        }
        
        Write-Host "`n========================================" -ForegroundColor Green
        Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
        Write-Host "========================================`n" -ForegroundColor Green
        
        if($dnsReady) {
            Write-Host "Your application is available at:" -ForegroundColor White
            Write-Host "   https://nammasociety-amp.com`n" -ForegroundColor Cyan
        } else {
            Write-Host "Your application is available at:" -ForegroundColor White
            Write-Host "   http://$EC2_IP`n" -ForegroundColor Cyan
            Write-Host "After DNS propagation, access via:" -ForegroundColor White
            Write-Host "   https://nammasociety-amp.com`n" -ForegroundColor Cyan
        }
    }
    
    "2" {
        Write-Host "`n========================================" -ForegroundColor Cyan
        Write-Host "  STEP-BY-STEP MANUAL DEPLOYMENT" -ForegroundColor Cyan
        Write-Host "========================================`n" -ForegroundColor Cyan
        
        Write-Host "Follow these commands in order:`n" -ForegroundColor Yellow
        
        Write-Host "[Step 1] Upload files to EC2:" -ForegroundColor Cyan
        Write-Host "scp -i $KeyFile -r . ubuntu@${EC2_IP}:/tmp/NammaSociety`n" -ForegroundColor White
        
        Write-Host "[Step 2] Connect to EC2:" -ForegroundColor Cyan
        Write-Host "ssh -i $KeyFile ubuntu@$EC2_IP`n" -ForegroundColor White
        
        Write-Host "[Step 3] On EC2, run setup:" -ForegroundColor Cyan
        Write-Host "sudo mv /tmp/NammaSociety /opt/NammaSociety" -ForegroundColor White
        Write-Host "cd /opt/NammaSociety" -ForegroundColor White
        Write-Host "sudo chmod +x *.sh" -ForegroundColor White
        Write-Host "sudo ./setup-ec2.sh" -ForegroundColor White
        Write-Host "sudo reboot`n" -ForegroundColor White
        
        Write-Host "[Step 4] After reboot, reconnect and deploy:" -ForegroundColor Cyan
        Write-Host "ssh -i $KeyFile ubuntu@$EC2_IP" -ForegroundColor White
        Write-Host "cd /opt/NammaSociety" -ForegroundColor White
        Write-Host "sudo ./deploy.sh`n" -ForegroundColor White
        
        if($dnsReady) {
            Write-Host "[Step 5] Install SSL:" -ForegroundColor Cyan
            Write-Host "sudo ./setup-ssl.sh`n" -ForegroundColor White
        } else {
            Write-Host "[Step 5] After DNS is ready, install SSL:" -ForegroundColor Cyan
            Write-Host "sudo ./setup-ssl.sh`n" -ForegroundColor White
        }
        
        Write-Host "Full guide: AWS_DEPLOYMENT_GUIDE.md`n" -ForegroundColor Gray
    }
    
    "3" {
        Write-Host "`nOpening SSH connection to EC2..." -ForegroundColor Cyan
        Write-Host "You'll be connected as: ubuntu@$EC2_IP`n" -ForegroundColor Gray
        ssh -i $KeyFile ubuntu@$EC2_IP
    }
    
    default {
        Write-Host "`nInvalid choice. Exiting." -ForegroundColor Red
        exit 1
    }
}

