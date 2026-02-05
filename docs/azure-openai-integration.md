# Azure OpenAI Integration Guide

This guide explains how to use **Azure OpenAI** instead of standard OpenAI with Synapse. Azure OpenAI provides enterprise-grade features including private networking, regional deployment, and Microsoft's security/compliance guarantees.

## ⚠️ Important: Not a Drop-in Replacement

**Azure OpenAI is NOT a direct drop-in replacement for standard OpenAI.** While they use compatible APIs, Azure OpenAI requires:

1. Different endpoint structure
2. Deployment names instead of model names
3. API version parameter in configuration
4. Authentication via API key OR Microsoft Entra ID

## Prerequisites

### 1. Azure OpenAI Resource

You need an Azure subscription with Azure OpenAI access:

1. **Request Access**: Azure OpenAI requires approval - [Apply here](https://aka.ms/oai/access)
2. **Create Resource**: Once approved, create an Azure OpenAI resource in Azure Portal
3. **Deploy Models**: Deploy the models you need (e.g., gpt-4, text-embedding-ada-002)

### 2. Required Deployments

Synapse requires **two deployments**:

- **Chat Model**: gpt-4, gpt-4-turbo, or gpt-3.5-turbo
- **Embedding Model**: text-embedding-ada-002 or text-embedding-3-small

### 3. Get Configuration Values

From your Azure OpenAI resource:

```
Endpoint: https://<your-resource-name>.openai.azure.com
API Key: Found in "Keys and Endpoint" section
Deployment Names: The names you gave your model deployments
```

## Environment Configuration

### Option 1: Azure OpenAI with API Key (Recommended for Getting Started)

Update your `.env` file:

```bash
# ====================================
# AZURE OPENAI CONFIGURATION
# ====================================

# Azure OpenAI Endpoint (NOT the standard OpenAI API)
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com

# Azure OpenAI API Key (from Azure Portal)
AZURE_OPENAI_API_KEY=your-azure-openai-api-key-here

# API Version (use latest stable version)
AZURE_OPENAI_API_VERSION=2024-07-01-preview

# Deployment Names (NOT model names like "gpt-4")
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4-deployment-name
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-deployment-name

# Enable Azure OpenAI mode
USE_AZURE_OPENAI=true
```

### Option 2: Azure OpenAI with Microsoft Entra ID (Recommended for Production)

For enhanced security using managed identities:

```bash
# ====================================
# AZURE OPENAI WITH ENTRA ID
# ====================================

AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-07-01-preview
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4-deployment-name
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-deployment-name

# Enable Azure OpenAI mode
USE_AZURE_OPENAI=true

# Entra ID authentication (no API key needed)
AZURE_OPENAI_USE_ENTRA=true

# Optional: Specific tenant/client ID for service principal
AZURE_CLIENT_ID=your-client-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_SECRET=your-client-secret
```

## Code Changes Required

### 1. Update AI Service Configuration

Modify `apps/backend/src/config/configuration.ts`:

```typescript
export const config = {
  // Existing OpenAI config
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4',
    // ... existing config
  },

  // NEW: Azure OpenAI config
  azureOpenai: {
    enabled: process.env.USE_AZURE_OPENAI === 'true',
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-07-01-preview',
    chatDeployment: process.env.AZURE_OPENAI_CHAT_DEPLOYMENT,
    embeddingDeployment: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
    useEntraId: process.env.AZURE_OPENAI_USE_ENTRA === 'true',
  },
};
```

### 2. Update AI Service Implementation

Modify `apps/backend/src/services/aiService.ts`:

```typescript
import { OpenAI, AzureOpenAI } from 'openai';
import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity';
import { config } from '../config/configuration';

class AIService {
  private client: OpenAI | AzureOpenAI;

  constructor() {
    if (config.azureOpenai.enabled) {
      this.client = this.createAzureClient();
    } else {
      this.client = this.createStandardClient();
    }
  }

  private createAzureClient(): AzureOpenAI {
    if (config.azureOpenai.useEntraId) {
      // Microsoft Entra ID authentication (recommended for production)
      const credential = new DefaultAzureCredential();
      const tokenProvider = getBearerTokenProvider(
        credential,
        'https://cognitiveservices.azure.com/.default'
      );

      return new OpenAI({
        baseURL: `${config.azureOpenai.endpoint}/openai/v1/`,
        apiKey: tokenProvider as any,
      });
    } else {
      // API Key authentication
      return new AzureOpenAI({
        endpoint: config.azureOpenai.endpoint,
        apiKey: config.azureOpenai.apiKey,
        apiVersion: config.azureOpenai.apiVersion,
      });
    }
  }

  private createStandardClient(): OpenAI {
    return new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  async generateResponse(messages: any[]): Promise<string> {
    const modelName = config.azureOpenai.enabled
      ? config.azureOpenai.chatDeployment // Use deployment name for Azure
      : config.openai.model; // Use model name for standard OpenAI

    const completion = await this.client.chat.completions.create({
      model: modelName,
      messages,
      max_tokens: config.openai.maxTokens,
      temperature: config.openai.temperature,
    });

    return completion.choices[0]?.message?.content || '';
  }

  // ... rest of service methods
}

export default new AIService();
```

### 3. Update Embedding Service

Modify `apps/backend/src/services/embeddingService.ts`:

```typescript
import { OpenAI, AzureOpenAI } from 'openai';
import { config } from '../config/configuration';

class EmbeddingService {
  private client: OpenAI | AzureOpenAI;

  constructor() {
    if (config.azureOpenai.enabled) {
      this.client = this.createAzureClient();
    } else {
      this.client = this.createStandardClient();
    }
  }

  private createAzureClient(): AzureOpenAI {
    // Same implementation as aiService.ts
  }

  private createStandardClient(): OpenAI {
    return new OpenAI({ apiKey: config.openai.apiKey });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const modelName = config.azureOpenai.enabled
      ? config.azureOpenai.embeddingDeployment
      : 'text-embedding-ada-002';

    const response = await this.client.embeddings.create({
      model: modelName,
      input: text,
    });

    return response.data[0].embedding;
  }

  // ... rest of service methods
}

export default new EmbeddingService();
```

### 4. Install Azure Dependencies

Update `apps/backend/package.json`:

```json
{
  "dependencies": {
    "openai": "^4.76.0",
    "@azure/identity": "^4.5.0",
    "@azure/openai": "^2.0.0-beta.2"
  }
}
```

Then install:

```bash
cd apps/backend
pnpm install
```

## Deployment on Azure

### One-Click Deployment with Azure OpenAI

When using the [Azure deployment button](../README.md#quick-deploy-to-cloud-1-click), the Azure OpenAI resource is **NOT automatically provisioned**. You must:

1. **Before Deployment**: Create Azure OpenAI resource and deploy models
2. **During Deployment**: Enter Azure OpenAI configuration in deployment form
3. **After Deployment**: Verify connection via health check

### Manual Azure Deployment

1. Create Azure OpenAI resource:

```bash
az cognitiveservices account create \
  --name synapse-openai \
  --resource-group synapse-rg \
  --kind OpenAI \
  --sku S0 \
  --location eastus
```

2. Deploy chat model:

```bash
az cognitiveservices account deployment create \
  --name synapse-openai \
  --resource-group synapse-rg \
  --deployment-name gpt-4-deployment \
  --model-name gpt-4 \
  --model-version "0613" \
  --model-format OpenAI \
  --scale-settings-scale-type "Standard"
```

3. Deploy embedding model:

```bash
az cognitiveservices account deployment create \
  --name synapse-openai \
  --resource-group synapse-rg \
  --deployment-name embedding-deployment \
  --model-name text-embedding-ada-002 \
  --model-version "2" \
  --model-format OpenAI \
  --scale-settings-scale-type "Standard"
```

4. Get endpoint and key:

```bash
# Get endpoint
az cognitiveservices account show \
  --name synapse-openai \
  --resource-group synapse-rg \
  --query properties.endpoint

# Get key
az cognitiveservices account keys list \
  --name synapse-openai \
  --resource-group synapse-rg \
  --query key1
```

## Cost Considerations

### Azure OpenAI Pricing (as of 2024)

| Model                  | Input (per 1K tokens) | Output (per 1K tokens) |
| ---------------------- | --------------------- | ---------------------- |
| GPT-4 Turbo            | $0.01                 | $0.03                  |
| GPT-4 (8K)             | $0.03                 | $0.06                  |
| GPT-3.5 Turbo          | $0.0005               | $0.0015                |
| text-embedding-ada-002 | $0.0001               | N/A                    |
| text-embedding-3-small | $0.00002              | N/A                    |

### Cost Comparison: Azure vs Standard OpenAI

✅ **Azure OpenAI Advantages**:

- Same pricing as standard OpenAI
- Enterprise SLA (99.9% uptime)
- Private networking (VNET integration)
- Microsoft compliance (HIPAA, SOC 2, ISO 27001)
- Regional data residency
- Lower latency for Azure-hosted apps

❌ **Azure OpenAI Limitations**:

- Requires Azure subscription
- Approval process for access
- Manual model deployment required
- Limited regional availability

## Troubleshooting

### Error: "The API deployment for this resource does not exist"

**Cause**: Using model name instead of deployment name.

**Fix**: Use your deployment name:

```typescript
// ❌ Wrong - using model name
model: 'gpt-4';

// ✅ Correct - using deployment name
model: 'gpt-4-deployment'; // Your actual deployment name
```

### Error: "Unauthorized" or "InvalidAuthenticationToken"

**Causes**:

1. Wrong API key
2. Expired Entra ID token
3. Wrong endpoint URL

**Fix**:

```bash
# Verify endpoint format
echo $AZURE_OPENAI_ENDPOINT
# Should be: https://your-resource-name.openai.azure.com
# NOT: https://your-resource-name.openai.azure.com/openai/deployments/...

# Test with curl
curl "$AZURE_OPENAI_ENDPOINT/openai/deployments/gpt-4-deployment/chat/completions?api-version=2024-07-01-preview" \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_OPENAI_API_KEY" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 10
  }'
```

### Error: "Resource not found" or 404

**Cause**: Wrong API version or deployment doesn't exist.

**Fix**:

1. Verify deployment exists in Azure Portal
2. Use correct API version: `2024-07-01-preview` or later
3. Check endpoint format

### Performance: Slower than standard OpenAI

**Solutions**:

1. **Use Azure region closest to your app**: Deploy Azure OpenAI in same region as backend
2. **Enable connection pooling**: Reuse client instances
3. **Use streaming for chat**: Reduce perceived latency
4. **Upgrade SKU**: Consider provisioned throughput for high-traffic apps

### Error: "Rate limit exceeded"

**Cause**: Azure OpenAI deployments have configurable rate limits.

**Fix**:

1. Check your deployment's Tokens-Per-Minute (TPM) quota in Azure Portal
2. Increase TPM quota if needed
3. Implement retry logic with exponential backoff

## Regional Availability

Azure OpenAI is available in limited regions. Check [official documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models#model-summary-table-and-region-availability) for current availability.

**Recommended Regions** (as of 2024):

- East US
- East US 2
- West Europe
- UK South
- France Central

## Security Best Practices

### 1. Use Microsoft Entra ID (Not API Keys)

For production deployments:

```typescript
// ✅ Recommended: Managed Identity
const credential = new DefaultAzureCredential();

// ❌ Avoid: API keys in environment variables
const apiKey = process.env.AZURE_OPENAI_API_KEY;
```

### 2. Enable Private Endpoints

Disable public access and use private endpoints:

```bash
az cognitiveservices account update \
  --name synapse-openai \
  --resource-group synapse-rg \
  --public-network-access Disabled

az network private-endpoint create \
  --name synapse-openai-pe \
  --resource-group synapse-rg \
  --vnet-name synapse-vnet \
  --subnet backend-subnet \
  --private-connection-resource-id <openai-resource-id> \
  --group-id account \
  --connection-name synapse-openai-connection
```

### 3. Enable Diagnostic Logging

Monitor API usage and errors:

```bash
az monitor diagnostic-settings create \
  --name synapse-openai-diagnostics \
  --resource <openai-resource-id> \
  --logs '[{"category": "Audit", "enabled": true}]' \
  --metrics '[{"category": "AllMetrics", "enabled": true}]' \
  --workspace <log-analytics-workspace-id>
```

## Next Steps

- **Local Development**: See [Docker Deployment Guide](./docker-deploy.md)
- **Offline Mode**: See [Local/Offline Deployment Guide](./local-offline-deployment.md)
- **Production Deployment**: See [One-Click Deployment Guide](./one-click-deploy.md)

## Support

If you encounter issues with Azure OpenAI integration:

1. Check the [Azure OpenAI documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
2. Review the [API reference](https://learn.microsoft.com/en-us/azure/ai-services/openai/reference)
3. Open an issue on the [Synapse GitHub repository](https://github.com/yourusername/synapse/issues)
