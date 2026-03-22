# AWS Deployment - Quick Start

**Your DNS is ready**: nammasociety-amp.com âœ…  
**AWS Account**: 286093099448 âœ…  
**All deployment files**: Created âœ…

---

## ðŸš€ DEPLOYMENT IN 5 STEPS

### â±ï¸ Total Time: 30-40 minutes

---

## Step 1: Configure Gmail (5 minutes)

**Required for email notifications (OTP, announcements)**

Run:
```powershell
.\SETUP-GMAIL-PASSWORD.ps1
```

This will guide you through:
1. Getting Gmail App Password from Google
2. Updating `.env.production` with credentials

---

## Step 2: Pre-Flight Check (2 minutes)

Verify everything is ready:

```powershell
.\AWS_DEPLOYMENT_CHECKLIST.ps1
```

Should show: âœ… **PRE-FLIGHT CHECK PASSED!**

If any issues, fix them before continuing.

---

## Step 3: Create EC2 Instance (15 minutes)

Follow the detailed guide:

```powershell
# Open in browser:
notepad EC2-CREATION-GUIDE.md
```

Or read online: [EC2-CREATION-GUIDE.md](EC2-CREATION-GUIDE.md)

**Tasks**:
1. Login to AWS Console: https://console.aws.amazon.com
2. Launch t3.micro instance (Ubuntu 22.04)
3. Create security group (ports 22, 80, 443)
4. Download SSH key: `NammaSociety-key.pem`
5. Note EC2 Public IP address

---

## Step 4: Update DNS (5 minutes + 30 min propagation)

Point your domain to EC2:

1. Go to your domain registrar (where you registered nammasociety-amp.com)
2. Navigate to DNS settings
3. Add A records:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | `<EC2 Public IP>` | 300 |
| A | www | `<EC2 Public IP>` | 300 |

4. Save changes
5. Wait 5-30 minutes for propagation

**Verify DNS**:
```powershell
nslookup nammasociety-amp.com
# Should return your EC2 IP
```

---

## Step 5: Deploy Application (10-15 minutes)

Run the automated deployment helper:

```powershell
.\AWS-DEPLOY-HELPER.ps1
```

**The script will**:
1. Ask for your EC2 Public IP
2. Test SSH connection
3. Upload all files
4. Install Docker, Docker Compose
5. Build and start all services
6. Install SSL certificate (if DNS is ready)

**Choose Option 1** for fully automated deployment.

---

## âœ… Deployment Complete!

After successful deployment, your application will be available at:

**ðŸŒ https://nammasociety-amp.com**

### Test These Features:

1. **Login Page**: https://nammasociety-amp.com
2. **Admin Login**:
   - Username: `admin`
   - Password: `admin123`

3. **Dashboard Access**:
   - Should redirect to dashboard after login
   - All widgets should load

4. **Email Notifications**:
   - Create an announcement
   - Check email delivery

---

## ðŸ” Verify Services

SSH into your EC2:
```powershell
ssh -i NammaSociety-key.pem ubuntu@<EC2-IP>
```

Check Docker containers:
```bash
cd /opt/NammaSociety
sudo docker-compose ps

# All services should show "Up"
```

Check logs:
```bash
sudo docker-compose logs -f [service-name]
# service-name: auth-service, user-service, frontend, nginx
```

---

## ðŸ“Š Monitor Costs

**First 12 Months**: **$0-5/month** (Free Tier + AWS Activate credits)

Setup billing alerts:
1. Go to AWS Console â†’ Billing â†’ Billing Preferences
2. Enable "Receive Billing Alerts"
3. Create CloudWatch alarm for $5 threshold

---

## ðŸ“š Additional Documentation

| Guide | Purpose |
|-------|---------|
| [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md) | Complete step-by-step deployment guide (850 lines) |
| [COST_OPTIMIZATION_GUIDE.md](COST_OPTIMIZATION_GUIDE.md) | 12-month cost strategy, savings tips (650 lines) |
| [MAINTENANCE_GUIDE.md](MAINTENANCE_GUIDE.md) | Daily/weekly/monthly operations (550 lines) |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Command cheatsheet (120 lines) |
| [EC2-CREATION-GUIDE.md](EC2-CREATION-GUIDE.md) | Detailed EC2 setup instructions |

---

## ðŸ†˜ Troubleshooting

### Services won't start
```bash
# Check logs
sudo docker-compose logs [service-name]

# Restart service
sudo docker-compose restart [service-name]

# Full restart
sudo docker-compose down
sudo docker-compose up -d
```

### Site not accessible
- Verify EC2 instance is running
- Check security group allows ports 80, 443
- Verify DNS points to correct IP
- Check nginx logs: `sudo docker-compose logs nginx`

### SSL certificate failed
- Ensure DNS propagates first (wait 30 minutes)
- Verify domain resolves: `nslookup nammasociety-amp.com`
- Re-run: `sudo ./setup-ssl.sh`

### Out of memory
- Upgrade to t3.small ($0.0208/hour = ~$15/month)
- Or add swap space:
  ```bash
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  ```

---

## ðŸ“ž Need Help?

1. Check troubleshooting sections in documentation
2. Review error logs: `sudo docker-compose logs`
3. Verify all prerequisite steps completed
4. Check AWS EC2 instance status in console

---

## ðŸŽ¯ Success Checklist

- [ ] Gmail App Password configured
- [ ] Pre-flight check passed
- [ ] EC2 instance created and running
- [ ] DNS points to EC2 IP
- [ ] SSH connection works
- [ ] All files uploaded to EC2
- [ ] Docker services running
- [ ] SSL certificate installed
- [ ] Site accessible via HTTPS
- [ ] Login works
- [ ] Dashboard loads
- [ ] Email notifications work

---

## ðŸš€ You're Ready!

Follow the 5 steps above and your application will be live on AWS in under an hour.

**Start with**: `.\SETUP-GMAIL-PASSWORD.ps1`

