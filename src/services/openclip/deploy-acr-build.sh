#!/bin/bash
# Deploy OpenCLIP using Azure Container Registry Build (no local Docker required)

set -e

# Load environment variables
if [[ -f .env ]]; then
    export $(grep -v '^#' .env | xargs)
    echo "✓ Loaded environment variables from .env"
else
    echo "❌ No .env file found"
    exit 1
fi

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

log "Starting Azure ACR Build deployment for OpenCLIP service"

# Set subscription
log "Setting Azure subscription to $AZURE_SUBSCRIPTION_ID"
az account set --subscription "$AZURE_SUBSCRIPTION_ID"

# Build image using Azure Container Registry Build
log "Building image using Azure Container Registry (cloud build)..."
az acr build \
    --registry "$ACR_NAME" \
    --image "openclip-service:v2" \
    --image "openclip-service:latest" \
    --file "Dockerfile.production" \
    --build-arg CLIP_MODEL="$CLIP_MODEL" \
    .

if [ $? -eq 0 ]; then
    success "Image built successfully in Azure!"
else
    error "Image build failed"
    exit 1
fi

# Check if container instance already exists
EXISTING=$(az container show --resource-group "$ACI_RESOURCE_GROUP" --name "$ACI_NAME" --query "name" -o tsv 2>/dev/null || echo "")

if [ ! -z "$EXISTING" ]; then
    log "Updating existing container instance: $ACI_NAME"
    az container delete --resource-group "$ACI_RESOURCE_GROUP" --name "$ACI_NAME" --yes
    log "Deleted existing container instance"
fi

# Create new container instance
log "Creating container instance: $ACI_NAME"
az container create \
    --resource-group "$ACI_RESOURCE_GROUP" \
    --name "$ACI_NAME" \
    --image "${ACR_NAME}.azurecr.io/openclip-service:v2" \
    --location "$ACI_LOCATION" \
    --cpu "$CPU_CORES" \
    --memory "$MEMORY_GB" \
    --registry-login-server "${ACR_NAME}.azurecr.io" \
    --registry-username "$ACR_NAME" \
    --registry-password "$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)" \
    --dns-name-label "openclip-spectreweave-v2" \
    --ports 5000 \
    --environment-variables \
        PORT=5000 \
        CLIP_MODEL="$CLIP_MODEL" \
        WORKERS="$WORKERS" \
        LOG_LEVEL=info \
        MAX_BATCH_SIZE=16 \
        ENABLE_CACHE=false \
    --restart-policy Always

if [ $? -eq 0 ]; then
    success "Container instance deployed successfully!"
    
    # Get the FQDN
    FQDN=$(az container show --resource-group "$ACI_RESOURCE_GROUP" --name "$ACI_NAME" --query "ipAddress.fqdn" -o tsv)
    
    success "Service URL: http://$FQDN:5000"
    success "Health Check: http://$FQDN:5000/health"
    
    # Wait and test
    log "Waiting 30 seconds for service to start..."
    sleep 30
    
    log "Testing service health..."
    if curl -f "http://$FQDN:5000/health" >/dev/null 2>&1; then
        success "✓ Service is healthy and ready!"
    else
        log "Service may still be starting. Check logs with:"
        log "az container logs --resource-group $ACI_RESOURCE_GROUP --name $ACI_NAME"
    fi
else
    error "Container deployment failed"
    exit 1
fi