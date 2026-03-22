# ðŸ” ALB Troubleshooting Guide - Fix "Site Can't Be Reached"

## ðŸš¨ Your Issue

**Problem:** `http://NammaSociety-alb-1234567890.us-east-1.elb.amazonaws.com/` is not reachable

**Symptom:** "Site can't be reached" or connection timeout

---

## âœ… Step-by-Step Troubleshooting

### Step 1: Check ALB Status

1. **Go to:** AWS Console â†’ EC2 â†’ Load Balancers
2. **Find your ALB:** NammaSociety-alb
3. **Check State:** Should say **"Active"**
   - âŒ If "Provisioning" â†’ Wait 2-3 minutes
   - âŒ If "Failed" â†’ Delete and recreate

---

### Step 2: Check Target Group Health âš ï¸ MOST COMMON ISSUE

This is usually the problem!

1. **Go to:** EC2 â†’ Target Groups
2. **Click:** NammaSociety-target-group
3. **Click:** "Targets" tab
4. **Check Status:**

#### âœ… If status is "healthy" (green):
- Good! Skip to Step 3

#### âŒ If status is "unhealthy" (red):
This is your problem! See "Fix Unhealthy Targets" section below.

#### â³ If status is "initial" or "unused":
- No targets registered
- See "Register EC2 Instance" section below

---

## ðŸ”§ Fix Unhealthy Targets

### Common Reasons for Unhealthy Status:

#### Reason 1: Health Check Path Not Working

**Check:**
```
Target Group â†’ Health checks tab
Health check path: /health
```

**Problem:** Your app doesn't have a `/health` endpoint

**Solution A: Create a health endpoint**

SSH to your EC2 and check if health endpoint exists:
```bash
ssh -i C:\AMP\Projects\NammaSociety-key.pem ubuntu@44.222.193.230

# Test if health endpoint works
curl http://localhost/health
curl http://localhost:80/health
```

If it fails, update your nginx.conf:
```nginx
server {
    listen 80;
    
    # Add health check endpoint
    location /health {
        return 200 "OK";
        add_header Content-Type text/plain;
    }
    
    # Your other locations...
}
```

Then restart nginx:
```bash
cd /opt/NammaSociety
docker-compose restart nginx
```

**Solution B: Change health check path**

If your app uses a different path (like `/` or `/api/health`):

1. Go to Target Group â†’ Health checks tab
2. Click "Edit health check settings"
3. Change path to: `/` or `/api/health`
4. Click "Save changes"
5. Wait 30 seconds for health checks to pass

---

#### Reason 2: Security Group Blocking Traffic

**Problem:** ALB can't reach your EC2 instance

**Check EC2 Security Group:**

1. Go to: EC2 â†’ Instances
2. Click your instance
3. Click "Security" tab
4. Note the security group name
5. Click the security group link

**Required Inbound Rules:**

Your EC2 security group MUST allow traffic FROM the ALB security group:

```
Type: HTTP  | Port: 80 | Source: <ALB-Security-Group-ID>
Type: HTTPS | Port: 443 | Source: <ALB-Security-Group-ID>
```

**How to fix:**
1. Edit inbound rules
2. Add rule:
   - Type: HTTP
   - Port: 80
   - Source: Custom â†’ Select ALB's security group
3. Save rules

---

#### Reason 3: Wrong Port Configuration

**Check Target Group Port:**

1. Go to Target Group â†’ Targets tab
2. Check "Port" column
3. Should match your app's port (usually 80)

**If port is wrong:**
1. Click "Register targets"
2. Select your instance
3. Enter correct port: 80
4. Click "Include as pending below"
5. Click "Register pending targets"

---

#### Reason 4: EC2 Instance Not Running

**Check:**
1. EC2 â†’ Instances
2. Your instance status should be "Running" (green)
3. Status checks should pass (2/2)

**If not running:**
```
Select instance â†’ Instance state â†’ Start instance
```

---

#### Reason 5: Application Not Running in EC2

**Check if your app is running:**

```bash
ssh -i C:\AMP\Projects\NammaSociety-key.pem ubuntu@44.222.193.230

# Check Docker containers
cd /opt/NammaSociety
docker-compose ps

# All services should be "Up"
# If not, restart:
docker-compose up -d

# Test locally
curl http://localhost:80
curl http://localhost:80/health
```

---

### Step 3: Check ALB Security Group

Your ALB security group must allow internet traffic:

1. **Go to:** EC2 â†’ Security Groups
2. **Find:** Security group attached to your ALB
3. **Check Inbound Rules:**

**Required rules:**
```
Type: HTTP  | Port: 80  | Source: 0.0.0.0/0 (Anywhere-IPv4)
Type: HTTPS | Port: 443 | Source: 0.0.0.0/0 (Anywhere-IPv4)
```

**If missing:**
1. Edit inbound rules
2. Add the above rules
3. Save changes

---

### Step 4: Check ALB Listeners

1. **Go to:** Load Balancers â†’ Your ALB
2. **Click:** "Listeners" tab
3. **Should have at minimum:**

```
HTTP:80 â†’ Forward to NammaSociety-target-group
```

**If listener is missing:**
1. Click "Add listener"
2. Protocol: HTTP
3. Port: 80
4. Default action: Forward to â†’ NammaSociety-target-group
5. Click "Add"

---

## ðŸ“‹ Quick Diagnostic Script

Run this PowerShell script to check everything:

```powershell
# Get your ALB DNS name
$albDNS = "NammaSociety-alb-1234567890.us-east-1.elb.amazonaws.com"

Write-Host "Testing ALB connectivity..." -ForegroundColor Yellow

# Test DNS resolution
try {
    $resolved = Resolve-DnsName $albDNS
    Write-Host "âœ“ DNS resolves to:" -ForegroundColor Green
    $resolved | ForEach-Object { Write-Host "  $($_.IPAddress)" -ForegroundColor Gray }
} catch {
    Write-Host "âœ— DNS resolution failed!" -ForegroundColor Red
}

# Test HTTP connection
try {
    $response = Invoke-WebRequest -Uri "http://$albDNS" -UseBasicParsing -TimeoutSec 10
    Write-Host "âœ“ HTTP connection successful! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "âœ— HTTP connection failed!" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test health endpoint
try {
    $health = Invoke-WebRequest -Uri "http://$albDNS/health" -UseBasicParsing -TimeoutSec 10
    Write-Host "âœ“ Health endpoint works! Status: $($health.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "âœ— Health endpoint failed!" -ForegroundColor Yellow
}
```

---

## ðŸŽ¯ Most Likely Issues (In Order)

### 1. **Unhealthy Targets** (90% of problems)
- Health check path doesn't exist
- App not responding on port 80
- Security group blocking ALB â†’ EC2 traffic

### 2. **ALB Security Group** (5% of problems)
- Not allowing HTTP/HTTPS from internet (0.0.0.0/0)

### 3. **No Listener Configured** (3% of problems)
- ALB doesn't have HTTP:80 listener

### 4. **Wrong Target Port** (2% of problems)
- Target group pointing to wrong port

---

## ðŸ› ï¸ Complete Fix Steps (Do This!)

### Step A: SSH to Your EC2

```bash
ssh -i C:\AMP\Projects\NammaSociety-key.pem ubuntu@44.222.193.230
```

### Step B: Ensure App Is Running

```bash
cd /opt/NammaSociety

# Check services
docker-compose ps

# If not running, start them
docker-compose up -d

# Wait 30 seconds
sleep 30
```

### Step C: Add Health Endpoint to Nginx

```bash
# Edit nginx.conf
nano nginx.conf
```

Add this location block:
```nginx
server {
    listen 80;
    
    # ADD THIS:
    location /health {
        return 200 "OK";
        add_header Content-Type text/plain;
    }
    
    # Keep your existing locations...
}
```

Save (Ctrl+O, Enter, Ctrl+X) and restart:
```bash
docker-compose restart nginx

# Test locally
curl http://localhost/health
# Should return: OK
```

### Step D: Fix EC2 Security Group

1. AWS Console â†’ EC2 â†’ Security Groups
2. Find your EC2 instance's security group
3. Edit inbound rules
4. Add/Update:
   ```
   Type: HTTP
   Port: 80
   Source: <Select your ALB's security group>
   ```
5. Save rules

### Step E: Check Target Group Health

1. AWS Console â†’ EC2 â†’ Target Groups
2. Click NammaSociety-target-group
3. Click "Targets" tab
4. Wait 30-60 seconds
5. Status should change to "healthy" (green)

### Step F: Test ALB

```powershell
# Test from your Windows machine
curl http://NammaSociety-alb-1234567890.us-east-1.elb.amazonaws.com
```

Should now work! âœ…

---

## ðŸ“Š ALB Architecture Checklist

```
Internet (0.0.0.0/0)
    â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  ALB Security Group           â”‚
â”‚  âœ“ Allow HTTP:80 from 0.0.0.0â”‚ â† Check this!
â”‚  âœ“ Allow HTTPS:443 from 0.0.0â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
             â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Application Load Balancer     â”‚
â”‚  âœ“ State: Active               â”‚ â† Check this!
â”‚  âœ“ Listener: HTTP:80           â”‚ â† Check this!
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
             â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Target Group                  â”‚
â”‚  âœ“ Health check: /health       â”‚ â† Check this!
â”‚  âœ“ Port: 80                    â”‚ â† Check this!
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
             â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  EC2 Security Group            â”‚
â”‚  âœ“ Allow HTTP:80 from ALB SG   â”‚ â† Check this!
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
             â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  EC2 Instance                  â”‚
â”‚  âœ“ Status: Running             â”‚ â† Check this!
â”‚  âœ“ App running on port 80      â”‚ â† Check this!
â”‚  âœ“ /health endpoint exists     â”‚ â† Check this!
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## ðŸ” Detailed Health Check Debugging

If targets are still unhealthy, check the reason:

1. **Go to:** Target Groups â†’ Targets tab
2. **Hover over** the unhealthy status
3. **Read the error message:**

### Common Error Messages:

#### "Connection refused"
- App not running on specified port
- Wrong port in target group
- **Fix:** Make sure nginx is listening on port 80

#### "Connection timed out"
- Security group blocking traffic
- **Fix:** Allow ALB security group in EC2 security group

#### "Health checks failed with these codes: [502]"
- App running but returning errors
- **Fix:** Check app logs: `docker-compose logs`

#### "Target is not in use"
- No listener forwarding to this target group
- **Fix:** Add HTTP listener to ALB

---

## ðŸ†˜ Still Not Working?

### Collect Debug Information:

```bash
# On your EC2:
ssh -i C:\AMP\Projects\NammaSociety-key.pem ubuntu@44.222.193.230

# 1. Check what's listening on port 80
sudo netstat -tlnp | grep :80

# 2. Check Docker containers
cd /opt/NammaSociety
docker-compose ps

# 3. Check nginx logs
docker-compose logs nginx --tail=50

# 4. Test local access
curl -v http://localhost:80
curl -v http://localhost:80/health

# 5. Check if firewall is blocking
sudo iptables -L -n
```

---

## âœ… Success Indicators

You'll know it's working when:

1. **Target Group:**
   - Targets tab shows "healthy" (green)

2. **ALB Test:**
   ```powershell
   curl http://NammaSociety-alb-xxx.us-east-1.elb.amazonaws.com
   # Returns your app's content
   ```

3. **Health Endpoint:**
   ```powershell
   curl http://NammaSociety-alb-xxx.us-east-1.elb.amazonaws.com/health
   # Returns: OK
   ```

---

## ðŸ’¡ Pro Tip: Simple A/B Test

**Test if problem is ALB or your app:**

```bash
# SSH to EC2
ssh -i C:\AMP\Projects\NammaSociety-key.pem ubuntu@44.222.193.230

# Test app directly
curl http://localhost:80
curl http://localhost:80/health
```

**If localhost works but ALB doesn't:**
â†’ Problem is with ALB configuration (security groups, target group)

**If localhost doesn't work:**
â†’ Problem is with your app (docker containers, nginx config)

---

## ðŸ“ž Quick Fix Checklist

Run through this in order:

- [ ] ALB status is "Active"
- [ ] ALB has HTTP:80 listener
- [ ] Listener forwards to correct target group
- [ ] Target group has EC2 instance registered
- [ ] Target group port is 80
- [ ] Target group health check path is `/health` (or `/`)
- [ ] EC2 instance is "Running"
- [ ] Docker containers are running (`docker-compose ps`)
- [ ] Nginx is listening on port 80
- [ ] `/health` endpoint exists and returns 200 OK
- [ ] ALB security group allows HTTP from 0.0.0.0/0
- [ ] EC2 security group allows HTTP from ALB security group

---

## ðŸŽ¯ After It Works

Once your HTTP works, then setup HTTPS:

1. Request SSL certificate in ACM
2. Validate domain ownership
3. Add HTTPS:443 listener to ALB
4. Point listener to certificate
5. Update DNS to point to ALB

But first, let's get HTTP working!

---

Let me know:
1. What's the target group health status? (healthy/unhealthy/initial)
2. Can you access your app directly via EC2 IP?
3. What error message do you see in target group?

I'll help you fix it! ðŸš€

