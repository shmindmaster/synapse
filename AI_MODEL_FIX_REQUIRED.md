# 🔴 CRITICAL: AI Model Configuration Fix Required

**Status:** ⚠️ **ACTION REQUIRED**  
**Priority:** 🔴 **HIGH**  
**Issue:** All AI features returning `404 model not found` error

---

## 🐛 Problem

The AI model environment variable is using an incorrect format that DigitalOcean Serverless Inference API doesn't recognize.

**Current (Wrong):**
```bash
AI_MODEL=llama-3.1-8b-instruct  # ❌ Wrong format (has dots)
```

**Expected (Correct):**
```bash
AI_MODEL=llama3-8b-instruct  # ✅ Correct format (no dots)
```

---

## 💥 Impact

**Affected Features:**
- ❌ AI Chat (`/api/chat`)
- ❌ Document Classification (`/api/classify-document`)
- ❌ Multi-Document Synthesis (`/api/synthesize-documents`)
- ❌ Smart Recommendations (`/api/smart-recommendations`)
- ❌ Document Analysis (`/api/analyze`)

**Error Message:**
```json
{"success": false, "message": "404 model not found"}
```

---

## ✅ Solution

### Option 1: Via DigitalOcean Control Panel (Recommended)

1. Go to: https://cloud.digitalocean.com/apps/9c1f52d4-21ce-4904-8247-f378edcec6cf/settings
2. Click **"Environment Variables"** tab
3. Find and update these variables:

```bash
AI_MODEL=llama3-8b-instruct
AI_MODEL_CHAT=llama3-8b-instruct
AI_MODEL_HEAVY=llama3-70b-instruct
```

4. Click **"Save"**
5. The app will automatically redeploy (~4 minutes)

### Option 2: Via doctl CLI

```powershell
# Create new app spec with correct model names
doctl apps update 9c1f52d4-21ce-4904-8247-f378edcec6cf --spec do-app-spec.yaml
```

**Note:** Ensure `do-app-spec.yaml` has the correct model names before running.

### Option 3: Via API (Advanced)

See `scripts/update-ai-model.sh` for API update script.

---

## 🧪 Verification Steps

After deployment completes:

### 1. Check Health Endpoint
```bash
curl https://synapse.shtrial.com/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "Synapse API",
  "version": "2.0.0",
  "aiProvider": "digitalocean",
  "aiModel": "llama3-8b-instruct",  # ← Should show corrected name
  "embeddingsAvailable": false
}
```

### 2. Test AI Chat Endpoint
```bash
curl -X POST https://synapse.shtrial.com/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "Hello, test",
    "filePath": "/tmp/test.txt",
    "message": "test"
  }'
```

**Expected:** Should return AI response, NOT `404 model not found`

### 3. Test Document Classification
```bash
curl -X POST https://synapse.shtrial.com/api/classify-document \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "This is a test document about AI and machine learning.",
    "fileName": "test.txt"
  }'
```

**Expected:** Should return classification result with document type and confidence score

---

## 📚 Background: Why This Happened

### Model Name Format Rules

DigitalOcean Serverless Inference uses a specific model naming convention:

| Provider | Format | Example |
|----------|--------|---------|
| Meta LLaMA | `llama{major}-{size}b-instruct` | `llama3-8b-instruct` |
| OpenAI | `openai-{model}` | `openai-gpt-4o-mini` |
| Anthropic | `anthropic-{model}` | `anthropic-claude-3-5-sonnet` |
| Mistral | `mistral-{size}b-instruct-v{version}` | `mistral-7b-instruct-v0.2` |

**Key Rules:**
1. **No version dots**: `3.1` → `3`
2. **Lowercase only**: No capitals
3. **Hyphens for separation**: Not underscores or dots
4. **Instruct suffix**: For chat models

### Source of Truth

Official documentation:
- [DigitalOcean Serverless Inference Tutorial](https://www.digitalocean.com/community/tutorials/serverless-inference-openai-sdk)
- [Model List API](https://gradient-sdk.digitalocean.com/api/resources/models/methods/list)

---

## 🔧 Technical Details

### Environment Variables to Update

```bash
# Global app-level variables (affects all services)
AI_MODEL=llama3-8b-instruct              # Primary chat model
AI_MODEL_CHAT=llama3-8b-instruct         # Explicit chat model
AI_MODEL_HEAVY=llama3-70b-instruct       # Heavy workloads
AI_MODEL_EMBEDDINGS=gte-large-en-v1.5    # Already correct
AI_PROVIDER=digitalocean                 # Already correct
```

### Files Affected

The following files reference the AI model configuration:
- `apps/backend/server.js` (line 60): `const chatModel = process.env.AI_MODEL_CHAT || process.env.AI_MODEL`
- `do-app-spec.yaml` (env section): Contains environment variable definitions

### No Code Changes Required

The application code is already correct and uses the environment variables properly. Only the environment variable **values** need updating in the DigitalOcean App Platform settings.

---

## 📊 Deployment Impact

**Estimated Time:** ~4 minutes
- Build: ~2m 20s
- Deploy: ~1m 40s

**Downtime:** None (zero-downtime deployment)

**Services Affected:** 
- All AI-powered endpoints will start working

**Risk Level:** 🟢 **Low** (only changing environment variables)

---

## 🚨 Rollback Plan

If something goes wrong:

### Revert to Previous Values
```bash
AI_MODEL=llama-3.1-8b-instruct  # Old (broken) value
```

### Or Use Alternative Model
```bash
AI_MODEL=mistral-7b-instruct-v0.2  # Try Mistral instead
```

### Emergency Fallback
If all DigitalOcean models fail, add OpenAI API key:
```bash
OPENAI_API_KEY=sk-your-key-here
AI_PROVIDER=openai
AI_MODEL=gpt-3.5-turbo
```

---

## 📞 Support

**App Details:**
- App ID: `9c1f52d4-21ce-4904-8247-f378edcec6cf`
- Region: `nyc` (New York)
- Current Status: Active but AI broken

**Control Panel:**
https://cloud.digitalocean.com/apps/9c1f52d4-21ce-4904-8247-f378edcec6cf

**Logs:**
```bash
doctl apps logs 9c1f52d4-21ce-4904-8247-f378edcec6cf --type run --tail
```

---

## ✅ Checklist

- [ ] Updated `AI_MODEL` to `llama3-8b-instruct`
- [ ] Updated `AI_MODEL_CHAT` to `llama3-8b-instruct`
- [ ] Updated `AI_MODEL_HEAVY` to `llama3-70b-instruct`
- [ ] Saved changes in App Platform
- [ ] Waited for deployment to complete (~4 min)
- [ ] Verified health endpoint shows new model name
- [ ] Tested AI chat endpoint
- [ ] Tested document classification
- [ ] Updated `do-app-spec.yaml` for future deployments
- [ ] Documented fix in git commit

---

**Created:** 2025-12-05  
**Issue ID:** AI-MODEL-404  
**Severity:** High  
**Status:** Awaiting manual fix via control panel
