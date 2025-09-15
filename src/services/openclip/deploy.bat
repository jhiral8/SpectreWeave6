@echo off
echo Deploying OpenCLIP service to Azure Container Instance...

az container create ^
  --resource-group rg-openclip-service ^
  --name openclip-service ^
  --image openclipspectreweave.azurecr.io/openclip-service:stable ^
  --os-type Linux ^
  --cpu 4 ^
  --memory 16 ^
  --ports 5000 ^
  --dns-name-label openclip-spectreweave ^
  --location swedencentral ^
  --registry-login-server openclipspectreweave.azurecr.io ^
  --registry-username openclipspectreweave ^
  --registry-password "%AZURE_REGISTRY_PASSWORD%" ^
  --environment-variables PORT=5000 WORKERS=2 LOG_LEVEL=INFO CLIP_MODEL=clip-ViT-B-32 ENABLE_CACHE=true

echo Deployment completed!
echo Service will be available at: http://openclip-spectreweave.swedencentral.azurecontainer.io:5000
pause