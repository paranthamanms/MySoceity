#!/bin/bash
###############################################################################
# NammaSociety EC2 Deployment Script
# Instance: i-003ec77969b6d4da3 (98.83.39.31)
# Domain: nammasociety-amp.com
###############################################################################

echo "========================================="
echo "  NammaSociety Deployment Starting..."
echo "========================================="

# Step 1: Update system
echo -e "\n[1/8] Updating system packages..."
sudo yum update -y || sudo apt-get update -y

# Step 2: Install Docker
echo -e "\n[2/8] Installing Docker..."
if command -v yum &> /dev/null; then
    # Amazon Linux 2
    sudo yum install -y docker
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -a -G docker $USER
else
    # Ubuntu
    sudo apt-get install -y docker.io
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
fi

# Step 3: Install Docker Compose
echo -e "\n[3/8] Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Step 4: Install additional tools
echo -e "\n[4/8] Installing Git and Certbot..."
if command -v yum &> /dev/null; then
    sudo yum install -y git
    sudo amazon-linux-extras install -y epel
    sudo yum install -y certbot
else
    sudo apt-get install -y git certbot
fi

# Step 5: Create application directory
echo -e "\n[5/8] Setting up application directory..."
sudo mkdir -p /opt/NammaSociety
cd /opt/NammaSociety

# Step 6: Create environment file
echo -e "\n[6/8] Creating environment configuration..."
sudo tee .env.production > /dev/null <<EOF
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=postgres
DB_USERNAME=postgres
DB_PASSWORD=Chennai@2006

# JWT Configuration
JWT_SECRET=NammaSociety_Super_Secret_Key_2024_Production_AMP_Deployment
JWT_EXPIRATION=86400000

# Email Configuration (Gmail)
GMAIL_USERNAME=NammaSociety.notifications@gmail.com
GMAIL_APP_PASSWORD=xhxkgqvjnyzcpxgp
GMAIL_FROM=NammaSociety.notifications@gmail.com

# AWS Configuration
AWS_REGION=ap-south-1
AWS_ACCOUNT_ID=286093099448

# Application URLs
DOMAIN_NAME=nammasociety-amp.com
API_BASE_URL=https://nammasociety-amp.com/api
FRONTEND_URL=https://nammasociety-amp.com

# Server Configuration
SERVER_PORT=8080
NODE_ENV=production
EOF

# Step 7: Create docker-compose.yml
echo -e "\n[7/8] Creating Docker Compose configuration..."
sudo tee docker-compose.yml > /dev/null <<'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:13
    container_name: NammaSociety-postgres
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: Chennai@2006
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - NammaSociety-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  auth-service:
    image: openjdk:17-slim
    container_name: NammaSociety-auth
    working_dir: /app
    volumes:
      - ./backend/auth-service/target/auth-service-1.0.0.jar:/app/auth-service.jar
    command: java -jar auth-service.jar
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/postgres
      - SPRING_DATASOURCE_USERNAME=postgres
      - SPRING_DATASOURCE_PASSWORD=Chennai@2006
      - JWT_SECRET=NammaSociety_Super_Secret_Key_2024_Production_AMP_Deployment
      - GMAIL_USERNAME=NammaSociety.notifications@gmail.com
      - GMAIL_APP_PASSWORD=xhxkgqvjnyzcpxgp
    ports:
      - "8001:8001"
    depends_on:
      - postgres
    networks:
      - NammaSociety-network
    restart: unless-stopped

  user-service:
    image: openjdk:17-slim
    container_name: NammaSociety-user
    working_dir: /app
    volumes:
      - ./backend/user-service/target/user-service-1.0.0.jar:/app/user-service.jar
    command: java -jar user-service.jar
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/postgres
      - SPRING_DATASOURCE_USERNAME=postgres
      - SPRING_DATASOURCE_PASSWORD=Chennai@2006
      - AUTH_SERVICE_URL=http://auth-service:8001
      - GMAIL_USERNAME=NammaSociety.notifications@gmail.com
      - GMAIL_APP_PASSWORD=xhxkgqvjnyzcpxgp
    ports:
      - "8002:8002"
    depends_on:
      - postgres
      - auth-service
    networks:
      - NammaSociety-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: NammaSociety-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - auth-service
      - user-service
    networks:
      - NammaSociety-network
    restart: unless-stopped

volumes:
  postgres-data:

networks:
  NammaSociety-network:
    driver: bridge
EOF

# Step 8: Create nginx configuration
echo -e "\n[8/8] Creating Nginx configuration..."
sudo tee nginx.conf > /dev/null <<'EOF'
events {
    worker_connections 1024;
}

http {
    upstream auth_backend {
        server auth-service:8001;
    }

    upstream user_backend {
        server user-service:8002;
    }

    server {
        listen 80;
        server_name nammasociety-amp.com www.nammasociety-amp.com 98.83.39.31;

        location /api/auth/ {
            proxy_pass http://auth_backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/users/ {
            proxy_pass http://user_backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location / {
            return 200 'NammaSociety API Gateway - Services Running!\n';
            add_header Content-Type text/plain;
        }

        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

echo -e "\n========================================="
echo "  Configuration Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Upload JAR files to /opt/NammaSociety/backend/"
echo "2. Run: sudo docker-compose up -d"
echo "3. Check logs: sudo docker-compose logs -f"
echo ""
echo "Note: SSL will be configured after DNS is pointed to this IP"
echo "========================================="

