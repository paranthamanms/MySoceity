# ðŸš¨ EC2 Instance Keeps Failing - Root Cause Analysis

## Your Situation

- **Issue**: Instance keeps going down after restart
- **Session Manager**: Repeatedly showing "Not Connected"
- **Symptom**: Recurring failure - instance becomes unreachable

This is **NOT normal** - there's an underlying problem causing the crashes.

---

## ðŸ” Common Root Causes (In Order of Likelihood)

### 1. **Application Crash / Out of Memory** (60%)
- Docker containers crashing
- Java backend running out of heap memory
- Node.js/Angular apps consuming all RAM
- Instance type too small (not enough resources)

### 2. **Disk Space Full** (20%)
- Logs filling up disk
- Docker images taking all space
- Database growing too large
- `/` or `/var` partition full

### 3. **Failed Status Checks** (10%)
- System status checks failing
- Instance automatically stopping/restarting
- Hardware/hypervisor issues

### 4. **Security/Network Issues** (5%)
- Auto-scaling terminating instance
- Someone manually stopping it
- VPC/subnet configuration issues

### 5. **System Errors** (5%)
- Kernel panic
- File system corruption
- Init system failures

---

## ðŸŽ¯ IMMEDIATE DIAGNOSTIC STEPS

### Step 1: Check Instance Status Checks

1. **Go to**: https://console.aws.amazon.com/ec2/v2/home#Instances:
2. **Select your instance**
3. **Look at "Status checks" column**

**What you'll see:**

âœ… **2/2 checks passed** â†’ Instance is healthy (problem is app-level)
âŒ **0/2 checks passed** â†’ Instance is down completely
âš ï¸ **1/2 checks passed** â†’ Partial failure

**If checks are failing:**
- Click on instance â†’ "Status checks" tab
- Read the error message
- This tells you if it's hardware, network, or system issue

---

### Step 2: Check CloudWatch Metrics

1. **Go to**: EC2 Console â†’ Select instance â†’ "Monitoring" tab
2. **Check these metrics:**

**CPU Utilization:**
- If constantly at 100% â†’ App is overloaded
- If suddenly drops to 0% â†’ Instance stopped/crashed

**Network In/Out:**
- If drops to 0 suddenly â†’ Instance went offline
- Check when it happened

**Status Check Failed:**
- Shows how many times checks failed
- Indicates recurring problem

---

### Step 3: Check System Logs (CRITICAL!)

This will show you WHY the instance is failing!

1. **Go to**: EC2 Console â†’ Select instance
2. **Actions** â†’ **Monitor and troubleshoot** â†’ **Get system log**
3. **Scroll to the bottom** (most recent logs)

**Look for:**
- âŒ `Out of memory: Kill process`
- âŒ `Kernel panic`
- âŒ `No space left on device`
- âŒ `Failed to start xxx service`

---

### Step 4: Check Instance Events

1. **EC2 Console** â†’ Select instance â†’ **Status checks** tab
2. **Scroll down** to "Scheduled events" and "Event history"

**Look for:**
- Automatic instance recovery
- System reboot required
- Instance retirement scheduled

---

## ðŸ”§ DIAGNOSTIC SCRIPT - Run When Instance is UP

When the instance IS running, immediately run this to collect diagnostics:

### Connect via Session Manager:

1. EC2 Console â†’ Select instance â†’ **Connect**
2. **Session Manager** tab â†’ **Connect**

### Run These Commands:

```bash
# ============================================
# CRITICAL DIAGNOSTICS - RUN ALL OF THESE
# ============================================

# 1. Check disk space (most common issue!)
df -h

# If any partition shows 100% or >90% usage, that's your problem!

# 2. Check memory usage
free -h

# If "available" is very low (<500MB), out of memory issue

# 3. Check what processes are using resources
top -bn1 | head -20

# Look for processes with high CPU% or MEM%

# 4. Check Docker containers status
docker ps -a

# Are containers constantly restarting? Check "STATUS" column

# 5. Check Docker logs for errors
docker logs $(docker ps -aq --filter name=auth-service) --tail=100
docker logs $(docker ps -aq --filter name=user-service) --tail=100
docker logs $(docker ps -aq --filter name=dashboard) --tail=100

# Look for OutOfMemoryError, crashes, connection errors

# 6. Check system logs for crashes
sudo journalctl -xe -n 100

# Look for error messages, out of memory, failed services

# 7. Check if disk is full (detailed)
du -sh /var/* | sort -h | tail -10
du -sh /* | sort -h | tail -10

# Shows which directories are using most space

# 8. Check system resource limits
ulimit -a

# 9. Check if services are failing
systemctl --failed

# 10. Check last system reboot time and reason
last reboot
uptime

# ============================================
# SAVE OUTPUT TO FILE
# ============================================

# Run this to save all diagnostics to a file:
echo "=== DISK SPACE ===" > /tmp/diagnostics.txt
df -h >> /tmp/diagnostics.txt
echo "=== MEMORY ===" >> /tmp/diagnostics.txt
free -h >> /tmp/diagnostics.txt
echo "=== TOP PROCESSES ===" >> /tmp/diagnostics.txt
top -bn1 | head -20 >> /tmp/diagnostics.txt
echo "=== DOCKER CONTAINERS ===" >> /tmp/diagnostics.txt
docker ps -a >> /tmp/diagnostics.txt
echo "=== DISK USAGE ===" >> /tmp/diagnostics.txt
du -sh /* 2>/dev/null | sort -h >> /tmp/diagnostics.txt
echo "=== SYSTEM LOGS ===" >> /tmp/diagnostics.txt
sudo journalctl -xe -n 100 >> /tmp/diagnostics.txt

# View the diagnostics:
cat /tmp/diagnostics.txt
```

---

## ðŸ”´ COMMON PROBLEMS & FIXES

### Problem 1: Out of Memory (OOM)

**Symptoms:**
- Instance becomes unresponsive
- `dmesg` or system logs show "Out of memory: Kill process"
- Java processes killed

**Check:**
```bash
# Check memory
free -h

# Check OOM killer logs
dmesg | grep -i "out of memory"
sudo journalctl | grep -i "oom"
```

**Fix:**

**Option A: Upgrade Instance Type**
```
Current: t2.micro (1GB RAM) or t2.small (2GB RAM)
Upgrade to: t3.medium (4GB RAM) or t3.large (8GB RAM)
```

1. EC2 Console â†’ Select instance â†’ **Actions** â†’ **Instance settings** â†’ **Change instance type**
2. Stop instance first
3. Change to larger type (t3.medium recommended)
4. Start instance

**Option B: Reduce Memory Usage**
```bash
# Limit Java heap size
# Edit docker-compose.yml or startup scripts:

# For auth-service and user-service, add:
JAVA_OPTS: "-Xmx256m -Xms128m"

# This limits Java to 256MB heap instead of default
```

---

### Problem 2: Disk Full

**Symptoms:**
- `df -h` shows 100% usage on `/` or `/var`
- Logs show "No space left on device"
- Docker can't start containers

**Check:**
```bash
# Check disk usage
df -h

# Find what's using space
du -sh /* 2>/dev/null | sort -h
du -sh /var/* 2>/dev/null | sort -h
```

**Fix:**

**Clean Docker:**
```bash
# Remove unused Docker images/containers
docker system prune -a -f

# Remove old logs
docker system df  # Show what's using space

# This can free 1-5GB easily!
```

**Clean System Logs:**
```bash
# Check log sizes
sudo du -sh /var/log/*

# Remove old logs
sudo journalctl --vacuum-time=3d  # Keep only 3 days
sudo find /var/log -name "*.gz" -mtime +7 -delete
```

**Expand Disk:**
1. EC2 Console â†’ **Volumes** (left sidebar)
2. Select your instance's volume
3. **Actions** â†’ **Modify volume**
4. Increase size (e.g., 8GB â†’ 20GB)
5. SSH to instance and grow filesystem:
```bash
sudo growpart /dev/xvda 1
sudo resize2fs /dev/xvda1
```

---

### Problem 3: Application Crashes

**Symptoms:**
- Docker containers keep restarting
- `docker ps` shows containers with "Restarting" status
- Services fail to start

**Check:**
```bash
# Check container status
docker ps -a

# Check logs for specific container
docker logs <container-name> --tail=100

# Check if containers are in restart loop
docker stats --no-stream
```

**Fix:**

**Check Configuration:**
```bash
cd /opt/NammaSociety

# Check if docker-compose.yml has errors
docker-compose config

# Check if services can connect to PostgreSQL
docker-compose logs postgres

# Restart all services properly
docker-compose down
docker-compose up -d

# Watch logs for errors
docker-compose logs -f
```

**Common fixes:**
- Database not ready (add healthcheck and depends_on)
- Wrong environment variables
- Port conflicts
- Missing dependencies

---

### Problem 4: Failed Status Checks

**Symptoms:**
- Instance status checks show 0/2 or 1/2
- Instance automatically stops/restarts
- AWS events show "automated recovery"

**Check:**
1. EC2 Console â†’ Instance â†’ **Status checks** tab
2. Look at specific check that's failing

**Fix:**

**If System Status Check fails:**
- Hardware/hypervisor issue (AWS responsibility)
- Stop and start instance (forces migration to new hardware)
- **Actions** â†’ **Instance state** â†’ **Stop** â†’ Wait â†’ **Start**

**If Instance Status Check fails:**
- OS/software issue (your responsibility)
- Check system logs (see commands above)
- Usually fixed by addressing disk/memory issues

---

## ðŸ“‹ QUICK CHECKLIST - Do These IN ORDER

When instance IS running:

1. **Connect via Session Manager immediately**
2. **Run**: `df -h` â†’ Is disk >90% full?
3. **Run**: `free -h` â†’ Is available memory <500MB?
4. **Run**: `docker ps -a` â†’ Are containers restarting?
5. **Run**: `docker-compose logs --tail=100` â†’ Any error messages?
6. **Run**: `sudo journalctl -xe -n 50` â†’ System errors?

When instance is DOWN:

1. **Check**: EC2 Console â†’ Status checks
2. **Check**: EC2 Console â†’ Monitoring â†’ CloudWatch metrics
3. **Check**: Actions â†’ Get system log
4. **Look for**: Out of memory, disk full, kernel panic messages

---

## ðŸŽ¯ MOST LIKELY SCENARIO

Based on your setup (Spring Boot + Angular + PostgreSQL in Docker), **99% chance it's one of these:**

### 1ï¸âƒ£ **Instance Too Small** (Most Likely!)

**Problem**: t2.micro (1GB RAM) can't handle:
- 2 Spring Boot apps (Java) â†’ 512MB each
- PostgreSQL database â†’ 256MB
- Angular frontends â†’ 100MB+
- Nginx â†’ 50MB
- Total needed: ~1.5-2GB minimum

**Solution:**
```
EC2 Console â†’ Stop instance â†’ Change instance type to t3.medium (4GB RAM)
```

### 2ï¸âƒ£ **Docker Logs Filling Disk**

**Problem**: Logs growing endlessly, filling disk

**Solution:**
```bash
# Add to docker-compose.yml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 3ï¸âƒ£ **Java Heap Size Too Large**

**Problem**: Java trying to use more memory than available

**Solution:**
```bash
# Limit Java memory in docker-compose.yml:
environment:
  - JAVA_OPTS=-Xmx384m -Xms256m
```

---

## ðŸš€ RECOMMENDED FIX (Do This First!)

### Upgrade to Proper Instance Size:

**Current problem**: Instance too small for your workload

**Solution**:

1. **Stop instance**: EC2 Console â†’ Select â†’ **Instance state** â†’ **Stop**

2. **Change type**: **Actions** â†’ **Instance settings** â†’ **Change instance type**
   - Choose: **t3.medium** (4GB RAM, 2 vCPU)
   - Cost: ~$30/month (vs $8/month for t2.micro)

3. **Start instance**: **Instance state** â†’ **Start**

4. **Note new IP** (if no Elastic IP)

5. **Connect and verify**:
```bash
# Check resources
free -h
df -h

# Start services
cd /opt/NammaSociety
docker-compose up -d

# Monitor
docker-compose logs -f
```

---

## ðŸ“Š Resource Requirements

**Minimum for your stack:**
- **RAM**: 2GB (4GB recommended)
- **CPU**: 2 vCPUs
- **Disk**: 20GB
- **Instance**: t3.medium or better

**Your current setup probably:**
- **Instance**: t2.micro or t2.small (too small!)
- **Needs**: Upgrade to t3.medium

---

## ðŸ’¡ IMMEDIATE ACTION PLAN

1. **Right now**: Go to EC2 Console
2. **Check**: What instance type are you using?
3. **If t2.micro or t2.small**: That's your problem!
4. **Stop instance** â†’ **Change type to t3.medium** â†’ **Start**
5. **Connect via Session Manager** when it comes up
6. **Run diagnostics** (commands above)

---

## ðŸ“ž Report Back With:

1. **Instance type**: What size are you currently using?
2. **System log**: Last 20 lines from "Get system log"
3. **When running**:
   - Output of `df -h`
   - Output of `free -h`
   - Output of `docker ps -a`

I'll help you fix this permanently! ðŸš€

---

## âš ï¸ Quick Answer to Your Immediate Question

**Q**: Why does it keep going down even after restart?

**A**: The restart doesn't fix the *root cause* - it just temporarily brings it back up until the same problem happens again.

**Most likely causes** (pick one):
1. ðŸ”´ Instance too small (not enough RAM) â†’ Java/Docker crashes
2. ðŸ”´ Disk full â†’ Can't write logs, services fail
3. ðŸ”´ Application bug â†’ Crashes and dies

**You need to diagnose WHILE it's running** to find the root cause!

