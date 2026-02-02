#!/bin/bash
# SSL Setup Script with Let's Encrypt for api.pdf2.in
# Usage: ./setup-ssl.sh [domain] [email]

set -e

DOMAIN="${1:-api.pdf2.in}"
EMAIL="${2:-admin@pdf2.in}"
PROJECT_DIR="${PROJECT_DIR:-$HOME/pdf-editor}"

echo "=========================================="
echo "  SSL Setup for: $DOMAIN"
echo "=========================================="

cd "$PROJECT_DIR"

# Create certbot directories
mkdir -p "$PROJECT_DIR/certbot/www"
mkdir -p "$PROJECT_DIR/certbot/conf"

# Check if certificates already exist
if [ -f "$PROJECT_DIR/certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    echo "SSL certificates already exist for $DOMAIN"
    CERTS_EXIST=true
else
    echo "No SSL certificates found. Will obtain new ones."
    CERTS_EXIST=false
fi

# Determine docker command
if groups | grep -q docker; then
    DOCKER_CMD="docker"
else
    DOCKER_CMD="sudo docker"
fi

# If certs don't exist, use HTTP-only config first
if [ "$CERTS_EXIST" = false ]; then
    echo ""
    echo "=== Step 1: Creating HTTP-only nginx config ==="

    cat > nginx/conf.d/api.conf << HTTPONLY
# HTTP server for initial certificate request
server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location /health {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }

    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 300s;
    }

    location / {
        return 200 '{"name": "PDF2.in API", "status": "running"}';
        add_header Content-Type application/json;
    }
}
HTTPONLY

    echo "Reloading nginx with HTTP-only config..."
    $DOCKER_CMD compose exec nginx nginx -s reload 2>/dev/null || $DOCKER_CMD compose restart nginx
    sleep 5

    echo ""
    echo "=== Step 2: Obtaining SSL certificate from Let's Encrypt ==="
    $DOCKER_CMD compose run --rm --entrypoint "" certbot certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --non-interactive \
        -d "$DOMAIN"

    echo "SSL certificate obtained successfully!"
fi

echo ""
echo "=== Step 3: Enabling HTTPS configuration ==="

# Write the full HTTPS config
cat > nginx/conf.d/api.conf << EOF
# Block direct IP access
server {
    listen 80 default_server;
    server_name _;
    return 444;
}

server {
    listen 443 default_server ssl;
    server_name _;
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    return 444;
}

# HTTP - redirect to HTTPS
server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl;
    http2 on;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    location /health {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # API routes - CORS handled by FastAPI backend
    location /api {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        proxy_send_timeout 300s;
    }

    location / {
        return 200 '{"name": "PDF2.in API", "status": "running", "docs": "https://pdf2.in"}';
        add_header Content-Type application/json;
    }
}
EOF

echo "Reloading nginx with HTTPS..."
$DOCKER_CMD compose exec nginx nginx -s reload 2>/dev/null || $DOCKER_CMD compose restart nginx

echo ""
echo "=========================================="
echo "  SSL Setup Complete!"
echo "=========================================="
echo ""
echo "Your API is now available at:"
echo "  https://$DOMAIN"
echo ""
echo "SSL certificate will auto-renew via certbot container."
