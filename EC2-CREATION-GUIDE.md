# AWS EC2 Instance Creation Guide

**Goal**: Create a single t3.micro EC2 instance for NammaSociety application

**Time Required**: 15-20 minutes

---

## Prerequisites

- [x] AWS Account ID: **286093099448**
- [x] Domain registered: **nammasociety-amp.com**
- [x] All deployment files created

---

## Step 1: Login to AWS Console

1. Go to: https://console.aws.amazon.com
2. **Account ID**: `286093099448`
3. **Username**: Your IAM user or root account
4. **Password**: `Va!ramsv02!2` (if root account)

---

## Step 2: Navigate to EC2

1. In the AWS Console search bar (top), type: **EC2**
2. Click **EC2** (Virtual Servers in the Cloud)
3. Make sure you're in the **ap-south-1 (Mumbai)** region
   - Check top-right corner dropdown
   - If not Mumbai, select it

---

## Step 3: Launch Instance

1. Click the orange **"Launch Instance"** button
2. You'll see the "Launch an instance" configuration page

---

## Step 4: Configure Instance

### **Name and Tags**
- **Name**: `NammaSociety-Production`
- Click **"Add additional tags"** (optional)
  - Key: `Project` â†’ Value: `NammaSociety`
  - Key: `Environment` â†’ Value: `Production`

### **Application and OS Images (Amazon Machine Image)**
- Select: **Ubuntu**
- Choose: **Ubuntu Server 22.04 LTS (HVM), SSD Volume Type**
- Architecture: **64-bit (x86)**
- Look for the **"Free tier eligible"** label

### **Instance Type**
- Select: **t3.micro**
  - 1 vCPU, 1 GB RAM
  - Should show **"Free tier eligible"**
- If t3.micro not available, use **t2.micro**

### **Key Pair (Login)**
- Click **"Create new key pair"**
- **Key pair name**: `NammaSociety-key`
- **Key pair type**: RSA
- **Private key file format**: `.pem`
- Click **"Create key pair"**
- **IMPORTANT**: The `NammaSociety-key.pem` file will download
  - Save it to: `C:\AMP\Projects\MySoceity\NammaSociety-key.pem`
  - You CANNOT download this again!

### **Network Settings**
Click **"Edit"** button

#### **VPC**
- Leave as default VPC

#### **Subnet**
- Leave as "No preference"

#### **Auto-assign public IP**
- **Enable** (make sure it's enabled)

#### **Firewall (Security Groups)**
- Select: **"Create security group"**
- **Security group name**: `NammaSociety-sg`
- **Description**: `Security group for NammaSociety application`

**Inbound Security Group Rules** (Add 3 rules):

1. **SSH Rule**:
   - Type: `SSH`
   - Protocol: `TCP`
   - Port: `22`
   - Source type: `My IP` (recommended) or `Anywhere` (0.0.0.0/0)
   - Description: `SSH access`

2. **HTTP Rule**:
   - Click **"Add security group rule"**
   - Type: `HTTP`
   - Protocol: `TCP`
   - Port: `80`
   - Source type: `Anywhere` (0.0.0.0/0)
   - Description: `HTTP access`

3. **HTTPS Rule**:
   - Click **"Add security group rule"**
   - Type: `HTTPS`
   - Protocol: `TCP`
   - Port: `443`
   - Source type: `Anywhere` (0.0.0.0/0)
   - Description: `HTTPS access`

### **Configure Storage**
- **Size**: `30` GiB
- **Volume type**: `gp3` (or gp2 if gp3 not available)
- **Delete on termination**: Checked
- This is within Free Tier (30 GB)

### **Advanced Details**
- Leave all as default
- Do NOT configure user data (we'll do setup manually)

---

## Step 5: Review and Launch

1. On the right side, review the **Summary** panel:
   - **Number of instances**: 1
   - **AMI**: Ubuntu 22.04 LTS
   - **Instance type**: t3.micro
   - **Storage**: 30 GiB

2. Click **"Launch instance"** (orange button at bottom)

3. You should see: âœ… **"Successfully initiated launch of instance"**

4. Click **"View all instances"**

---

## Step 6: Wait for Instance to Start

1. You'll see your instance with status:
   - **Instance State**: `Pending` â†’ Wait 1-2 minutes â†’ `Running` âœ…
   - **Status Check**: `Initializing` â†’ Wait 2-3 minutes â†’ `2/2 checks passed` âœ…

2. While waiting, select your instance (checkbox) and note:
   - **Instance ID**: `i-xxxxxxxxxxxx` (e.g., i-0a1b2c3d4e5f6g7h8)
   - **Public IPv4 address**: `x.x.x.x` (e.g., 13.234.56.78)
   - **Public IPv4 DNS**: Long hostname

---

## Step 7: Copy Critical Information

**Create a text file and save this info:**

```
EC2 Instance Details
====================
Instance ID: i-xxxxxxxxxxxx
Public IP: x.x.x.x
Key File: C:\AMP\Projects\MySoceity\NammaSociety-key.pem
Region: ap-south-1
```

---

## Step 8: Update DNS Records

**Now that you have your EC2 Public IP, update your domain DNS:**

1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Navigate to DNS settings for **nammasociety-amp.com**
3. Add/Update these **A Records**:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | `<YOUR-EC2-PUBLIC-IP>` | 300 |
| A | www | `<YOUR-EC2-PUBLIC-IP>` | 300 |

Example:
```
A    @        13.234.56.78    300
A    www      13.234.56.78    300
```

4. Save changes
5. **Wait 5-30 minutes for DNS propagation**

---

## Step 9: Verify DNS Propagation

You can check DNS from your Windows machine:

```powershell
# Method 1: nslookup
nslookup nammasociety-amp.com

# Method 2: ping
ping nammasociety-amp.com

# Should return your EC2 IP address
```

Or online tools:
- https://www.whatsmydns.net/#A/nammasociety-amp.com
- https://dnschecker.org/#A/nammasociety-amp.com

---

## Step 10: Prepare for SSH Connection

1. Open PowerShell in your project directory:
   ```powershell
   cd C:\AMP\Projects\MySoceity
   ```

2. Set correct permissions on key file:
   ```powershell
   # Remove inherited permissions and grant only current user access
   icacls .\NammaSociety-key.pem /inheritance:r
   icacls .\NammaSociety-key.pem /grant:r "$($env:USERNAME):(R)"
   ```

3. Test SSH connection:
   ```powershell
   ssh -i NammaSociety-key.pem ubuntu@<YOUR-EC2-PUBLIC-IP>
   
   # If prompted "Are you sure you want to continue connecting?", type: yes
   ```

4. You should see Ubuntu welcome message!

---

## âœ… EC2 Instance Creation Complete!

**What You Have Now:**
- âœ… Running EC2 t3.micro instance in ap-south-1
- âœ… Public IP address assigned
- âœ… Security group allowing SSH, HTTP, HTTPS
- âœ… SSH key pair for access
- âœ… DNS pointing to your EC2 instance

**What's Next:**
1. Wait for DNS propagation to complete
2. Run: `.\AWS-DEPLOY-HELPER.ps1` to start deployment
3. Or manually follow: `AWS_DEPLOYMENT_GUIDE.md`

---

## Troubleshooting

### Cannot connect via SSH

**Error**: "Connection timeout"
- Check security group allows SSH from your IP
- Verify instance is "Running" state
- Check public IP address is correct

**Error**: "Permission denied (publickey)"
- Check key file permissions
- Verify you're using: `ubuntu@<ip>` (not `ec2-user` or `root`)

### Instance shows "Instance limit exceeded"

- You've reached Free Tier limits
- Stop/terminate old instances
- Or request limit increase in AWS Console

### Cannot find t3.micro

- Use t2.micro instead (also Free Tier eligible)
- t3.micro may not be available in all regions

---

## Cost Estimate

**First 12 Months** (Free Tier):
- EC2 t3.micro: **$0** (750 hrs/month free)
- 30 GB Storage: **$0** (30 GB free)
- Data transfer: **$0** (15 GB out free)
- **Total**: **$0-5/month**

**After Month 12**:
- EC2 t3.micro: ~$10/month
- Storage: ~$2/month
- Data transfer: ~$1-3/month
- **Total**: ~$13-15/month

With auto-shutdown (12h/day): **~$8-10/month**

---

## Next Steps

Run the deployment helper script:

```powershell
.\AWS-DEPLOY-HELPER.ps1
```

Or continue manually with `AWS_DEPLOYMENT_GUIDE.md`

