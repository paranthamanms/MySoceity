#!/bin/bash
# ================================================================
# EC2 Instance Health Diagnostic Script
# Run this when instance IS UP to diagnose why it keeps failing
# ================================================================

echo "â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—"
echo "â•‘                                                              â•‘"
echo "â•‘         EC2 Health Diagnostics ðŸ¥                           â•‘"
echo "â•‘         Collecting data... please wait...                    â•‘"
echo "â•‘                                                              â•‘"
echo "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•"
echo ""

OUTPUT_FILE="/tmp/health-diagnostic-$(date +%Y%m%d-%H%M%S).txt"

echo "Saving results to: $OUTPUT_FILE"
echo ""

# ============================================
# 1. DISK SPACE (CRITICAL!)
# ============================================
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
echo "1. DISK SPACE ANALYSIS" | tee -a $OUTPUT_FILE
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
df -h | tee -a $OUTPUT_FILE
echo "" | tee -a $OUTPUT_FILE

# Check if disk is >85% full
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "âŒ CRITICAL: Disk is $DISK_USAGE% full!" | tee -a $OUTPUT_FILE
    echo "This is likely causing your crashes!" | tee -a $OUTPUT_FILE
else
    echo "âœ“ Disk space looks OK ($DISK_USAGE% used)" | tee -a $OUTPUT_FILE
fi
echo "" | tee -a $OUTPUT_FILE

# ============================================
# 2. MEMORY USAGE (CRITICAL!)
# ============================================
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
echo "2. MEMORY ANALYSIS" | tee -a $OUTPUT_FILE
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
free -h | tee -a $OUTPUT_FILE
echo "" | tee -a $OUTPUT_FILE

# Check available memory
AVAILABLE_MB=$(free -m | awk 'NR==2 {print $7}')
if [ "$AVAILABLE_MB" -lt 300 ]; then
    echo "âŒ CRITICAL: Only ${AVAILABLE_MB}MB available!" | tee -a $OUTPUT_FILE
    echo "System is low on memory - this causes crashes!" | tee -a $OUTPUT_FILE
else
    echo "âœ“ Memory available: ${AVAILABLE_MB}MB" | tee -a $OUTPUT_FILE
fi
echo "" | tee -a $OUTPUT_FILE

# ============================================
# 3. CPU & TOP PROCESSES
# ============================================
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
echo "3. TOP RESOURCE-CONSUMING PROCESSES" | tee -a $OUTPUT_FILE
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
top -bn1 | head -20 | tee -a $OUTPUT_FILE
echo "" | tee -a $OUTPUT_FILE

# ============================================
# 4. DOCKER CONTAINERS STATUS
# ============================================
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
echo "4. DOCKER CONTAINERS STATUS" | tee -a $OUTPUT_FILE
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
docker ps -a | tee -a $OUTPUT_FILE
echo "" | tee -a $OUTPUT_FILE

# Check for constantly restarting containers
RESTARTING=$(docker ps -a --filter "status=restarting" -q | wc -l)
if [ "$RESTARTING" -gt 0 ]; then
    echo "âŒ WARNING: $RESTARTING container(s) are constantly restarting!" | tee -a $OUTPUT_FILE
    docker ps -a --filter "status=restarting" | tee -a $OUTPUT_FILE
else
    echo "âœ“ No containers in restart loop" | tee -a $OUTPUT_FILE
fi
echo "" | tee -a $OUTPUT_FILE

# ============================================
# 5. DOCKER LOGS (ERRORS ONLY)
# ============================================
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
echo "5. DOCKER CONTAINER ERRORS (Last 50 lines)" | tee -a $OUTPUT_FILE
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE

for container in $(docker ps -aq); do
    CONTAINER_NAME=$(docker inspect --format='{{.Name}}' $container | sed 's/\///')
    echo "" | tee -a $OUTPUT_FILE
    echo "--- $CONTAINER_NAME ---" | tee -a $OUTPUT_FILE
    docker logs $container --tail=50 2>&1 | grep -iE "error|exception|fatal|fail|crash|kill|out of memory" | tail -20 | tee -a $OUTPUT_FILE || echo "No recent errors found" | tee -a $OUTPUT_FILE
done
echo "" | tee -a $OUTPUT_FILE

# ============================================
# 6. DISK USAGE BY DIRECTORY
# ============================================
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
echo "6. LARGEST DIRECTORIES (Top 10)" | tee -a $OUTPUT_FILE
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
du -sh /* 2>/dev/null | sort -h | tail -10 | tee -a $OUTPUT_FILE
echo "" | tee -a $OUTPUT_FILE

echo "Checking /var directory..." | tee -a $OUTPUT_FILE
du -sh /var/* 2>/dev/null | sort -h | tail -10 | tee -a $OUTPUT_FILE
echo "" | tee -a $OUTPUT_FILE

# ============================================
# 7. DOCKER DISK USAGE
# ============================================
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
echo "7. DOCKER DISK USAGE" | tee -a $OUTPUT_FILE
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
docker system df | tee -a $OUTPUT_FILE
echo "" | tee -a $OUTPUT_FILE

# ============================================
# 8. OUT OF MEMORY EVENTS
# ============================================
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
echo "8. OUT OF MEMORY EVENTS (OOM Killer)" | tee -a $OUTPUT_FILE
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
dmesg | grep -i "out of memory" | tail -20 | tee -a $OUTPUT_FILE
if [ $? -ne 0 ]; then
    echo "âœ“ No OOM events found in dmesg" | tee -a $OUTPUT_FILE
fi
echo "" | tee -a $OUTPUT_FILE

# ============================================
# 9. SYSTEM JOURNAL ERRORS
# ============================================
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
echo "9. RECENT SYSTEM ERRORS (Last 50 entries)" | tee -a $OUTPUT_FILE
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
sudo journalctl -p err -xe -n 50 --no-pager | tee -a $OUTPUT_FILE
echo "" | tee -a $OUTPUT_FILE

# ============================================
# 10. FAILED SERVICES
# ============================================
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
echo "10. FAILED SYSTEMD SERVICES" | tee -a $OUTPUT_FILE
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
systemctl --failed --no-pager | tee -a $OUTPUT_FILE
echo "" | tee -a $OUTPUT_FILE

# ============================================
# 11. UPTIME & LOAD AVERAGE
# ============================================
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
echo "11. SYSTEM UPTIME & LOAD" | tee -a $OUTPUT_FILE
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
uptime | tee -a $OUTPUT_FILE
echo "" | tee -a $OUTPUT_FILE
echo "Recent reboots:" | tee -a $OUTPUT_FILE
last reboot | head -5 | tee -a $OUTPUT_FILE
echo "" | tee -a $OUTPUT_FILE

# ============================================
# 12. INSTANCE METADATA
# ============================================
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
echo "12. INSTANCE INFORMATION" | tee -a $OUTPUT_FILE
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
echo "Instance Type: $(curl -s http://169.254.169.254/latest/meta-data/instance-type 2>/dev/null || echo 'Unable to fetch')" | tee -a $OUTPUT_FILE
echo "Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo 'Unable to fetch')" | tee -a $OUTPUT_FILE
echo "Private IP: $(curl -s http://169.254.169.254/latest/meta-data/local-ipv4 2>/dev/null || echo 'Unable to fetch')" | tee -a $OUTPUT_FILE
echo "Public IP: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'Unable to fetch')" | tee -a $OUTPUT_FILE
echo "" | tee -a $OUTPUT_FILE

# ============================================
# SUMMARY & RECOMMENDATIONS
# ============================================
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
echo "SUMMARY & RECOMMENDATIONS" | tee -a $OUTPUT_FILE
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
echo "" | tee -a $OUTPUT_FILE

DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
AVAILABLE_MB=$(free -m | awk 'NR==2 {print $7}')
INSTANCE_TYPE=$(curl -s http://169.254.169.254/latest/meta-data/instance-type 2>/dev/null || echo 'unknown')

echo "Current Instance Type: $INSTANCE_TYPE" | tee -a $OUTPUT_FILE
echo "Disk Usage: $DISK_USAGE%" | tee -a $OUTPUT_FILE
echo "Available Memory: ${AVAILABLE_MB}MB" | tee -a $OUTPUT_FILE
echo "" | tee -a $OUTPUT_FILE

# Recommendations
NEEDS_UPGRADE=0

if [ "$DISK_USAGE" -gt 80 ]; then
    echo "âš ï¸  RECOMMENDATION: Disk is $DISK_USAGE% full!" | tee -a $OUTPUT_FILE
    echo "   Action: Clean up space or increase disk size" | tee -a $OUTPUT_FILE
    echo "   Commands:" | tee -a $OUTPUT_FILE
    echo "     docker system prune -a -f" | tee -a $OUTPUT_FILE
    echo "     sudo journalctl --vacuum-time=3d" | tee -a $OUTPUT_FILE
    echo "" | tee -a $OUTPUT_FILE
    NEEDS_UPGRADE=1
fi

if [ "$AVAILABLE_MB" -lt 500 ]; then
    echo "âš ï¸  RECOMMENDATION: Low memory (${AVAILABLE_MB}MB available)" | tee -a $OUTPUT_FILE
    echo "   Action: Upgrade instance type" | tee -a $OUTPUT_FILE
    echo "   Recommended: t3.medium (4GB RAM)" | tee -a $OUTPUT_FILE
    echo "" | tee -a $OUTPUT_FILE
    NEEDS_UPGRADE=1
fi

if [[ "$INSTANCE_TYPE" == t2.micro* ]] || [[ "$INSTANCE_TYPE" == t2.small* ]]; then
    echo "âš ï¸  RECOMMENDATION: Instance type too small!" | tee -a $OUTPUT_FILE
    echo "   Current: $INSTANCE_TYPE" | tee -a $OUTPUT_FILE
    echo "   Your stack needs at least 2GB RAM (preferably 4GB)" | tee -a $OUTPUT_FILE
    echo "   Recommended: t3.medium (4GB RAM, 2 vCPU)" | tee -a $OUTPUT_FILE
    echo "   Cost: ~$30/month" | tee -a $OUTPUT_FILE
    echo "" | tee -a $OUTPUT_FILE
    NEEDS_UPGRADE=1
fi

OOM_COUNT=$(dmesg | grep -i "out of memory" | wc -l)
if [ "$OOM_COUNT" -gt 0 ]; then
    echo "âŒ CRITICAL: Found $OOM_COUNT Out-of-Memory events!" | tee -a $OUTPUT_FILE
    echo "   This is WHY your instance keeps crashing!" | tee -a $OUTPUT_FILE
    echo "   Action: MUST upgrade instance type immediately" | tee -a $OUTPUT_FILE
    echo "   Minimum: t3.small (2GB)" | tee -a $OUTPUT_FILE
    echo "   Recommended: t3.medium (4GB)" | tee -a $OUTPUT_FILE
    echo "" | tee -a $OUTPUT_FILE
    NEEDS_UPGRADE=1
fi

if [ "$NEEDS_UPGRADE" -eq 0 ]; then
    echo "âœ“ Instance resources look adequate" | tee -a $OUTPUT_FILE
    echo "  Check Docker logs above for application errors" | tee -a $OUTPUT_FILE
    echo "" | tee -a $OUTPUT_FILE
fi

echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" | tee -a $OUTPUT_FILE
echo "" | tee -a $OUTPUT_FILE

echo "âœ… Diagnostic complete!" | tee -a $OUTPUT_FILE
echo "" | tee -a $OUTPUT_FILE
echo "Full report saved to: $OUTPUT_FILE" | tee -a $OUTPUT_FILE
echo "" | tee -a $OUTPUT_FILE
echo "To view the full report:" | tee -a $OUTPUT_FILE
echo "  cat $OUTPUT_FILE" | tee -a $OUTPUT_FILE
echo "" | tee -a $OUTPUT_FILE
echo "To download from EC2:" | tee -a $OUTPUT_FILE
echo "  # From your local machine:" | tee -a $OUTPUT_FILE
echo "  scp -i C:\\AMP\\Projects\\NammaSociety-key.pem ubuntu@YOUR_IP:$OUTPUT_FILE ." | tee -a $OUTPUT_FILE
echo "" | tee -a $OUTPUT_FILE

# Display the file
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•"
echo "Press ENTER to view the full report..."
read
cat $OUTPUT_FILE

echo ""
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•"
echo "Share this report to get help debugging the issue!"
echo "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•"

