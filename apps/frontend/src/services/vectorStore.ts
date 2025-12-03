/**
 * Client-Side Vector Store using IndexedDB
 * Stores file embeddings locally in the browser for offline semantic search
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface VectorDocument {
  id: string;
  name: string;
  path: string;
  embedding: number[];
  preview: string;
  indexedAt: number;
}

interface VectorDBSchema extends DBSchema {
  vectors: {
    key: string;
    value: VectorDocument;
    indexes: { 'by-path': string };
  };
  metadata: {
    key: string;
    value: { key: string; value: string | number };
  };
}

class ClientVectorStore {
  private db: IDBPDatabase<VectorDBSchema> | null = null;
  private dbName = 'synapse-vectors';
  private dbVersion = 1;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<VectorDBSchema>(this.dbName, this.dbVersion, {
      upgrade(db) {
        // Create vectors store
        if (!db.objectStoreNames.contains('vectors')) {
          const vectorStore = db.createObjectStore('vectors', { keyPath: 'id' });
          vectorStore.createIndex('by-path', 'path');
        }
        // Create metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      },
    });
  }

  async insert(doc: VectorDocument): Promise<void> {
    await this.init();
    await this.db!.put('vectors', doc);
  }

  async bulkInsert(docs: VectorDocument[]): Promise<void> {
    await this.init();
    const tx = this.db!.transaction('vectors', 'readwrite');
    await Promise.all([
      ...docs.map(doc => tx.store.put(doc)),
      tx.done
    ]);
  }

  async getAll(): Promise<VectorDocument[]> {
    await this.init();
    return this.db!.getAll('vectors');
  }

  async getCount(): Promise<number> {
    await this.init();
    return this.db!.count('vectors');
  }

  async deleteByPath(path: string): Promise<void> {
    await this.init();
    const tx = this.db!.transaction('vectors', 'readwrite');
    const index = tx.store.index('by-path');
    const keys = await index.getAllKeys(path);
    await Promise.all(keys.map(key => tx.store.delete(key)));
    await tx.done;
  }

  async clear(): Promise<void> {
    await this.init();
    await this.db!.clear('vectors');
  }

  async setMetadata(key: string, value: string | number): Promise<void> {
    await this.init();
    await this.db!.put('metadata', { key, value });
  }

  async getMetadata(key: string): Promise<string | number | undefined> {
    await this.init();
    const result = await this.db!.get('metadata', key);
    return result?.value;
  }

  /**
   * Cosine similarity between two vectors
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Search for similar documents
   */
  async search(queryEmbedding: number[], limit: number = 10, threshold: number = 0.25): Promise<Array<VectorDocument & { score: number }>> {
    const allDocs = await this.getAll();
    
    const results = allDocs
      .map(doc => ({
        ...doc,
        score: this.cosineSimilarity(queryEmbedding, doc.embedding)
      }))
      .filter(doc => doc.score > threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Deduplicate by path (keep highest scoring chunk per file)
    const uniqueByPath = new Map<string, typeof results[0]>();
    results.forEach(r => {
      if (!uniqueByPath.has(r.path) || uniqueByPath.get(r.path)!.score < r.score) {
        uniqueByPath.set(r.path, r);
      }
    });

    return Array.from(uniqueByPath.values());
  }
}

export const vectorStore = new ClientVectorStore();
export type { VectorDocument };
