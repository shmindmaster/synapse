import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Infrastructure
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('8000'),
  APP_SLUG: z.string().default('synapse'),

  // Database
  DATABASE_URL: z.string(),

  // Auth
  AUTH_SECRET: z.string().default('super-secret-auth-key-change-in-prod'),

  // AI Inference - Cloud Providers
  OPENAI_API_KEY: z.string().optional(), // Primary OpenAI key (what users expect)
  OPENAI_DIRECT_API_KEY: z.string().optional(), // Legacy alias
  DO_INFERENCE_API_KEY: z.string().optional(), // DigitalOcean inference
  AI_BASE_URL: z.string().optional(), // For local models (Ollama, vLLM)
  
  // AI Model Configuration
  MODEL_CHAT: z.string().default('gpt-4o'),
  MODEL_FAST: z.string().default('gpt-3.5-turbo'),
  MODEL_EMBEDDING: z.string().default('text-embedding-3-small'),
  EMBEDDING_DIMENSIONS: z.string().transform(Number).default('1536'),
  EMBEDDING_BATCH_SIZE: z.string().transform(Number).default('100'),
  
  // Local/Offline Models Configuration (Ollama-powered)
  USE_LOCAL_MODELS: z.string().optional().transform(val => val === 'true'),
  LOCAL_LLM_ENDPOINT: z.string().optional(),        // Ollama OpenAI-compat: http://ollama:11434/v1
  LOCAL_LLM_MODEL: z.string().optional(),            // qwen2.5-coder:7b | gemma3:4b | phi3.5 | llama3.1:8b
  LOCAL_LLM_CONTEXT_LENGTH: z.string().transform(Number).optional(),
  LOCAL_LLM_TIMEOUT: z.string().transform(Number).optional(),
  LOCAL_EMBEDDING_ENDPOINT: z.string().optional(),   // Same Ollama endpoint or separate
  LOCAL_EMBEDDING_MODEL: z.string().optional(),      // nomic-embed-text | all-minilm
  LOCAL_EMBEDDING_DIMENSIONS: z.string().transform(Number).optional(),

  // Object Storage
  SPACES_KEY: z.string().optional(),
  SPACES_SECRET: z.string().optional(),
  SPACES_ENDPOINT: z.string().default('https://nyc3.digitaloceanspaces.com'),
  SPACES_BUCKET: z.string().default('sh-storage'),
  OBJECT_STORAGE_PREFIX: z.string().default('synapse/'),
  
  // Server Configuration
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  FRONTEND_PORT: z.string().transform(Number).default('3000'),
  BACKEND_PORT: z.string().transform(Number).default('8000'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const config = {
  env: _env.data.NODE_ENV,
  port: _env.data.PORT,
  appSlug: _env.data.APP_SLUG,
  
  // Deployment mode detection
  deployment: {
    isLocal: _env.data.USE_LOCAL_MODELS || false,
    isDocker: !!process.env.DOCKER_CONTAINER,
    isProduction: _env.data.NODE_ENV === 'production',
  },
  
  // Server
  server: {
    corsOrigin: _env.data.CORS_ORIGIN,
    frontendPort: _env.data.FRONTEND_PORT,
    backendPort: _env.data.BACKEND_PORT,
  },
  
  db: {
    url: _env.data.DATABASE_URL,
  },
  auth: {
    secret: _env.data.AUTH_SECRET,
  },
  ai: {
    // API Keys - prefer OPENAI_API_KEY, fallback to legacy names
    openaiApiKey: _env.data.OPENAI_API_KEY || _env.data.OPENAI_DIRECT_API_KEY,
    openaiDirectApiKey: _env.data.OPENAI_DIRECT_API_KEY,
    doInferenceApiKey: _env.data.DO_INFERENCE_API_KEY,
    baseUrl: _env.data.AI_BASE_URL,
    
    // Model names
    chatModel: _env.data.MODEL_CHAT,
    fastModel: _env.data.MODEL_FAST,
    embeddingModel: _env.data.MODEL_EMBEDDING,
    embeddingDimensions: _env.data.EMBEDDING_DIMENSIONS,
    embeddingBatchSize: _env.data.EMBEDDING_BATCH_SIZE,
    
    // Local models (Ollama defaults)
    useLocalModels: _env.data.USE_LOCAL_MODELS || false,
    local: {
      llmEndpoint: _env.data.LOCAL_LLM_ENDPOINT || 'http://localhost:11434/v1',
      llmModel: _env.data.LOCAL_LLM_MODEL || 'qwen2.5-coder:7b',
      llmContextLength: _env.data.LOCAL_LLM_CONTEXT_LENGTH || 32768,
      llmTimeout: _env.data.LOCAL_LLM_TIMEOUT || 120000,
      embeddingEndpoint: _env.data.LOCAL_EMBEDDING_ENDPOINT || _env.data.LOCAL_LLM_ENDPOINT || 'http://localhost:11434/v1',
      embeddingModel: _env.data.LOCAL_EMBEDDING_MODEL || 'nomic-embed-text',
      embeddingDimensions: _env.data.LOCAL_EMBEDDING_DIMENSIONS || 768,
    },
  },
  storage: {
    key: _env.data.SPACES_KEY,
    secret: _env.data.SPACES_SECRET,
    endpoint: _env.data.SPACES_ENDPOINT,
    bucket: _env.data.SPACES_BUCKET,
    prefix: _env.data.OBJECT_STORAGE_PREFIX,
  },
} as const;
