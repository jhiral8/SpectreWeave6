# OpenCLIP Production Microservice

A production-ready FastAPI microservice providing CLIP embeddings for the SpectreWeave character lock system. Optimized for Azure Container Instances deployment with comprehensive monitoring, caching, and batch processing capabilities.

## 🚀 Features

- **Production-Ready FastAPI Service**: Async endpoints with proper error handling
- **Multi-Modal Embeddings**: Text and image embeddings using OpenCLIP
- **Character Consistency**: Specialized endpoint for character appearance validation
- **High-Performance Caching**: Redis-based caching with configurable TTL
- **Batch Processing**: Efficient batch processing for multiple embeddings
- **Comprehensive Monitoring**: Prometheus metrics and health checks
- **Azure Integration**: Ready for Azure Container Instances deployment
- **Security Hardened**: Non-root containers, input validation, rate limiting
- **Development Tools**: Docker Compose for local development and testing

## 📋 Quick Start

### Local Development

1. **Start the service:**
   ```bash
   npm run clip:start
   ```

2. **Check service status:**
   ```bash
   npm run clip:status
   ```

3. **Run tests:**
   ```bash
   npm run clip:test
   ```

4. **View logs:**
   ```bash
   npm run clip:logs
   ```

### Production Deployment (Azure)

1. **Configure environment:**
   ```bash
   cd src/services/openclip
   cp .env.example .env
   # Edit .env with your Azure configuration
   ```

2. **Deploy to Azure:**
   ```bash
   npm run azure:deploy
   ```

## 🛠️ Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SpectreWeave Application                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ HTTP/REST API
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                OpenCLIP Microservice                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   FastAPI   │  │   CLIP      │  │    Redis Cache      │  │
│  │   Server    │◄─┤   Model     │  │   (Embeddings)     │  │
│  │             │  │             │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Monitoring  │  │   Logging   │  │   Health Checks     │  │
│  │(Prometheus) │  │ (Structured)│  │   (Readiness)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 📖 API Documentation

### Health Check
```bash
GET /health
```
Returns comprehensive service health including GPU status, memory usage, and uptime.

### Text Embeddings
```bash
POST /embed/text
Content-Type: application/json

{
  "text": "A brave knight in shining armor",
  "cache_key": "optional-cache-key"
}
```

### Image Embeddings
```bash
POST /embed/image
Content-Type: application/json

{
  "image": "base64-encoded-image-data",
  "cache_key": "optional-cache-key"
}
```

### Character Consistency Check
```bash
POST /character/consistency
Content-Type: application/json

{
  "generated_image": "base64-generated-image",
  "reference_images": ["base64-ref1", "base64-ref2"],
  "text_description": "Character description",
  "threshold": 0.85
}
```

### Batch Processing
```bash
POST /embed/batch
Content-Type: application/json

{
  "items": ["text1", "text2", "text3"],
  "batch_type": "text"
}
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CLIP_MODEL` | CLIP model to use | `clip-ViT-B-32` |
| `WORKERS` | Number of worker processes | `2` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `ENABLE_CACHE` | Enable Redis caching | `true` |
| `MAX_BATCH_SIZE` | Maximum batch size | `16` |
| `MAX_IMAGE_SIZE` | Maximum image dimension | `1024` |

### Available CLIP Models

- `clip-ViT-B-32`: Balanced performance (512 dimensions)
- `clip-ViT-L-14`: Higher quality, slower (768 dimensions)  
- `clip-ViT-B-16`: Alternative balanced model (512 dimensions)

## 🐳 Docker Configuration

### Local Development
```bash
# Start with monitoring
npm run clip:monitoring

# Production mode
npm run clip:production

# Custom configuration
CLIP_MODEL=clip-ViT-L-14 npm run clip:start
```

### Resource Requirements

| Mode | CPU | Memory | Storage |
|------|-----|---------|---------|
| Development | 2 cores | 4GB | 10GB |
| Production | 2-4 cores | 4-8GB | 20GB |
| With GPU | 2-4 cores | 8-16GB | 20GB |

## ☁️ Azure Deployment

### Prerequisites

1. **Azure CLI installed and logged in**
2. **Container Registry created**
3. **Resource groups prepared**

### Deployment Steps

1. **Configure Azure settings:**
   ```bash
   export ACR_NAME="your-registry"
   export ACR_RESOURCE_GROUP="your-acr-rg"
   export ACI_RESOURCE_GROUP="your-aci-rg"
   export ACI_NAME="openclip-service"
   export ACI_LOCATION="eastus2"
   ```

2. **Deploy:**
   ```bash
   npm run azure:deploy
   ```

3. **Monitor deployment:**
   ```bash
   az container logs --name openclip-service --resource-group your-aci-rg
   ```

### Azure Services Used

- **Azure Container Instances**: Primary compute
- **Azure Container Registry**: Image storage
- **Azure Redis Cache**: Embedding cache (optional)
- **Azure File Storage**: Persistent model cache
- **Application Insights**: Monitoring and telemetry

## 📊 Monitoring & Observability

### Metrics Available

- Request count and latency
- Cache hit/miss rates
- Memory and GPU usage
- Embedding generation times
- Error rates and types

### Prometheus Metrics

```
clip_requests_total
clip_request_duration_seconds
clip_cache_hits_total
clip_memory_usage_bytes
clip_gpu_memory_usage_bytes
```

### Health Monitoring

The service includes comprehensive health checks:

- Model loading status
- Redis connectivity
- Memory usage thresholds
- GPU availability (if applicable)

## 🧪 Testing

### Unit Tests
```bash
npm run clip:test
```

### Load Testing
```bash
npm run clip:monitoring  # Start with monitoring
# Load tests run automatically in testing profile
```

### Manual Testing
```bash
# Test text embedding
curl -X POST http://localhost:5000/embed/text \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world"}'

# Test image embedding (requires base64 image)
curl -X POST http://localhost:5000/embed/image \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/png;base64,iVBOR..."}'
```

## 🔒 Security

### Security Features

- **Non-root container**: Runs as unprivileged user
- **Input validation**: Pydantic models for request validation
- **Resource limits**: Memory and CPU constraints
- **API key authentication**: Optional API key protection
- **CORS configuration**: Configurable allowed origins

### Production Security Checklist

- [ ] Configure API keys
- [ ] Set proper CORS origins
- [ ] Enable Azure Key Vault integration
- [ ] Configure network security groups
- [ ] Enable container instance logs
- [ ] Set up monitoring alerts

## 🛠️ Development

### Project Structure

```
src/services/openclip/
├── production_server.py      # Main FastAPI application
├── Dockerfile.production     # Multi-stage production Dockerfile
├── requirements.production.txt
├── docker-compose.yml        # Local development setup
├── .env.example             # Environment configuration template
├── azure/
│   ├── deploy.sh           # Azure deployment script
│   └── deploy-aci.yml      # Container instance template
├── monitoring/
│   └── prometheus.yml      # Metrics configuration
└── deploy-local.sh         # Local deployment script
```

### Local Development Setup

1. **Install dependencies:**
   ```bash
   cd src/services/openclip
   pip install -r requirements.production.txt
   ```

2. **Run development server:**
   ```bash
   python production_server.py
   ```

3. **Run with Docker:**
   ```bash
   npm run clip:start
   ```

## 📝 Performance Tuning

### Optimization Tips

1. **Model Selection**: Choose appropriate model for use case
2. **Batch Size**: Increase for better throughput, decrease for lower latency
3. **Caching**: Enable Redis for repeated embeddings
4. **Resource Limits**: Set appropriate CPU/memory limits
5. **Workers**: Scale workers based on CPU cores

### Performance Benchmarks

| Model | Batch Size | Text (ms) | Image (ms) | Memory |
|-------|------------|-----------|------------|---------|
| ViT-B-32 | 1 | 50-100 | 150-300 | 2GB |
| ViT-B-32 | 16 | 200-400 | 1000-2000 | 3GB |
| ViT-L-14 | 1 | 100-200 | 300-600 | 4GB |

## 🚨 Troubleshooting

### Common Issues

**Service won't start:**
- Check Docker is running
- Verify port 5000 is available
- Check logs: `npm run clip:logs`

**High memory usage:**
- Reduce batch size
- Enable model quantization
- Increase memory limits

**Cache issues:**
- Verify Redis connection
- Check Redis memory limits
- Monitor cache hit rates

**Azure deployment fails:**
- Verify Azure CLI login
- Check resource group permissions
- Validate environment variables

### Debug Commands

```bash
# Check service health
curl http://localhost:5000/health

# View detailed logs
npm run clip:logs

# Check Redis connectivity
docker exec -it redis-cache redis-cli ping

# Monitor resource usage
docker stats openclip-service
```

## 📚 Additional Resources

- [CLIP Model Documentation](https://github.com/openai/CLIP)
- [Sentence Transformers](https://www.sbert.net/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Azure Container Instances](https://docs.microsoft.com/en-us/azure/container-instances/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## 📄 License

This project is part of SpectreWeave and follows the main project license.