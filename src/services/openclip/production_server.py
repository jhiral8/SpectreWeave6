#!/usr/bin/env python3
"""
Production OpenCLIP FastAPI Microservice for Character Lock System
Optimized for Azure Container Instances deployment
"""

import os
import json
import base64
import asyncio
import hashlib
import time
from datetime import datetime, timedelta
from functools import lru_cache
from typing import List, Union, Optional, Dict, Any
from io import BytesIO
import numpy as np
from PIL import Image
import torch
import redis
import psutil
from contextlib import asynccontextmanager

# FastAPI imports
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
import uvicorn

# ML imports
import open_clip
import logging
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/app/logs/clip_server.log') if os.path.exists('/app/logs') else logging.NullHandler()
    ]
)
logger = logging.getLogger(__name__)

# Prometheus metrics
REQUEST_COUNT = Counter('clip_requests_total', 'Total requests', ['method', 'endpoint'])
REQUEST_LATENCY = Histogram('clip_request_duration_seconds', 'Request latency')
EMBEDDING_CACHE_HITS = Counter('clip_cache_hits_total', 'Cache hits')
EMBEDDING_CACHE_MISSES = Counter('clip_cache_misses_total', 'Cache misses')
ACTIVE_CONNECTIONS = Gauge('clip_active_connections', 'Active connections')
MEMORY_USAGE = Gauge('clip_memory_usage_bytes', 'Memory usage in bytes')
GPU_MEMORY_USAGE = Gauge('clip_gpu_memory_usage_bytes', 'GPU memory usage in bytes')

# Pydantic models for request validation
class TextEmbeddingRequest(BaseModel):
    text: Union[str, List[str]] = Field(..., description="Text or list of texts to embed")
    cache_key: Optional[str] = Field(None, description="Optional cache key")

class ImageEmbeddingRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded image")
    cache_key: Optional[str] = Field(None, description="Optional cache key")
    
    @validator('image')
    def validate_image(cls, v):
        if not v or len(v) < 10:  # Basic validation
            raise ValueError('Invalid image data')
        return v

class MultimodalRequest(BaseModel):
    text: str = Field(..., description="Text description")
    image: str = Field(..., description="Base64 encoded image")
    cache_key: Optional[str] = Field(None, description="Optional cache key")

class SimilarityRequest(BaseModel):
    embedding1: List[float] = Field(..., description="First embedding vector")
    embedding2: List[float] = Field(..., description="Second embedding vector")

class SearchRequest(BaseModel):
    query_embedding: List[float] = Field(..., description="Query embedding")
    candidate_embeddings: List[List[float]] = Field(..., description="Candidate embeddings")
    top_k: int = Field(5, ge=1, le=100, description="Number of results to return")

class ConsistencyRequest(BaseModel):
    generated_image: str = Field(..., description="Generated image base64")
    reference_images: List[str] = Field(..., description="Reference images base64")
    text_description: Optional[str] = Field(None, description="Text description")
    threshold: float = Field(0.85, ge=0.0, le=1.0, description="Consistency threshold")

class BatchRequest(BaseModel):
    items: List[Union[str, dict]] = Field(..., max_items=50, description="Batch items")
    batch_type: str = Field(..., pattern="^(text|image)$", description="Batch type")

class ProductionCLIPService:
    """
    Production-ready CLIP embedding service with caching, monitoring, and optimization
    """
    
    def __init__(self, model_name: str = "clip-ViT-B-32", enable_cache: bool = True):
        logger.info(f"Initializing production CLIP service with model: {model_name}")
        
        # Device selection with optimization
        self.device = self._select_optimal_device()
        logger.info(f"Using device: {self.device}")
        
        # Load model with optimization
        self.model_name = model_name
        self.model = self._load_optimized_model(model_name)
        # OpenCLIP models typically have 512-dimensional embeddings for ViT-B models
        self.embedding_dim = 512 if 'B' in model_name else 768
        
        # Initialize caching
        self.cache_enabled = enable_cache
        self.redis_client = self._initialize_cache() if enable_cache else None
        self.memory_cache = {}
        self.cache_ttl = int(os.getenv('CACHE_TTL', '3600'))  # 1 hour default
        self.max_memory_cache_size = int(os.getenv('MAX_MEMORY_CACHE_SIZE', '1000'))
        
        # Performance tracking
        self.request_count = 0
        self.startup_time = datetime.now()
        
        # Batch processing settings
        self.max_batch_size = int(os.getenv('MAX_BATCH_SIZE', '32'))
        self.batch_timeout = float(os.getenv('BATCH_TIMEOUT', '0.1'))
        
        logger.info(f"Service initialized successfully. Embedding dimension: {self.embedding_dim}")
        
    def _select_optimal_device(self) -> str:
        """Select the optimal device for inference"""
        if torch.cuda.is_available():
            gpu_count = torch.cuda.device_count()
            if gpu_count > 0:
                # Select GPU with most available memory
                max_memory = 0
                best_device = 0
                for i in range(gpu_count):
                    memory = torch.cuda.get_device_properties(i).total_memory
                    if memory > max_memory:
                        max_memory = memory
                        best_device = i
                return f"cuda:{best_device}"
        return "cpu"
    
    def _load_optimized_model(self, model_name: str):
        """Load OpenCLIP model with optimization settings"""
        # Convert model name format (clip-ViT-B-32 -> ViT-B-32)
        clip_model_name = model_name.replace('clip-', '') if model_name.startswith('clip-') else model_name
        
        # Load OpenCLIP model
        model, _, preprocess = open_clip.create_model_and_transforms(
            clip_model_name, pretrained='openai', device=self.device
        )
        
        # Set model to evaluation mode for inference
        model.eval()
        
        # Enable optimizations for PyTorch
        if hasattr(torch, 'jit') and self.device.startswith('cuda'):
            try:
                # Compile model for better performance (PyTorch 2.0+)
                if hasattr(torch, 'compile'):
                    model = torch.compile(model, mode="max-autotune")
                    logger.info("Model compiled for optimal performance")
            except Exception as e:
                logger.warning(f"Could not compile model: {e}")
        
        # Store preprocessing function
        self.preprocess = preprocess
        return model
    
    def _initialize_cache(self) -> Optional[redis.Redis]:
        """Initialize Redis cache if available"""
        try:
            redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
            client = redis.from_url(redis_url, decode_responses=False)
            client.ping()
            logger.info("Redis cache initialized successfully")
            return client
        except Exception as e:
            logger.warning(f"Redis not available, using memory cache only: {e}")
            return None
    
    def _get_cache_key(self, data: Union[str, bytes], prefix: str) -> str:
        """Generate cache key from data"""
        if isinstance(data, str):
            data = data.encode('utf-8')
        return f"{prefix}:{hashlib.md5(data).hexdigest()}"
    
    async def _get_from_cache(self, cache_key: str) -> Optional[np.ndarray]:
        """Get embedding from cache"""
        if not self.cache_enabled:
            return None
            
        try:
            # Try Redis first
            if self.redis_client:
                cached = self.redis_client.get(cache_key)
                if cached:
                    EMBEDDING_CACHE_HITS.inc()
                    return np.frombuffer(cached, dtype=np.float32)
            
            # Try memory cache
            if cache_key in self.memory_cache:
                cached_data, timestamp = self.memory_cache[cache_key]
                if time.time() - timestamp < self.cache_ttl:
                    EMBEDDING_CACHE_HITS.inc()
                    return cached_data
                else:
                    del self.memory_cache[cache_key]
                    
        except Exception as e:
            logger.warning(f"Cache retrieval error: {e}")
            
        EMBEDDING_CACHE_MISSES.inc()
        return None
    
    async def _store_in_cache(self, cache_key: str, embedding: np.ndarray) -> None:
        """Store embedding in cache"""
        if not self.cache_enabled:
            return
            
        try:
            # Store in Redis
            if self.redis_client:
                self.redis_client.setex(
                    cache_key, 
                    self.cache_ttl, 
                    embedding.astype(np.float32).tobytes()
                )
            
            # Store in memory cache (with size limit)
            if len(self.memory_cache) < self.max_memory_cache_size:
                self.memory_cache[cache_key] = (embedding, time.time())
            
        except Exception as e:
            logger.warning(f"Cache storage error: {e}")
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get comprehensive health status"""
        memory_info = psutil.virtual_memory()
        process = psutil.Process()
        
        health = {
            'status': 'healthy',
            'model': self.model_name,
            'embedding_dim': self.embedding_dim,
            'device': self.device,
            'uptime_seconds': (datetime.now() - self.startup_time).total_seconds(),
            'total_requests': self.request_count,
            'cache_enabled': self.cache_enabled,
            'system': {
                'memory_usage_percent': memory_info.percent,
                'available_memory_gb': memory_info.available / (1024**3),
                'process_memory_mb': process.memory_info().rss / (1024**2)
            }
        }
        
        # Add GPU info if available
        if self.device.startswith('cuda'):
            try:
                gpu_memory = torch.cuda.get_device_properties(0).total_memory / (1024**3)
                gpu_allocated = torch.cuda.memory_allocated(0) / (1024**3)
                health['gpu'] = {
                    'total_memory_gb': gpu_memory,
                    'allocated_memory_gb': gpu_allocated,
                    'utilization_percent': (gpu_allocated / gpu_memory) * 100
                }
                GPU_MEMORY_USAGE.set(torch.cuda.memory_allocated(0))
            except Exception as e:
                logger.warning(f"Could not get GPU info: {e}")
        
        # Update metrics
        MEMORY_USAGE.set(process.memory_info().rss)
        
        return health
    
    async def encode_text(self, texts: Union[str, List[str]], cache_key: Optional[str] = None) -> np.ndarray:
        """Generate embeddings for text inputs with caching"""
        is_single = isinstance(texts, str)
        if is_single:
            texts = [texts]
        
        # Check cache for single text items
        if is_single and self.cache_enabled:
            cache_key = cache_key or self._get_cache_key(texts[0], "text")
            cached = await self._get_from_cache(cache_key)
            if cached is not None:
                return cached.reshape(1, -1) if is_single else cached
        
        # Generate embeddings with performance monitoring
        start_time = time.time()
        try:
            with torch.no_grad():
                # Tokenize text using OpenCLIP
                tokenized = open_clip.tokenize(texts).to(self.device)
                text_features = self.model.encode_text(tokenized)
                # Normalize embeddings
                text_features = text_features / text_features.norm(dim=-1, keepdim=True)
                embeddings = text_features.cpu().numpy()
        except Exception as e:
            logger.error(f"Text encoding failed: {e}")
            raise HTTPException(status_code=500, detail=f"Text encoding failed: {str(e)}")
        
        processing_time = time.time() - start_time
        logger.debug(f"Text encoding took {processing_time:.3f}s for {len(texts)} items")
        
        # Cache single item results
        if is_single and self.cache_enabled and cache_key:
            await self._store_in_cache(cache_key, embeddings[0])
        
        self.request_count += 1
        return embeddings
    
    async def encode_image(self, image_data: Union[str, bytes, Image.Image], cache_key: Optional[str] = None) -> np.ndarray:
        """Generate embeddings for image inputs with caching and optimization"""
        # Check cache first
        if self.cache_enabled and cache_key:
            cached = await self._get_from_cache(cache_key)
            if cached is not None:
                return cached
        elif self.cache_enabled and isinstance(image_data, str):
            cache_key = self._get_cache_key(image_data, "image")
            cached = await self._get_from_cache(cache_key)
            if cached is not None:
                return cached
        
        start_time = time.time()
        
        try:
            # Convert to PIL Image if needed
            if isinstance(image_data, str):
                # Handle data URLs and base64
                if image_data.startswith('data:image'):
                    image_data = image_data.split(',')[1]
                image_bytes = base64.b64decode(image_data)
                image = Image.open(BytesIO(image_bytes))
            elif isinstance(image_data, bytes):
                image = Image.open(BytesIO(image_data))
            else:
                image = image_data
            
            # Validate image
            if image.size[0] == 0 or image.size[1] == 0:
                raise ValueError("Invalid image dimensions")
                
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize if too large (optimization)
            max_size = int(os.getenv('MAX_IMAGE_SIZE', '1024'))
            if max(image.size) > max_size:
                image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            
            # Generate embedding using OpenCLIP
            with torch.no_grad():
                # Preprocess image and add batch dimension
                image_tensor = self.preprocess(image).unsqueeze(0).to(self.device)
                image_features = self.model.encode_image(image_tensor)
                # Normalize embeddings
                image_features = image_features / image_features.norm(dim=-1, keepdim=True)
                embedding = image_features.cpu().numpy()
                
        except Exception as e:
            logger.error(f"Image encoding failed: {e}")
            raise HTTPException(status_code=400, detail=f"Image processing failed: {str(e)}")
        
        processing_time = time.time() - start_time
        logger.debug(f"Image encoding took {processing_time:.3f}s")
        
        result = embedding[0]
        
        # Cache the result
        if self.cache_enabled and cache_key:
            await self._store_in_cache(cache_key, result)
        
        self.request_count += 1
        return result
    
    async def batch_encode(self, items: List[Union[str, dict]], batch_type: str) -> List[np.ndarray]:
        """Batch encode multiple items efficiently"""
        if batch_type == "text":
            texts = [item if isinstance(item, str) else item.get('text', '') for item in items]
            return await self.encode_text(texts)
        elif batch_type == "image":
            results = []
            for item in items:
                image_data = item if isinstance(item, str) else item.get('image', '')
                cache_key = item.get('cache_key') if isinstance(item, dict) else None
                embedding = await self.encode_image(image_data, cache_key)
                results.append(embedding)
            return results
        else:
            raise HTTPException(status_code=400, detail="Invalid batch_type")

# Initialize the service globally
clip_service: Optional[ProductionCLIPService] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    global clip_service
    
    # Startup
    logger.info("Starting up CLIP service...")
    try:
        clip_service = ProductionCLIPService(
            model_name=os.getenv('CLIP_MODEL', 'clip-ViT-B-32'),
            enable_cache=os.getenv('ENABLE_CACHE', 'true').lower() == 'true'
        )
        logger.info("CLIP service started successfully")
        yield
    except Exception as e:
        logger.error(f"Failed to start CLIP service: {e}")
        raise
    finally:
        # Shutdown
        logger.info("Shutting down CLIP service...")
        if clip_service and clip_service.redis_client:
            clip_service.redis_client.close()

# Create FastAPI app with lifespan management
app = FastAPI(
    title="Production OpenCLIP Service",
    description="Production-ready CLIP embedding service for character consistency",
    version="1.0.0",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv('ALLOWED_ORIGINS', '*').split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Middleware for request tracking
@app.middleware("http")
async def track_requests(request: Request, call_next):
    start_time = time.time()
    ACTIVE_CONNECTIONS.inc()
    
    try:
        response = await call_next(request)
        
        # Track metrics
        duration = time.time() - start_time
        REQUEST_LATENCY.observe(duration)
        REQUEST_COUNT.labels(
            method=request.method, 
            endpoint=request.url.path
        ).inc()
        
        return response
    finally:
        ACTIVE_CONNECTIONS.dec()

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint with comprehensive status"""
    if not clip_service:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    return clip_service.get_health_status()

# Metrics endpoint for Prometheus
@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

# Text embedding endpoint
@app.post("/embed/text")
async def embed_text(request: TextEmbeddingRequest):
    """Generate text embeddings"""
    if not clip_service:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        embeddings = await clip_service.encode_text(request.text, request.cache_key)
        
        # Return as list of lists for multiple texts
        if isinstance(request.text, list):
            result = embeddings.tolist()
        else:
            result = embeddings[0].tolist()
        
        return {
            'embeddings': result,
            'dimension': clip_service.embedding_dim
        }
    except Exception as e:
        logger.error(f"Text embedding failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Image embedding endpoint
@app.post("/embed/image")
async def embed_image(request: ImageEmbeddingRequest):
    """Generate image embeddings"""
    if not clip_service:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        embedding = await clip_service.encode_image(request.image, request.cache_key)
        
        return {
            'embedding': embedding.tolist(),
            'dimension': clip_service.embedding_dim
        }
    except Exception as e:
        logger.error(f"Image embedding failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Multimodal embedding endpoint
@app.post("/embed/multimodal")
async def embed_multimodal(request: MultimodalRequest):
    """Generate both text and image embeddings"""
    if not clip_service:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        text_embedding = await clip_service.encode_text(request.text)
        image_embedding = await clip_service.encode_image(request.image)
        
        # Calculate cross-modal similarity
        similarity = float(np.dot(text_embedding[0], image_embedding))
        
        return {
            'text_embedding': text_embedding[0].tolist(),
            'image_embedding': image_embedding.tolist(),
            'cross_modal_similarity': similarity
        }
    except Exception as e:
        logger.error(f"Multimodal embedding failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Batch processing endpoint
@app.post("/embed/batch")
async def embed_batch(request: BatchRequest):
    """Batch process multiple embeddings"""
    if not clip_service:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        embeddings = await clip_service.batch_encode(request.items, request.batch_type)
        
        return {
            'embeddings': [emb.tolist() for emb in embeddings],
            'dimension': clip_service.embedding_dim,
            'count': len(embeddings)
        }
    except Exception as e:
        logger.error(f"Batch embedding failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Character consistency endpoint
@app.post("/character/consistency")
async def check_character_consistency(request: ConsistencyRequest):
    """Check character consistency between generated and reference images"""
    if not clip_service:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        # Generate embedding for the generated image
        gen_embedding = await clip_service.encode_image(request.generated_image)
        
        # Calculate similarities with reference images
        image_similarities = []
        for ref_image in request.reference_images:
            ref_embedding = await clip_service.encode_image(ref_image)
            similarity = float(np.dot(gen_embedding, ref_embedding))
            image_similarities.append(similarity)
        
        # Calculate text similarity if provided
        text_similarity = None
        if request.text_description:
            text_embedding = await clip_service.encode_text(request.text_description)
            text_similarity = float(np.dot(gen_embedding, text_embedding[0]))
        
        # Calculate overall consistency score
        avg_image_similarity = np.mean(image_similarities) if image_similarities else 0
        consistency_score = avg_image_similarity
        
        if text_similarity is not None:
            # Weight: 70% image similarity, 30% text similarity
            consistency_score = 0.7 * avg_image_similarity + 0.3 * text_similarity
        
        passed = consistency_score >= request.threshold
        
        return {
            'consistency_score': float(consistency_score),
            'image_similarities': image_similarities,
            'text_similarity': text_similarity,
            'passed': passed,
            'threshold': request.threshold,
            'embedding': gen_embedding.tolist()
        }
    except Exception as e:
        logger.error(f"Consistency check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Similarity calculation endpoint
@app.post("/similarity")
async def calculate_similarity(request: SimilarityRequest):
    """Calculate cosine similarity between two embeddings"""
    try:
        # Convert to numpy arrays
        emb1 = np.array(request.embedding1)
        emb2 = np.array(request.embedding2)
        
        # Normalize if not already normalized
        emb1 = emb1 / np.linalg.norm(emb1)
        emb2 = emb2 / np.linalg.norm(emb2)
        
        # Calculate cosine similarity
        similarity = float(np.dot(emb1, emb2))
        
        return {'similarity': similarity}
    except Exception as e:
        logger.error(f"Similarity calculation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Search endpoint
@app.post("/search")
async def search_similar(request: SearchRequest):
    """Find most similar embeddings from candidates"""
    try:
        query = np.array(request.query_embedding)
        query = query / np.linalg.norm(query)
        
        similarities = []
        for i, candidate in enumerate(request.candidate_embeddings):
            cand = np.array(candidate)
            cand = cand / np.linalg.norm(cand)
            similarity = float(np.dot(query, cand))
            similarities.append({
                'index': i,
                'similarity': similarity
            })
        
        # Sort by similarity
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        
        return {'results': similarities[:request.top_k]}
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Development server runner
if __name__ == '__main__':
    port = int(os.getenv('PORT', '5000'))
    workers = int(os.getenv('WORKERS', '1'))
    
    config = uvicorn.Config(
        app=app,
        host="0.0.0.0",
        port=port,
        workers=workers,
        log_level="info",
        access_log=True
    )
    
    server = uvicorn.Server(config)
    server.run()