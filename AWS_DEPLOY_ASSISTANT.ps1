#!/usr/bin/env pwsh
# ================================================================
# NammaSociety AWS Deployment Assistant
# Handles the complete deployment process automatically
# ================================================================

$ErrorActionPreference = "Continue"

# Colors
function Write-Step { param($msg) Write-Host "`n$msg" -ForegroundColor Cyan -BackgroundColor Black }
function Write-Success { param($msg) Write-Host "âœ“ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "âœ— $msg" -ForegroundColor Red }
function Write-Warning { param($msg) Write-Host "âš  $msg" -ForegroundColor Yellow }
function Write-Info { param($msg) Write-Host "  $msg" -ForegroundColor Gray }

Clear-Host
Write-Host "â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—" -ForegroundColor Cyan
Write-Host "â•‘                                                              â•‘" -ForegroundColor Cyan
Write-Host "â•‘         NammaSociety AWS Deployment Assistant ðŸš€               â•‘" -ForegroundColor Cyan
Write-Host "â•‘                                                              â•‘" -ForegroundColor Cyan
Write-Host "â•‘   I'll help you deploy your app step-by-step!               â•‘" -ForegroundColor Cyan
Write-Host "â•‘                                                              â•‘" -ForegroundColor Cyan
Write-Host "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan

# Check if we're in the right directory
if (!(Test-Path "docker-compose.yml")) {
    Write-Error "Please run this script from C:\AMP\Projects\MySoceity directory"
    exit 1
}

# ================================================================
# STEP 1: Get EC2 Details
# ================================================================
Write-Step "â•â•â• STEP 1: AWS EC2 Instance Details â•â•â•"

Write-Info "I need your EC2 instance information:"
Write-Host ""

$EC2_IP = Read-Host "Enter your EC2 Public IP address (e.g., 44.210.99.61)"
if ([string]::IsNullOrWhiteSpace($EC2_IP)) {
    Write-Error "EC2 IP is required!"
    exit 1
}

$KEY_FILE = "C:\AMP\Projects\NammaSociety-key.pem"
if (!(Test-Path $KEY_FILE)) {
    Write-Warning "Key file not found at: $KEY_FILE"
    $KEY_FILE = Read-Host "Enter the full path to your .pem key file"
    if (!(Test-Path $KEY_FILE)) {
        Write-Error "Key file not found: $KEY_FILE"
        exit 1
    }
}

Write-Success "Using key file: $KEY_FILE"
Write-Success "Deploying to: $EC2_IP"

# ================================================================
# STEP 2: Fix Security Group (If Needed)
# ================================================================
Write-Step "â•â•â• STEP 2: Testing SSH Connection â•â•â•"

Write-Info "Testing connection to $EC2_IP..."

$testResult = ssh -i $KEY_FILE -o ConnectTimeout=5 -o StrictHostKeyChecking=no ubuntu@$EC2_IP "echo 'success'" 2>&1

if ($testResult -like "*success*") {
    Write-Success "SSH connection successful!"
} else {
    Write-Error "SSH connection failed!"
    Write-Host ""
    Write-Host "â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—" -ForegroundColor Yellow
    Write-Host "â•‘  ACTION REQUIRED: Fix Security Group                        â•‘" -ForegroundColor Yellow
    Write-Host "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Yellow
    Write-Host ""
    Write-Info "Your EC2 security group needs to allow SSH access."
    Write-Host ""
    Write-Host "Follow these steps:" -ForegroundColor White
    Write-Host ""
    Write-Host "1. Open AWS Console: https://console.aws.amazon.com/ec2" -ForegroundColor White
    Write-Host "2. Click on 'Security Groups' in the left menu" -ForegroundColor White
    Write-Host "3. Find the security group for your EC2 instance" -ForegroundColor White
    Write-Host "4. Click 'Edit inbound rules'" -ForegroundColor White
    Write-Host "5. Add/Update these rules:" -ForegroundColor White
    Write-Host ""
    Write-Host "   Type    | Port | Source          | Description" -ForegroundColor Cyan
    Write-Host "   --------|------|-----------------|------------------" -ForegroundColor Cyan
    Write-Host "   SSH     | 22   | My IP           | SSH access" -ForegroundColor White
    Write-Host "   HTTP    | 80   | 0.0.0.0/0       | Web access" -ForegroundColor White
    Write-Host "   HTTPS   | 443  | 0.0.0.0/0       | Secure web" -ForegroundColor White
    Write-Host ""
    Write-Host "6. Click 'Save rules'" -ForegroundColor White
    Write-Host ""
    
    # Get user's public IP
    try {
        $myIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content
        Write-Info "Your public IP is: $myIP"
        Write-Info "Use this for the 'My IP' source in SSH rule"
    } catch {
        Write-Warning "Could not detect your public IP automatically"
    }
    
    Write-Host ""
    $ready = Read-Host "Have you updated the security group? (y/n)"
    if ($ready -ne "y") {
        Write-Warning "Please update the security group and run this script again."
        exit 1
    }
    
    # Test again
    Write-Info "Testing connection again..."
    $testResult = ssh -i $KEY_FILE -o ConnectTimeout=10 -o StrictHostKeyChecking=no ubuntu@$EC2_IP "echo 'success'" 2>&1
    
    if ($testResult -like "*success*") {
        Write-Success "SSH connection successful!"
    } else {
        Write-Error "Still cannot connect. Error:"
        Write-Host $testResult -ForegroundColor Red
        Write-Host ""
        Write-Info "Please verify:"
        Write-Info "- Security group allows SSH from your IP"
        Write-Info "- EC2 instance is running (not stopped)"
        Write-Info "- The IP address $EC2_IP is correct"
        Write-Info "- The key file $KEY_FILE matches your EC2 instance"
        exit 1
    }
}

# ================================================================
# STEP 3: Prepare Deployment Package
# ================================================================
Write-Step "â•â•â• STEP 3: Preparing Deployment Package â•â•â•"

Write-Info "Building backend services..."

# Build auth-service
if (Test-Path "backend\auth-service\pom.xml") {
    Write-Info "Building auth-service..."
    Push-Location backend\auth-service
    mvn clean package -DskipTests -q
    if ($LASTEXITCODE -eq 0) {
        Write-Success "auth-service built successfully"
    } else {
        Write-Error "Failed to build auth-service"
        Pop-Location
        exit 1
    }
    Pop-Location
}

# Build user-service
if (Test-Path "backend\user-service\pom.xml") {
    Write-Info "Building user-service..."
    Push-Location backend\user-service
    mvn clean package -DskipTests -q
    if ($LASTEXITCODE -eq 0) {
        Write-Success "user-service built successfully"
    } else {
        Write-Error "Failed to build user-service"
        Pop-Location
        exit 1
    }
    Pop-Location
}

# ================================================================
# STEP 4: Upload Files to EC2
# ================================================================
Write-Step "â•â•â• STEP 4: Uploading Files to EC2 â•â•â•"

Write-Info "Creating deployment directory on EC2..."
ssh -i $KEY_FILE ubuntu@$EC2_IP "sudo mkdir -p /opt/NammaSociety && sudo chown ubuntu:ubuntu /opt/NammaSociety"

Write-Info "Uploading files (this may take 2-3 minutes)..."

# Create a temporary directory with only necessary files
$tempDir = "C:\AMP\Projects\NammaSociety_Deploy_Temp"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy necessary files
Write-Info "Preparing files..."
$filesToCopy = @(
    "docker-compose.yml",
    "nginx.conf",
    ".env.production",
    "DATABASE_SCHEMA.sql",
    "NammaSocietyDeploy\deploy.sh",
    "NammaSocietyDeploy\setup-ec2.sh"
)

foreach ($file in $filesToCopy) {
    if (Test-Path $file) {
        $dest = Join-Path $tempDir (Split-Path $file -Leaf)
        Copy-Item $file $dest -Force
        Write-Success "Prepared: $file"
    }
}

# Copy backend JARs
New-Item -ItemType Directory -Path "$tempDir\backend\auth-service\target" -Force | Out-Null
New-Item -ItemType Directory -Path "$tempDir\backend\user-service\target" -Force | Out-Null

Copy-Item "backend\auth-service\target\auth-service-1.0.0.jar" "$tempDir\backend\auth-service\target\" -ErrorAction SilentlyContinue
Copy-Item "backend\user-service\target\user-service-1.0.0.jar" "$tempDir\backend\user-service\target\" -ErrorAction SilentlyContinue

# Copy Dockerfiles
Copy-Item "backend\auth-service\Dockerfile" "$tempDir\backend\auth-service\" -ErrorAction SilentlyContinue
Copy-Item "backend\user-service\Dockerfile" "$tempDir\backend\user-service\" -ErrorAction SilentlyContinue

# Copy entire backend src folders
Copy-Item "backend\auth-service\src" "$tempDir\backend\auth-service\src" -Recurse -ErrorAction SilentlyContinue
Copy-Item "backend\auth-service\pom.xml" "$tempDir\backend\auth-service\" -ErrorAction SilentlyContinue
Copy-Item "backend\user-service\src" "$tempDir\backend\user-service\src" -Recurse -ErrorAction SilentlyContinue
Copy-Item "backend\user-service\pom.xml" "$tempDir\backend\user-service\" -ErrorAction SilentlyContinue

# Copy frontend
New-Item -ItemType Directory -Path "$tempDir\frontend" -Force | Out-Null
Copy-Item "frontend\*" "$tempDir\frontend\" -Recurse -Force -ErrorAction SilentlyContinue

Write-Info "Uploading to EC2..."
scp -i $KEY_FILE -r "$tempDir\*" "ubuntu@${EC2_IP}:/opt/NammaSociety/"

if ($LASTEXITCODE -eq 0) {
    Write-Success "Files uploaded successfully"
    Remove-Item $tempDir -Recurse -Force
} else {
    Write-Error "File upload failed"
    exit 1
}

# ================================================================
# STEP 5: Install Prerequisites on EC2
# ================================================================
Write-Step "â•â•â• STEP 5: Installing Prerequisites on EC2 â•â•â•"

Write-Info "This will install Docker, Docker Compose, and other tools..."
Write-Info "This may take 5-10 minutes..."

$setupScript = @'
#!/bin/bash
set -e

echo "Updating system packages..."
sudo apt-get update -y

echo "Installing Docker..."
if ! command -v docker &> /dev/null; then
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker ubuntu
fi

echo "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo "Installing Maven and Java..."
sudo apt-get install -y maven default-jdk

echo "Prerequisites installed successfully!"
docker --version
docker-compose --version
mvn --version
'@

$setupScript | ssh -i $KEY_FILE ubuntu@$EC2_IP "cat > /tmp/setup.sh && chmod +x /tmp/setup.sh && bash /tmp/setup.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Success "Prerequisites installed successfully"
} else {
    Write-Error "Failed to install prerequisites"
    exit 1
}

# ================================================================
# STEP 6: Deploy Application
# ================================================================
Write-Step "â•â•â• STEP 6: Deploying Application â•â•â•"

Write-Info "Building and starting all services..."
Write-Info "This will take 10-15 minutes (building Docker images)..."

$deployScript = @'
#!/bin/bash
set -e

cd /opt/NammaSociety

echo "Making scripts executable..."
chmod +x *.sh 2>/dev/null || true

echo "Building backend services if needed..."
if [ -f backend/auth-service/pom.xml ]; then
    cd backend/auth-service
    mvn clean package -DskipTests
    cd ../..
fi

if [ -f backend/user-service/pom.xml ]; then
    cd backend/user-service
    mvn clean package -DskipTests
    cd ../..
fi

echo "Stopping any existing containers..."
docker-compose down 2>/dev/null || true

echo "Building Docker images..."
docker-compose build

echo "Starting services..."
docker-compose --env-file .env.production up -d

echo "Waiting for services to start..."
sleep 30

echo "Checking service status..."
docker-compose ps

echo "Deployment complete!"
'@

$deployScript | ssh -i $KEY_FILE ubuntu@$EC2_IP "cat > /opt/NammaSociety/auto-deploy.sh && chmod +x /opt/NammaSociety/auto-deploy.sh && bash /opt/NammaSociety/auto-deploy.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Success "Application deployed successfully!"
} else {
    Write-Error "Deployment failed"
    Write-Info "Checking logs..."
    ssh -i $KEY_FILE ubuntu@$EC2_IP "cd /opt/NammaSociety && docker-compose logs --tail=50"
    exit 1
}

# ================================================================
# STEP 7: Verify Deployment
# ================================================================
Write-Step "â•â•â• STEP 7: Verifying Deployment â•â•â•"

Write-Info "Checking service health..."
ssh -i $KEY_FILE ubuntu@$EC2_IP "cd /opt/NammaSociety && docker-compose ps"

Write-Host ""
Write-Host "â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—" -ForegroundColor Green
Write-Host "â•‘                                                              â•‘" -ForegroundColor Green
Write-Host "â•‘            âœ… DEPLOYMENT COMPLETE! âœ…                        â•‘" -ForegroundColor Green
Write-Host "â•‘                                                              â•‘" -ForegroundColor Green
Write-Host "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Green

Write-Host ""
Write-Host "ðŸŒ Your application is now running at:" -ForegroundColor Cyan
Write-Host "   http://$EC2_IP" -ForegroundColor White
Write-Host ""
Write-Host "ðŸ“Š Service URLs:" -ForegroundColor Cyan
Write-Host "   Auth Service:  http://${EC2_IP}:8001/health" -ForegroundColor Gray
Write-Host "   User Service:  http://${EC2_IP}:8002/health" -ForegroundColor Gray
Write-Host "   Frontend:      http://${EC2_IP}" -ForegroundColor Gray
Write-Host ""
Write-Host "ðŸ” Default Login:" -ForegroundColor Cyan
Write-Host "   Username: admin" -ForegroundColor Gray
Write-Host "   Password: admin123" -ForegroundColor Gray
Write-Host ""
Write-Host "ðŸ“ Useful Commands:" -ForegroundColor Cyan
Write-Host "   Connect to EC2:        ssh -i $KEY_FILE ubuntu@$EC2_IP" -ForegroundColor Gray
Write-Host "   Check logs:            docker-compose logs -f [service-name]" -ForegroundColor Gray
Write-Host "   Restart services:      docker-compose restart" -ForegroundColor Gray
Write-Host "   Stop services:         docker-compose down" -ForegroundColor Gray
Write-Host "   Start services:        docker-compose up -d" -ForegroundColor Gray
Write-Host ""

# Test if we can access the service
Write-Info "Testing if services are accessible..."
try {
    $response = Invoke-WebRequest -Uri "http://${EC2_IP}" -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Success "Application is accessible!"
    }
} catch {
    Write-Warning "Could not access http://${EC2_IP} yet"
    Write-Info "Services may still be starting up. Wait 2-3 minutes and try again."
}

Write-Host ""
Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan

# Offer to setup domain
Write-Host ""
$setupDomain = Read-Host "Do you want to setup your domain (NammaSociety-AMP.com) now? (y/n)"
if ($setupDomain -eq "y") {
    Write-Host ""
    Write-Host "â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—" -ForegroundColor Yellow
    Write-Host "â•‘  Domain Setup Instructions                                   â•‘" -ForegroundColor Yellow
    Write-Host "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Go to your domain registrar (e.g., GoDaddy, Namecheap)" -ForegroundColor White
    Write-Host "2. Add an A record:" -ForegroundColor White
    Write-Host "   Host: @" -ForegroundColor Gray
    Write-Host "   Points to: $EC2_IP" -ForegroundColor Gray
    Write-Host "   TTL: 600" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Add another A record for www:" -ForegroundColor White
    Write-Host "   Host: www" -ForegroundColor Gray
    Write-Host "   Points to: $EC2_IP" -ForegroundColor Gray
    Write-Host "   TTL: 600" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Wait 10-30 minutes for DNS propagation" -ForegroundColor White
    Write-Host ""
    Write-Host "5. After DNS propagates, run SSL setup:" -ForegroundColor White
    Write-Host "   ssh -i $KEY_FILE ubuntu@$EC2_IP" -ForegroundColor Gray
    Write-Host "   cd /opt/NammaSociety" -ForegroundColor Gray
    Write-Host "   sudo apt-get install -y certbot" -ForegroundColor Gray
    Write-Host "   sudo certbot certonly --standalone -d nammasociety-amp.com -d www.nammasociety-amp.com" -ForegroundColor Gray
    Write-Host ""
}

Write-Host ""
Write-Success "All done! Enjoy your deployed application! ðŸŽ‰"
Write-Host ""

