/**
 * Client-Side Vector Store using IndexedDB
 * Stores file embeddings locally in the browser for offline semantic search
 */

interface VectorDocument {
  id: string;
  name: string;
  path: string;
  embedding: number[];
  preview: string;
  indexedAt: number;
}

class ClientVectorStore {
  private db: IDBDatabase | null = null;
  private dbName = 'synapse-vectors';
  private dbVersion = 1;

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        // Create vectors store
        if (!db.objectStoreNames.contains('vectors')) {
          const store = db.createObjectStore('vectors', { keyPath: 'id' });
          store.createIndex('by-path', 'path', { unique: false });
        }
        // Create metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
      
      request.onsuccess = () => resolve(request.result);
    });
  }

  async init(): Promise<void> {
    if (this.db) return;
    this.db = await this.openDB();
  }

  async insert(doc: VectorDocument): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('vectors', 'readwrite');
      const store = tx.objectStore('vectors');
      const request = store.put(doc);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async bulkInsert(docs: VectorDocument[]): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('vectors', 'readwrite');
      const store = tx.objectStore('vectors');
      
      docs.forEach(doc => store.put(doc));
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAll(): Promise<VectorDocument[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('vectors', 'readonly');
      const store = tx.objectStore('vectors');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getCount(): Promise<number> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('vectors', 'readonly');
      const store = tx.objectStore('vectors');
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('vectors', 'readwrite');
      const store = tx.objectStore('vectors');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
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
