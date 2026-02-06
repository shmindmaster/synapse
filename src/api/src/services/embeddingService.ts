/**
 * Batch Embeddings Service
 * Supports both cloud (OpenAI) and local (Ollama) embedding models.
 * Ollama serves embeddings via OpenAI-compatible API at /v1/embeddings.
 */
import { config } from '../config/configuration.js';
import OpenAI from 'openai';

// Route to local Ollama endpoint when USE_LOCAL_MODELS=true, otherwise cloud
const baseURL = config.ai.useLocalModels
  ? config.ai.local.embeddingEndpoint
  : config.ai.baseUrl;

const openai = new OpenAI({
  apiKey: config.ai.openaiApiKey || config.ai.doInferenceApiKey || 'not-needed-for-local',
  baseURL,
  maxRetries: 3,
  timeout: 60000,
});

interface EmbeddingOptions {
  model?: string;
  dimensions?: number;
  batchSize?: number;
}

/**
 * Split array into chunks
 */
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Generate embeddings for multiple texts in batches
 * Optimized for cost by using text-embedding-3-small and reduced dimensions
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  options: EmbeddingOptions = {}
): Promise<number[][]> {
  // Resolve defaults from centralized config
  const isLocal = config.ai.useLocalModels;
  const {
    model = isLocal ? config.ai.local.embeddingModel : config.ai.embeddingModel,
    dimensions = isLocal ? config.ai.local.embeddingDimensions : config.ai.embeddingDimensions,
    batchSize = config.ai.embeddingBatchSize,
  } = options;

  if (texts.length === 0) {
    return [];
  }

  // Ollama handles smaller batches; OpenAI supports up to 100
  const maxBatch = isLocal ? Math.min(batchSize, 50) : Math.min(batchSize, 100);
  const batches = chunk(texts, maxBatch);
  const allEmbeddings: number[][] = [];

  let batchNum = 0;
  for (const batch of batches) {
    batchNum++;

    try {
      // Local models (Ollama) return native dimensions; don't pass the dimensions param
      // OpenAI text-embedding-3-* supports the dimensions param for truncation
      const response = await openai.embeddings.create({
        model,
        input: batch,
        encoding_format: 'float',
        ...(isLocal ? {} : { dimensions: dimensions > 0 ? dimensions : undefined }),
      });

      allEmbeddings.push(...response.data.map((d: any) => d.embedding));

      // Log progress for large batches
      if (batches.length > 5) {
        console.log(`Generated embeddings batch ${batchNum}/${batches.length}`);
      }
    } catch (error) {
      console.error(`Error generating embeddings for batch ${batchNum}:`, error);

      if (error instanceof OpenAI.APIError && error.status === 429) {
        // Rate limited - wait and retry
        const retryAfter = parseInt(error.headers?.['retry-after'] || '5');
        console.log(`Rate limited. Waiting ${retryAfter}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));

        // Retry this batch
        batchNum--;
        continue;
      }

      throw error;
    }

    // Small delay between batches to avoid rate limits
    if (batchNum < batches.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return allEmbeddings;
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(
  text: string,
  options: EmbeddingOptions = {}
): Promise<number[]> {
  const isLocal = config.ai.useLocalModels;
  const {
    model = isLocal ? config.ai.local.embeddingModel : config.ai.embeddingModel,
    dimensions = isLocal ? config.ai.local.embeddingDimensions : config.ai.embeddingDimensions,
  } = options;

  try {
    const response = await openai.embeddings.create({
      model,
      input: text,
      encoding_format: 'float',
      ...(isLocal ? {} : { dimensions: dimensions > 0 ? dimensions : undefined }),
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Normalize embedding vector (L2 normalization)
 */
export function normalizeEmbedding(embedding: number[]): number[] {
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return norm === 0 ? embedding : embedding.map(val => val / norm);
}
