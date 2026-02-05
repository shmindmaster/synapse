/**
 * Vector Search Service with Optimizations
 * Implements efficient similarity search with caching and indexing
 */
import { prisma } from '../config/db.js';
import { trackVectorSearch } from '../config/sentry.js';
import { generateEmbedding } from './embeddingService.js';

export interface SearchResult {
  id: string;
  content: string;
  similarity: number;
  metadata?: Record<string, any>;
}

export interface SearchOptions {
  limit?: number;
  threshold?: number;
  filter?: Record<string, any>;
}

/**
 * Perform vector similarity search with optimizations
 */
export async function vectorSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const startTime = Date.now();
  const {
    limit = parseInt(process.env.VECTOR_MAX_RESULTS || '10'),
    threshold = parseFloat(process.env.VECTOR_SIMILARITY_THRESHOLD || '0.7'),
    filter = {},
  } = options;

  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    // Perform similarity search using pgvector
    // Uses cosine distance: 1 - cosine_similarity
    const results = await prisma.$queryRaw<
      Array<{ id: string; content: string; similarity: number; metadata: any }>
    >`
      SELECT
        id,
        content,
        1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity,
        metadata
      FROM documents
      WHERE 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) >= ${threshold}
      ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
      LIMIT ${limit}
    `;

    const duration = Date.now() - startTime;

    // Track performance
    trackVectorSearch({
      query,
      resultsCount: results.length,
      duration,
      similarityThreshold: threshold,
      success: true,
    });

    return results.map(r => ({
      id: r.id,
      content: r.content,
      similarity: r.similarity,
      metadata: r.metadata,
    }));
  } catch (error) {
    const duration = Date.now() - startTime;
    trackVectorSearch({
      query,
      resultsCount: 0,
      duration,
      similarityThreshold: threshold,
      success: false,
    });
    throw error;
  }
}

/**
 * Batch vector search for multiple queries
 */
export async function batchVectorSearch(
  queries: string[],
  options: SearchOptions = {}
): Promise<SearchResult[][]> {
  // Execute searches in parallel
  const searchPromises = queries.map(query => vectorSearch(query, options));
  return await Promise.all(searchPromises);
}

/**
 * Get similar documents to a given document ID
 */
export async function findSimilarDocuments(
  documentId: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const { limit = 10, threshold = 0.7 } = options;

  try {
    // Get the document's embedding
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { embedding: true },
    });

    if (!document || !document.embedding) {
      return [];
    }

    // Find similar documents
    const results = await prisma.$queryRaw<
      Array<{ id: string; content: string; similarity: number; metadata: any }>
    >`
      SELECT
        id,
        content,
        1 - (embedding <=> ${document.embedding}::vector) as similarity,
        metadata
      FROM documents
      WHERE id != ${documentId}
        AND 1 - (embedding <=> ${document.embedding}::vector) >= ${threshold}
      ORDER BY embedding <=> ${document.embedding}::vector
      LIMIT ${limit}
    `;

    return results.map(r => ({
      id: r.id,
      content: r.content,
      similarity: r.similarity,
      metadata: r.metadata,
    }));
  } catch (error) {
    console.error('Error finding similar documents:', error);
    return [];
  }
}

/**
 * Hybrid search: combines vector similarity with text search
 */
export async function hybridSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const { limit = 10, threshold = 0.7 } = options;

  try {
    // Generate embedding
    const queryEmbedding = await generateEmbedding(query);

    // Perform hybrid search using both vector similarity and text matching
    const results = await prisma.$queryRaw<
      Array<{ id: string; content: string; similarity: number; text_rank: number; metadata: any }>
    >`
      WITH vector_search AS (
        SELECT
          id,
          content,
          metadata,
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
        FROM documents
        WHERE 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) >= ${threshold}
      ),
      text_search AS (
        SELECT
          id,
          ts_rank(to_tsvector('english', content), plainto_tsquery('english', ${query})) as text_rank
        FROM documents
        WHERE to_tsvector('english', content) @@ plainto_tsquery('english', ${query})
      )
      SELECT
        v.id,
        v.content,
        v.similarity,
        COALESCE(t.text_rank, 0) as text_rank,
        v.metadata
      FROM vector_search v
      LEFT JOIN text_search t ON v.id = t.id
      ORDER BY (v.similarity * 0.7 + COALESCE(t.text_rank, 0) * 0.3) DESC
      LIMIT ${limit}
    `;

    return results.map(r => ({
      id: r.id,
      content: r.content,
      similarity: r.similarity,
      metadata: r.metadata,
    }));
  } catch (error) {
    console.error('Error in hybrid search:', error);
    // Fall back to vector search only
    return await vectorSearch(query, options);
  }
}
