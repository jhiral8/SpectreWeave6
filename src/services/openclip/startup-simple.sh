#!/bin/bash
# Simplified startup script for OpenCLIP service

echo "Starting OpenCLIP service..."
echo "Port: ${PORT:-5000}"
echo "Model: ${CLIP_MODEL:-clip-ViT-B-32}"

# Create directories
mkdir -p /app/logs /app/cache

# Start uvicorn in foreground (no background, no workers for simplicity)
exec python -m uvicorn production_server:app \
    --host 0.0.0.0 \
    --port ${PORT:-5000} \
    --log-level info \
    --timeout-keep-alive 120 \
    --access-log