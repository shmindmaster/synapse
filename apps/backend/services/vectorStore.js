import { prisma } from '../../lib/db.js';
import { pool } from '../../lib/db.js';

/**
 * Vector Store Service using PostgreSQL + pgvector
 * Provides persistent, scalable vector storage for codebase embeddings
 */
export class VectorStoreService {
  /**
   * Insert or update vector embeddings in the database
   */
  async upsertVectors(documents) {
    if (documents.length === 0) return;

    // Use raw SQL for pgvector operations (Prisma doesn't fully support pgvector yet)
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const doc of documents) {
        const metadataJson = doc.metadata ? JSON.stringify(doc.metadata) : null;
        
        if (doc.embedding && Array.isArray(doc.embedding)) {
          // Insert with embedding - pgvector expects array format
          await client.query(
            `INSERT INTO vector_embeddings (id, path, content, embedding, metadata, preview, indexed_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, $3::vector, $4::jsonb, $5, NOW(), NOW())
             ON CONFLICT (path) DO UPDATE SET
               content = EXCLUDED.content,
               embedding = EXCLUDED.embedding,
               metadata = EXCLUDED.metadata,
               preview = EXCLUDED.preview,
               updated_at = NOW()`,
            [doc.path, doc.content, doc.embedding, metadataJson, doc.preview || null]
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
  async deleteByPath(pathPattern) {
    const result = await prisma.$executeRaw`
      DELETE FROM vector_embeddings 
      WHERE path LIKE ${pathPattern}
    `;
    return result;
  }

  /**
   * Semantic similarity search using pgvector
   */
  async similaritySearch(queryEmbedding, limit = 10, threshold = 0.7, filters = {}) {
    const client = await pool.connect();
    
    try {
      // pgvector expects array format directly
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
      
      const params = [queryEmbedding];
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
      
      return result.rows.map(row => ({
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
  async textSearch(query, limit = 10, filters = {}) {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (filters?.path) {
      whereClause += ` AND path LIKE $${paramIndex}`;
      params.push(`%${filters.path}%`);
      paramIndex++;
    }
    
    // Simple text matching using PostgreSQL ILIKE
    const searchTerms = queryWords.map((word, idx) => {
      params.push(`%${word}%`);
      return `(LOWER(content) ILIKE $${paramIndex + idx} OR LOWER(path) ILIKE $${paramIndex + idx})`;
    }).join(' OR ');
    
    if (searchTerms) {
      whereClause += ` AND (${searchTerms})`;
    }
    
    const client = await pool.connect();
    try {
      const wordParams = queryWords.map(w => `%${w}%`);
      const allParams = [...params, ...wordParams, limit];
      
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
            WHEN LOWER(content) LIKE ANY(ARRAY[${wordParams.map((_, i) => `$${paramIndex + params.length + i}`).join(', ')}]) THEN 0.8
            WHEN LOWER(path) LIKE ANY(ARRAY[${wordParams.map((_, i) => `$${paramIndex + params.length + i}`).join(', ')}]) THEN 0.6
            ELSE 0.4
          END as score
        FROM vector_embeddings
        ${whereClause}
        ORDER BY score DESC
        LIMIT $${paramIndex + params.length + wordParams.length}`,
        allParams
      );
      
      return result.rows.map(row => ({
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
  async getCount() {
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM vector_embeddings
    `;
    return Number(result[0]?.count || 0);
  }

  /**
   * Check if any vectors have embeddings
   */
  async hasEmbeddings() {
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM vector_embeddings WHERE embedding IS NOT NULL
    `;
    return Number(result[0]?.count || 0) > 0;
  }

  /**
   * Get all indexed paths
   */
  async getAllPaths() {
    const result = await prisma.$queryRaw`
      SELECT DISTINCT path FROM vector_embeddings ORDER BY path
    `;
    return result.map(r => r.path);
  }

  /**
   * Clear all vectors (for re-indexing)
   */
  async clearAll() {
    await prisma.$executeRaw`TRUNCATE TABLE vector_embeddings`;
  }
}

export const vectorStoreService = new VectorStoreService();

