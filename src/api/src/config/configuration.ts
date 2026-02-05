import { z } from 'zod';
import dotenv from 'dotenv';

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

    // AI Inference
    DO_INFERENCE_API_KEY: z.string().optional(),
    OPENAI_DIRECT_API_KEY: z.string().optional(),
    AI_BASE_URL: z.string().optional(), // For local models (Ollama, vLLM)

    // Object Storage
    SPACES_KEY: z.string().optional(),
    SPACES_SECRET: z.string().optional(),
    SPACES_ENDPOINT: z.string().default('https://nyc3.digitaloceanspaces.com'),
    SPACES_BUCKET: z.string().default('sh-storage'),
    OBJECT_STORAGE_PREFIX: z.string().default('synapse/'),

    // Logging
    SENTRY_DSN: z.string().optional(),
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
    db: {
        url: _env.data.DATABASE_URL,
    },
    auth: {
        secret: _env.data.AUTH_SECRET,
    },
    ai: {
        doInferenceApiKey: _env.data.DO_INFERENCE_API_KEY,
        openaiDirectApiKey: _env.data.OPENAI_DIRECT_API_KEY,
        baseUrl: _env.data.AI_BASE_URL,
    },
    storage: {
        key: _env.data.SPACES_KEY,
        secret: _env.data.SPACES_SECRET,
        endpoint: _env.data.SPACES_ENDPOINT,
        bucket: _env.data.SPACES_BUCKET,
        prefix: _env.data.OBJECT_STORAGE_PREFIX,
    },
    sentry: {
        dsn: _env.data.SENTRY_DSN,
    },
};
