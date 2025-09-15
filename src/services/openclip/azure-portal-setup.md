# Azure Portal Setup Guide for OpenCLIP Service

## Step 1: Create Azure Container Registry (ACR)

1. **Go to Azure Portal**: https://portal.azure.com
2. **Click "Create a resource"**
3. **Search for "Container Registry"** and select it
4. **Click "Create"**
5. **Fill in the details:**
   - **Subscription**: Your Azure subscription
   - **Resource group**: Create new → `rg-openclip-acr`
   - **Registry name**: `youruniqueacr` (must be globally unique)
   - **Location**: `East US 2`
   - **SKU**: `Basic`
6. **Click "Review + create"** → **"Create"**

## Step 2: Enable ACR Admin User

1. **Go to your Container Registry** (once created)
2. **Navigate to "Access keys"** (left sidebar)
3. **Toggle "Admin user"** to **Enabled**
4. **Note down:**
   - Login server (e.g., `youruniqueacr.azurecr.io`)
   - Username
   - Password

## Step 3: Create Resource Group for Container Instance

1. **Go to "Resource groups"** in Azure Portal
2. **Click "Create"**
3. **Fill in:**
   - **Subscription**: Your subscription
   - **Resource group**: `rg-openclip-service`
   - **Region**: `East US 2`
4. **Click "Review + create"** → **"Create"**

## Step 4: Upload Docker Image (Manual Method)

Since CLI is problematic, we'll use Docker directly:

### Option A: Build and Push from Local Docker

```bash
# In your project directory: src/services/openclip/
docker login youruniqueacr.azurecr.io
# Enter username/password from Step 2

# Build the image
docker build -f Dockerfile.production -t youruniqueacr.azurecr.io/openclip-service:latest .

# Push to ACR
docker push youruniqueacr.azurecr.io/openclip-service:latest
```

### Option B: Use Azure Container Registry Build (Portal)

1. **Go to your ACR** in Azure Portal
2. **Navigate to "Tasks"** → **"Quick tasks"**
3. **Click "Build"**
4. **Upload source**: Upload a ZIP of the `src/services/openclip/` folder
5. **Dockerfile**: `Dockerfile.production`
6. **Image name**: `openclip-service:latest`
7. **Click "Run"**

## Step 5: Create Container Instance

1. **Go to "Container Instances"** in Azure Portal
2. **Click "Create"**
3. **Basics tab:**
   - **Subscription**: Your subscription
   - **Resource group**: `rg-openclip-service`
   - **Container name**: `openclip-service`
   - **Region**: `East US 2`
   - **Image source**: `Azure Container Registry`
   - **Registry**: Select your ACR (`youruniqueacr`)
   - **Image**: `openclip-service`
   - **Image tag**: `latest`

4. **Advanced tab:**
   - **Restart policy**: `Always`
   - **CPU cores**: `2`
   - **Memory (GB)**: `4`
   - **Environment variables**:
     ```
     CLIP_MODEL=clip-ViT-B-32
     LOG_LEVEL=INFO
     WORKERS=2
     ```

5. **Networking tab:**
   - **Networking type**: `Public`
   - **DNS name label**: `openclip-service-unique` (choose unique name)
   - **Ports**: Add port `5000` (TCP, Public)

6. **Click "Review + create"** → **"Create"**

## Step 6: Test Your Service

1. **Go to your Container Instance** in the portal
2. **Note the FQDN** (e.g., `openclip-service-unique.eastus2.azurecontainer.io`)
3. **Test endpoints:**

### Health Check:
```
http://openclip-service-unique.eastus2.azurecontainer.io:5000/health
```

### Generate Embedding:
```bash
curl -X POST http://openclip-service-unique.eastus2.azurecontainer.io:5000/embeddings \
  -H "Content-Type: application/json" \
  -d '{"text": "a red fox character"}'
```

## Step 7: Update Your Environment Variables

Create `.env` file in `src/services/openclip/`:
```env
# Your deployed service URL
OPENCLIP_SERVICE_URL=http://openclip-service-unique.eastus2.azurecontainer.io:5000

# Azure details (for reference)
ACR_NAME=youruniqueacr
ACI_NAME=openclip-service
ACI_RESOURCE_GROUP=rg-openclip-service
```

## Step 8: Update SpectreWeave5 Configuration

Add to your main project's `.env.local`:
```env
OPENCLIP_SERVICE_URL=http://openclip-service-unique.eastus2.azurecontainer.io:5000
```

## Troubleshooting

### Container Won't Start:
1. **Go to Container Instance** → **"Logs"** tab
2. **Check for errors** in the startup logs
3. **Common issues:**
   - Model download timeout (increase memory to 8GB)
   - Port conflicts (ensure port 5000 is exposed)

### Can't Access Service:
1. **Check networking** - ensure port 5000 is public
2. **Verify DNS name** is correct
3. **Check container status** - should be "Running"

### Performance Issues:
1. **Increase resources**: 4 CPU cores, 8GB RAM
2. **Enable caching** with Redis (optional)
3. **Monitor logs** for bottlenecks

## Cost Optimization

- **Start/Stop manually** when not in use
- **Use Azure Container Apps** for auto-scaling
- **Consider spot instances** for dev/test environments

## Next Steps

Once your service is running:
1. Test the health endpoint
2. Test embedding generation
3. Update your SpectreWeave5 app to use the new service URL
4. Test character consistency in your book generation pipeline

Your OpenCLIP service will now be accessible at:
`http://your-unique-dns-name.eastus2.azurecontainer.io:5000`