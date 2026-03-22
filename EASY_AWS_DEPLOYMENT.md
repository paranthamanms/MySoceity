# ðŸš€ AWS Deployment Made Easy!

I know AWS deployment can be overwhelming. I've created an **automated assistant** that will do all the hard work for you!

## âš¡ Quick Start (One Command)

Just run this and follow the prompts:

```powershell
.\AWS_DEPLOY_ASSISTANT.ps1
```

**That's it!** The script will:
- âœ… Test your SSH connection
- âœ… Help you fix security group if needed
- âœ… Build your backend services
- âœ… Upload everything to EC2
- âœ… Install Docker & prerequisites
- âœ… Deploy your entire application
- âœ… Verify everything is working

**Time:** 20-30 minutes (mostly automated)

---

## ðŸ“‹ What You Need Before Starting

1. **EC2 Instance IP**
   - Your EC2 public IP address (e.g., 44.210.99.61)
   - Find it: AWS Console â†’ EC2 â†’ Instances â†’ Your instance

2. **SSH Key File**  
   - Your .pem key file (e.g., NammaSociety-key.pem)
   - Should be at: `C:\AMP\Projects\NammaSociety-key.pem`

3. **5 Minutes**
   - To fix security group (if needed)
   - To answer a few questions
   - Then let it run automatically!

---

## ðŸŽ¯ Step-by-Step (What the Script Does)

### Step 1: Tests SSH Connection
- Tries to connect to your EC2
- If it fails, shows you exactly how to fix security group

### Step 2: Fix Security Group (If Needed)
The script will guide you through:
1. Opening AWS Console
2. Finding your security group  
3. Adding the right rules:
   - **SSH (Port 22)** from your IP
   - **HTTP (Port 80)** from anywhere
   - **HTTPS (Port 443)** from anywhere

### Step 3: Builds Your Code
- Compiles backend services locally
- Creates deployment package
- Everything automated!

### Step 4: Uploads to EC2
- Transfers all necessary files
- Sets up directory structure
- Shows progress

### Step 5: Installs Prerequisites
- Docker
- Docker Compose
- Java & Maven
- All automated!

### Step 6: Deploys Application
- Builds Docker images
- Starts all services
- PostgreSQL database
- Auth service
- User service
- Frontend (Angular)
- Nginx proxy

### Step 7: Verification
- Checks all services are running
- Tests if site is accessible
- Gives you the URL to visit!

---

## ðŸ†˜ If Something Goes Wrong

### "Cannot connect via SSH"  
**Fix:** Update EC2 Security Group
1. Go to: https://console.aws.amazon.com/ec2
2. Click "Security Groups"
3. Select your instance's security group
4. Click "Edit inbound rules"
5. Add rule: SSH | Port 22 | Source: My IP
6. Save rules

### "Service won't start"
**Fix:** Check logs
```powershell
ssh -i C:\AMP\Projects\NammaSociety-key.pem ubuntu@YOUR_EC2_IP
cd /opt/NammaSociety
docker-compose logs [service-name]
```

### "Can't access the website"
**Fix:** Check security group allows HTTP
- Port 80 should be open to 0.0.0.0/0

---

## ðŸŽ“ Manual Deployment (If You Prefer)

If you want to do it step-by-step manually:

### 1. Connect to EC2
```powershell
ssh -i C:\AMP\Projects\NammaSociety-key.pem ubuntu@YOUR_EC2_IP
```

### 2. Install Prerequisites
```bash
# Update system
sudo apt-get update -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Java & Maven
sudo apt-get install -y maven default-jdk

# Log out and back in for docker group
exit
```

### 3. Upload Files
```powershell
# On your Windows machine
scp -i C:\AMP\Projects\NammaSociety-key.pem -r C:\AMP\Projects\MySoceity ubuntu@YOUR_EC2_IP:/tmp/
```

### 4. Deploy on EC2
```bash
# Back on EC2
sudo mkdir -p /opt/NammaSociety
sudo mv /tmp/MySoceity/* /opt/NammaSociety/
sudo chown -R ubuntu:ubuntu /opt/NammaSociety
cd /opt/NammaSociety

# Build backend
cd backend/auth-service && mvn clean package -DskipTests && cd ../..
cd backend/user-service && mvn clean package -DskipTests && cd ../..

# Deploy with Docker
docker-compose --env-file .env.production build
docker-compose --env-file .env.production up -d

# Check status
docker-compose ps
```

---

## âœ… After Deployment

Your app will be running at:
- **Main Site:** http://YOUR_EC2_IP
- **Auth Service:** http://YOUR_EC2_IP:8001
- **User Service:** http://YOUR_EC2_IP:8002

**Test Login:**
- Username: `admin`
- Password: `admin123`

---

## ðŸŒ Setup Domain (Optional)

After everything works on IP:

1. **Update DNS Records**
   - Go to your domain registrar
   - Add A record: `@` â†’ Your EC2 IP
   - Add A record: `www` â†’ Your EC2 IP

2. **Wait for DNS** (30 minutes)

3. **Install SSL Certificate**
   ```bash
   ssh -i your-key.pem ubuntu@YOUR_EC2_IP
   cd /opt/NammaSociety
   sudo apt-get install -y certbot
   sudo certbot certonly --standalone -d nammasociety-amp.com -d www.nammasociety-amp.com
   ```

---

## ðŸ“ž Need Help?

If you get stuck at any step, I'm here to help! Just let me know:
- What step you're on
- Any error messages you see
- What you've tried so far

**Remember:** The automated script ([AWS_DEPLOY_ASSISTANT.ps1](AWS_DEPLOY_ASSISTANT.ps1)) handles 95% of this for you!

---

## ðŸŽ‰ You've Got This!

Deployment can feel overwhelming, but with the automated assistant, it's actually quite straightforward. Just run the script and let it guide you!

**Ready? Let's deploy! ðŸš€**

```powershell
.\AWS_DEPLOY_ASSISTANT.ps1
```

