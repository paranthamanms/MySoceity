# NammaSociety - AWS Deployment Guide

## ðŸŽ¯ Overview

This guide will help you deploy the NammaSociety application to AWS EC2 using Docker Compose. This setup is optimized for startups with:
- **Cost**: $0-5/month (first 6 months with Free Tier + Credits)
- **Simplicity**: Single EC2 instance, all services containerized
- **Auto-shutdown**: 12 hours/day to minimize costs

---

## ðŸ“‹ Prerequisites

### AWS Account Setup
- âœ… AWS Account created (Account ID: 286093099448)
- âœ… Domain name: **NammaSociety-AMP.com**
- âœ… AWS Free Tier activated (12 months free)
- âœ… Optional: AWS Activate credits ($200 for 6 months)

### Required Credentials
Before deployment, gather these credentials:
1. **Gmail App Password** (for email notifications)
2. **Twilio credentials** (for SMS notifications)
3. **CCAvenue credentials** (for payment gateway)

---

## ðŸš€ Quick Start Deployment

### Step 1: Create EC2 Instance

1. **Log in to AWS Console**: https://console.aws.amazon.com
2. **Navigate to EC2**: Services â†’ EC2
3. **Launch Instance**:
   - **Name**: NammaSociety-Production
   - **AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance type**: **t3.micro** or t2.micro (Free tier)
   - **Key pair**: Create new key pair (download and save securely)
   - **Network settings**:
     - Allow SSH (port 22) from your IP
     - Allow HTTP (port 80) from anywhere
     - Allow HTTPS (port 443) from anywhere
   - **Storage**: 30 GB gp3 (Free tier: 30 GB)
   - **Tags**:
     - Key: Name, Value: NammaSociety-Production
     - Key: Project, Value: NammaSociety
     - Key: Environment, Value: Production

4. **Launch** and wait for instance to start

### Step 2: Connect to EC2 Instance

```bash
# Download your key pair (e.g., NammaSociety-key.pem)
# Set permissions
chmod 400 NammaSociety-key.pem

# Connect via SSH
ssh -i NammaSociety-key.pem ubuntu@<EC2-PUBLIC-IP>
```

### Step 3: Initial Server Setup

```bash
# Update and switch to root
sudo apt update
sudo su

# Download setup script
cd /root
wget https://raw.githubusercontent.com/yourusername/NammaSociety/main/setup-ec2.sh
chmod +x setup-ec2.sh

# Run setup (installs Docker, Docker Compose, Certbot)
./setup-ec2.sh
```

The script will:
- âœ… Install Docker & Docker Compose
- âœ… Install Git
- âœ… Install Certbot (SSL certificates)
- âœ… Configure firewall
- âœ… Set up auto-start on reboot
- âœ… Create application directory

**Reboot after setup**: `sudo reboot`

### Step 4: Clone Application Code

```bash
# Reconnect after reboot
ssh -i NammaSociety-key.pem ubuntu@<EC2-PUBLIC-IP>
sudo su

# Clone your code to /opt/NammaSociety
cd /opt
git clone <your-repo-url> NammaSociety
cd NammaSociety
```

**Or upload code via SCP**:
```bash
# From your local machine
scp -i NammaSociety-key.pem -r c:\AMP\Projects\MySoceity ubuntu@<EC2-IP>:/tmp/
ssh -i NammaSociety-key.pem ubuntu@<EC2-IP>
sudo mv /tmp/MySoceity/* /opt/NammaSociety/
```

### Step 5: Configure Environment Variables

```bash
cd /opt/NammaSociety

# Copy and edit environment file
cp .env.example .env.production
nano .env.production
```

**Update these values in `.env.production`**:

```bash
# Database (keep default or customize)
DB_PASSWORD=YourSecurePassword123!

# JWT Secret (generate random 64-char string)
JWT_SECRET=<generate-from-https://randomkeygen.com/>

# Gmail App Password
GMAIL_USERNAME=NammaSociety.notifications@gmail.com
GMAIL_APP_PASSWORD=<your-16-char-app-password>

# Twilio SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_PHONE_NUMBER=+1234567890

# CCAvenue Payment Gateway
CCAVENUE_MERCHANT_ID=your_merchant_id
CCAVENUE_ACCESS_CODE=your_access_code
CCAVENUE_WORKING_KEY=your_working_key
```

**Save and exit**: `Ctrl+X`, `Y`, `Enter`

### Step 6: Point Domain to EC2

1. **Get EC2 Public IP**:
   ```bash
   curl http://checkip.amazonaws.com
   ```

2. **Configure DNS** (at your domain registrar):
   - **A Record**: `@` â†’ `<EC2-PUBLIC-IP>`
   - **A Record**: `www` â†’ `<EC2-PUBLIC-IP>`

3. **Wait** for DNS propagation (5-30 minutes)

4. **Verify**:
   ```bash
   ping NammaSociety-AMP.com
   ```

### Step 7: Deploy Application

```bash
cd /opt/NammaSociety

# Make scripts executable
chmod +x *.sh

# Deploy (builds and starts all services)
./deploy.sh
```

The script will:
- âœ… Build Spring Boot JAR files
- âœ… Build Docker images (auth, user, frontend, nginx, postgres)
- âœ… Start all containers
- âœ… Initialize database

**Wait 2-3 minutes** for all services to start.

### Step 8: Verify Deployment

```bash
# Check running containers
docker-compose ps

# Should show 5 services running:
# - NammaSociety-postgres (postgres:13-alpine)
# - NammaSociety-auth (auth-service)
# - NammaSociety-user (user-service)
# - NammaSociety-frontend (nginx)
# - NammaSociety-nginx (reverse proxy)

# Check logs
docker-compose logs -f auth-service
docker-compose logs -f user-service

# Test locally
curl http://localhost/health
```

### Step 9: Setup SSL Certificate (HTTPS)

```bash
cd /opt/NammaSociety

# Run SSL setup
./setup-ssl.sh
```

This will:
- âœ… Obtain free SSL certificate from Let's Encrypt
- âœ… Configure automatic renewal (every 90 days)
- âœ… Restart nginx with HTTPS enabled

**Your site is now live**: https://NammaSociety-AMP.com

---

## ðŸ• Auto-Shutdown Setup (Optional - Save 50% cost)

To run the server only **12 hours/day** (8 AM - 8 PM IST):

### Option 1: CloudFormation (Recommended)

```bash
# From your local machine with AWS CLI installed
aws cloudformation create-stack \
  --stack-name NammaSociety-AutoShutdown \
  --template-body file://cloudformation-auto-shutdown.json \
  --parameters ParameterKey=InstanceId,ParameterValue=<YOUR-EC2-INSTANCE-ID> \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-south-1
```

### Option 2: Manual Setup

1. **Go to AWS Console** â†’ Lambda
2. **Create 2 functions**:
   - `NammaSociety-StartEC2` (start instance)
   - `NammaSociety-StopEC2` (stop instance)
3. **Create EventBridge Rules**:
   - Start: `cron(30 2 * * ? *)` - 8:00 AM IST
   - Stop: `cron(30 14 * * ? *)` - 8:00 PM IST

**Schedule**:
- **Start**: 8:00 AM IST (2:30 AM UTC)
- **Stop**: 8:00 PM IST (2:30 PM UTC)
- **Running**: 12 hours/day
- **Cost savings**: ~50%

---

## ðŸ“Š Service Management

### Start Services
```bash
cd /opt/NammaSociety
./start-services.sh
```

### Stop Services
```bash
cd /opt/NammaSociety
./stop-services.sh
```

### Restart Services
```bash
docker-compose restart
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth-service
docker-compose logs -f user-service
docker-compose logs -f frontend
```

### Update Application
```bash
cd /opt/NammaSociety

# Pull latest code
git pull

# Rebuild and redeploy
./deploy.sh
```

---

## ðŸ’° Cost Breakdown

### Months 1-6 (Free Tier + Credits)
| Resource | Cost | Notes |
|----------|------|-------|
| EC2 t3.micro | **$0** | Free Tier (750 hrs/month) |
| EBS 30GB | **$0** | Free Tier |
| Data Transfer | **$0-2** | 15GB free, then $0.09/GB |
| Route53 (optional) | **$0.50** | Hosted zone |
| **Total** | **$0-5/month** | |

### Months 7-12 (Free Tier only)
| Resource | Cost | Notes |
|----------|------|-------|
| EC2 t3.micro | **$0** | Free Tier |
| EBS 30GB | **$0** | Free Tier |
| Data Transfer | **$5-10** | After free tier |
| **Total** | **$5-10/month** | |

### After 12 Months (12h/day)
| Resource | Cost | Notes |
|----------|------|-------|
| EC2 t3.micro | **$10** | 360 hrs/month (~$0.028/hr) |
| EBS 30GB | **$3** | $0.10/GB |
| Data Transfer | **$2-5** | $0.09/GB after 1GB |
| **Total** | **$15-20/month** | |

---

## ðŸ”’ Security Checklist

- [x] SSH key pair secured (not shared)
- [x] Firewall configured (only ports 22, 80, 443)
- [x] Strong database password
- [x] JWT secret is random and secure
- [x] HTTPS enabled (SSL certificate)
- [x] Environment variables not committed to Git
- [ ] Enable AWS CloudWatch monitoring
- [ ] Set up backup strategy (database snapshots)
- [ ] Enable AWS GuardDuty (optional threat detection)

---

## ðŸ› Troubleshooting

### Service won't start
```bash
# Check logs
docker-compose logs [service-name]

# Check disk space
df -h

# Check memory
free -h

# Restart specific service
docker-compose restart [service-name]
```

### Can't access site
```bash
# Check nginx
docker-compose logs nginx

# Test locally first
curl http://localhost

# Check DNS
nslookup NammaSociety-AMP.com

# Check security group (AWS Console)
# Ensure ports 80, 443 are open
```

### Database connection issues
```bash
# Check PostgreSQL
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U postgres -d postgres -c "SELECT 1;"

# Restart database
docker-compose restart postgres
```

### SSL certificate issues
```bash
# Check certificate expiry
sudo certbot certificates

# Renew manually
sudo certbot renew

# Restart nginx
docker-compose restart nginx
```

### Out of memory
```bash
# Check Docker usage
docker system df

# Clean up
docker system prune -a --volumes

# For persistent issues, upgrade to t3.small
```

---

## ðŸ“ˆ Scaling Up

When your user base grows:

### Phase 1: Vertical Scaling (Easy)
- Upgrade to **t3.small** ($15/month â†’ 2GB RAM)
- Upgrade to **t3.medium** ($30/month â†’ 4GB RAM)

### Phase 2: Add RDS (Better reliability)
- Move PostgreSQL to **RDS db.t3.micro** (+$15/month)
- Automated backups and maintenance

### Phase 3: Horizontal Scaling (Production)
- Deploy to EKS (Kubernetes)
- Multiple EC2 instances + Load Balancer
- Auto-scaling based on traffic
- Cost: $150-300/month

---

## ðŸ“ž Support

**Created by**: GitHub Copilot  
**Date**: March 7, 2026  
**Version**: 1.0.0  

For issues:
1. Check logs: `docker-compose logs -f`
2. Review troubleshooting section above
3. Check AWS Free Tier usage: https://console.aws.amazon.com/billing/home#/freetier

---

## âœ… Post-Deployment Checklist

- [ ] All services running (`docker-compose ps`)
- [ ] Site accessible via HTTP
- [ ] SSL certificate installed (HTTPS working)
- [ ] Domain pointing to EC2
- [ ] Database initialized
- [ ] Email notifications working (test announcement)
- [ ] SMS notifications working (test OTP)
- [ ] Payment gateway configured
- [ ] Auto-shutdown scheduled (if enabled)
- [ ] Backup strategy in place
- [ ] Monitoring configured

**Your NammaSociety application is now live! ðŸŽ‰**

