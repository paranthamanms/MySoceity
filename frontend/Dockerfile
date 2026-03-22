# ================================================================
# Multi-Stage Dockerfile for All Frontend Services
# ================================================================
# This builds all 3 Angular micro-frontends in one image
# ================================================================

# ===== STAGE 1: Build All Angular Apps =====
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files for all MFEs
COPY login-mfe/package*.json ./login-mfe/
COPY dashboard-mfe/package*.json ./dashboard-mfe/
COPY register-mfe/package*.json ./register-mfe/

# Install dependencies for each MFE
RUN cd login-mfe && npm ci --only=production
RUN cd dashboard-mfe && npm ci --only=production
RUN cd register-mfe && npm ci --only=production

# Copy source code for all MFEs
COPY login-mfe/ ./login-mfe/
COPY dashboard-mfe/ ./dashboard-mfe/
COPY register-mfe/ ./register-mfe/

# Build all Angular apps for production
RUN cd login-mfe && npm run build -- --configuration production
RUN cd dashboard-mfe && npm run build -- --configuration production
RUN cd register-mfe && npm run build -- --configuration production

# ===== STAGE 2: Serve with Nginx =====
FROM nginx:alpine

# Remove default nginx config
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/*

# Copy built apps to nginx
COPY --from=builder /app/login-mfe/dist/login-mfe /usr/share/nginx/html/login
COPY --from=builder /app/dashboard-mfe/dist/dashboard-mfe /usr/share/nginx/html/dashboard
COPY --from=builder /app/register-mfe/dist/register-mfe /usr/share/nginx/html/register

# Copy nginx configuration (will be created separately)
COPY frontend-nginx.conf /etc/nginx/conf.d/default.conf

# Expose ports
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
