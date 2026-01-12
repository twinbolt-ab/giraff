#!/bin/sh
set -e

# Export environment variables for the app
export HA_ADDON=true
export NODE_ENV=production

cd /app

echo "=========================================="
echo "Starting Giraff Dashboard"
echo "=========================================="

# Start nginx in background (reverse proxy on port 3001)
echo "Starting nginx reverse proxy..."
nginx

# Start Next.js on port 3000 (nginx proxies to it)
echo "Starting Next.js server on port 3000..."
exec npm run start:internal
