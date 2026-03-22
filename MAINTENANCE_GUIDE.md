# NammaSociety - Maintenance & Operations Guide

## ðŸ”§ Daily Operations

### Health Checks

**Check Service Status**:
```bash
cd /opt/NammaSociety
docker-compose ps

# All services should show "Up" status
```

**Check Logs for Errors**:
```bash
# Check all services
docker-compose logs --tail=100

# Check specific service
docker-compose logs --tail=50 auth-service
docker-compose logs --tail=50 user-service
```

**Check Disk Space**:
```bash
# Check overall disk usage
df -h

# Check Docker usage
docker system df

# If low on space (<20% free)
docker system prune -a --volumes
```

**Check Memory**:
```bash
free -h

# If memory is consistently >90%, consider upgrading to t3.small
```

---

## ðŸ“… Weekly Tasks

### 1. Review Logs
```bash
cd /opt/NammaSociety

# Check for errors in last 7 days
docker-compose logs --since 7d | grep -i "error\|exception\|failed"

# Review auth-service logs
docker-compose logs --since 7d auth-service | grep -i "failed login"

# Review user-service logs
docker-compose logs --since 7d user-service | grep -i "error"
```

### 2. Database Cleanup
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d postgres

# Run cleanup queries
-- Delete old sessions (>30 days)
DELETE FROM sessions WHERE created_at < NOW() - INTERVAL '30 days';

-- Delete old notifications (>90 days)
DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '90 days';

-- Check database size
SELECT pg_size_pretty(pg_database_size('postgres'));

-- Exit
\q
```

### 3. Security Updates
```bash
# SSH into EC2
ssh -i NammaSociety-key.pem ubuntu@<EC2-IP>
sudo su

# Update system packages
apt update
apt upgrade -y

# Restart if kernel updated
reboot
```

---

## ðŸ“† Monthly Tasks

### 1. Cost Review
```bash
# Check AWS Free Tier usage
# AWS Console â†’ Billing â†’ Free Tier

# Check current month costs
# AWS Console â†’ Billing â†’ Bills

# Review top cost drivers
# Should be: EC2, Data Transfer, EBS
```

### 2. Database Backup
```bash
cd /opt/NammaSociety

# Create backup directory
mkdir -p backups

# Backup database
docker-compose exec -T postgres pg_dump -U postgres postgres > backups/backup-$(date +%Y%m%d).sql

# Compress backup
gzip backups/backup-$(date +%Y%m%d).sql

# Keep only last 3 months
find backups/ -name "*.sql.gz" -mtime +90 -delete

# Download backup to local machine (from your PC)
scp -i NammaSociety-key.pem ubuntu@<EC2-IP>:/opt/NammaSociety/backups/*.sql.gz ./
```

**Automated monthly backup**:
```bash
# Add to crontab
crontab -e

# Add this line (runs 1st of every month at 2 AM)
0 2 1 * * cd /opt/NammaSociety && docker-compose exec -T postgres pg_dump -U postgres postgres | gzip > backups/backup-$(date +\%Y\%m\%d).sql.gz
```

### 3. SSL Certificate Check
```bash
# Check certificate expiry
sudo certbot certificates

# Certificates auto-renew, but verify
# Should show "Valid until" date >30 days from now

# Test renewal (dry run)
sudo certbot renew --dry-run
```

### 4. Performance Review
```bash
# Check CloudWatch metrics (AWS Console)
# - CPU Utilization (should be <70% average)
# - Disk I/O (should be <80% capacity)
# - Network In/Out (check for spikes)

# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://NammaSociety-AMP.com

# Create curl-format.txt
cat > curl-format.txt << 'EOF'
time_total: %{time_total}s
time_connect: %{time_connect}s
time_starttransfer: %{time_starttransfer}s
EOF

# Response should be <1s for good UX
```

---

## ðŸš¨ Troubleshooting Common Issues

### Issue 1: Service Won't Start

**Symptoms**:
- `docker-compose ps` shows service as "Restarting" or "Exited"

**Diagnosis**:
```bash
# Check logs
docker-compose logs [service-name]

# Common causes:
# 1. Port already in use
# 2. Environment variable missing
# 3. Database not ready
# 4. Out of memory
```

**Solutions**:
```bash
# Restart the service
docker-compose restart [service-name]

# If that doesn't work, recreate
docker-compose up -d --force-recreate [service-name]

# Check environment variables
cat .env.production | grep -i [variable-name]
```

---

### Issue 2: Database Connection Failed

**Symptoms**:
- Backend services log "Connection refused" or "Connection timeout"

**Diagnosis**:
```bash
# Check PostgreSQL running
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U postgres -d postgres -c "SELECT 1;"
```

**Solutions**:
```bash
# Restart PostgreSQL
docker-compose restart postgres

# If data corruption suspected
docker-compose down
docker volume rm NammaSociety_postgres_data  # WARNING: DELETES DATA
docker-compose up -d

# Restore from backup
docker-compose exec -T postgres psql -U postgres postgres < backups/backup-latest.sql
```

---

### Issue 3: Out of Disk Space

**Symptoms**:
- `df -h` shows >90% usage
- Services crashing randomly

**Diagnosis**:
```bash
# Check what's using space
du -sh /opt/NammaSociety/*
docker system df
```

**Solutions**:
```bash
# Clean Docker images/containers
docker system prune -a --volumes

# Clean old logs
docker-compose logs --tail=1000 > /dev/null
find /var/lib/docker/containers/ -name "*.log" -exec truncate -s 0 {} \;

# If still low, upgrade EBS volume (AWS Console)
```

---

### Issue 4: Site Not Accessible

**Symptoms**:
- Can't reach https://NammaSociety-AMP.com
- Browser shows "Connection timed out"

**Diagnosis**:
```bash
# Test from EC2 itself
curl http://localhost

# Check nginx
docker-compose ps nginx

# Check DNS
nslookup NammaSociety-AMP.com

# Check security group (AWS Console)
# Ports 80, 443 should be open to 0.0.0.0/0
```

**Solutions**:
```bash
# Restart nginx
docker-compose restart nginx

# Check nginx logs
docker-compose logs nginx

# Verify firewall
sudo ufw status

# If DNS issue, wait 5-30 min for propagation
```

---

### Issue 5: High CPU Usage

**Symptoms**:
- CloudWatch shows CPU >80%
- Site is slow

**Diagnosis**:
```bash
# Check what's consuming CPU
docker stats

# Check for runaway processes
top
```

**Solutions**:
```bash
# Restart high-CPU service
docker-compose restart [service-name]

# Check for infinite loops in logs
docker-compose logs [service-name] | grep -i "loop\|recursive"

# If persistent, upgrade to t3.small
# AWS Console â†’ EC2 â†’ Instance â†’ Actions â†’ Instance Settings â†’ Change Instance Type
```

---

### Issue 6: Email/SMS Not Sending

**Symptoms**:
- Notifications not received
- Logs show "Authentication failed" or "Invalid credentials"

**Diagnosis**:
```bash
# Check environment variables
docker-compose exec auth-service env | grep -i "GMAIL\|TWILIO"

# Check logs
docker-compose logs auth-service | grep -i "mail\|sms\|notification"
```

**Solutions**:
```bash
# Verify Gmail App Password (16 characters, no spaces)
# Verify Twilio credentials

# Update .env.production
nano .env.production

# Restart services
docker-compose restart auth-service user-service
```

---

## ðŸ”„ Update Procedures

### Update Application Code

```bash
cd /opt/NammaSociety

# Pull latest changes
git pull origin main

# Rebuild and restart
./deploy.sh
```

### Update Dependencies (Backend)

```bash
cd backend/auth-service

# Update pom.xml dependencies
nano pom.xml

# Rebuild
mvn clean package -DskipTests

# Restart
cd /opt/NammaSociety
docker-compose restart auth-service
```

### Update Dependencies (Frontend)

```bash
cd frontend/login-mfe

# Update package.json
npm update

# Rebuild
cd /opt/NammaSociety
./deploy.sh
```

---

## ðŸ“Š Monitoring Setup

### CloudWatch Alarms (Recommended)

**CPU Alarm**:
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name NammaSociety-HighCPU \
  --alarm-description "Alert when CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions <SNS-TOPIC-ARN>
```

**Disk Alarm**:
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name NammaSociety-LowDisk \
  --alarm-description "Alert when disk > 90%" \
  --metric-name DiskSpaceUtilization \
  --namespace System/Linux \
  --statistic Average \
  --period 300 \
  --threshold 90 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions <SNS-TOPIC-ARN>
```

---

## ðŸ”’ Security Maintenance

### Review Security Group Rules
```bash
# AWS Console â†’ EC2 â†’ Security Groups â†’ NammaSociety-sg

# Should only have:
# - SSH (22): Your IP only
# - HTTP (80): 0.0.0.0/0
# - HTTPS (443): 0.0.0.0/0

# Remove any unused rules
```

### Check for Failed Login Attempts
```bash
# Review auth logs
docker-compose logs auth-service | grep -i "failed login"

# If many failures from same IP, block it
sudo ufw deny from <SUSPICIOUS-IP>
```

### Update Passwords Periodically
```bash
# Update database password every 90 days
nano .env.production  # Change DB_PASSWORD

# Update JWT secret every 6 months
nano .env.production  # Change JWT_SECRET

# Restart services
docker-compose restart
```

---

## ðŸ“ˆ Capacity Planning

### When to Upgrade

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| **CPU** | >70% | >85% | Upgrade to t3.small |
| **Memory** | >80% | >95% | Upgrade to t3.small |
| **Disk** | >80% | >95% | Increase EBS volume |
| **Response Time** | >1s | >3s | Optimize queries or upgrade |
| **Users** | >50 | >100 | Consider RDS + caching |

---

## âœ… Maintenance Checklist

### Daily â˜€ï¸
- [ ] Check `docker-compose ps` status
- [ ] Review error logs (5 min)

### Weekly ðŸ“…
- [ ] Review all service logs
- [ ] Clean up old database records
- [ ] Check disk space (`df -h`)
- [ ] Review failed logins

### Monthly ðŸ—“ï¸
- [ ] Create database backup
- [ ] Review AWS costs
- [ ] Check SSL certificate expiry
- [ ] Update system packages
- [ ] Review CloudWatch metrics
- [ ] Test disaster recovery

### Quarterly ðŸ“†
- [ ] Update application dependencies
- [ ] Review security group rules
- [ ] Rotate database password
- [ ] Performance audit
- [ ] Capacity planning review

---

## ðŸ†˜ Emergency Procedures

### Complete System Failure

1. **Check EC2 status** (AWS Console)
2. **Restart instance** (if stopped)
3. **SSH and check services**:
   ```bash
   cd /opt/NammaSociety
   docker-compose ps
   ./start-services.sh
   ```
4. **If data corruption**:
   ```bash
   # Restore from latest backup
   docker-compose down
   docker volume rm NammaSociety_postgres_data
   docker-compose up -d postgres
   sleep 10
   docker-compose exec -T postgres psql -U postgres postgres < backups/backup-latest.sql
   docker-compose up -d
   ```

### Database Restore

```bash
# Stop services
docker-compose down

# Remove corrupted data
docker volume rm NammaSociety_postgres_data

# Start PostgreSQL only
docker-compose up -d postgres
sleep 10

# Restore backup
gunzip < backups/backup-20260301.sql.gz | docker-compose exec -T postgres psql -U postgres postgres

# Start all services
docker-compose up -d
```

---

## ðŸ“ž Support Contacts

**AWS Support**:
- Free Tier: https://console.aws.amazon.com/support
- Forums: https://forums.aws.amazon.com

**Application Issues**:
- Check logs first: `docker-compose logs -f`
- Review troubleshooting section above

**Costs/Billing**:
- AWS Console â†’ Billing â†’ Cost Explorer
- Enable cost alerts

---

**Need help?** Review the troubleshooting section or check the [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md) for deployment issues.

