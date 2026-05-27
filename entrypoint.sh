#!/bin/bash
set -e

echo "Starting Redis server in background..."
redis-server /etc/redis/redis.conf &

# Aguarda o Redis iniciar
sleep 2

echo "Starting Next.js Server..."
cd /app/admin-panel
npm run start
