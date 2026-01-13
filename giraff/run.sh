#!/bin/sh
set -e

echo "=========================================="
echo "Starting Giraff Dashboard"
echo "=========================================="

# Inject addon credentials into index.html if running as addon
if [ -n "$SUPERVISOR_TOKEN" ]; then
  echo "Running as Home Assistant addon, injecting credentials..."
  INJECT_SCRIPT="<script>window.__HA_ADDON__=true;window.__HA_URL__='http://supervisor/core';window.__HA_TOKEN__='$SUPERVISOR_TOKEN';</script>"
  sed -i "s|</head>|$INJECT_SCRIPT</head>|" /var/www/html/index.html
fi

# Start nginx (foreground mode)
echo "Starting nginx on port 3001..."
exec nginx -g 'daemon off;'
