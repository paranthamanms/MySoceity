# AWS Security Group - Visual Setup Guide

## ðŸŽ¯ The Problem
You're getting "Connection timed out" when trying to SSH to your EC2 instance.

## âœ… The Solution  
Update your EC2 Security Group to allow access.

---

## Step-by-Step with Screenshots Guide

### STEP 1: Open AWS Console

1. Go to: **https://console.aws.amazon.com/ec2**
2. Make sure you're in the correct region (top-right corner)
   - Your EC2 instance region (probably us-east-1 or ap-south-1)

### STEP 2: Navigate to Security Groups

**In the left sidebar**, scroll down and click:
```
Network & Security â†’ Security Groups
```

### STEP 3: Find Your Security Group

You'll see a list of security groups. Find the one attached to your EC2 instance.

**How to identify it:**
- Look at the "Description" column - it might say something like:
  - "launch-wizard-1 created 2026-03-XX"
  - "default security group"
  - "NammaSociety-SG"
  
**OR** find it from your EC2 instance:
1. Click "Instances" in left sidebar
2. Click on your instance
3. Click "Security" tab (bottom panel)
4. Note the security group name(s)
5. Go back to Security Groups and find that name

### STEP 4: Edit Inbound Rules

1. **Select** your security group (checkbox)
2. Click **"Edit inbound rules"** button (bottom of page)

### STEP 5: Add/Update Rules

You need THREE rules. Click **"Add rule"** for each one:

#### Rule 1: SSH Access
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Type                â”‚ SSH                â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Protocol            â”‚ TCP (auto-filled)  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Port range          â”‚ 22 (auto-filled)   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Source              â”‚ My IP              â”‚  â† IMPORTANT: Select from dropdown
â”‚                     â”‚ (auto-detects)     â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Description         â”‚ SSH from my PC     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**IMPORTANT:** For "Source", click the dropdown and select **"My IP"**. 
It will automatically fill in your current IP address.

#### Rule 2: HTTP Access
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Type                â”‚ HTTP               â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Protocol            â”‚ TCP (auto-filled)  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Port range          â”‚ 80 (auto-filled)   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Source              â”‚ Anywhere-IPv4      â”‚  â† Select from dropdown
â”‚                     â”‚ (0.0.0.0/0)        â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Description         â”‚ HTTP web access    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

#### Rule 3: HTTPS Access
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Type                â”‚ HTTPS              â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Protocol            â”‚ TCP (auto-filled)  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Port range          â”‚ 443 (auto-filled)  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Source              â”‚ Anywhere-IPv4      â”‚  â† Select from dropdown
â”‚                     â”‚ (0.0.0.0/0)        â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Description         â”‚ HTTPS secure web   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### STEP 6: Save Rules

Click **"Save rules"** button (orange button, bottom-right)

### STEP 7: Wait & Test

1. Wait **15-30 seconds** for changes to take effect
2. Test connection:
   ```powershell
   ssh -i C:\AMP\Projects\NammaSociety-key.pem ubuntu@YOUR_EC2_IP
   ```

---

## ðŸŽ¯ Quick Visual Reference

### Before (âŒ Wrong - No rules)
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Inbound rules                                  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Type â”‚ Port â”‚ Source â”‚ Groups â”‚ Description   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚      â”‚      â”‚        â”‚        â”‚ No rules     â”‚
â””â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### After (âœ… Correct - 3 rules)
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Inbound rules                                          â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Type  â”‚ Port â”‚ Source        â”‚ Description            â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ SSH   â”‚ 22   â”‚ 203.0.113.0/32â”‚ SSH from my PC        â”‚
â”‚ HTTP  â”‚ 80   â”‚ 0.0.0.0/0     â”‚ HTTP web access        â”‚
â”‚ HTTPS â”‚ 443  â”‚ 0.0.0.0/0     â”‚ HTTPS secure web       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## ðŸ†˜ Common Mistakes

### âŒ Mistake 1: Using "Custom TCP" instead of "SSH"
**Fix:** Use the dropdown and select "SSH" (not Custom TCP)

### âŒ Mistake 2: Wrong source for SSH
**Fix:** For SSH, use "My IP", NOT "Anywhere"
- Anywhere (0.0.0.0/0) = anyone can try to SSH (security risk!)
- My IP = only you can SSH (secure!)

### âŒ Mistake 3: Forgetting to click "Save rules"
**Fix:** Always click the orange "Save rules" button!

### âŒ Mistake 4: Wrong security group
**Fix:** Make sure you're editing the security group attached to your EC2 instance

---

## ðŸ§ª Test Your Connection

### Option 1: Use the helper script
```powershell
cd C:\AMP\Projects\MySoceity
.\FIX_SSH_CONNECTION.ps1
```

### Option 2: Manual test
```powershell
ssh -i C:\AMP\Projects\NammaSociety-key.pem ubuntu@YOUR_EC2_IP
```

**Success looks like:**
```
Welcome to Ubuntu 22.04 LTS
ubuntu@ip-xxx-xxx-xxx-xxx:~$
```

**Failure looks like:**
```
Connection timed out
```

---

## âœ… Next Steps

Once your SSH connection works:

1. **Deploy your application**
   ```powershell
   .\AWS_DEPLOY_ASSISTANT.ps1
   ```

2. **Or connect manually**
   ```powershell
   ssh -i C:\AMP\Projects\NammaSociety-key.pem ubuntu@YOUR_EC2_IP
   ```

---

## ðŸ“ž Still Having Issues?

If you're still stuck:

1. **Check EC2 instance status**
   - AWS Console â†’ EC2 â†’ Instances
   - Status should be "Running" (green)
   - State should show a green checkmark

2. **Verify IP address**
   - In EC2 console, click your instance
   - Look for "Public IPv4 address"
   - Make sure it matches what you're using

3. **Check your key file**
   - Should be at: `C:\AMP\Projects\NammaSociety-key.pem`
   - Should be the same key you selected when creating EC2

4. **Check region**
   - Top-right of AWS console should show correct region
   - Your EC2 instance must be in this region

5. **Wait a bit longer**
   - Sometimes security group changes take 1-2 minutes
   - Try again after 2 minutes

---

## ðŸŽ‰ Once It Works

You'll see:
```
ubuntu@ip-172-31-xx-xx:~$
```

Then you're ready to deploy! ðŸš€

```powershell
.\AWS_DEPLOY_ASSISTANT.ps1
```

