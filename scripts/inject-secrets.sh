#!/bin/bash
# USAGE: ./scripts/inject-secrets.sh
# Reads the root .env and injects ALL Hybrid AI secrets to K8s
set -e

if [ ! -f .env ]; then
  echo "❌ .env file not found at root."
  exit 1
fi

# Load .env variables
export $(grep -v '^#' .env | xargs)

if [ -z "$APP_SLUG" ]; then echo "APP_SLUG missing in .env"; exit 1; fi

echo "💉 Injecting Hybrid AI secrets for ${APP_SLUG} into K8s..."

kubectl create namespace "${APP_SLUG}" --dry-run=client -o yaml | kubectl apply -f -

# Create app-secrets with ALL AI providers and model preferences
kubectl -n "${APP_SLUG}" create secret generic app-secrets \
  --from-literal=DATABASE_URL="${DATABASE_URL}" \
  --from-literal=MODEL_CHAT="${MODEL_CHAT}" \
  --from-literal=MODEL_FAST="${MODEL_FAST}" \
  --from-literal=MODEL_EMBEDDING="${MODEL_EMBEDDING}" \
  --from-literal=MODEL_IMAGE="${MODEL_IMAGE}" \
  --from-literal=MODEL_TTS="${MODEL_TTS}" \
  --from-literal=OPENAI_API_KEY="${OPENAI_API_KEY}" \
  --from-literal=OPENAI_API_BASE="${OPENAI_API_BASE}" \
  --from-literal=GROQ_API_KEY="${GROQ_API_KEY}" \
  --from-literal=CEREBRAS_API_KEY="${CEREBRAS_API_KEY}" \
  --from-literal=GEMINI_API_KEY="${GEMINI_API_KEY}" \
  --from-literal=BEDROCK_ACCESS_KEY_ID="${BEDROCK_ACCESS_KEY_ID}" \
  --from-literal=BEDROCK_SECRET_ACCESS_KEY="${BEDROCK_SECRET_ACCESS_KEY}" \
  --from-literal=BEDROCK_REGION="${BEDROCK_REGION}" \
  --from-literal=ELEVENLABS_API_KEY="${ELEVENLABS_API_KEY}" \
  --from-literal=BLAND_AI_API_KEY="${BLAND_AI_API_KEY}" \
  --from-literal=FIRECRAWL_API_KEY="${FIRECRAWL_API_KEY}" \
  --from-literal=TAVILY_API_KEY="${TAVILY_API_KEY}" \
  --from-literal=CONTEXT7_API_KEY="${CONTEXT7_API_KEY}" \
  --from-literal=AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
  --from-literal=AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
  --from-literal=AWS_ENDPOINT_URL="${AWS_ENDPOINT_URL}" \
  --from-literal=CDN_BASE_URL="${CDN_BASE_URL}" \
  --from-literal=RESEND_API_KEY="${RESEND_API_KEY}" \
  --from-literal=SENDGRID_API_KEY="${SENDGRID_API_KEY}" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Hybrid AI secrets updated in namespace: ${APP_SLUG}"
echo "✅ Includes: OpenAI, Groq, Cerebras, Gemini, Bedrock, ElevenLabs, Bland AI, Firecrawl, Tavily"
