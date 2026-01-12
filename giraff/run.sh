#!/bin/sh

# Export environment variables for the app
export HA_ADDON=true
export NODE_ENV=production

# Get the ingress entry path from Supervisor
INGRESS_ENTRY=$(curl -s -H "Authorization: Bearer ${SUPERVISOR_TOKEN}" http://supervisor/addons/self/info | sed -n 's/.*"ingress_entry":"\([^"]*\)".*/\1/p')
INGRESS_URL=$(curl -s -H "Authorization: Bearer ${SUPERVISOR_TOKEN}" http://supervisor/addons/self/info | sed -n 's/.*"ingress_url":"\([^"]*\)".*/\1/p')

echo "Ingress entry: ${INGRESS_ENTRY}"
echo "Ingress URL: ${INGRESS_URL}"

export INGRESS_URL="${INGRESS_URL}"

# Start the Next.js server
cd /app
exec npm start
