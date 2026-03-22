#!/bin/bash
# ================================================================
# Stop NammaSociety Services
# ================================================================

echo "=================================================="
echo "Stopping NammaSociety Services"
echo "=================================================="
echo ""

echo "ðŸ”„ Stopping all services..."
docker-compose down

echo ""
echo "âœ… All services stopped successfully!"
echo ""
echo "Data is preserved in Docker volumes"
echo "To start again: ./start-services.sh"
echo "=================================================="

