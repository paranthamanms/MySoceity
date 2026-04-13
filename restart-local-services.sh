#!/bin/zsh
# ============================================================
# NammaSociety - Complete Local Restart Script (Non-Docker)
# ============================================================
# This script restarts all backend and frontend services locally
# without requiring Docker installation.
# ============================================================

set -e  # Exit on error

PROJECT_DIR="/Users/amp/Projects/MySoceity"
cd "$PROJECT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================================="
echo "NammaSociety - Local Services Restart"
echo "==================================================${NC}\n"

# ============================================================
# 1. CLEANUP - Stop any existing processes
# ============================================================
echo -e "${YELLOW}📋 Step 1: Stopping existing processes...${NC}"

PORTS=(4200 4201 4202 4203 4400 8001 8002)
for port in "${PORTS[@]}"; do
  if lsof -ti tcp:$port > /dev/null 2>&1; then
    echo "  ⚠️  Killing process on port $port..."
    lsof -ti tcp:$port | xargs -r kill -9 2>/dev/null || true
  fi
done

echo -e "${GREEN}✓ Existing processes stopped${NC}\n"

# ============================================================
# 2. DATABASE - Apply schema migration if Postgres is running
# ============================================================
echo -e "${YELLOW}📋 Step 2: Applying database migrations...${NC}"

if command -v psql &> /dev/null; then
  DB_NAME="${DB_NAME:-postgres}"
  DB_USER="${DB_USER:-postgres}"
  DB_PASSWORD="${DB_PASSWORD:-Chennai@2006}"
  DB_HOST="127.0.0.1"
  
  export PGPASSWORD="$DB_PASSWORD"
  
  if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f database-migration.sql 2>/dev/null; then
    echo -e "${GREEN}✓ Database migrations applied successfully${NC}\n"
  else
    echo -e "${RED}⚠️  Database migration skipped (Postgres may not be running)${NC}\n"
  fi
else
  echo -e "${RED}⚠️  psql not found - skipping database migrations${NC}\n"
fi

# ============================================================
# 3. BACKEND BUILD - Compile Java services
# ============================================================
echo -e "${YELLOW}📋 Step 3: Building backend services...${NC}"

echo "  📦 Building Auth Service..."
cd backend/auth-service
mvn -DskipTests clean package -q
cd ../..
echo "  ✓ Auth Service built"

echo "  📦 Building User Service..."
cd backend/user-service
mvn -DskipTests clean package -q
cd ../..
echo -e "  ✓ User Service built\n"

# ============================================================
# 4. FRONTEND BUILD - Compile Angular applications
# ============================================================
echo -e "${YELLOW}📋 Step 4: Building frontend microfrontends...${NC}"

echo "  📦 Building Host App..."
cd frontend/host-app && npm run build -q && cd ../..
echo "  ✓ Host App built"

echo "  📦 Building Login MFE..."
cd frontend/login-mfe && npm run build -q && cd ../..
echo "  ✓ Login MFE built"

echo "  📦 Building Register MFE..."
cd frontend/register-mfe && npm run build -q && cd ../..
echo "  ✓ Register MFE built"

echo "  📦 Building Dashboard MFE..."
cd frontend/dashboard-mfe && npm run build -q && cd ../..
echo -e "  ✓ Dashboard MFE built\n"

# ============================================================
# 5. MOBILE BUILD - Prepare mobile app
# ============================================================
echo -e "${YELLOW}📋 Step 5: Building mobile application...${NC}"

cd frontend/mobile-app
npm run build:web -q
npx cap sync android -q 2>/dev/null || npx cap sync ios -q 2>/dev/null
cd ../..
echo -e "  ✓ Mobile app prepared\n"

# ============================================================
# 6. SERVICES STARTUP - Launch all services in background
# ============================================================
echo -e "${YELLOW}📋 Step 6: Starting services...${NC}\n"

# Helper function to start service in background
start_service() {
  local name=$1
  local dir=$2
  local cmd=$3
  local port=$4
  
  echo "  🚀 Starting $name..."
  cd "$dir"
  eval "$cmd" > /tmp/namsociety_${name// /_}.log 2>&1 &
  service_pid=$!
  echo "     (PID: $service_pid)"
  cd - > /dev/null
}

# Start Backend Services
start_service "Auth Service" "$PROJECT_DIR/backend/auth-service" "mvn spring-boot:run" 8001
sleep 2

start_service "User Service" "$PROJECT_DIR/backend/user-service" "mvn spring-boot:run" 8002
sleep 2

# Start Frontend Services
start_service "Dashboard MFE" "$PROJECT_DIR/frontend/dashboard-mfe" "npm start" 4203
sleep 2

start_service "Register MFE" "$PROJECT_DIR/frontend/register-mfe" "npm start" 4202
sleep 2

start_service "Login MFE" "$PROJECT_DIR/frontend/login-mfe" "npm start" 4201
sleep 2

start_service "Host App" "$PROJECT_DIR/frontend/host-app" "npm start" 4200
sleep 2

# Start Mobile Dev Server
start_service "Mobile App" "$PROJECT_DIR/frontend/mobile-app" "npm start" 4400

echo ""

# ============================================================
# 7. HEALTH CHECK - Verify services are running
# ============================================================
echo -e "${YELLOW}📋 Step 7: Verifying services...${NC}\n"

sleep 5

FAILED=0
SERVICES=(
  "Auth Service:8001"
  "User Service:8002"
  "Host App:4200"
  "Login MFE:4201"
  "Register MFE:4202"
  "Dashboard MFE:4203"
  "Mobile App:4400"
)

for service in "${SERVICES[@]}"; do
  name="${service%:*}"
  port="${service##*:}"
  
  if lsof -ti tcp:$port > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} $name (port $port)"
  else
    echo -e "  ${RED}✗${NC} $name (port $port) - FAILED"
    FAILED=$((FAILED + 1))
  fi
done

echo ""

# ============================================================
# 8. FINAL STATUS
# ============================================================
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}=================================================="
  echo "🎉 All services started successfully!"
  echo "==================================================${NC}"
  echo ""
  echo "📍 Service URLs:"
  echo "   Web Application:  http://localhost:4200"
  echo "   Login MFE:        http://localhost:4201"
  echo "   Register MFE:     http://localhost:4202"
  echo "   Dashboard MFE:    http://localhost:4203"
  echo "   Mobile Web:       http://localhost:4400"
  echo ""
  echo "   Auth API:         http://localhost:8001"
  echo "   User API:         http://localhost:8002"
  echo ""
  echo "📝 Log files:"
  echo "   ls -la /tmp/namsociety_*.log"
  echo ""
  echo "🔴 To stop all services:"
  echo "   killall node mvn java 2>/dev/null || true"
  echo ""
else
  echo -e "${RED}=================================================="
  echo "⚠️  Some services failed to start! ($FAILED)"
  echo "==================================================${NC}"
  echo ""
  echo "📝 Check logs:"
  echo "   tail -f /tmp/namsociety_*.log"
  echo ""
  exit 1
fi

# ============================================================
# 9. OPTIONAL: Launch Mobile Emulator
# ============================================================
echo -e "${YELLOW}📋 Step 8: Mobile emulator setup...${NC}\n"

if command -v xcrun &> /dev/null; then
  echo "  ✅ iOS Simulator available"
  echo "     Run: open -a Simulator"
elif command -v emulator &> /dev/null; then
  echo "  ✅ Android Emulator available"
  echo "     Run: emulator -avd NammaSociety_Emulator"
else
  echo "  ℹ️  No emulator detected"
  echo "     iOS: Requires Xcode (macOS only)"
  echo "     Android: Run ./setup-android-sdk.sh to install"
fi

echo ""
echo -e "${BLUE}=================================================="
echo "Ready to develop! 🚀"
echo "==================================================${NC}\n"
