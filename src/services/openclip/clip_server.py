#!/usr/bin/env python3
"""
OpenCLIP Embedding Server for Character Lock System
Production-ready FastAPI microservice with CLIP embeddings
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
from sentence_transformers import SentenceTransformer
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
    batch_type: str = Field(..., regex="^(text|image)$", description="Batch type")

class ProductionCLIPService:
    """
    Production-ready CLIP embedding service with caching, monitoring, and optimization
    """
    
    def __init__(self, model_name: str = "clip-ViT-B-32", enable_cache: bool = True):
        """
        Initialize CLIP model with production optimizations
        Available models:
        - clip-ViT-B-32: Good balance of speed and quality (512 dims)
        - clip-ViT-L-14: Higher quality, slower (768 dims)
        - clip-ViT-B-16: Alternative balanced model
        """
        logger.info(f"Initializing production CLIP service with model: {model_name}")
        
        # Device selection with optimization
        self.device = self._select_optimal_device()
        logger.info(f"Using device: {self.device}")
        
        # Load model with optimization
        self.model_name = model_name
        self.model = self._load_optimized_model(model_name)
        self.embedding_dim = self.model.get_sentence_embedding_dimension()
        
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
    
    def _load_optimized_model(self, model_name: str) -> SentenceTransformer:
        """Load model with optimization settings"""
        model = SentenceTransformer(f'sentence-transformers/{model_name}')
        model.to(self.device)
        
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
        """
        Generate embeddings for text inputs with caching
        """
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
                embeddings = self.model.encode(
                    texts,
                    convert_to_numpy=True,
                    normalize_embeddings=True,
                    batch_size=min(len(texts), self.max_batch_size),
                    show_progress_bar=False
                )
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
        """
        Generate embeddings for image inputs with caching and optimization
        """
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
            
            # Generate embedding
            with torch.no_grad():
                embedding = self.model.encode(
                    [image],
                    convert_to_numpy=True,
                    normalize_embeddings=True,
                    batch_size=1,
                    show_progress_bar=False
                )
                
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
    
    async def encode_multimodal(self, text: str, image_data: Union[str, bytes, Image.Image], cache_key: Optional[str] = None) -> dict:
        """
        Generate both text and image embeddings for multimodal comparison
        """
        text_embedding = self.encode_text(text)[0]
        image_embedding = self.encode_image(image_data)
        
        # Calculate cross-modal similarity
        similarity = float(np.dot(text_embedding, image_embedding))
        
        return {
            'text_embedding': text_embedding.tolist(),
            'image_embedding': image_embedding.tolist(),
            'cross_modal_similarity': similarity
        }
    
    def calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Calculate cosine similarity between two embeddings
        """
        # Convert to numpy arrays
        emb1 = np.array(embedding1)
        emb2 = np.array(embedding2)
        
        # Normalize if not already normalized
        emb1 = emb1 / np.linalg.norm(emb1)
        emb2 = emb2 / np.linalg.norm(emb2)
        
        # Calculate cosine similarity
        similarity = float(np.dot(emb1, emb2))
        
        return similarity
    
    def find_most_similar(self, query_embedding: List[float], 
                         candidate_embeddings: List[List[float]], 
                         top_k: int = 5) -> List[dict]:
        """
        Find the most similar embeddings from a list of candidates
        """
        query = np.array(query_embedding)
        query = query / np.linalg.norm(query)
        
        similarities = []
        for i, candidate in enumerate(candidate_embeddings):
            cand = np.array(candidate)
            cand = cand / np.linalg.norm(cand)
            similarity = float(np.dot(query, cand))
            similarities.append({
                'index': i,
                'similarity': similarity
            })
        
        # Sort by similarity
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        
        return similarities[:top_k]

# Initialize the service
clip_service = CLIPEmbeddingService()

# API Routes

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model': 'clip-ViT-B-32',
        'embedding_dim': clip_service.embedding_dim,
        'device': clip_service.device
    })

@app.route('/embed/text', methods=['POST'])
def embed_text():
    """Generate text embeddings"""
    try:
        data = request.json
        texts = data.get('texts', data.get('text'))
        
        if not texts:
            return jsonify({'error': 'No text provided'}), 400
        
        embeddings = clip_service.encode_text(texts)
        
        # Return as list of lists for multiple texts
        if isinstance(texts, list):
            result = embeddings.tolist()
        else:
            result = embeddings[0].tolist()
        
        return jsonify({
            'embeddings': result,
            'dimension': clip_service.embedding_dim
        })
    
    except Exception as e:
        logger.error(f"Error in embed_text: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/embed/image', methods=['POST'])
def embed_image():
    """Generate image embeddings"""
    try:
        data = request.json
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'error': 'No image provided'}), 400
        
        embedding = clip_service.encode_image(image_data)
        
        return jsonify({
            'embedding': embedding.tolist(),
            'dimension': clip_service.embedding_dim
        })
    
    except Exception as e:
        logger.error(f"Error in embed_image: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/embed/multimodal', methods=['POST'])
def embed_multimodal():
    """Generate both text and image embeddings"""
    try:
        data = request.json
        text = data.get('text')
        image_data = data.get('image')
        
        if not text or not image_data:
            return jsonify({'error': 'Both text and image required'}), 400
        
        result = clip_service.encode_multimodal(text, image_data)
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in embed_multimodal: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/similarity', methods=['POST'])
def calculate_similarity():
    """Calculate similarity between two embeddings"""
    try:
        data = request.json
        embedding1 = data.get('embedding1')
        embedding2 = data.get('embedding2')
        
        if not embedding1 or not embedding2:
            return jsonify({'error': 'Two embeddings required'}), 400
        
        similarity = clip_service.calculate_similarity(embedding1, embedding2)
        
        return jsonify({
            'similarity': similarity
        })
    
    except Exception as e:
        logger.error(f"Error in calculate_similarity: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/search', methods=['POST'])
def search_similar():
    """Find most similar embeddings from candidates"""
    try:
        data = request.json
        query_embedding = data.get('query_embedding')
        candidate_embeddings = data.get('candidate_embeddings')
        top_k = data.get('top_k', 5)
        
        if not query_embedding or not candidate_embeddings:
            return jsonify({'error': 'Query and candidate embeddings required'}), 400
        
        results = clip_service.find_most_similar(
            query_embedding, 
            candidate_embeddings, 
            top_k
        )
        
        return jsonify({
            'results': results
        })
    
    except Exception as e:
        logger.error(f"Error in search_similar: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/character/consistency', methods=['POST'])
def check_character_consistency():
    """
    Special endpoint for character consistency checking
    Compares a generated image against reference images
    """
    try:
        data = request.json
        generated_image = data.get('generated_image')
        reference_images = data.get('reference_images', [])
        text_description = data.get('text_description')
        threshold = data.get('threshold', 0.85)
        
        if not generated_image:
            return jsonify({'error': 'Generated image required'}), 400
        
        # Generate embedding for the generated image
        gen_embedding = clip_service.encode_image(generated_image)
        
        # Calculate similarities with reference images
        image_similarities = []
        for ref_image in reference_images:
            ref_embedding = clip_service.encode_image(ref_image)
            similarity = float(np.dot(gen_embedding, ref_embedding))
            image_similarities.append(similarity)
        
        # Calculate text similarity if provided
        text_similarity = None
        if text_description:
            text_embedding = clip_service.encode_text(text_description)[0]
            text_similarity = float(np.dot(gen_embedding, text_embedding))
        
        # Calculate overall consistency score
        avg_image_similarity = np.mean(image_similarities) if image_similarities else 0
        consistency_score = avg_image_similarity
        
        if text_similarity is not None:
            # Weight: 70% image similarity, 30% text similarity
            consistency_score = 0.7 * avg_image_similarity + 0.3 * text_similarity
        
        passed = consistency_score >= threshold
        
        return jsonify({
            'consistency_score': float(consistency_score),
            'image_similarities': image_similarities,
            'text_similarity': text_similarity,
            'passed': passed,
            'threshold': threshold,
            'embedding': gen_embedding.tolist()
        })
    
    except Exception as e:
        logger.error(f"Error in check_character_consistency: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('CLIP_PORT', 5000))
    logger.info(f"Starting CLIP server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)