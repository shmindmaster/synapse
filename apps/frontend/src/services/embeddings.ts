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
