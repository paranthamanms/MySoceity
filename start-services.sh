#!/bin/bash
# ================================================================
# Start NammaSociety Services
# ================================================================

echo "=================================================="
echo "Starting NammaSociety Services"
echo "=================================================="
echo ""

# Check if services are already running
if docker-compose ps | grep -q "Up"; then
    echo "âš ï¸  Services are already running"
    docker-compose ps
    exit 0
fi

echo "ðŸ”„ Starting all services..."
docker-compose --env-file .env.production up -d

echo ""
echo "â³ Waiting for services to start..."
sleep 15

echo ""
echo "=================================================="
echo "Service Status:"
echo "=================================================="
docker-compose ps

echo ""
echo "âœ… Services started successfully!"
echo ""
echo "Access your application at:"
echo "  http://localhost (or your domain)"
echo ""
echo "To check logs: docker-compose logs -f"
echo "=================================================="

