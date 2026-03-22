#!/bin/bash
# ================================================================
# Setup SSL Certificate with Let's Encrypt
# Run this AFTER deploying the application
# ================================================================

set -e

echo "=================================================="
echo "NammaSociety - SSL Certificate Setup"
echo "=================================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "âŒ Please run as root (use sudo)"
    exit 1
fi

DOMAIN="NammaSociety-AMP.com"
EMAIL="NammaSociety.notifications@gmail.com"

echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo ""

echo "ðŸ”„ Stopping nginx to free port 80..."
docker-compose stop nginx

echo ""
echo "ðŸ”„ Obtaining SSL certificate..."
certbot certonly --standalone \
    --preferred-challenges http \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

echo ""
echo "ðŸ”„ Copying certificates to application directory..."
mkdir -p ./ssl
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ./ssl/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ./ssl/
chmod 644 ./ssl/*.pem

echo ""
echo "ðŸ”„ Setting up automatic renewal..."
# Add cron job for auto-renewal
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'docker-compose restart nginx'") | crontab -

echo ""
echo "ðŸ”„ Restarting nginx with SSL..."
docker-compose start nginx

echo ""
echo "=================================================="
echo "âœ… SSL CERTIFICATE INSTALLED!"
echo "=================================================="
echo ""
echo "Your site is now accessible via HTTPS:"
echo "  https://$DOMAIN"
echo ""
echo "Certificate will auto-renew every 90 days"
echo "=================================================="

