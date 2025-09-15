#!/bin/bash

# Local deployment script for OpenCLIP service development
# This script sets up the service for local development with Docker Compose

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! command -v docker compose &> /dev/null; then
    echo "Error: Docker Compose is not installed."
    exit 1
fi

# Use docker compose or docker-compose based on availability
DOCKER_COMPOSE="docker compose"
if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
fi

log "Using: $DOCKER_COMPOSE"

# Create .env file if it doesn't exist
if [[ ! -f .env ]]; then
    log "Creating .env file from example..."
    cp .env.example .env
    success ".env file created. Please review and update as needed."
fi

# Create necessary directories
log "Creating necessary directories..."
mkdir -p logs
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources

# Function to handle different deployment modes
deploy_service() {
    local mode=${1:-"development"}
    
    case $mode in
        "development")
            log "Starting OpenCLIP service in development mode..."
            $DOCKER_COMPOSE up -d openclip-service redis
            ;;
        "production")
            log "Starting OpenCLIP service in production mode..."
            $DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.prod.yml up -d
            ;;
        "monitoring")
            log "Starting OpenCLIP service with monitoring stack..."
            $DOCKER_COMPOSE --profile monitoring up -d
            ;;
        "testing")
            log "Starting OpenCLIP service for testing..."
            $DOCKER_COMPOSE --profile testing up -d
            ;;
        *)
            echo "Unknown mode: $mode"
            echo "Available modes: development, production, monitoring, testing"
            exit 1
            ;;
    esac
}

# Function to check service health
check_health() {
    local max_retries=30
    local retry_count=0
    
    log "Waiting for service to be healthy..."
    
    while [[ $retry_count -lt $max_retries ]]; do
        if curl -s http://localhost:5000/health > /dev/null 2>&1; then
            success "Service is healthy!"
            
            # Show service info
            log "Service Information:"
            curl -s http://localhost:5000/health | python3 -m json.tool
            return 0
        fi
        
        echo -n "."
        sleep 2
        retry_count=$((retry_count + 1))
    done
    
    warning "Service health check timeout. Check logs with: $DOCKER_COMPOSE logs openclip-service"
    return 1
}

# Function to show service status
show_status() {
    log "Service Status:"
    $DOCKER_COMPOSE ps
    
    echo ""
    log "Service URLs:"
    echo "OpenCLIP Service: http://localhost:5000"
    echo "Health Check: http://localhost:5000/health"
    echo "Metrics: http://localhost:5000/metrics"
    echo "Redis: localhost:6379"
    
    if docker ps --format "table {{.Names}}" | grep -q prometheus; then
        echo "Prometheus: http://localhost:9090"
    fi
    
    if docker ps --format "table {{.Names}}" | grep -q grafana; then
        echo "Grafana: http://localhost:3001 (admin/admin)"
    fi
}

# Function to show logs
show_logs() {
    local service=${1:-"openclip-service"}
    log "Showing logs for $service..."
    $DOCKER_COMPOSE logs -f "$service"
}

# Function to stop services
stop_service() {
    log "Stopping OpenCLIP services..."
    $DOCKER_COMPOSE down
    success "Services stopped"
}

# Function to clean up
cleanup() {
    log "Cleaning up..."
    $DOCKER_COMPOSE down -v --remove-orphans
    docker system prune -f
    success "Cleanup completed"
}

# Function to run tests
run_tests() {
    log "Running tests..."
    
    # Start service if not running
    if ! curl -s http://localhost:5000/health > /dev/null 2>&1; then
        log "Starting service for testing..."
        deploy_service development
        sleep 10
    fi
    
    # Run basic tests
    log "Testing text embedding..."
    curl -X POST http://localhost:5000/embed/text \
        -H "Content-Type: application/json" \
        -d '{"text": "Hello world"}' | python3 -m json.tool
    
    log "Testing health endpoint..."
    curl http://localhost:5000/health | python3 -m json.tool
    
    success "Basic tests completed"
}

# Function to build image
build_image() {
    log "Building OpenCLIP service image..."
    $DOCKER_COMPOSE build openclip-service
    success "Image built successfully"
}

# Main function
main() {
    local command=${1:-"start"}
    local mode=${2:-"development"}
    
    case $command in
        "start")
            deploy_service "$mode"
            sleep 5
            check_health && show_status
            ;;
        "stop")
            stop_service
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "$mode"
            ;;
        "test")
            run_tests
            ;;
        "build")
            build_image
            ;;
        "cleanup")
            cleanup
            ;;
        "restart")
            stop_service
            deploy_service "$mode"
            sleep 5
            check_health && show_status
            ;;
        *)
            cat << EOF
OpenCLIP Local Deployment Script

Usage: $0 <command> [mode]

Commands:
    start [mode]    Start the service (default: development)
    stop           Stop the service
    restart [mode] Restart the service
    status         Show service status
    logs [service] Show logs (default: openclip-service)
    test           Run basic tests
    build          Build Docker image
    cleanup        Stop and clean up everything

Modes:
    development    Basic service with Redis (default)
    production     Production configuration
    monitoring     Include Prometheus and Grafana
    testing        Include load testing tools

Examples:
    $0 start                    # Start in development mode
    $0 start monitoring         # Start with monitoring
    $0 logs                     # Show service logs
    $0 logs redis               # Show Redis logs
    $0 test                     # Run tests
    $0 cleanup                  # Clean up everything

EOF
            ;;
    esac
}

# Run main function with all arguments
main "$@"