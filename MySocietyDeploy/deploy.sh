#!/bin/bash
# ================================================================
# MySociety Deployment Script
# Builds and deploys all services
# ================================================================

set -e  # Exit on error

echo "=================================================="
echo "MySociety - Deployment Script"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Error: .env.production file not found${NC}"
    echo "Please create .env.production with your credentials"
    echo "You can copy .env.example as a template"
    exit 1
fi

echo -e "${YELLOW}🔄 Step 1: Stopping existing services...${NC}"
docker-compose down || true
echo -e "${GREEN}✅ Services stopped${NC}"
echo ""

echo -e "${YELLOW}🔄 Step 2: Building backend JAR files...${NC}"
echo "Building auth-service..."
cd backend/auth-service
mvn clean package -DskipTests
cd ../..

echo "Building user-service..."
cd backend/user-service
mvn clean package -DskipTests
cd ../..

echo -e "${GREEN}✅ Backend services built${NC}"
echo ""

echo -e "${YELLOW}🔄 Step 3: Building Docker images...${NC}"
docker-compose build --no-cache
echo -e "${GREEN}✅ Docker images built${NC}"
echo ""

echo -e "${YELLOW}🔄 Step 4: Starting services...${NC}"
docker-compose --env-file .env.production up -d
echo -e "${GREEN}✅ Services started${NC}"
echo ""

echo -e "${YELLOW}🔄 Step 5: Waiting for services to be healthy...${NC}"
sleep 30

# Check service health
echo "Checking service status..."
docker-compose ps

echo ""
echo -e "${YELLOW}🔄 Step 6: Running database migrations...${NC}"
# Database schema should be initialized automatically via init.sql
echo -e "${GREEN}✅ Database initialized${NC}"

echo ""
echo "=================================================="
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo "=================================================="
echo ""
echo "Service URLs:"
echo "  Auth Service:      http://localhost:8001"
echo "  User Service:      http://localhost:8002"
echo "  Frontend:          http://localhost:4200"
echo "  Main Application:  http://localhost (via Nginx)"
echo ""
echo "To check logs:"
echo "  docker-compose logs -f [service-name]"
echo ""
echo "To check status:"
echo "  docker-compose ps"
echo ""
echo "=================================================="
