#!/bin/bash

# Azure Container Instances Deployment Script for OpenCLIP Service
# This script handles the complete deployment process to Azure

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Load environment variables
if [[ -f .env ]]; then
    export $(grep -v '^#' .env | xargs)
    log "Loaded environment variables from .env"
else
    warning "No .env file found, using environment defaults"
fi

# Required variables
REQUIRED_VARS=(
    "ACR_NAME"
    "ACR_RESOURCE_GROUP"
    "ACI_RESOURCE_GROUP" 
    "ACI_NAME"
    "ACI_LOCATION"
    "AZURE_SUBSCRIPTION_ID"
)

# Check required variables
for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var}" ]]; then
        error "Required variable $var is not set"
        exit 1
    fi
done

# Default values
CLIP_MODEL=${CLIP_MODEL:-"clip-ViT-B-32"}
MEMORY_GB=${MEMORY_GB:-4}
CPU_CORES=${CPU_CORES:-2}
WORKERS=${WORKERS:-2}
RANDOM_SUFFIX=$(openssl rand -hex 4)

# Azure CLI check
if ! command -v az &> /dev/null; then
    error "Azure CLI is not installed. Please install it first."
    exit 1
fi

# Login check
if ! az account show &> /dev/null; then
    log "Please log in to Azure CLI..."
    az login
fi

# Set subscription
log "Setting Azure subscription to $AZURE_SUBSCRIPTION_ID"
az account set --subscription "$AZURE_SUBSCRIPTION_ID"

# Function to create resource group if it doesn't exist
create_resource_group() {
    local rg_name=$1
    local location=$2
    
    if ! az group exists --name "$rg_name" &> /dev/null; then
        log "Creating resource group $rg_name in $location"
        az group create --name "$rg_name" --location "$location"
        success "Resource group $rg_name created"
    else
        log "Resource group $rg_name already exists"
    fi
}

# Function to build and push Docker image
build_and_push() {
    log "Building Docker image..."
    
    # Login to ACR
    log "Logging in to Azure Container Registry..."
    az acr login --name "$ACR_NAME"
    
    # Build image
    local image_tag="${ACR_NAME}.azurecr.io/openclip-service:latest"
    local image_tag_versioned="${ACR_NAME}.azurecr.io/openclip-service:$(date +%Y%m%d-%H%M%S)"
    
    log "Building image: $image_tag"
    docker build -f Dockerfile.production -t "$image_tag" -t "$image_tag_versioned" \
        --build-arg CLIP_MODEL="$CLIP_MODEL" .
    
    # Push image
    log "Pushing image to ACR..."
    docker push "$image_tag"
    docker push "$image_tag_versioned"
    
    success "Image built and pushed successfully"
    echo "Latest tag: $image_tag"
    echo "Versioned tag: $image_tag_versioned"
}

# Function to create Azure File Storage for persistent volumes
create_storage() {
    local storage_account="openclip${RANDOM_SUFFIX}"
    local storage_key
    
    log "Creating storage account: $storage_account"
    
    az storage account create \
        --name "$storage_account" \
        --resource-group "$ACI_RESOURCE_GROUP" \
        --location "$ACI_LOCATION" \
        --sku Standard_LRS \
        --kind StorageV2
    
    # Get storage key
    storage_key=$(az storage account keys list \
        --resource-group "$ACI_RESOURCE_GROUP" \
        --account-name "$storage_account" \
        --query '[0].value' --output tsv)
    
    # Create file shares
    log "Creating file shares..."
    for share in model-cache logs; do
        az storage share create \
            --name "$share" \
            --account-name "$storage_account" \
            --account-key "$storage_key"
    done
    
    # Export for deployment
    export AZURE_STORAGE_ACCOUNT="$storage_account"
    export AZURE_STORAGE_KEY="$storage_key"
    
    success "Storage account created: $storage_account"
}

# Function to create Azure Redis Cache (optional)
create_redis_cache() {
    local redis_name="openclip-redis-${RANDOM_SUFFIX}"
    
    if [[ "${CREATE_REDIS_CACHE:-false}" == "true" ]]; then
        log "Creating Azure Redis Cache: $redis_name"
        
        az redis create \
            --name "$redis_name" \
            --resource-group "$ACI_RESOURCE_GROUP" \
            --location "$ACI_LOCATION" \
            --sku Basic \
            --vm-size c0 \
            --enable-non-ssl-port
        
        # Get connection string
        local redis_key=$(az redis list-keys \
            --name "$redis_name" \
            --resource-group "$ACI_RESOURCE_GROUP" \
            --query 'primaryKey' --output tsv)
        
        export AZURE_REDIS_CONNECTION_STRING="redis://:${redis_key}@${redis_name}.redis.cache.windows.net:6379"
        
        success "Redis cache created: $redis_name"
    else
        log "Skipping Redis cache creation (CREATE_REDIS_CACHE=false)"
    fi
}

# Function to deploy container instance
deploy_container() {
    log "Deploying container instance: $ACI_NAME"
    
    # Prepare deployment template
    local template_file="azure/deploy-aci.yml"
    local temp_file=$(mktemp)
    
    # Substitute environment variables in template
    envsubst < "$template_file" > "$temp_file"
    
    # Deploy using Azure CLI
    az container create \
        --resource-group "$ACI_RESOURCE_GROUP" \
        --file "$temp_file" \
        --name "$ACI_NAME"
    
    rm "$temp_file"
    
    # Get public IP
    local public_ip=$(az container show \
        --resource-group "$ACI_RESOURCE_GROUP" \
        --name "$ACI_NAME" \
        --query 'ipAddress.ip' --output tsv)
    
    local dns_name=$(az container show \
        --resource-group "$ACI_RESOURCE_GROUP" \
        --name "$ACI_NAME" \
        --query 'ipAddress.fqdn' --output tsv)
    
    success "Container deployed successfully!"
    echo "Public IP: $public_ip"
    echo "DNS Name: $dns_name"
    echo "Service URL: http://$dns_name:5000"
    echo "Health Check: http://$dns_name:5000/health"
}

# Function to setup monitoring
setup_monitoring() {
    if [[ "${SETUP_MONITORING:-false}" == "true" ]]; then
        log "Setting up Application Insights monitoring..."
        
        local app_insights_name="openclip-insights-${RANDOM_SUFFIX}"
        
        # Create Application Insights
        az monitor app-insights component create \
            --app "$app_insights_name" \
            --location "$ACI_LOCATION" \
            --resource-group "$ACI_RESOURCE_GROUP" \
            --kind web
        
        # Get connection string
        local connection_string=$(az monitor app-insights component show \
            --app "$app_insights_name" \
            --resource-group "$ACI_RESOURCE_GROUP" \
            --query 'connectionString' --output tsv)
        
        export APPLICATION_INSIGHTS_CONNECTION_STRING="$connection_string"
        
        success "Application Insights created: $app_insights_name"
    fi
}

# Main deployment function
main() {
    log "Starting Azure deployment for OpenCLIP service"
    
    # Create resource groups
    create_resource_group "$ACR_RESOURCE_GROUP" "$ACI_LOCATION"
    create_resource_group "$ACI_RESOURCE_GROUP" "$ACI_LOCATION"
    
    # Build and push image
    build_and_push
    
    # Create supporting resources
    create_storage
    create_redis_cache
    setup_monitoring
    
    # Deploy container
    deploy_container
    
    success "Deployment completed successfully!"
    
    # Show deployment info
    log "Deployment Summary:"
    echo "├── Resource Group: $ACI_RESOURCE_GROUP"
    echo "├── Container Name: $ACI_NAME"
    echo "├── Location: $ACI_LOCATION"
    echo "├── Model: $CLIP_MODEL"
    echo "├── CPU Cores: $CPU_CORES"
    echo "├── Memory: ${MEMORY_GB}GB"
    echo "└── Workers: $WORKERS"
    
    # Test deployment
    if [[ "${SKIP_HEALTH_CHECK:-false}" != "true" ]]; then
        log "Running health check..."
        sleep 30  # Wait for container to start
        
        local dns_name=$(az container show \
            --resource-group "$ACI_RESOURCE_GROUP" \
            --name "$ACI_NAME" \
            --query 'ipAddress.fqdn' --output tsv)
        
        if curl -f "http://$dns_name:5000/health" > /dev/null 2>&1; then
            success "Health check passed! Service is running."
        else
            warning "Health check failed. Check container logs."
        fi
    fi
}

# Cleanup function
cleanup() {
    if [[ "${1:-}" == "--cleanup" ]]; then
        log "Cleaning up resources..."
        
        warning "This will delete the container instance and associated resources."
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            az container delete \
                --resource-group "$ACI_RESOURCE_GROUP" \
                --name "$ACI_NAME" \
                --yes
            
            success "Resources cleaned up"
        fi
        exit 0
    fi
}

# Help function
show_help() {
    cat << EOF
Azure OpenCLIP Deployment Script

Usage: $0 [OPTIONS]

OPTIONS:
    --cleanup       Delete the deployed container instance
    --help, -h      Show this help message

ENVIRONMENT VARIABLES:
    Required:
        ACR_NAME                    Azure Container Registry name
        ACR_RESOURCE_GROUP          ACR resource group
        ACI_RESOURCE_GROUP          ACI resource group
        ACI_NAME                    Container instance name
        ACI_LOCATION                Azure location (e.g., eastus2)
        AZURE_SUBSCRIPTION_ID       Azure subscription ID

    Optional:
        CLIP_MODEL                  CLIP model to use (default: clip-ViT-B-32)
        MEMORY_GB                   Memory in GB (default: 4)
        CPU_CORES                   CPU cores (default: 2)
        WORKERS                     Number of workers (default: 2)
        CREATE_REDIS_CACHE          Create Azure Redis Cache (default: false)
        SETUP_MONITORING            Setup Application Insights (default: false)
        SKIP_HEALTH_CHECK           Skip final health check (default: false)

EXAMPLES:
    # Deploy with default settings
    $0

    # Deploy with custom model
    CLIP_MODEL=clip-ViT-L-14 $0

    # Deploy with monitoring
    SETUP_MONITORING=true CREATE_REDIS_CACHE=true $0

    # Cleanup deployment
    $0 --cleanup

EOF
}

# Parse command line arguments
case "${1:-}" in
    --cleanup)
        cleanup --cleanup
        ;;
    --help|-h)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac