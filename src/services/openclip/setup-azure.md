# Azure OpenCLIP Service Setup Guide

## Prerequisites

1. **Azure CLI installed**: [Download here](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **Docker installed**: For building the container image
3. **Azure subscription**: Active Azure subscription

## Step 1: Login to Azure

```bash
az login
az account list --output table
az account set --subscription "your-subscription-id"
```

## Step 2: Create Azure Container Registry (ACR)

```bash
# Create resource group for ACR
az group create --name rg-openclip-acr --location eastus2

# Create container registry
az acr create --resource-group rg-openclip-acr --name youruniqueacr --sku Basic

# Enable admin user (for easy authentication)
az acr update --name youruniqueacr --admin-enabled true
```

## Step 3: Create Resource Group for Container Instance

```bash
# Create resource group for the service
az group create --name rg-openclip-service --location eastus2
```

## Step 4: Configure Environment

Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```bash
ACR_NAME=youruniqueacr
ACR_RESOURCE_GROUP=rg-openclip-acr
ACI_RESOURCE_GROUP=rg-openclip-service
ACI_NAME=openclip-service
ACI_LOCATION=eastus2
AZURE_SUBSCRIPTION_ID=your-subscription-id
```

## Step 5: Deploy the Service

```bash
# Run the deployment
npm run azure:deploy
```

## Step 6: Test the Service

Once deployed, the script will provide the service URL. Test it:

```bash
# Health check
curl http://your-service-dns:5000/health

# Test embedding generation
curl -X POST http://your-service-dns:5000/embeddings \
  -H "Content-Type: application/json" \
  -d '{"text": "a red fox character"}'
```

## Troubleshooting

### If ACR_NAME error occurs:
1. Make sure you've created the `.env` file
2. Check that all required variables are set
3. Verify Azure CLI is logged in: `az account show`

### If deployment fails:
1. Check resource group exists: `az group exists --name rg-openclip-service`
2. Verify ACR exists: `az acr show --name youruniqueacr`
3. Check subscription access: `az account show`

### Manual cleanup:
```bash
# Delete container instance
az container delete --resource-group rg-openclip-service --name openclip-service --yes

# Delete resource groups
az group delete --name rg-openclip-service --yes
az group delete --name rg-openclip-acr --yes
```

## Cost Estimates

- **Azure Container Registry (Basic)**: ~$5/month
- **Container Instance (2 CPU, 4GB RAM)**: ~$60/month (running 24/7)
- **Storage Account**: ~$2/month
- **Total**: ~$67/month

To reduce costs:
- Use Azure Container Instances with scheduled scaling
- Consider Azure Container Apps for auto-scaling
- Use spot instances if available