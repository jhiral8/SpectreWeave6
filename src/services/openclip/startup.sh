#!/bin/bash

# Production startup script for OpenCLIP service
# Handles graceful shutdown and monitoring

set -e

# Default values
PORT=${PORT:-5000}
WORKERS=${WORKERS:-1}
LOG_LEVEL=${LOG_LEVEL:-info}
# Convert LOG_LEVEL to lowercase for uvicorn
LOG_LEVEL=$(echo "$LOG_LEVEL" | tr '[:upper:]' '[:lower:]')
TIMEOUT=${TIMEOUT:-120}

# Function to handle shutdown signals
shutdown() {
    echo "$(date): Received shutdown signal, gracefully stopping..."
    
    # Send SIGTERM to uvicorn process group
    if [[ ! -z "$UVICORN_PID" ]]; then
        echo "$(date): Stopping uvicorn (PID: $UVICORN_PID)..."
        kill -TERM "$UVICORN_PID" 2>/dev/null || true
        
        # Wait for graceful shutdown
        local count=0
        while kill -0 "$UVICORN_PID" 2>/dev/null && [[ $count -lt 30 ]]; do
            echo "$(date): Waiting for server to shutdown... ($count/30)"
            sleep 1
            count=$((count + 1))
        done
        
        # Force kill if still running
        if kill -0 "$UVICORN_PID" 2>/dev/null; then
            echo "$(date): Force stopping server..."
            kill -KILL "$UVICORN_PID" 2>/dev/null || true
        fi
    fi
    
    echo "$(date): Cleanup complete, exiting..."
    exit 0
}

# Set up signal handlers
trap shutdown SIGTERM SIGINT SIGQUIT

# Create log directory if it doesn't exist
mkdir -p /app/logs

# Log startup information
echo "$(date): Starting OpenCLIP service..."
echo "$(date): Configuration:"
echo "  - Port: $PORT"
echo "  - Workers: $WORKERS"
echo "  - Log Level: $LOG_LEVEL"
echo "  - Timeout: $TIMEOUT"
echo "  - Model: ${CLIP_MODEL:-clip-ViT-B-32}"
echo "  - Cache: ${ENABLE_CACHE:-true}"
echo "  - Max Batch Size: ${MAX_BATCH_SIZE:-16}"

# Health check function
health_check() {
    echo "$(date): Performing initial health check..."
    local retries=10
    local count=0
    
    while [[ $count -lt $retries ]]; do
        if python -c "import requests; requests.get('http://localhost:$PORT/health', timeout=5)" 2>/dev/null; then
            echo "$(date): Health check passed!"
            return 0
        fi
        
        echo "$(date): Health check failed, retrying... ($count/$retries)"
        sleep 3
        count=$((count + 1))
    done
    
    echo "$(date): Health check failed after $retries attempts"
    return 1
}

# Start the server
echo "$(date): Starting uvicorn server..."

# Use uvicorn directly for better control in containers
python -m uvicorn production_server:app \
    --host 0.0.0.0 \
    --port "$PORT" \
    --workers "$WORKERS" \
    --log-level "$LOG_LEVEL" \
    --timeout-keep-alive "$TIMEOUT" \
    --timeout-graceful-shutdown 30 \
    --no-server-header \
    --date-header \
    --access-log \
    --use-colors &

UVICORN_PID=$!
echo "$(date): Server started with PID: $UVICORN_PID"

# Wait a moment for server to start
sleep 5

# Run health check (optional, can be disabled for faster startup)
if [[ "${SKIP_HEALTH_CHECK:-false}" != "true" ]]; then
    if ! health_check; then
        echo "$(date): Initial health check failed, stopping server..."
        shutdown
        exit 1
    fi
fi

# Monitor the server process
echo "$(date): Server is running, monitoring..."

# Wait for the server process or signals
wait $UVICORN_PID