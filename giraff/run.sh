#!/bin/sh

# Export environment variables for the app
export HA_ADDON=true
export NODE_ENV=production

# Start the Next.js server
cd /app
exec npm start
