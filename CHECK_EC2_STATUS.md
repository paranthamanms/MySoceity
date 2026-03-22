# ðŸ”´ EC2 Instance Not Reachable - Emergency Fix

## Your Situation

- **Ping Status**: Offline âŒ
- **Session Manager**: Not Connected âŒ
- **IP Address**: 44.222.193.230

This means your EC2 instance is likely **STOPPED** or **TERMINATED**.

---

## ðŸš¨ IMMEDIATE ACTION - Check Instance Status

### Step 1: Open AWS EC2 Console

**Go to**: https://console.aws.amazon.com/ec2/v2/home#Instances:

---

### Step 2: Find Your Instance

Look for your instance (IP: 44.222.193.230 or name: NammaSociety-*)

**Check the "Instance state" column:**

---

## ðŸ“Š What You'll See & What To Do

### âœ… If Instance State = "Running" (Green)

**Your instance is running but not reachable.**

**Possible causes:**
1. Wrong IP address (may have changed)
2. All security groups are blocking traffic
3. Instance has issues

**What to do:**
1. **Check the Public IPv4 address** - has it changed?
2. **Check Status checks** - should be "2/2 checks passed"
   - If failing, instance has internal issues
3. Try connecting via **Session Manager**:
   - Select instance â†’ Click "Connect" button
   - Choose "Session Manager" tab
   - Click "Connect"

---

### ðŸŸ¡ If Instance State = "Stopped" (Amber/Yellow)

**Your instance is stopped. You need to start it!**

**This is the most likely reason!**

#### How to Start:

1. **Select** your instance (checkbox)
2. Click **"Instance state"** dropdown (top right)
3. Click **"Start instance"**
4. Wait 1-2 minutes

#### âš ï¸ IMPORTANT:

When you start a stopped instance **without an Elastic IP**, the public IP will change!

**After starting:**
1. Note the new **Public IPv4 address**
2. Update your SSH command with new IP
3. Update DNS/ALB configuration with new IP

---

### ðŸ”´ If Instance State = "Terminated" (Red)

**Your instance was deleted. You need to recreate it.**

This is bad - all your setup is gone. You'll need to:
1. Launch a new EC2 instance
2. Redeploy your application
3. Reconfigure everything

**Prevention**: Always use "Stop" instead of "Terminate" when you don't need the instance temporarily.

---

### â¸ï¸ If Instance State = "Stopping" or "Pending"

**Wait 1-2 minutes** for it to finish the state transition, then check again.

---

## ðŸ”§ Quick Fix Steps

### If Instance is STOPPED:

```
Step 1: Start the instance
Step 2: Wait for "Running" state (1-2 mins)
Step 3: Wait for "2/2 status checks passed" (2-3 mins)
Step 4: Note the NEW Public IPv4 address
Step 5: Update your commands with new IP
```

---

### If Instance is RUNNING but unreachable:

#### Option A: Use Session Manager (Easiest!)

1. AWS Console â†’ EC2 â†’ Instances
2. Select your instance
3. Click **"Connect"** button (top right)
4. Click **"Session Manager"** tab
5. Click **"Connect"**

This opens a browser terminal - no SSH needed!

#### Option B: Check if IP Changed

If you recently stopped/started the instance, the IP may have changed.

**Find current IP:**
1. EC2 Console â†’ Instances
2. Select your instance
3. Look at "Public IPv4 address" in details below

**If it changed**, update your connection:
```powershell
ssh -i C:\AMP\Projects\NammaSociety-key.pem ubuntu@NEW_IP_HERE
```

---

## ðŸŽ¯ Prevention: Use Elastic IP

To prevent IP changes when stopping/starting:

### Allocate Elastic IP:

1. **Go to**: EC2 â†’ Elastic IPs (left sidebar)
2. Click **"Allocate Elastic IP address"**
3. Click **"Allocate"**
4. Select the new Elastic IP
5. Click **"Actions"** â†’ **"Associate Elastic IP address"**
6. Select your instance
7. Click **"Associate"**

Now your IP won't change when you stop/start! ðŸŽ‰

**Cost**: FREE while instance is running, $0.005/hour when stopped.

---

## ðŸ“‹ Checklist - Do This Now

- [ ] Go to EC2 Console
- [ ] Find your instance
- [ ] Check "Instance state"
- [ ] If stopped â†’ Start it
- [ ] Wait for "Running" (1-2 mins)
- [ ] Wait for "2/2 checks passed" (2-3 mins)
- [ ] Note the Public IPv4 address
- [ ] Try Session Manager to connect
- [ ] Update your scripts with correct IP

---

## ðŸ” After Starting Instance

### 1. Wait for Instance to be Ready

**Instance State**: Should show "Running" (green) âœ…

**Status Checks**: Should show "2/2 checks passed" âœ…
- Takes 2-3 minutes after starting

If status checks fail, try:
- Wait another minute
- Reboot instance (Instance state â†’ Reboot)

### 2. Get the New IP Address

Look at **"Public IPv4 address"** in the instance details.

**Example**: 
- Old IP: 44.222.193.230 âŒ
- New IP: 54.123.45.67 âœ… (use this now!)

### 3. Update Everything with New IP

Update these files/commands:
```powershell
# SSH command
ssh -i C:\AMP\Projects\NammaSociety-key.pem ubuntu@NEW_IP_HERE

# Diagnostic scripts
.\FIX_SSH_TO_EC2.ps1 -EC2_IP "NEW_IP_HERE"
.\CHECK_ALB_STATUS.ps1 -EC2_IP "NEW_IP_HERE"
```

### 4. Update ALB Target Group

If you're using ALB, update the target:

1. EC2 â†’ Target Groups
2. Select NammaSociety-target-group
3. Click "Targets" tab
4. Click "Register targets"
5. Select your instance (it will show the new IP)
6. Click "Include as pending below"
7. Click "Register pending targets"
8. Deregister the old IP if still there

---

## ðŸ’¡ Connect via Session Manager (Recommended!)

**Why Session Manager is better:**
- âœ… No SSH key needed
- âœ… Works even if IP changed
- âœ… No security group changes needed
- âœ… Works from browser
- âœ… Automatic logging/audit

**How to use:**
1. https://console.aws.amazon.com/ec2/v2/home#Instances:
2. Select your instance
3. Click "Connect" â†’ "Session Manager"
4. Click "Connect"

---

## ðŸ“ž Report Back

After checking EC2 console, tell me:

1. **What is the instance state?** (Running/Stopped/Terminated?)
2. **What is the Public IPv4 address?** (Has it changed?)
3. **What are the status checks?** (2/2 passed or failing?)
4. **Can you connect via Session Manager?** (Yes/No)

I'll help you get it working! ðŸš€

---

## Quick Commands Reference

### Connect via Session Manager (Best Option):
```
AWS Console â†’ EC2 â†’ Instances â†’ Select Instance â†’ Connect â†’ Session Manager â†’ Connect
```

### SSH with correct IP:
```powershell
# Get current IP from EC2 console first!
ssh -i C:\AMP\Projects\NammaSociety-key.pem ubuntu@YOUR_CURRENT_IP
```

### Check if instance is running:
```powershell
Test-Connection -ComputerName YOUR_CURRENT_IP -Count 2
```

