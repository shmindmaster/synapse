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

// ============================================
// Content-Aware Chunking
// ============================================
// Splits text intelligently based on content type:
// - Code: function/class boundaries, blank-line-separated blocks
// - Markdown: heading sections (##, ###)
// - Prose: paragraph and sentence boundaries
//
// Default chunk target: ~1500 chars (better for embedding quality
// than the old 500-char chunks). Overlap ensures context continuity.

const DEFAULT_CHUNK_SIZE = 1500;
const DEFAULT_OVERLAP = 150;
const MAX_TEXT_LENGTH = 1024 * 1024; // 1MB safety cap
const MAX_CHUNKS = 500;             // Per-file chunk limit
const MIN_CHUNK_LENGTH = 30;        // Skip trivially small chunks

/**
 * Detect content type from text content for chunking strategy selection
 */
function detectContentType(text: string): 'code' | 'markdown' | 'prose' {
  const lines = text.slice(0, 3000).split('\n');

  // Markdown: has heading lines
  const headingCount = lines.filter(l => /^#{1,6}\s/.test(l)).length;
  if (headingCount >= 2) return 'markdown';

  // Code: has common code patterns
  const codePatterns = [
    /^(import |from |require\(|export |const |let |var |function |class |def |async |pub fn |fn |package |using )/,
    /^\s*(if|for|while|switch|try|catch)\s*[\({]/,
    /[{};]\s*$/,
    /^\s*(public|private|protected|static)\s/,
  ];
  const codeLineCount = lines.filter(l => codePatterns.some(p => p.test(l.trim()))).length;
  if (codeLineCount > lines.length * 0.15) return 'code';

  return 'prose';
}

/**
 * Chunk text into smaller pieces for embedding quality.
 * Content-aware: detects code, markdown, or prose and splits accordingly.
 * 
 * SAFETY: Enforces max text length, max chunks, and progress guarantees.
 */
export function chunkText(
  text: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_OVERLAP
): string[] {
  if (!text || text.length === 0) return [];
  if (chunkSize <= 0) chunkSize = DEFAULT_CHUNK_SIZE;
  if (overlap < 0 || overlap >= chunkSize) overlap = Math.min(150, Math.floor(chunkSize * 0.1));

  if (text.length > MAX_TEXT_LENGTH) {
    console.warn(`chunkText: Truncating from ${text.length} to ${MAX_TEXT_LENGTH} chars`);
    text = text.slice(0, MAX_TEXT_LENGTH);
  }

  const contentType = detectContentType(text);

  let rawChunks: string[];
  switch (contentType) {
    case 'markdown':
      rawChunks = chunkMarkdown(text, chunkSize);
      break;
    case 'code':
      rawChunks = chunkCode(text, chunkSize, overlap);
      break;
    default:
      rawChunks = chunkProse(text, chunkSize, overlap);
  }

  // Filter and cap
  return rawChunks
    .map(c => c.trim())
    .filter(c => c.length >= MIN_CHUNK_LENGTH)
    .slice(0, MAX_CHUNKS);
}

/**
 * Chunk markdown by heading sections.
 * Each ## or ### heading starts a new chunk. Oversized sections
 * are further split by paragraph boundaries.
 */
function chunkMarkdown(text: string, maxSize: number): string[] {
  const chunks: string[] = [];
  // Split on heading lines (## or deeper)
  const sections = text.split(/(?=^#{1,6}\s)/m);

  for (const section of sections) {
    if (section.length <= maxSize) {
      chunks.push(section);
    } else {
      // Large section: split by paragraphs (double newline)
      chunks.push(...chunkByParagraphs(section, maxSize));
    }
  }

  return chunks;
}

/**
 * Chunk code by logical boundaries:
 * 1. Try to split on blank-line-separated blocks (function/class gaps)
 * 2. Fall back to line-boundary splitting with overlap
 */
function chunkCode(text: string, maxSize: number, overlap: number): string[] {
  const chunks: string[] = [];

  // Split on double newlines (blank lines between functions/classes)
  const blocks = text.split(/\n\s*\n/);
  let currentChunk = '';

  for (const block of blocks) {
    const candidate = currentChunk ? currentChunk + '\n\n' + block : block;

    if (candidate.length <= maxSize) {
      currentChunk = candidate;
    } else {
      // Flush current chunk
      if (currentChunk) {
        chunks.push(currentChunk);
      }

      // If single block is too large, split by lines
      if (block.length > maxSize) {
        chunks.push(...chunkByLines(block, maxSize, overlap));
        currentChunk = '';
      } else {
        currentChunk = block;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Chunk prose by paragraph and sentence boundaries.
 */
function chunkProse(text: string, maxSize: number, overlap: number): string[] {
  return chunkByParagraphs(text, maxSize, overlap);
}

/**
 * Split text by paragraph boundaries (double newlines).
 * Oversized paragraphs are further split by sentences.
 */
function chunkByParagraphs(text: string, maxSize: number, overlap: number = 0): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\s*\n/);
  let currentChunk = '';

  for (const para of paragraphs) {
    const candidate = currentChunk ? currentChunk + '\n\n' + para : para;

    if (candidate.length <= maxSize) {
      currentChunk = candidate;
    } else {
      if (currentChunk) chunks.push(currentChunk);

      if (para.length > maxSize) {
        // Split oversized paragraph by sentences
        chunks.push(...chunkBySentences(para, maxSize, overlap));
        currentChunk = '';
      } else {
        currentChunk = para;
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

/**
 * Split text by sentence boundaries.
 */
function chunkBySentences(text: string, maxSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  // Split on sentence-ending punctuation followed by space or newline
  const sentences = text.split(/(?<=[.!?])\s+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    const candidate = currentChunk ? currentChunk + ' ' + sentence : sentence;

    if (candidate.length <= maxSize) {
      currentChunk = candidate;
    } else {
      if (currentChunk) chunks.push(currentChunk);

      if (sentence.length > maxSize) {
        // Last resort: hard split with overlap
        chunks.push(...chunkByLines(sentence, maxSize, overlap));
        currentChunk = '';
      } else {
        // Add overlap from end of previous chunk
        if (overlap > 0 && chunks.length > 0) {
          const prev = chunks[chunks.length - 1];
          const overlapText = prev.slice(-overlap);
          currentChunk = overlapText + ' ' + sentence;
        } else {
          currentChunk = sentence;
        }
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

/**
 * Split text by line boundaries with overlap (last resort for code/long lines).
 */
function chunkByLines(text: string, maxSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  const lines = text.split('\n');
  let currentChunk = '';

  for (const line of lines) {
    const candidate = currentChunk ? currentChunk + '\n' + line : line;

    if (candidate.length <= maxSize) {
      currentChunk = candidate;
    } else {
      if (currentChunk) chunks.push(currentChunk);

      if (line.length > maxSize) {
        // Absolute last resort: hard character split
        for (let i = 0; i < line.length; i += maxSize - overlap) {
          chunks.push(line.slice(i, i + maxSize));
        }
        currentChunk = '';
      } else {
        currentChunk = line;
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}
