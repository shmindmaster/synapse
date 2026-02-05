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
export declare class VectorStoreService {
    /**
     * Insert or update vector embeddings in the database
     */
    upsertVectors(documents: VectorDocument[]): Promise<void>;
    /**
     * Delete vectors by path pattern
     */
    deleteByPath(pathPattern: string): Promise<number>;
    /**
     * Semantic similarity search using pgvector
     */
    similaritySearch(queryEmbedding: number[], limit?: number, threshold?: number, filters?: {
        path?: string;
        metadata?: Record<string, any>;
    }): Promise<Array<VectorDocument & {
        score: number;
    }>>;
    /**
     * Text-based search fallback (when embeddings unavailable)
     */
    textSearch(query: string, limit?: number, filters?: {
        path?: string;
    }): Promise<Array<VectorDocument & {
        score: number;
    }>>;
    /**
     * Get total count of indexed vectors
     */
    getCount(): Promise<number>;
    /**
     * Check if any vectors have embeddings
     */
    hasEmbeddings(): Promise<boolean>;
    /**
     * Get all indexed paths
     */
    getAllPaths(): Promise<string[]>;
    /**
     * Clear all vectors (for re-indexing)
     */
    clearAll(): Promise<void>;
}
export declare const vectorStore: VectorStoreService;
//# sourceMappingURL=vectorStore.d.ts.map