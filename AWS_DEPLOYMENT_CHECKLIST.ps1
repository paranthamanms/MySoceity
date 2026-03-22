# ========================================
# AWS DEPLOYMENT PRE-FLIGHT CHECKLIST
# ========================================
# Run this before starting AWS deployment

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AWS DEPLOYMENT PRE-FLIGHT CHECK" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$allGood = $true

# 1. Check DNS Configuration
Write-Host "[1/8] Checking DNS Configuration..." -ForegroundColor Yellow
Write-Host "Domain: NammaSociety-AMP.com" -ForegroundColor White
try {
    $dns = Resolve-DnsName "nammasociety-amp.com" -ErrorAction Stop
    Write-Host "   DNS resolves to: $($dns[0].IPAddress)" -ForegroundColor Green
    Write-Host "   Make sure this will be your EC2 IP after creation" -ForegroundColor Yellow
} catch {
    Write-Host "   DNS not yet propagated or not configured" -ForegroundColor Red
    Write-Host "   You'll need to point DNS to EC2 IP after instance creation" -ForegroundColor Yellow
}

# 2. Check required files exist
Write-Host "`n[2/8] Checking Deployment Files..." -ForegroundColor Yellow
$requiredFiles = @(
    "docker-compose.yml",
    "nginx.conf",
    ".env.production",
    "setup-ec2.sh",
    "deploy.sh",
    "setup-ssl.sh",
    "backend\auth-service\Dockerfile",
    "backend\user-service\Dockerfile",
    "frontend\Dockerfile",
    "DATABASE_SCHEMA.sql"
)

foreach($file in $requiredFiles) {
    if(Test-Path $file) {
        Write-Host "   $file - FOUND" -ForegroundColor Green
    } else {
        Write-Host "   $file - MISSING" -ForegroundColor Red
        $allGood = $false
    }
}

# 3. Check Backend JARs
Write-Host "`n[3/8] Checking Backend Build Artifacts..." -ForegroundColor Yellow
$jars = @(
    "backend\auth-service\target\auth-service-1.0.0.jar",
    "backend\user-service\target\user-service-1.0.0.jar"
)

foreach($jar in $jars) {
    if(Test-Path $jar) {
        $size = (Get-Item $jar).Length / 1MB
        Write-Host "   $jar - FOUND ($([math]::Round($size, 2)) MB)" -ForegroundColor Green
    } else {
        Write-Host "   $jar - MISSING (run 'mvn clean package')" -ForegroundColor Red
        $allGood = $false
    }
}

# 4. Check Frontend node_modules
Write-Host "`n[4/8] Checking Frontend Dependencies..." -ForegroundColor Yellow
$frontends = @("login-mfe", "dashboard-mfe", "register-mfe")
foreach($mfe in $frontends) {
    $path = "frontend\$mfe\node_modules"
    if(Test-Path $path) {
        Write-Host "   $mfe - DEPENDENCIES INSTALLED" -ForegroundColor Green
    } else {
        Write-Host "   $mfe - MISSING (run 'npm install' in $mfe folder)" -ForegroundColor Red
        $allGood = $false
    }
}

# 5. Check .env.production configuration
Write-Host "`n[5/8] Checking Environment Configuration..." -ForegroundColor Yellow
if(Test-Path ".env.production") {
    $envContent = Get-Content ".env.production" -Raw
    
    # Check for required values
    $checks = @{
        "AWS_ACCOUNT_ID=286093099448" = "AWS Account ID"
        "DOMAIN_NAME=NammaSociety-AMP.com" = "Domain Name"
        "DB_PASSWORD=Chennai@2006" = "Database Password"
    }
    
    foreach($check in $checks.Keys) {
        if($envContent -match [regex]::Escape($check)) {
            Write-Host "   $($checks[$check]) - CONFIGURED" -ForegroundColor Green
        } else {
            Write-Host "   $($checks[$check]) - NOT SET" -ForegroundColor Red
            $allGood = $false
        }
    }
    
    # Check for placeholders that need updating
    $placeholders = @(
        "YOUR_GMAIL_APP_PASSWORD_HERE",
        "YOUR_TWILIO_ACCOUNT_SID",
        "YOUR_CCAVENUE_MERCHANT_ID"
    )
    
    Write-Host "`n   Required Updates:" -ForegroundColor Cyan
    foreach($placeholder in $placeholders) {
        if($envContent -match $placeholder) {
            if($placeholder -eq "YOUR_GMAIL_APP_PASSWORD_HERE") {
                Write-Host "   Gmail App Password - REQUIRED" -ForegroundColor Red
                $allGood = $false
            } else {
                Write-Host "   $($placeholder.Replace('YOUR_','').Replace('_',' ')) - Optional" -ForegroundColor Yellow
            }
        }
    }
} else {
    Write-Host "   .env.production - MISSING" -ForegroundColor Red
    $allGood = $false
}

# 6. Check AWS Credentials
Write-Host "`n[6/8] AWS Account Information..." -ForegroundColor Yellow
Write-Host "   Account ID: 286093099448" -ForegroundColor White
Write-Host "   Account Name: AMP" -ForegroundColor White
Write-Host "   Region: ap-south-1 (Mumbai)" -ForegroundColor White
Write-Host "   Domain: NammaSociety-AMP.com" -ForegroundColor White

# 7. Check if AWS CLI is installed (optional but helpful)
Write-Host "`n[7/8] Checking AWS Tools..." -ForegroundColor Yellow
try {
    $awsCli = aws --version 2>&1
    Write-Host "   AWS CLI - INSTALLED ($awsCli)" -ForegroundColor Green
} catch {
    Write-Host "   AWS CLI - NOT INSTALLED (optional, but recommended)" -ForegroundColor Yellow
    Write-Host "   Install from: https://aws.amazon.com/cli/" -ForegroundColor Gray
}

# 8. Disk Space Check
Write-Host "`n[8/8] Checking Disk Space..." -ForegroundColor Yellow
$drive = Get-PSDrive C
$freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)
if($freeSpaceGB -gt 5) {
    Write-Host "   Free Space: $freeSpaceGB GB - OK" -ForegroundColor Green
} else {
    Write-Host "   Free Space: $freeSpaceGB GB - LOW" -ForegroundColor Red
    $allGood = $false
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
if($allGood) {
    Write-Host "  PRE-FLIGHT CHECK PASSED!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
    Write-Host "Ready for AWS deployment!`n" -ForegroundColor Green
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Update Gmail App Password in .env.production" -ForegroundColor White
    Write-Host "2. Open AWS Console: https://console.aws.amazon.com" -ForegroundColor White
    Write-Host "3. Follow EC2-CREATION-GUIDE.md to create instance`n" -ForegroundColor White
} else {
    Write-Host "  PRE-FLIGHT CHECK FAILED" -ForegroundColor Red
    Write-Host "========================================`n" -ForegroundColor Cyan
    Write-Host "Please fix the issues above before deploying`n" -ForegroundColor Yellow
}
