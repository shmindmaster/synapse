/**
 * Client-Side Embeddings using Transformers.js
 * Generates vector embeddings directly in the browser using WebAssembly
 */

// @ts-ignore - Transformers.js types
import { pipeline, env } from '@xenova/transformers';

// Configure Transformers.js to use local cache
env.allowLocalModels = false;
env.useBrowserCache = true;

type FeatureExtractionPipeline = {
  (text: string, options?: { pooling?: string; normalize?: boolean }): Promise<{ data: Float32Array }>;
};

let embeddingPipeline: FeatureExtractionPipeline | null = null;
let isLoading = false;
let loadError: Error | null = null;

// Model to use - MiniLM is small (~25MB) and fast
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

export interface EmbeddingProgress {
  status: 'loading' | 'ready' | 'error';
  progress?: number;
  message?: string;
}

type ProgressCallback = (progress: EmbeddingProgress) => void;

/**
 * Initialize the embedding model
 * Downloads and caches the model in the browser
 */
export async function initEmbeddings(onProgress?: ProgressCallback): Promise<void> {
  if (embeddingPipeline) return;
  if (isLoading) {
    // Wait for existing load to complete
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (loadError) throw loadError;
    return;
  }

  isLoading = true;
  loadError = null;

  try {
    onProgress?.({ status: 'loading', progress: 0, message: 'Downloading AI model...' });

    embeddingPipeline = await pipeline('feature-extraction', MODEL_NAME, {
      progress_callback: (data: { progress?: number; status?: string }) => {
        if (data.progress !== undefined) {
          onProgress?.({ 
            status: 'loading', 
            progress: Math.round(data.progress), 
            message: `Loading model: ${Math.round(data.progress)}%` 
          });
        }
      }
    }) as FeatureExtractionPipeline;

    onProgress?.({ status: 'ready', progress: 100, message: 'AI model ready' });
  } catch (error) {
    loadError = error as Error;
    onProgress?.({ status: 'error', message: (error as Error).message });
    throw error;
  } finally {
    isLoading = false;
  }
}

/**
 * Check if the embedding model is ready
 */
export function isModelReady(): boolean {
  return embeddingPipeline !== null;
}

/**
 * Generate embedding for a text string
 */
export async function getEmbedding(text: string): Promise<number[]> {
  if (!embeddingPipeline) {
    await initEmbeddings();
  }

  // Truncate text to avoid memory issues (MiniLM has 256 token limit)
  const truncatedText = text.slice(0, 1500);

  const output = await embeddingPipeline!(truncatedText, {
    pooling: 'mean',
    normalize: true
  });

  return Array.from(output.data);
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await getEmbedding(text));
  }
  return results;
}

/**
 * Chunk text into smaller pieces for better embedding quality
 */
export function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunk = text.slice(start, end);

    // Try to break at sentence boundary
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf('.');
      const lastNewline = chunk.lastIndexOf('\n');
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > chunkSize * 0.5) {
        chunk = chunk.slice(0, breakPoint + 1);
      }
    }

    if (chunk.trim().length > 20) {
      chunks.push(chunk.trim());
    }

    start = start + chunk.length - overlap;
    if (start <= 0) start = end; // Prevent infinite loop
  }

  return chunks;
}
