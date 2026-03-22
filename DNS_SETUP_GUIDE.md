# ðŸŒ DNS Setup for NammaSociety - Complete Guide

## ðŸ“‹ Overview

You have a domain: **NammaSociety-AMP.com**  
You have an EC2 instance with IP: **44.222.193.230** (or your current IP)

**Goal:** Make your app accessible at `https://nammasociety-amp.com`

---

## ðŸŽ¯ Option 1: Simple DNS Setup (RECOMMENDED for now)

### Best for:
- Starting out
- Single EC2 instance
- Quick and easy
- **FREE** (no extra AWS costs)

### How it works:
```
User types: nammasociety-amp.com
    â†“
DNS resolves to: 44.222.193.230
    â†“
User sees your app!
```

---

## ðŸš€ Step-by-Step: DNS Configuration

### Method A: Using Your Domain Registrar (Easiest)

**Where did you buy NammaSociety-AMP.com?**
- GoDaddy
- Namecheap
- Google Domains
- Other registrar

### For Most Registrars (GoDaddy, Namecheap, etc.):

#### 1. Login to your domain registrar

#### 2. Find DNS Management
- Look for: "DNS Management", "DNS Settings", "Manage DNS", or "Nameservers"

#### 3. Add A Records

Add **TWO** A records:

**Record 1: Root domain**
```
Type:     A
Host:     @  (or leave blank, or use "nammasociety-amp.com")
Points to: 44.222.193.230
TTL:      600 (or 3600, or Auto)
```

**Record 2: WWW subdomain**
```
Type:     A
Host:     www
Points to: 44.222.193.230
TTL:      600
```

#### 4. Save changes

#### 5. Wait for DNS propagation
- **Time:** 10-30 minutes (sometimes up to 2 hours)
- **Check status:** https://dnschecker.org

---

### Method B: Using AWS Route 53 (AWS Native)

**Benefits:**
- Integrated with AWS
- Better for multiple AWS services later
- More DNS management features

**Cost:** ~$0.50/month per hosted zone + $0.40 per million queries

#### Step 1: Create Hosted Zone in Route 53

```powershell
# Option 1: Use AWS Console
```

1. Go to: https://console.aws.amazon.com/route53/
2. Click **"Create hosted zone"**
3. **Domain name:** `nammasociety-amp.com`
4. **Type:** Public hosted zone
5. Click **"Create hosted zone"**

**Note the nameservers** (you'll see 4 nameservers like):
```
ns-1234.awsdns-56.org
ns-789.awsdns-12.co.uk
ns-345.awsdns-67.com
ns-890.awsdns-34.net
```

#### Step 2: Update Nameservers at Your Registrar

1. Go back to where you bought your domain (GoDaddy, Namecheap, etc.)
2. Find "Nameservers" or "DNS Settings"
3. Change from default nameservers to the 4 AWS nameservers (from step 1)
4. Save changes
5. **Wait 24-48 hours** for nameserver propagation

#### Step 3: Create DNS Records in Route 53

Once nameservers are updated:

1. Go to your hosted zone in Route 53
2. Click **"Create record"**

**Record 1: Root domain**
```
Record name: (leave blank)
Record type: A
Value:       44.222.193.230
TTL:         300
Routing:     Simple
```

**Record 2: WWW subdomain**
```
Record name: www
Record type: A
Value:       44.222.193.230
TTL:         300
Routing:     Simple
```

3. Click **"Create records"**

---

## ðŸ” Step 2: Setup SSL Certificate (HTTPS)

After DNS is working (can access via http://nammasociety-amp.com):

### Using Let's Encrypt (FREE SSL)

```bash
# SSH to your EC2 instance
ssh -i C:\AMP\Projects\NammaSociety-key.pem ubuntu@44.222.193.230

# Install Certbot
sudo apt-get update
sudo apt-get install -y certbot

# Stop nginx temporarily (to use port 80)
cd /opt/NammaSociety
docker-compose stop nginx

# Get SSL certificate
sudo certbot certonly --standalone \
  -d nammasociety-amp.com \
  -d www.nammasociety-amp.com \
  --agree-tos \
  --email your-email@gmail.com \
  --non-interactive

# Certificates will be saved to:
# /etc/letsencrypt/live/nammasociety-amp.com/fullchain.pem
# /etc/letsencrypt/live/nammasociety-amp.com/privkey.pem

# Create SSL directory for Docker
sudo mkdir -p /opt/NammaSociety/ssl
sudo cp /etc/letsencrypt/live/nammasociety-amp.com/fullchain.pem /opt/NammaSociety/ssl/
sudo cp /etc/letsencrypt/live/nammasociety-amp.com/privkey.pem /opt/NammaSociety/ssl/
sudo chown -R $USER:$USER /opt/NammaSociety/ssl

# Update nginx config to use HTTPS (see next section)
# Then restart services
docker-compose up -d
```

---

## âš™ï¸ Update Nginx Configuration for HTTPS

Create/update your nginx.conf:

```nginx
events {
    worker_connections 1024;
}

http {
    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name nammasociety-amp.com www.nammasociety-amp.com;
        
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS server
    server {
        listen 443 ssl;
        server_name nammasociety-amp.com www.nammasociety-amp.com;

        ssl_certificate     /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Frontend
        location / {
            proxy_pass http://frontend:4200;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Auth API
        location /api/auth/ {
            proxy_pass http://auth-service:8001/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # User API
        location /api/users/ {
            proxy_pass http://user-service:8002/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Health check
        location /health {
            return 200 "OK";
            add_header Content-Type text/plain;
        }
    }
}
```

---

## ðŸ§ª Testing Your DNS Setup

### 1. Check DNS Propagation
```powershell
# Test from your Windows machine
nslookup nammasociety-amp.com

# Should show: 44.222.193.230
```

**Online tools:**
- https://dnschecker.org - Shows propagation worldwide
- https://mxtoolbox.com/DNSLookup.aspx - Detailed DNS info

### 2. Test HTTP Access
```powershell
# Should work after DNS propagates
curl http://nammasociety-amp.com
```

### 3. Test HTTPS Access (after SSL setup)
```powershell
curl https://nammasociety-amp.com
```

---

## ðŸ“Š Current vs Target Architecture

### Current (What you have now):
```
User â†’ EC2 IP (44.222.193.230) â†’ Your App
```

### After DNS Setup:
```
User â†’ nammasociety-amp.com â†’ DNS resolves to 44.222.193.230 â†’ Your App
```

### After SSL Setup:
```
User â†’ https://nammasociety-amp.com (HTTPS) â†’ 44.222.193.230 â†’ Your App
```

### With Load Balancer (Future scaling):
```
User â†’ nammasociety-amp.com 
  â†’ Route 53 
  â†’ Application Load Balancer (ALB)
  â†’ Target Group
  â†’ Multiple EC2 instances (auto-scaling)
```

---

## ðŸŽ¯ Which Option Should You Choose?

### âœ… Use Method A (Registrar DNS) if:
- You want to get started quickly (15 minutes)
- You're comfortable with your domain registrar
- You want to save $0.50/month
- Simple setup is your priority

### âš™ï¸ Use Method B (Route 53) if:
- You want everything in AWS
- You plan to use more AWS services
- You want advanced DNS features
- You're comfortable with a bit more complexity

**My Recommendation:** Start with **Method A** using your registrar. It's simpler and you can always migrate to Route 53 later if needed.

---

## ðŸ†˜ Troubleshooting

### "DNS not resolving"
```bash
# Check if DNS record exists
nslookup nammasociety-amp.com

# If it shows your old IP or no result:
# - Wait longer (up to 48 hours for nameserver changes)
# - Clear your DNS cache:
ipconfig /flushdns
```

### "Can access via IP but not domain"
- DNS hasn't propagated yet (wait 30 minutes)
- Check your A record points to correct IP
- Try from different device/network

### "HTTPS not working"
- SSL certificate not installed yet
- Nginx not configured for HTTPS
- Port 443 not open in security group

### "ERR_SSL_PROTOCOL_ERROR"
- Certificate paths wrong in nginx.conf
- Certificate expired
- Nginx didn't restart after config change

---

## ðŸ“ Quick Setup Script

I'll create an automated script for you in the next file!

---

## âœ… Setup Checklist

### DNS Setup
- [ ] Decided between Registrar DNS vs Route 53
- [ ] Added A record for root domain (@)
- [ ] Added A record for www subdomain
- [ ] Waited for DNS propagation (30 min - 2 hours)
- [ ] Verified with nslookup or dnschecker.org
- [ ] Can access via http://nammasociety-amp.com

### SSL Setup
- [ ] DNS is working (above checklist complete)
- [ ] Installed certbot on EC2
- [ ] Generated SSL certificate
- [ ] Copied certificates to /opt/NammaSociety/ssl/
- [ ] Updated nginx.conf with HTTPS config
- [ ] Restarted nginx container
- [ ] Can access via https://nammasociety-amp.com
- [ ] HTTP automatically redirects to HTTPS

### Security
- [ ] Security group allows port 80 (HTTP)
- [ ] Security group allows port 443 (HTTPS)
- [ ] SSL certificate will auto-renew (certbot renew)

---

## ðŸŽ‰ Success!

Once complete, your users can access your app at:
- âœ… https://nammasociety-amp.com
- âœ… https://www.nammasociety-amp.com
- âœ… Both redirect to HTTPS automatically
- âœ… Green padlock in browser ðŸ”’

---

## ðŸ“ž Need More Help?

Let me know:
1. Which method you want to use (Registrar DNS or Route 53)
2. Where you registered your domain
3. Your current EC2 IP address

I'll create specific commands for your exact setup!

