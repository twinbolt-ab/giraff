#!/bin/sh

# Export environment variables for the app
export HA_ADDON=true
export NODE_ENV=production

cd /app

# Get the ingress URL from Supervisor
ADDON_INFO=$(curl -s -H "Authorization: Bearer ${SUPERVISOR_TOKEN}" http://supervisor/addons/self/info)
INGRESS_URL=$(echo "$ADDON_INFO" | sed -n 's/.*"ingress_url":"\([^"]*\)".*/\1/p')

echo "Ingress URL: ${INGRESS_URL}"

# Check if we need to rebuild with the correct basePath
if [ -n "$INGRESS_URL" ] && [ "$INGRESS_URL" != "/" ]; then
  CURRENT_BASE=$(grep -o 'basePath:"[^"]*"' .next/required-server-files.json 2>/dev/null | head -1 || echo "")

  if [ "$CURRENT_BASE" != "basePath:\"$INGRESS_URL\"" ]; then
    echo "Rebuilding with basePath: ${INGRESS_URL}"
    export NEXT_PUBLIC_BASE_PATH="${INGRESS_URL}"
    npm run build
  fi
fi

# Start the Next.js server
exec npm start
