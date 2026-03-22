# ðŸ”„ AWS Application Load Balancer Setup (Future Scaling)

## ðŸ“‹ When Do You Need a Load Balancer?

### âŒ You DON'T need it now if:
- You have a single EC2 instance
- Your traffic is manageable (< 1000 concurrent users)
- You want to keep costs low
- Simple DNS pointing to EC2 IP works fine

### âœ… You NEED it later when:
- You want to run multiple EC2 instances (high availability)
- You want auto-scaling based on traffic
- You need health checks and automatic failover
- You're ready for production-grade infrastructure
- You have budget (~$16/month for ALB)

---

## ðŸ’° Cost Estimate

**Application Load Balancer (ALB):**
- Base cost: ~$16/month ($0.0225/hour)
- + $0.008 per LCU-hour (Load Balancer Capacity Unit)
- **Total:** ~$20-30/month depending on traffic

**vs Simple EC2 + DNS:**
- EC2 t3.micro: FREE (first 12 months) or ~$8/month
- Route 53: ~$0.50/month
- **Total:** ~$0-8/month

**Recommendation:** Start without load balancer, add it when you need to scale!

---

## ðŸ—ï¸ Architecture Comparison

### Current Simple Setup (What you should use now):
```
                                  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
User â†’ nammasociety-amp.com  â†’    â”‚   EC2       â”‚
       (DNS A Record)              â”‚  Instance   â”‚
       44.222.193.230              â”‚  (Your App) â”‚
                                   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```
**Pros:** Simple, cheap, works great for startups  
**Cons:** Single point of failure, manual scaling

---

### With Application Load Balancer (Future):
```
                                   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
User â†’ nammasociety-amp.com   â†’    â”‚ Route 53 DNS â”‚
       (DNS CNAME/Alias)           â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜
                                          â”‚
                                   â”Œâ”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                                   â”‚  Application      â”‚
                                   â”‚  Load Balancer    â”‚
                                   â”‚  (ALB)            â”‚
                                   â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                          â”‚
                              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                              â”‚                      â”‚
                       â”Œâ”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”      â”Œâ”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”
                       â”‚   EC2        â”‚      â”‚   EC2        â”‚
                       â”‚  Instance 1  â”‚      â”‚  Instance 2  â”‚
                       â”‚  (Your App)  â”‚      â”‚  (Your App)  â”‚
                       â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜      â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```
**Pros:** High availability, auto-scaling, health checks  
**Cons:** More complex, higher cost

---

## ðŸš€ ALB Setup Guide (For When You're Ready)

### Prerequisites
- âœ… EC2 instance(s) running your app
- âœ… Security groups configured
- âœ… Domain registered
- âœ… Budget for ~$20-30/month

---

## Step-by-Step: Create Application Load Balancer

### Step 1: Create Target Group

1. **Go to EC2 Console:** https://console.aws.amazon.com/ec2/
2. **In left sidebar:** Load Balancing â†’ Target Groups
3. **Click:** "Create target group"

**Configuration:**
```
Target type:         Instances
Target group name:   NammaSociety-target-group
Protocol:            HTTP
Port:                80
VPC:                 (select your VPC - same as EC2)
Protocol version:    HTTP1

Health checks:
  Protocol:          HTTP
  Path:              /health
  Port:              traffic port
  Healthy threshold: 2
  Unhealthy threshold: 2
  Timeout:           5 seconds
  Interval:          30 seconds
  Success codes:     200
```

4. **Click:** "Next"
5. **Register targets:**
   - Select your EC2 instance(s)
   - Port: 80
   - Click "Include as pending below"
6. **Click:** "Create target group"

---

### Step 2: Create Application Load Balancer

1. **In EC2 Console:** Load Balancing â†’ Load Balancers
2. **Click:** "Create Load Balancer"
3. **Select:** "Application Load Balancer"

**Basic Configuration:**
```
Load balancer name:  NammaSociety-alb
Scheme:              Internet-facing
IP address type:     IPv4
```

**Network mapping:**
```
VPC:                 (your VPC)
Mappings:            Select at least 2 availability zones
                     (e.g., us-east-1a, us-east-1b)
```

**Security groups:**
```
Create new security group or use existing:
  Name:              NammaSociety-alb-sg
  
  Inbound rules:
    Type: HTTP   | Port: 80  | Source: 0.0.0.0/0
    Type: HTTPS  | Port: 443 | Source: 0.0.0.0/0
```

**Listeners and routing:**
```
Listener 1:
  Protocol:          HTTP
  Port:              80
  Default action:    Forward to NammaSociety-target-group

(Add HTTPS listener after getting SSL certificate)
```

4. **Click:** "Create load balancer"
5. **Wait 2-3 minutes** for ALB to become "Active"
6. **Note the DNS name:** 
   - Example: `NammaSociety-alb-1234567890.us-east-1.elb.amazonaws.com`

---
000
### Step 3: Request SSL Certificate (AWS Certificate Manager)

1. **Go to:** AWS Certificate Manager (ACM)
   - https://console.aws.amazon.com/acm/
2. **Click:** "Request a certificate"
3. **Select:** "Request a public certificate"

**Certificate details:**
```
Fully qualified domain names:
  1. nammasociety-amp.com
  2. *.nammasociety-amp.com  (includes www)

Validation method:
  DNS validation (recommended)
  
Key algorithm:
  RSA 2048
```

4. **Click:** "Request"

**Validate Domain Ownership:**
- ACM will show CNAME records to add to your DNS
- Add these CNAME records in Route 53 or your registrar
- Wait 5-30 minutes for validation
- Status will change to "Issued"

---

### Step 4: Add HTTPS Listener to ALB

1. **Go to:** Load Balancers â†’ Your ALB
2. **Click:** "Listeners" tab
3. **Click:** "Add listener"

**Configuration:**
```
Protocol:            HTTPS
Port:                443
Default action:      Forward to NammaSociety-target-group

Security policy:     ELBSecurityPolicy-2016-08
Default SSL certificate:
  From ACM:          Select your certificate
                     (nammasociety-amp.com)
```

4. **Click:** "Add"

**Optional: Redirect HTTP to HTTPS**
1. Edit the **HTTP:80** listener
2. Change default action to:
   ```
   Type: Redirect to URL
   Protocol: HTTPS
   Port: 443
   Status code: 301 (Permanent redirect)
   ```

---

### Step 5: Update DNS to Point to Load Balancer

**If using Route 53:**
1. Go to Route 53 â†’ Hosted zones â†’ Your domain
2. Edit the A record for nammasociety-amp.com
3. Change to:
   ```
   Record name:    (blank for root)
   Record type:    A
   Route traffic:  Alias to Application Load Balancer
   Region:         (your region)
   Load balancer:  (select your ALB)
   ```

**If using other registrar:**
1. Get ALB DNS name: `NammaSociety-alb-1234567890.us-east-1.elb.amazonaws.com`
2. Create CNAME record:
   ```
   Type:           CNAME
   Host:           www
   Points to:      NammaSociety-alb-1234567890.us-east-1.elb.amazonaws.com
   ```
3. For root domain, you may need to use ANAME or ALIAS record (depends on registrar)

---

## ðŸŽ¯ Complete Infrastructure with ALB

### Files to Update

**docker-compose.yml** - No changes needed! ALB connects to your EC2 instance via port 80/443

**Security Groups:**

**EC2 Security Group (Update):**
```
Inbound rules:
  Type: SSH     | Port: 22   | Source: My IP
  Type: HTTP    | Port: 80   | Source: ALB Security Group
  Type: HTTPS   | Port: 443  | Source: ALB Security Group

(Remove direct HTTP/HTTPS from 0.0.0.0/0)
```

**ALB Security Group:**
```
Inbound rules:
  Type: HTTP    | Port: 80   | Source: 0.0.0.0/0
  Type: HTTPS   | Port: 443  | Source: 0.0.0.0/0

Outbound rules:
  Type: All     | All ports  | Destination: 0.0.0.0/0
```

---

## ðŸ§ª Testing Your ALB Setup

### 1. Check Target Health
```
EC2 Console â†’ Target Groups â†’ NammaSociety-target-group â†’ Targets tab
Status should show: "healthy"
```

### 2. Test ALB Directly
```powershell
# Test with ALB DNS name
curl http://NammaSociety-alb-1234567890.us-east-1.elb.amazonaws.com
curl https://NammaSociety-alb-1234567890.us-east-1.elb.amazonaws.com
```

### 3. Test with Your Domain
```powershell
curl http://nammasociety-amp.com
curl https://nammasociety-amp.com
```

---

## ðŸ“Š Monitoring & Auto-Scaling (Advanced)

### Enable ALB Access Logs
```
ALB â†’ Attributes â†’ Edit attributes
Enable access logs â†’ Save to S3 bucket
```

### Create Auto-Scaling Group (For multiple instances)
```
EC2 Console â†’ Auto Scaling â†’ Auto Scaling Groups
Create ASG with your AMI
Min: 2, Max: 4, Desired: 2
Attach to Target Group: NammaSociety-target-group
Scaling policies: Target tracking (CPU 70%)
```

---

## ðŸ’¡ Best Practices

### 1. Health Checks
Create a health endpoint in your app:
```java
// In user-service or auth-service
@GetMapping("/health")
public ResponseEntity<String> health() {
    return ResponseEntity.ok("OK");
}
```

### 2. Enable Sticky Sessions (if needed)
```
Target Group â†’ Attributes â†’ Stickiness
Enable: Application-based cookie stickiness
Duration: 1 day
```

### 3. Set Up CloudWatch Alarms
```
CloudWatch â†’ Alarms â†’ Create alarm
Metric: ALB UnHealthyHostCount
Threshold: > 0 for 2 minutes
Action: Send SNS notification
```

### 4. Enable WAF (Web Application Firewall)
```
WAF Console â†’ Create web ACL
Associate with ALB
Add rules: SQL injection, XSS protection
```

---

## ðŸ“ˆ When to Upgrade from Simple EC2 to ALB

### Upgrade When:
- âœ… You have > 500 concurrent users
- âœ… You need 99.9% uptime
- âœ… You want automatic failover
- âœ… You're ready to run multiple instances
- âœ… You have funding (not bootstrapping)

### Stay with Simple Setup If:
- âŒ Just starting out
- âŒ Low traffic (< 100 users/day)
- âŒ Budget is tight
- âŒ Single instance is sufficient

---

## ðŸŽ¯ Decision Helper

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Traffic/Day    â”‚ Monthly Budget  â”‚ Recommended Setup    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ < 100 users    â”‚ < $10/month     â”‚ EC2 + DNS (Simple)   â”‚
â”‚ 100-1000 users â”‚ $10-20/month    â”‚ EC2 + DNS (Simple)   â”‚
â”‚ 1000-5000      â”‚ $30-50/month    â”‚ ALB + 2 EC2          â”‚
â”‚ 5000+          â”‚ $100+/month     â”‚ ALB + ASG + RDS      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## âœ… Current Recommendation for You

**Start with: Simple EC2 + DNS Setup**

**Reasons:**
1. You're just deploying
2. Simpler to debug and maintain
3. Much lower cost (~$8/month vs $30/month)
4. Can easily upgrade later
5. Works perfectly for MVP/early stage

**Upgrade to ALB when:**
- You have consistent traffic > 1000 users/day
- You need high availability guarantees
- You're earning revenue to cover costs
- You want to auto-scale

---

## ðŸ“ž Next Steps

**For Now:**
1. Use the [DNS_SETUP_GUIDE.md](DNS_SETUP_GUIDE.md)
2. Point your domain to EC2 IP (simple A record)
3. Install SSL with Let's Encrypt
4. Get your app live!

**In 3-6 Months (When You're Growing):**
1. Come back to this guide
2. Create ALB and Target Group
3. Get ACM certificate
4. Update DNS to point to ALB
5. Scale up! ðŸš€

---

## ðŸŽ‰ Summary

You don't need a load balancer right now! Start simple:
```
Domain â†’ DNS A Record â†’ EC2 IP â†’ Your App
```

Add load balancer later when you're ready to scale!

