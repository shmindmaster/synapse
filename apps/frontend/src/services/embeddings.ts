/**
 * Server-Side Embeddings via DigitalOcean Gradient AI
 * Uses backend API to generate embeddings (avoids browser memory issues)
 */

import { apiUrl } from '../utils/api';

export interface EmbeddingProgress {
  status: 'loading' | 'ready' | 'error';
  progress?: number;
  message?: string;
}

type ProgressCallback = (progress: EmbeddingProgress) => void;

let isReady = false;

/**
 * Initialize embeddings - just marks as ready since server handles the model
 */
export async function initEmbeddings(onProgress?: ProgressCallback): Promise<void> {
  onProgress?.({ status: 'loading', progress: 50, message: 'Connecting to AI server...' });
  
  // Quick health check to ensure backend is available
  try {
    const response = await fetch(apiUrl('/api/health'));
    if (response.ok) {
      isReady = true;
      onProgress?.({ status: 'ready', progress: 100, message: 'AI server ready' });
    } else {
      throw new Error('Backend not available');
    }
  } catch (error) {
    onProgress?.({ status: 'error', message: 'Failed to connect to AI server' });
    throw error;
  }
}

/**
 * Check if the embedding service is ready
 */
export function isModelReady(): boolean {
  return isReady;
}

/**
 * Generate embedding for a text string via backend API
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(apiUrl('/api/embedding'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text.slice(0, 2000) }) // Limit text size
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate embedding');
  }

  const data = await response.json();
  return data.embedding;
}

/**
 * Generate embeddings for multiple texts in batch via backend API
 */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await fetch(apiUrl('/api/embeddings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts: texts.map(t => t.slice(0, 2000)) })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate embeddings');
  }

  const data = await response.json();
  return data.embeddings;
}

/**
 * Chunk text into smaller pieces for better embedding quality
 * SAFETY: Includes limits to prevent infinite loops and memory issues
 */
export function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
  // Validate inputs
  if (!text || text.length === 0) return [];
  if (chunkSize <= 0) chunkSize = 500;
  if (overlap < 0 || overlap >= chunkSize) overlap = Math.min(50, Math.floor(chunkSize * 0.1));
  
  // Limit text size to prevent memory issues (max 1MB of text)
  const MAX_TEXT_LENGTH = 1024 * 1024; // 1MB
  const MAX_CHUNKS = 1000; // Maximum number of chunks to prevent array overflow
  
  if (text.length > MAX_TEXT_LENGTH) {
    console.warn(`Text too large (${text.length} chars), truncating to ${MAX_TEXT_LENGTH} chars`);
    text = text.slice(0, MAX_TEXT_LENGTH);
  }
  
  const chunks: string[] = [];
  let start = 0;
  let iterations = 0;
  const MAX_ITERATIONS = MAX_CHUNKS * 2; // Safety limit to prevent infinite loops

  while (start < text.length && chunks.length < MAX_CHUNKS && iterations < MAX_ITERATIONS) {
    iterations++;
    
    const end = Math.min(start + chunkSize, text.length);
    let chunk = text.slice(start, end);
    let actualChunkLength = end - start;

    // Try to break at sentence boundary
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf('.');
      const lastNewline = chunk.lastIndexOf('\n');
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > chunkSize * 0.5) {
        chunk = chunk.slice(0, breakPoint + 1);
        actualChunkLength = breakPoint + 1;
      }
    }

    if (chunk.trim().length > 20) {
      chunks.push(chunk.trim());
    }

    // Ensure we always advance forward to prevent infinite loops
    const advance = Math.max(actualChunkLength - overlap, 1);
    start = start + advance;
    
    // Safety: if we're not making progress, jump to end
    if (advance < 1) {
      console.warn('chunkText: Progress stalled, breaking loop');
      break;
    }
  }
  
  if (iterations >= MAX_ITERATIONS) {
    console.error('chunkText: Max iterations reached, possible infinite loop prevented');
  }
  
  if (chunks.length >= MAX_CHUNKS) {
    console.warn(`chunkText: Max chunks limit (${MAX_CHUNKS}) reached, some text may be truncated`);
  }

  return chunks;
}
