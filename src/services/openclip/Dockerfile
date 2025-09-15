# OpenCLIP Server Docker Image
# Lightweight Python image with CLIP model

FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download CLIP model during build to include in image
RUN python -c "from sentence_transformers import SentenceTransformer; model = SentenceTransformer('sentence-transformers/clip-ViT-B-32'); print('Model downloaded successfully')"

# Copy application code
COPY clip_server.py .

# Expose port
EXPOSE 5000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV CLIP_PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import requests; response = requests.get('http://localhost:5000/health'); exit(0 if response.status_code == 200 else 1)"

# Run the server
CMD ["python", "clip_server.py"]