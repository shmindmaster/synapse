import { prisma } from '../../src/config/db.js';
import { pool } from '../../src/config/db.js';

export interface VectorDocument {
  id?: string;
  path: string;
  content: string;
  embedding: number[] | null;
  metadata?: Record<string, any>;
  preview?: string;
}

/**
 * Vector Store Service using PostgreSQL + pgvector
 * Provides persistent, scalable vector storage for codebase embeddings
 */
export class VectorStoreService {
  /**
   * Insert or update vector embeddings in the database
   */
  async upsertVectors(documents: VectorDocument[]): Promise<void> {
    if (documents.length === 0) return;

    // Use raw SQL for pgvector operations (Prisma doesn't fully support pgvector yet)
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const doc of documents) {
        const embeddingArray = doc.embedding ? `[${doc.embedding.join(',')}]` : null;
        const metadataJson = doc.metadata ? JSON.stringify(doc.metadata) : null;
        
        if (doc.embedding) {
          // Insert with embedding
          await client.query(
            `INSERT INTO vector_embeddings (id, path, content, embedding, metadata, preview, indexed_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, $3::vector, $4::jsonb, $5, NOW(), NOW())
             ON CONFLICT (path) DO UPDATE SET
               content = EXCLUDED.content,
               embedding = EXCLUDED.embedding,
               metadata = EXCLUDED.metadata,
               preview = EXCLUDED.preview,
               updated_at = NOW()`,
            [doc.path, doc.content, embeddingArray, metadataJson, doc.preview || null]
          );
        } else {
          // Insert without embedding (text-based search fallback)
          await client.query(
            `INSERT INTO vector_embeddings (id, path, content, embedding, metadata, preview, indexed_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, NULL, $3::jsonb, $4, NOW(), NOW())
             ON CONFLICT (path) DO UPDATE SET
               content = EXCLUDED.content,
               metadata = EXCLUDED.metadata,
               preview = EXCLUDED.preview,
               updated_at = NOW()`,
            [doc.path, doc.content, metadataJson, doc.preview || null]
          );
        }
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete vectors by path pattern
   */
  async deleteByPath(pathPattern: string): Promise<number> {
    const result = await prisma.$executeRaw`
      DELETE FROM vector_embeddings 
      WHERE path LIKE ${pathPattern}
    `;
    return result as number;
  }

  /**
   * Semantic similarity search using pgvector
   */
  async similaritySearch(
    queryEmbedding: number[],
    limit: number = 10,
    threshold: number = 0.7,
    filters?: { path?: string; metadata?: Record<string, any> }
  ): Promise<Array<VectorDocument & { score: number }>> {
    const client = await pool.connect();
    
    try {
      const embeddingArray = `[${queryEmbedding.join(',')}]`;
      let query = `
        SELECT 
          id,
          path,
          content,
          embedding,
          metadata,
          preview,
          indexed_at,
          1 - (embedding <=> $1::vector) as score
        FROM vector_embeddings
        WHERE embedding IS NOT NULL
      `;
      
      const params: any[] = [embeddingArray];
      let paramIndex = 2;
      
      if (filters?.path) {
        query += ` AND path LIKE $${paramIndex}`;
        params.push(`%${filters.path}%`);
        paramIndex++;
      }
      
      if (filters?.metadata) {
        // Add JSONB metadata filtering
        for (const [key, value] of Object.entries(filters.metadata)) {
          query += ` AND metadata->>$${paramIndex} = $${paramIndex + 1}`;
          params.push(key, String(value));
          paramIndex += 2;
        }
      }
      
      query += ` AND (1 - (embedding <=> $1::vector)) >= $${paramIndex}`;
      params.push(threshold);
      paramIndex++;
      
      query += ` ORDER BY embedding <=> $1::vector LIMIT $${paramIndex}`;
      params.push(limit);
      
      const result = await client.query(query, params);
      
      return result.rows.map((row: any) => ({
        id: row.id,
        path: row.path,
        content: row.content,
        embedding: row.embedding ? Array.from(row.embedding) : null,
        metadata: row.metadata || {},
        preview: row.preview,
        score: parseFloat(row.score),
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Text-based search fallback (when embeddings unavailable)
   */
  async textSearch(
    query: string,
    limit: number = 10,
    filters?: { path?: string }
  ): Promise<Array<VectorDocument & { score: number }>> {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (filters?.path) {
      whereClause += ` AND path LIKE $${paramIndex}`;
      params.push(`%${filters.path}%`);
      paramIndex++;
    }
    
    // Simple text matching using PostgreSQL full-text search
    const searchTerms = queryWords.map((word, idx) => {
      params.push(`%${word}%`);
      return `(LOWER(content) LIKE $${paramIndex + idx} OR LOWER(path) LIKE $${paramIndex + idx})`;
    }).join(' OR ');
    
    if (searchTerms) {
      whereClause += ` AND (${searchTerms})`;
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT 
          id,
          path,
          content,
          embedding,
          metadata,
          preview,
          indexed_at,
          CASE 
            WHEN LOWER(content) LIKE ANY(ARRAY[${queryWords.map((_, i) => `$${paramIndex + i}`).join(', ')}]) THEN 0.8
            WHEN LOWER(path) LIKE ANY(ARRAY[${queryWords.map((_, i) => `$${paramIndex + i}`).join(', ')}]) THEN 0.6
            ELSE 0.4
          END as score
        FROM vector_embeddings
        ${whereClause}
        ORDER BY score DESC
        LIMIT $${paramIndex + queryWords.length}`,
        [...params, ...queryWords.map(w => `%${w}%`), limit]
      );
      
      return result.rows.map((row: any) => ({
        id: row.id,
        path: row.path,
        content: row.content,
        embedding: row.embedding ? Array.from(row.embedding) : null,
        metadata: row.metadata || {},
        preview: row.preview,
        score: parseFloat(row.score),
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get total count of indexed vectors
   */
  async getCount(): Promise<number> {
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM vector_embeddings
    `;
    return Number(result[0]?.count || 0);
  }

  /**
   * Check if any vectors have embeddings
   */
  async hasEmbeddings(): Promise<boolean> {
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM vector_embeddings WHERE embedding IS NOT NULL
    `;
    return Number(result[0]?.count || 0) > 0;
  }

  /**
   * Get all indexed paths
   */
  async getAllPaths(): Promise<string[]> {
    const result = await prisma.$queryRaw<Array<{ path: string }>>`
      SELECT DISTINCT path FROM vector_embeddings ORDER BY path
    `;
    return result.map(r => r.path);
  }

  /**
   * Clear all vectors (for re-indexing)
   */
  async clearAll(): Promise<void> {
    await prisma.$executeRaw`TRUNCATE TABLE vector_embeddings`;
  }
}

export const vectorStore = new VectorStoreService();

