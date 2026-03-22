# NammaSociety - Cost Optimization Guide

## ðŸ’° 12-Month Cost Strategy

### Overview
This guide shows how to keep AWS costs minimal during your startup's early months.

---

## ðŸ“Š Cost Projection (12 Months)

| Period | Strategy | Monthly Cost | Total |
|--------|----------|--------------|-------|
| **Months 1-6** | Free Tier + $200 Credits | **$0-5** | **$0-30** |
| **Months 7-12** | Free Tier Only | **$5-10** | **$30-60** |
| **After Month 12** | 12h Shutdown | **$15-25** | Ongoing |

**Total first year**: **$30-90** (vs $2,300+ without optimization)

---

## ðŸŽ¯ Strategy Breakdown

### Months 1-6: Free Tier + AWS Activate Credits

**AWS Free Tier (Always Free for 12 months)**:
- âœ… EC2 t3.micro: 750 hours/month FREE
- âœ… EBS: 30GB FREE
- âœ… Data Transfer: 15GB/month out FREE
- âœ… Load Balancer: First 750 hours FREE

**AWS Activate Credits** ($200 for 6 months):
- Apply at: https://aws.amazon.com/activate/
- Requirements: GitHub account with repo
- Approval: 1-2 weeks
- Covers any overages beyond Free Tier

**Expected Costs**:
```
EC2 t3.micro (750 hrs)     = $0   (Free Tier)
EBS 30GB                   = $0   (Free Tier)
Data Transfer (5-10GB)     = $0   (Under 15GB)
Route53 (optional)         = $0.50
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
TOTAL                      = $0.50/month
```

**If you exceed Free Tier**:
- Credits automatically applied
- No unexpected charges

---

### Months 7-12: Free Tier Only

**Free Tier Still Active**:
- âœ… EC2: 750 hours/month FREE (still eligible)
- âœ… EBS: 30GB FREE
- âš ï¸ Credits expired

**Expected Costs**:
```
EC2 t3.micro              = $0   (Free Tier still applies!)
EBS 30GB                  = $0   (Free Tier)
Data Transfer (20-30GB)   = $2-5 (After 15GB free)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
TOTAL                     = $2-5/month
```

**Key Insight**: Free Tier is 750 hours/month = 31 days Ã— 24 hours!  
Even running 24/7, you stay within Free Tier.

---

### After Month 12: Post-Free Tier Optimization

**Free Tier Expires**, but you have options:

#### Option 1: Run 24/7 (Full-time)
```
EC2 t3.micro (730 hrs)    = $15  ($0.021/hr)
EBS 30GB                  = $3   ($0.10/GB)
Data Transfer (30-40GB)   = $5-7 ($0.09/GB after 1GB)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
TOTAL                     = $23-25/month
```

#### Option 2: Run 12h/day (Recommended)
```
EC2 t3.micro (360 hrs)    = $8   (50% savings)
EBS 30GB                  = $3   (storage persists)
Data Transfer (15-20GB)   = $2-3 (less usage)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
TOTAL                     = $13-15/month
```

**Savings**: $10/month = $120/year

---

## ðŸ”§ Cost Optimization Techniques

### 1. Enable Auto-Shutdown (12h/day)

**Setup** (included in deployment):
```bash
cd /opt/NammaSociety
aws cloudformation create-stack \
  --stack-name NammaSociety-AutoShutdown \
  --template-body file://cloudformation-auto-shutdown.json
```

**Schedule**:
- **Start**: 8:00 AM IST
- **Stop**: 8:00 PM IST
- **Savings**: 50% compute cost

**When to use**:
- âœ… Pre-launch testing
- âœ… Limited user base
- âœ… Business hours only
- âŒ 24/7 user access required

---

### 2. Use Spot Instances (Advanced)

**Savings**: Up to 90% on EC2 costs

**How it works**:
- AWS sells unused capacity at discount
- Can be terminated with 2-minute notice
- Best for non-critical workloads

**Setup**:
1. Create Spot Instance request
2. Set max price: $0.01/hour (vs $0.021 on-demand)
3. Configure auto-restart on termination

**Risk**: Service interruption (rare but possible)

**Recommendation**: Only after validating product-market fit

---

### 3. PostgreSQL on EC2 (Not RDS)

**Savings**: $15-20/month

```
RDS db.t3.micro          = $15/month
PostgreSQL on EC2        = $0 (included in t3.micro)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
SAVINGS                  = $15/month
```

**Trade-offs**:
- âœ… Cost: Free (uses existing EC2)
- âœ… Control: Full database access
- âŒ Backups: Manual setup required
- âŒ Maintenance: You manage updates

**When to upgrade to RDS**:
- Growing beyond 100 users
- Need automated backups
- Want managed updates/patches
- Critical uptime requirements

---

### 4. Optimize Data Transfer

**Free Tier**: 15GB/month out  
**After Free Tier**: $0.09/GB

**Tips to reduce**:
1. **Enable gzip compression** (nginx) âœ… Already configured
2. **Cache static assets** (1 year expiry) âœ… Already configured
3. **Optimize images**:
   ```bash
   # Compress images before upload
   jpegoptim --max=85 *.jpg
   pngquant *.png
   ```
4. **CDN for static files** (optional):
   - CloudFront Free Tier: 50GB/month
   - Cost after: $0.085/GB (cheaper than EC2 transfer)

---

### 5. Right-Sizing (Vertical Scaling)

**Current**: t3.micro (1 vCPU, 1GB RAM)  
**When to upgrade**:

| Users | Instance | Cost/month (12h) | RAM | vCPU |
|-------|----------|------------------|-----|------|
| 0-50 | **t3.micro** | **$8** | 1GB | 1 |
| 50-200 | t3.small | $15 | 2GB | 2 |
| 200-500 | t3.medium | $30 | 4GB | 2 |
| 500+ | EKS cluster | $150+ | Scalable | Scalable |

**Monitor** with CloudWatch:
```bash
# CPU > 80% sustained = upgrade
# RAM > 90% sustained = upgrade
# Response time > 2s = upgrade
```

---

### 6. Database Optimization

**Reduce storage costs**:
```sql
-- Run monthly cleanup queries
-- Delete old sessions (older than 30 days)
DELETE FROM sessions WHERE created_at < NOW() - INTERVAL '30 days';

-- Delete old notifications (older than 90 days)
DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '90 days';

-- Vacuum database (reclaim space)
VACUUM FULL;
```

**Storage savings**: 20-30% reduction

---

### 7. Free SSL Certificates

**Let's Encrypt** (Free vs $50-100/year):
```bash
# Already configured in setup-ssl.sh
# Auto-renewal every 90 days
# No cost ever
```

**Alternative** (AWS ACM):
- Free SSL certificates
- Requires Load Balancer ($18/month)
- Not cost-effective for single instance

---

### 8. Monitoring & Alerts (Free)

**CloudWatch Free Tier**:
- 10 custom metrics
- 10 alarms
- 5GB log ingestion
- 1 million API requests

**Setup billing alerts**:
1. AWS Console â†’ Billing â†’ Budgets
2. Create budget: $10/month
3. Alert at: 80% ($8) and 100% ($10)
4. Email notification

**Cost**: $0 (first 2 budgets free)

---

## ðŸ“ˆ Scaling Decision Matrix

| Metric | Current Setup | Trigger Upgrade | Next Step |
|--------|---------------|-----------------|-----------|
| **Users** | 0-50 | >50 active | t3.small |
| **Requests/min** | <100 | >200 | Add caching (Redis) |
| **Database Size** | <5GB | >10GB | RDS db.t3.micro |
| **Uptime Need** | 12h/day | 24/7 | Disable auto-shutdown |
| **Monthly Cost** | $0-15 | >$50 | Review all services |

---

## ðŸŽ¯ Optimization Checklist

### Immediate (Do Now)
- [x] Use t3.micro (not t3.small)
- [x] PostgreSQL on EC2 (not RDS)
- [x] Let's Encrypt SSL (not paid)
- [x] Gzip compression enabled
- [x] Static asset caching
- [ ] Set up billing alerts
- [ ] Enable auto-shutdown (optional)

### Short-term (First 3 months)
- [ ] Apply for AWS Activate credits
- [ ] Monitor CloudWatch metrics
- [ ] Optimize image sizes
- [ ] Set up database cleanup job
- [ ] Review Free Tier usage monthly

### Long-term (After 6 months)
- [ ] Review need for RDS
- [ ] Consider CloudFront CDN
- [ ] Evaluate 12h vs 24h operation
- [ ] Plan for post-Free Tier costs
- [ ] Benchmark against budget

---

## ðŸ’¡ Pro Tips

### 1. Free Tier Calendar Reminder
```
Month 1: âœ… Free Tier starts
Month 6: âš ï¸ Credits expire (if activated)
Month 11: ðŸ“… Set reminder - Free Tier ends soon
Month 12: ðŸ’° Free Tier expires - costs increase
```

### 2. Track Free Tier Usage
- AWS Console â†’ Billing â†’ Free Tier
- Check monthly to avoid surprises
- Set up usage alerts

### 3. Reserved Instances (After Month 12)
If staying with AWS long-term:
- Buy 1-year Reserved Instance
- Save 30-40% vs on-demand
- Commit only when stable

### 4. AWS Credits for Startups
Multiple programs available:
- **AWS Activate**: $200-100,000 credits
- **Y Combinator**: $25,000 credits
- **Techstars**: $5,000 credits
- **GitHub Student**: $100 credits

---

## ðŸ“Š ROI Analysis

### Without Optimization
```
12 months Ã— $45/month (EC2 + RDS 24/7) = $540/year
```

### With This Guide
```
Months 1-6:   6 Ã— $2   = $12
Months 7-12:  6 Ã— $7   = $42
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Total first year       = $54

SAVINGS                = $486 (90% reduction!)
```

---

## âš ï¸ Common Pitfalls to Avoid

1. **Forgetting to stop instances**
   - Use auto-shutdown or calendar reminders
   - Cost: $15-20/month wasted

2. **Not deleting snapshots/volumes**
   - Delete unused EBS volumes
   - Cost: $3/month per unused 30GB

3. **Leaving dev/test instances running**
   - Always terminate test instances
   - Cost: $15-45/month wasted

4. **Not setting billing alerts**
   - Surprise bills are preventable
   - Set up alerts NOW

5. **Scaling too early**
   - Don't upgrade until metrics justify it
   - Premature scaling costs $50-100/month extra

---

## ðŸ“ˆ Expected Growth Path

### Phase 1: Launch (Months 1-6)
- **Users**: 0-20
- **Cost**: $0-5/month
- **Setup**: Single t3.micro, 12h/day
- **Revenue**: $0 (testing phase)

### Phase 2: Early Traction (Months 7-12)
- **Users**: 20-100
- **Cost**: $5-15/month
- **Setup**: t3.micro 24/7
- **Revenue**: $0-500/month

### Phase 3: Growth (Year 2)
- **Users**: 100-500
- **Cost**: $30-80/month
- **Setup**: t3.small + RDS + Backups
- **Revenue**: $500-2000/month

### Phase 4: Scale (Year 3+)
- **Users**: 500-5000
- **Cost**: $150-500/month
- **Setup**: EKS + Auto-scaling + CDN
- **Revenue**: $2000-20,000/month

---

## ðŸŽ¯ Final Recommendations

### For Months 1-6
âœ… **DO**:
- Use Free Tier + Credits
- Apply for AWS Activate
- Monitor usage weekly
- Set billing alerts at $5

âŒ **DON'T**:
- Buy Reserved Instances
- Use RDS
- Run 24/7 if not needed
- Add Load Balancer

### For Months 7-12
âœ… **DO**:
- Continue Free Tier optimization
- Monitor CloudWatch metrics
- Enable 12h shutdown if possible
- Plan for post-Free Tier

âŒ **DON'T**:
- Upgrade instance size prematurely
- Add unnecessary services
- Ignore cost anomalies

### After Month 12
âœ… **DO**:
- Review all resources
- Consider Reserved Instances
- Optimize based on metrics
- Budget $50-100/month buffer

âŒ **DON'T**:
- Let costs surprise you
- Over-provision resources
- Skip monitoring

---

**Remember**: Start small, scale smart, optimize always! ðŸš€

