# Simple Azure Deployment (No Docker Required)

Since we're having Docker issues, let's use the Azure Portal build feature which is much more reliable.

## Step 1: Create ZIP Package

1. **Navigate to**: `C:\Users\craig\Documents\SpectreWeave5\src\services\openclip\`
2. **Select all files** in the folder
3. **Right-click → Send to → Compressed folder**
4. **Name it**: `openclip-service.zip`

## Step 2: Azure Container Registry Quick Build

1. **Go to your ACR** (`openclipspectreweave`) in Azure Portal
2. **Navigate to**: "Tasks" → "Quick tasks"
3. **Click**: "Quick build"
4. **Fill in**:
   - **Source location**: "Upload a local file"
   - **Upload** the `openclip-service.zip` file
   - **Dockerfile**: `Dockerfile.production`
   - **Image**: `openclip-service:latest`
   - **Platform**: `linux`

5. **Click "Run"** - Azure will build the image for you!

## Step 3: Monitor Build

1. **Watch the build logs** in the Azure Portal
2. **Wait for completion** (takes 5-10 minutes)
3. **Check "Repositories"** - you should see `openclip-service` listed

## Step 4: Create Container Instance

1. **Go to "Container Instances"** in Azure Portal
2. **Click "Create"**
3. **Fill in**:
   - **Container name**: `openclip-service`
   - **Region**: `East US 2`
   - **Image source**: `Azure Container Registry`
   - **Registry**: `openclipspectreweave`
   - **Image**: `openclip-service`
   - **Tag**: `latest`

4. **Advanced settings**:
   - **CPU cores**: `2`
   - **Memory**: `4 GB`
   - **Restart policy**: `Always`

5. **Networking**:
   - **Networking type**: `Public`
   - **DNS name**: `openclip-spectreweave` (or any unique name)
   - **Port**: `5000` (Public)

6. **Click "Review + create"** → **"Create"**

## Step 5: Test Service

Your service will be available at:
```
http://openclip-spectreweave.eastus2.azurecontainer.io:5000
```

Test endpoints:
- **Health**: `http://your-dns:5000/health`
- **Docs**: `http://your-dns:5000/docs`

## If Build Fails

Common fixes:
1. **Check ZIP contents** - make sure all files are at the root level
2. **Verify Dockerfile.production** exists in ZIP
3. **Check build logs** in Azure Portal for specific errors
4. **Try smaller ZIP** - exclude unnecessary files

## Alternative: Use Existing Docker Image

If building fails, we can use a pre-built OpenCLIP image:

1. **Create Container Instance** with:
   - **Image**: `huggingface/transformers-pytorch-cpu:latest`
   - **Command**: Custom startup command to install and run OpenCLIP

This approach bypasses all Docker and build issues completely!