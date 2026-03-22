# NammaSociety - Quick Reference Card

## ðŸš€ Essential Commands

### Service Management
```bash
# Check status
docker-compose ps

# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart auth-service

# View logs
docker-compose logs -f [service-name]
```

### Deployment
```bash
# Initial setup (run once)
sudo ./setup-ec2.sh

# Deploy application
./deploy.sh

# Setup SSL
sudo ./setup-ssl.sh
```

### Monitoring
```bash
# Check disk space
df -h

# Check memory
free -h

# Check Docker usage
docker system df

# Service health
curl http://localhost/health
```

### Database
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d postgres

# Backup database
docker-compose exec -T postgres pg_dump -U postgres postgres > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres postgres < backup.sql
```

### Cleanup
```bash
# Clean Docker
docker system prune -a --volumes

# Clean logs
find /var/lib/docker/containers/ -name "*.log" -exec truncate -s 0 {} \;
```

---

## ðŸ“Š Service URLs

| Service | URL | Port |
|---------|-----|------|
| **Main Site** | https://NammaSociety-AMP.com | 443 |
| **Auth API** | /api/auth/ | 8001 |
| **User API** | /api/users/ | 8002 |
| **Health Check** | /health | - |

---

## ðŸ”§ Configuration Files

| File | Purpose |
|------|---------|
| `.env.production` | Environment variables |
| `docker-compose.yml` | Service orchestration |
| `nginx.conf` | Reverse proxy routing |

---

## ðŸ†˜ Emergency Commands

```bash
# Restart everything
cd /opt/NammaSociety
docker-compose restart

# Full reset (WARNING: loses data)
docker-compose down -v
./deploy.sh

# Check what's wrong
docker-compose logs --tail=100
```

---

## ðŸ’° Cost Check

```bash
# AWS Console â†’ Billing â†’ Free Tier
# Check usage monthly to stay within limits
```

---

## ðŸ“ž Important Links

- **AWS Console**: https://console.aws.amazon.com
- **Free Tier Usage**: https://console.aws.amazon.com/billing/home#/freetier
- **EC2 Dashboard**: https://console.aws.amazon.com/ec2
- **CloudWatch**: https://console.aws.amazon.com/cloudwatch

---

## âœ… Daily Checklist

- [ ] `docker-compose ps` - All services "Up"
- [ ] Check error logs (5 min)
- [ ] `df -h` - Disk space >20% free

## âœ… Weekly Checklist

- [ ] Review all service logs
- [ ] Clean old database records
- [ ] Check AWS Free Tier usage

## âœ… Monthly Checklist

- [ ] Create database backup
- [ ] Review costs
- [ ] Update system packages
- [ ] Check SSL certificate

---

**Keep this handy for quick reference!**

