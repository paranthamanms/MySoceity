#!/usr/bin/env pwsh
# ================================================================
# DNS Setup Helper - NammaSociety
# Helps you configure DNS to point to your EC2 instance
# ================================================================

$ErrorActionPreference = "Continue"

Clear-Host
Write-Host "â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—" -ForegroundColor Cyan
Write-Host "â•‘                                                              â•‘" -ForegroundColor Cyan
Write-Host "â•‘         NammaSociety DNS Configuration Helper ðŸŒ               â•‘" -ForegroundColor Cyan
Write-Host "â•‘                                                              â•‘" -ForegroundColor Cyan
Write-Host "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan

Write-Host ""
Write-Host "This wizard will help you point your domain to your EC2 instance." -ForegroundColor White
Write-Host ""

# ================================================================
# Get Domain and IP Information
# ================================================================

Write-Host "â•â•â• Step 1: Your Details â•â•â•" -ForegroundColor Yellow
Write-Host ""

$domain = Read-Host "Enter your domain name (e.g., nammasociety-amp.com)"
if ([string]::IsNullOrWhiteSpace($domain)) {
    $domain = "nammasociety-amp.com"
}

$ec2IP = Read-Host "Enter your EC2 Public IP address (e.g., 44.222.193.230)"
if ([string]::IsNullOrWhiteSpace($ec2IP)) {
    Write-Host "âœ— EC2 IP is required!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "âœ“ Domain: $domain" -ForegroundColor Green
Write-Host "âœ“ EC2 IP: $ec2IP" -ForegroundColor Green
Write-Host ""

# ================================================================
# Choose DNS Provider
# ================================================================

Write-Host "â•â•â• Step 2: Choose Your DNS Provider â•â•â•" -ForegroundColor Yellow
Write-Host ""
Write-Host "Where did you register your domain?" -ForegroundColor White
Write-Host ""
Write-Host "  1. GoDaddy" -ForegroundColor Cyan
Write-Host "  2. Namecheap" -ForegroundColor Cyan
Write-Host "  3. Google Domains" -ForegroundColor Cyan
Write-Host "  4. AWS Route 53" -ForegroundColor Cyan
Write-Host "  5. Other registrar" -ForegroundColor Cyan
Write-Host ""

$choice = Read-Host "Enter your choice (1-5)"

switch ($choice) {
    "1" { 
        $registrar = "GoDaddy"
        $dnsUrl = "https://dcc.godaddy.com/domains/$domain/dns"
    }
    "2" { 
        $registrar = "Namecheap"
        $dnsUrl = "https://ap.www.namecheap.com/domains/domaincontrolpanel/$domain/advancedns"
    }
    "3" { 
        $registrar = "Google Domains"
        $dnsUrl = "https://domains.google.com/registrar/$domain/dns"
    }
    "4" { 
        $registrar = "AWS Route 53"
        $dnsUrl = "https://console.aws.amazon.com/route53/v2/hostedzones"
    }
    default { 
        $registrar = "Your DNS Provider"
        $dnsUrl = ""
    }
}

Write-Host ""
Write-Host "âœ“ Selected: $registrar" -ForegroundColor Green
Write-Host ""

# ================================================================
# Provide Instructions
# ================================================================

Write-Host "â•â•â• Step 3: DNS Configuration Instructions â•â•â•" -ForegroundColor Yellow
Write-Host ""

if ($registrar -eq "AWS Route 53") {
    # Route 53 specific instructions
    Write-Host "AWS Route 53 Setup:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Open Route 53:" -ForegroundColor White
    Write-Host "   https://console.aws.amazon.com/route53/v2/hostedzones" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. If you don't have a hosted zone:" -ForegroundColor White
    Write-Host "   a. Click 'Create hosted zone'" -ForegroundColor Gray
    Write-Host "   b. Domain name: $domain" -ForegroundColor Gray
    Write-Host "   c. Type: Public hosted zone" -ForegroundColor Gray
    Write-Host "   d. Click 'Create hosted zone'" -ForegroundColor Gray
    Write-Host "   e. Note the 4 nameservers shown" -ForegroundColor Gray
    Write-Host "   f. Update nameservers at your domain registrar" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Create DNS records:" -ForegroundColor White
    Write-Host "   a. Click your hosted zone ($domain)" -ForegroundColor Gray
    Write-Host "   b. Click 'Create record'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Record 1 (Root domain):" -ForegroundColor Cyan
    Write-Host "     Record name:    (leave blank)" -ForegroundColor Gray
    Write-Host "     Record type:    A" -ForegroundColor Gray
    Write-Host "     Value:          $ec2IP" -ForegroundColor Green
    Write-Host "     TTL:            300" -ForegroundColor Gray
    Write-Host "     Routing policy: Simple" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   c. Click 'Create records'" -ForegroundColor Gray
    Write-Host "   d. Click 'Create record' again" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Record 2 (WWW subdomain):" -ForegroundColor Cyan
    Write-Host "     Record name:    www" -ForegroundColor Gray
    Write-Host "     Record type:    A" -ForegroundColor Gray
    Write-Host "     Value:          $ec2IP" -ForegroundColor Green
    Write-Host "     TTL:            300" -ForegroundColor Gray
    Write-Host "     Routing policy: Simple" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   e. Click 'Create records'" -ForegroundColor Gray
    
} else {
    # Generic registrar instructions
    Write-Host "$registrar DNS Setup:" -ForegroundColor Cyan
    Write-Host ""
    
    if ($dnsUrl -ne "") {
        Write-Host "1. Open DNS management:" -ForegroundColor White
        Write-Host "   $dnsUrl" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "1. Login to $registrar" -ForegroundColor White
        Write-Host "2. Find DNS Management for $domain" -ForegroundColor White
        Write-Host ""
    }
    
    Write-Host "2. Add these TWO A records:" -ForegroundColor White
    Write-Host ""
    Write-Host "   Record 1 (Root domain):" -ForegroundColor Cyan
    Write-Host "   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”" -ForegroundColor Gray
    Write-Host "   â”‚ Type        â”‚ A                            â”‚" -ForegroundColor Gray
    Write-Host "   â”‚ Host        â”‚ @  (or blank)                â”‚" -ForegroundColor Gray
    Write-Host "   â”‚ Points to   â”‚ $ec2IP                  â”‚" -ForegroundColor Green
    Write-Host "   â”‚ TTL         â”‚ 600 (or Auto)                â”‚" -ForegroundColor Gray
    Write-Host "   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Record 2 (WWW subdomain):" -ForegroundColor Cyan
    Write-Host "   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”" -ForegroundColor Gray
    Write-Host "   â”‚ Type        â”‚ A                            â”‚" -ForegroundColor Gray
    Write-Host "   â”‚ Host        â”‚ www                          â”‚" -ForegroundColor Gray
    Write-Host "   â”‚ Points to   â”‚ $ec2IP                  â”‚" -ForegroundColor Green
    Write-Host "   â”‚ TTL         â”‚ 600 (or Auto)                â”‚" -ForegroundColor Gray
    Write-Host "   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Save changes" -ForegroundColor White
}

Write-Host ""
Write-Host "â±ï¸  Wait 10-30 minutes for DNS propagation" -ForegroundColor Yellow
Write-Host ""

# ================================================================
# Copy to Clipboard
# ================================================================

$clipboardText = @"
DNS Configuration for $domain

EC2 IP: $ec2IP

Record 1 (Root):
  Type: A
  Host: @ (or blank)
  Points to: $ec2IP
  TTL: 600

Record 2 (WWW):
  Type: A  
  Host: www
  Points to: $ec2IP
  TTL: 600
"@

try {
    Set-Clipboard -Value $clipboardText
    Write-Host "âœ“ DNS details copied to clipboard!" -ForegroundColor Green
    Write-Host ""
} catch {
    # Clipboard not available
}

# ================================================================
# Wait and Test
# ================================================================

Write-Host "â•â•â• Step 4: Verification â•â•â•" -ForegroundColor Yellow
Write-Host ""

$ready = Read-Host "Have you added the DNS records? (y/n)"

if ($ready -eq "y") {
    Write-Host ""
    Write-Host "Testing DNS resolution..." -ForegroundColor Cyan
    Write-Host ""
    
    # Test DNS
    try {
        $result = Resolve-DnsName -Name $domain -ErrorAction SilentlyContinue
        
        if ($result.Count -gt 0) {
            $resolvedIP = $result[0].IPAddress
            
            if ($resolvedIP -eq $ec2IP) {
                Write-Host "âœ“ SUCCESS! DNS is correctly configured!" -ForegroundColor Green
                Write-Host "  $domain â†’ $resolvedIP" -ForegroundColor Gray
                Write-Host ""
            } else {
                Write-Host "âš  DNS resolves but to wrong IP:" -ForegroundColor Yellow
                Write-Host "  Expected: $ec2IP" -ForegroundColor Yellow
                Write-Host "  Got:      $resolvedIP" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "This might be cached. Wait a few minutes and try again." -ForegroundColor Yellow
            }
        } else {
            Write-Host "âš  DNS not resolving yet" -ForegroundColor Yellow
            Write-Host "  This is normal immediately after changes" -ForegroundColor Gray
            Write-Host "  Wait 10-30 minutes and check again" -ForegroundColor Gray
        }
    } catch {
        Write-Host "âš  Could not resolve DNS yet" -ForegroundColor Yellow
        Write-Host "  Wait 10-30 minutes for propagation" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "Check DNS propagation worldwide:" -ForegroundColor Cyan
    Write-Host "  https://dnschecker.org/#A/$domain" -ForegroundColor White
    Write-Host ""
    
    # Test with www
    Write-Host "Testing www subdomain..." -ForegroundColor Cyan
    try {
        $wwwResult = Resolve-DnsName -Name "www.$domain" -ErrorAction SilentlyContinue
        if ($wwwResult.Count -gt 0) {
            $wwwIP = $wwwResult[0].IPAddress
            if ($wwwIP -eq $ec2IP) {
                Write-Host "âœ“ www.$domain â†’ $wwwIP" -ForegroundColor Green
            } else {
                Write-Host "âš  www resolves to: $wwwIP (expected: $ec2IP)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "âš  www.$domain not resolving yet" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "âš  www.$domain not resolving yet" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host ""

# ================================================================
# Next Steps
# ================================================================

Write-Host "â•â•â• Next Steps â•â•â•" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. Wait for DNS propagation (10-30 minutes)" -ForegroundColor White
Write-Host ""
Write-Host "2. Test your domain:" -ForegroundColor White
Write-Host "   http://$domain" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Setup SSL certificate (HTTPS):" -ForegroundColor White
Write-Host ""
Write-Host "   SSH to your EC2:" -ForegroundColor Gray
Write-Host "   ssh -i C:\AMP\Projects\NammaSociety-key.pem ubuntu@$ec2IP" -ForegroundColor Gray
Write-Host ""
Write-Host "   Install Certbot:" -ForegroundColor Gray
Write-Host "   sudo apt-get update" -ForegroundColor Gray
Write-Host "   sudo apt-get install -y certbot" -ForegroundColor Gray
Write-Host ""
Write-Host "   Stop nginx temporarily:" -ForegroundColor Gray
Write-Host "   cd /opt/NammaSociety" -ForegroundColor Gray
Write-Host "   docker-compose stop nginx" -ForegroundColor Gray
Write-Host ""
Write-Host "   Get SSL certificate:" -ForegroundColor Gray
Write-Host "   sudo certbot certonly --standalone -d $domain -d www.$domain" -ForegroundColor Gray
Write-Host ""
Write-Host "   Copy certificates:" -ForegroundColor Gray
Write-Host "   sudo mkdir -p /opt/NammaSociety/ssl" -ForegroundColor Gray
Write-Host "   sudo cp /etc/letsencrypt/live/$domain/fullchain.pem /opt/NammaSociety/ssl/" -ForegroundColor Gray
Write-Host "   sudo cp /etc/letsencrypt/live/$domain/privkey.pem /opt/NammaSociety/ssl/" -ForegroundColor Gray
Write-Host "   sudo chown -R ubuntu:ubuntu /opt/NammaSociety/ssl" -ForegroundColor Gray
Write-Host ""
Write-Host "   Update nginx.conf for HTTPS (see DNS_SETUP_GUIDE.md)" -ForegroundColor Gray
Write-Host ""
Write-Host "   Restart services:" -ForegroundColor Gray
Write-Host "   docker-compose up -d" -ForegroundColor Gray
Write-Host ""

Write-Host "4. Your site will be live at:" -ForegroundColor White
Write-Host "   https://$domain ðŸŽ‰" -ForegroundColor Green
Write-Host ""

Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host ""

# ================================================================
# Offer to create SSL setup script
# ================================================================

$createSSL = Read-Host "Would you like to create an SSL setup script? (y/n)"

if ($createSSL -eq "y") {
    $sslScript = @"
#!/bin/bash
# SSL Certificate Setup for $domain

set -e

echo "Installing Certbot..."
sudo apt-get update
sudo apt-get install -y certbot

echo "Stopping nginx temporarily..."
cd /opt/NammaSociety
docker-compose stop nginx

echo "Obtaining SSL certificate..."
sudo certbot certonly --standalone \
  -d $domain \
  -d www.$domain \
  --agree-tos \
  --non-interactive \
  --email admin@$domain

echo "Creating SSL directory..."
sudo mkdir -p /opt/NammaSociety/ssl

echo "Copying certificates..."
sudo cp /etc/letsencrypt/live/$domain/fullchain.pem /opt/NammaSociety/ssl/
sudo cp /etc/letsencrypt/live/$domain/privkey.pem /opt/NammaSociety/ssl/
sudo chown -R ubuntu:ubuntu /opt/NammaSociety/ssl

echo "Setting up auto-renewal..."
echo "0 0,12 * * * root python3 -c 'import random; import time; time.sleep(random.random() * 3600)' && certbot renew -q" | sudo tee -a /etc/cron tab

echo ""
echo "âœ“ SSL certificate obtained!"
echo "âœ“ Certificates saved to: /opt/NammaSociety/ssl/"
echo ""
echo "Next steps:"
echo "1. Update nginx.conf to use HTTPS (see DNS_SETUP_GUIDE.md)"
echo "2. Restart services: docker-compose up -d"
echo ""
"@

    $sslScript | Out-File -FilePath "setup-ssl.sh" -Encoding UTF8 -NoNewline
    
    Write-Host ""
    Write-Host "âœ“ Created setup-ssl.sh" -ForegroundColor Green
    Write-Host ""
    Write-Host "Upload to EC2 and run:" -ForegroundColor Cyan
    Write-Host "  scp -i C:\AMP\Projects\NammaSociety-key.pem setup-ssl.sh ubuntu@${ec2IP}:/opt/NammaSociety/" -ForegroundColor Gray
    Write-Host "  ssh -i C:\AMP\Projects\NammaSociety-key.pem ubuntu@$ec2IP" -ForegroundColor Gray
    Write-Host "  cd /opt/NammaSociety && chmod +x setup-ssl.sh && sudo ./setup-ssl.sh" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Cyan
Write-Host ""
Write-Host "âœ“ DNS configuration helper complete!" -ForegroundColor Green
Write-Host ""
Write-Host "ðŸ“š For more help, see:" -ForegroundColor Cyan
Write-Host "   - DNS_SETUP_GUIDE.md (Detailed DNS instructions)" -ForegroundColor Gray
Write-Host "   - LOAD_BALANCER_GUIDE.md (Future scaling options)" -ForegroundColor Gray
Write-Host ""

