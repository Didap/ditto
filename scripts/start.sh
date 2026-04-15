#!/bin/sh
echo "Running database migrations..."
node /app/scripts/migrate.mjs
echo "Starting server..."
exec node server.js
