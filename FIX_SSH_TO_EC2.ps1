#!/usr/bin/env pwsh
# ================================================================
# Fix SSH Connection to EC2 - Troubleshoot Connection Timeout
# ================================================================

param(
    [string]$EC2_IP = "44.222.193.230",
    [string]$KeyFile = "C:\AMP\Projects\NammaSociety-key.pem"
)

Clear-Host
Write-Host "â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—" -ForegroundColor Cyan
Write-Host "â•‘                                                              â•‘" -ForegroundColor Cyan
Write-Host "â•‘         SSH Connection Troubleshooter ðŸ”§                    â•‘" -ForegroundColor Cyan
Write-Host "â•‘                                                              â•‘" -ForegroundColor Cyan
Write-Host "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host ""

# ================================================================
# Step 1: Get Your Public IP
# ================================================================
Write-Host "[Step 1/5] Detecting Your Public IP..." -ForegroundColor Yellow
Write-Host ""

try {
    $myIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 5).Content
    Write-Host "âœ“ Your public IP is: $myIP" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "âš  Could not detect your IP automatically" -ForegroundColor Yellow
    Write-Host "Getting IP from alternative sources..." -ForegroundColor Gray
    try {
        $myIP = (Invoke-WebRequest -Uri "https://ifconfig.me" -UseBasicParsing -TimeoutSec 5).Content
        Write-Host "âœ“ Your public IP is: $myIP" -ForegroundColor Green
    } catch {
        Write-Host "âœ— Could not detect IP. You'll need to find it manually." -ForegroundColor Red
        Write-Host "Visit: https://whatismyipaddress.com/" -ForegroundColor White
        $myIP = "YOUR_IP_HERE"
    }
    Write-Host ""
}

# ================================================================
# Step 2: Test Network Connectivity
# ================================================================
Write-Host "[Step 2/5] Testing Network Connectivity..." -ForegroundColor Yellow
Write-Host "Testing: $EC2_IP" -ForegroundColor Gray
Write-Host ""

$pingTest = Test-Connection -ComputerName $EC2_IP -Count 2 -ErrorAction SilentlyContinue

if ($pingTest) {
    Write-Host "âœ“ PASS - EC2 instance is reachable (ICMP ping works)" -ForegroundColor Green
    Write-Host "  â†’ The instance is running" -ForegroundColor Gray
    Write-Host "  â†’ Network path is working" -ForegroundColor Gray
    Write-Host "  â†’ Problem is likely SSH port (22) blocked" -ForegroundColor Yellow
    $isReachable = $true
} else {
    Write-Host "âœ— FAIL - EC2 instance is NOT reachable" -ForegroundColor Red
    Write-Host "  â†’ Instance might be stopped" -ForegroundColor Yellow
    Write-Host "  â†’ Wrong IP address" -ForegroundColor Yellow
    Write-Host "  â†’ Security group blocking all ICMP" -ForegroundColor Yellow
    $isReachable = $false
}

Write-Host ""

# ================================================================
# Step 3: Test SSH Port
# ================================================================
Write-Host "[Step 3/5] Testing SSH Port (22)..." -ForegroundColor Yellow
Write-Host ""

try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $connect = $tcpClient.BeginConnect($EC2_IP, 22, $null, $null)
    $wait = $connect.AsyncWaitHandle.WaitOne(3000, $false)
    
    if ($wait -and $tcpClient.Connected) {
        Write-Host "âœ“ PASS - SSH port 22 is OPEN!" -ForegroundColor Green
        Write-Host "  â†’ SSH service is listening" -ForegroundColor Gray
        Write-Host "  â†’ Security group allows SSH" -ForegroundColor Gray
        Write-Host "  â†’ Problem might be SSH key or username" -ForegroundColor Yellow
        $tcpClient.Close()
        $sshPortOpen = $true
    } else {
        Write-Host "âœ— FAIL - SSH port 22 is BLOCKED or CLOSED" -ForegroundColor Red
        Write-Host "  â†’ This is your main problem!" -ForegroundColor Yellow
        $tcpClient.Close()
        $sshPortOpen = $false
    }
} catch {
    Write-Host "âœ— FAIL - Cannot connect to SSH port 22" -ForegroundColor Red
    Write-Host "  â†’ Connection timed out" -ForegroundColor Yellow
    $sshPortOpen = $false
}

Write-Host ""

# ================================================================
# Step 4: Check SSH Key File
# ================================================================
Write-Host "[Step 4/5] Checking SSH Key File..." -ForegroundColor Yellow
Write-Host "Key: $KeyFile" -ForegroundColor Gray
Write-Host ""

if (Test-Path $KeyFile) {
    Write-Host "âœ“ PASS - Key file exists" -ForegroundColor Green
    
    # Check permissions (should be restrictive)
    $acl = Get-Acl $KeyFile
    Write-Host "  â†’ Key file found" -ForegroundColor Gray
    $keyExists = $true
} else {
    Write-Host "âœ— FAIL - Key file not found!" -ForegroundColor Red
    Write-Host "  â†’ Check the path: $KeyFile" -ForegroundColor Yellow
    $keyExists = $false
}

Write-Host ""

# ================================================================
# Step 5: Attempt SSH Connection
# ================================================================
Write-Host "[Step 5/5] Testing SSH Connection..." -ForegroundColor Yellow
Write-Host ""

if ($keyExists -and $sshPortOpen) {
    Write-Host "Attempting connection..." -ForegroundColor Gray
    Write-Host "Running: ssh -i $KeyFile -o ConnectTimeout=5 ubuntu@$EC2_IP 'echo Connected!'" -ForegroundColor DarkGray
    Write-Host ""
    
    $sshResult = ssh -i $KeyFile -o ConnectTimeout=5 -o StrictHostKeyChecking=no ubuntu@$EC2_IP "echo 'SSH Connection Successful!'" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "âœ“ SUCCESS - SSH works!" -ForegroundColor Green
        Write-Host "  Response: $sshResult" -ForegroundColor Gray
        $sshWorks = $true
    } else {
        Write-Host "âœ— FAIL - SSH connection failed" -ForegroundColor Red
        Write-Host "  Error: $sshResult" -ForegroundColor Yellow
        $sshWorks = $false
    }
} else {
    Write-Host "âŠ˜ SKIP - Prerequisites not met" -ForegroundColor Yellow
    $sshWorks = $false
}

Write-Host ""
Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host ""

# ================================================================
# DIAGNOSIS & SOLUTION
# ================================================================
Write-Host "â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—" -ForegroundColor Cyan
Write-Host "â•‘  DIAGNOSIS & SOLUTION                                        â•‘" -ForegroundColor Cyan
Write-Host "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host ""

if ($sshWorks) {
    Write-Host "ðŸŽ‰ GREAT! SSH is working now!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can connect with:" -ForegroundColor White
    Write-Host "  ssh -i $KeyFile ubuntu@$EC2_IP" -ForegroundColor Cyan
    Write-Host ""
    
} elseif (-not $isReachable) {
    # Instance not reachable at all
    Write-Host "âŒ PROBLEM: EC2 Instance Not Reachable" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible causes:" -ForegroundColor Yellow
    Write-Host "  1. EC2 instance is STOPPED or TERMINATED" -ForegroundColor White
    Write-Host "  2. Wrong IP address" -ForegroundColor White
    Write-Host "  3. VPC/Network ACL blocking all traffic" -ForegroundColor White
    Write-Host ""
    Write-Host "ðŸ”§ IMMEDIATE ACTION:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Check EC2 Instance Status:" -ForegroundColor Cyan
    Write-Host "   â†’ Go to: https://console.aws.amazon.com/ec2/v2/home#Instances:" -ForegroundColor White
    Write-Host "   â†’ Find your instance" -ForegroundColor Gray
    Write-Host "   â†’ Check: Instance state = 'Running' (green)" -ForegroundColor Gray
    Write-Host "   â†’ Check: Status checks = '2/2 checks passed'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. If STOPPED:" -ForegroundColor Cyan
    Write-Host "   â†’ Select instance â†’ Instance state â†’ Start instance" -ForegroundColor White
    Write-Host "   â†’ Wait 1-2 minutes" -ForegroundColor Gray
    Write-Host "   â†’ Note: IP might change if you don't have Elastic IP" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "3. Verify IP Address:" -ForegroundColor Cyan
    Write-Host "   â†’ In EC2 console, check 'Public IPv4 address'" -ForegroundColor White
    Write-Host "   â†’ Update IP if it changed" -ForegroundColor Gray
    Write-Host ""
    
} elseif (-not $sshPortOpen) {
    # Instance reachable but SSH port blocked
    Write-Host "âŒ PROBLEM: SSH Port 22 is BLOCKED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Your EC2 is running, but Security Group is blocking SSH." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "ðŸ”§ FIX THIS NOW:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor White
    Write-Host "STEP 1: Open AWS Console" -ForegroundColor Cyan
    Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor White
    Write-Host "https://console.aws.amazon.com/ec2/v2/home#SecurityGroups:" -ForegroundColor White
    Write-Host ""
    
    Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor White
    Write-Host "STEP 2: Find Your EC2's Security Group" -ForegroundColor Cyan
    Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor White
    Write-Host "â†’ Go to: EC2 â†’ Instances" -ForegroundColor Gray
    Write-Host "â†’ Click your instance" -ForegroundColor Gray
    Write-Host "â†’ Click 'Security' tab" -ForegroundColor Gray
    Write-Host "â†’ Note the security group name (e.g., 'NammaSociety-sg')" -ForegroundColor Gray
    Write-Host "â†’ Click the security group link" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor White
    Write-Host "STEP 3: Edit Inbound Rules" -ForegroundColor Cyan
    Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor White
    Write-Host "â†’ Click 'Inbound rules' tab" -ForegroundColor Gray
    Write-Host "â†’ Click 'Edit inbound rules' button" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor White
    Write-Host "STEP 4: Add SSH Rule" -ForegroundColor Cyan
    Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor White
    Write-Host "â†’ Click 'Add rule'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Configure as follows:" -ForegroundColor Yellow
    Write-Host "  Type:        SSH" -ForegroundColor White
    Write-Host "  Protocol:    TCP" -ForegroundColor White
    Write-Host "  Port:        22" -ForegroundColor White
    Write-Host "  Source:      My IP ( $myIP/32 )" -ForegroundColor Green
    Write-Host "  Description: SSH from my computer" -ForegroundColor White
    Write-Host ""
    Write-Host "â†’ Click 'Save rules'" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor White
    Write-Host "STEP 5: Test Connection" -ForegroundColor Cyan
    Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor White
    Write-Host "Wait 5 seconds, then try:" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  ssh -i $KeyFile ubuntu@$EC2_IP" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor White
    Write-Host ""
    Write-Host "âš ï¸ IMPORTANT NOTES:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "â€¢ Your IP: $myIP" -ForegroundColor White
    Write-Host "â€¢ If your IP changes (WiFi, VPN), update security group" -ForegroundColor Gray
    Write-Host "â€¢ For convenience, use 0.0.0.0/0 (less secure, allows SSH from anywhere)" -ForegroundColor Gray
    Write-Host "â€¢ For production, always use specific IP ranges" -ForegroundColor Gray
    Write-Host ""
    
    # Copy to clipboard
    Write-Host "ðŸ“‹ Security Group Rule (copied to clipboard):" -ForegroundColor Cyan
    $clipboardText = @"
SSH Rule Configuration:
Type: SSH
Protocol: TCP
Port: 22
Source: $myIP/32
Description: SSH from my computer
"@
    Set-Clipboard -Value $clipboardText
    Write-Host "âœ“ Copied to clipboard!" -ForegroundColor Green
    Write-Host ""
    
} elseif (-not $keyExists) {
    Write-Host "âŒ PROBLEM: SSH Key File Not Found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Expected location: $KeyFile" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "ðŸ”§ SOLUTIONS:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Find your key file:" -ForegroundColor Cyan
    Write-Host "   â†’ Check Downloads folder" -ForegroundColor White
    Write-Host "   â†’ Search for: *.pem" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Download key from AWS (if lost):" -ForegroundColor Cyan
    Write-Host "   âš ï¸ You CANNOT re-download the original key!" -ForegroundColor Red
    Write-Host "   â†’ You need to create a new key pair" -ForegroundColor Yellow
    Write-Host "   â†’ Or use AWS Systems Manager Session Manager (no key needed)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "3. Use Session Manager (Alternative):" -ForegroundColor Cyan
    Write-Host "   â†’ Go to: EC2 â†’ Instances" -ForegroundColor White
    Write-Host "   â†’ Select instance â†’ Connect" -ForegroundColor Gray
    Write-Host "   â†’ Choose 'Session Manager' tab" -ForegroundColor Gray
    Write-Host "   â†’ Click 'Connect' (no key needed!)" -ForegroundColor Gray
    Write-Host ""

} else {
    Write-Host "âŒ PROBLEM: SSH Authentication Failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Port is open, key exists, but connection fails." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "ðŸ”§ POSSIBLE CAUSES:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Wrong username:" -ForegroundColor Cyan
    Write-Host "   â†’ Try 'ubuntu' (Ubuntu AMI)" -ForegroundColor White
    Write-Host "   â†’ Try 'ec2-user' (Amazon Linux)" -ForegroundColor White
    Write-Host "   â†’ Try 'admin' (Debian)" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Wrong key file:" -ForegroundColor Cyan
    Write-Host "   â†’ Verify this is the correct key for this instance" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Key permissions too open (Windows usually OK):" -ForegroundColor Cyan
    Write-Host "   â†’ Key file should only be readable by you" -ForegroundColor White
    Write-Host ""
}

Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host ""

# ================================================================
# Quick Copy Commands
# ================================================================
Write-Host "ðŸ“‹ QUICK COPY: SSH Command" -ForegroundColor Cyan
Write-Host ""
Write-Host "ssh -i $KeyFile ubuntu@$EC2_IP" -ForegroundColor White
Write-Host ""

Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host ""
Write-Host "Need help? Report back with:" -ForegroundColor Yellow
Write-Host "  1. EC2 instance state (Running/Stopped?)" -ForegroundColor Gray
Write-Host "  2. Did you add the SSH rule to security group?" -ForegroundColor Gray
Write-Host "  3. Any new error messages?" -ForegroundColor Gray
Write-Host ""

