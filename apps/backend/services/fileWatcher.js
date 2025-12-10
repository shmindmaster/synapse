import chokidar from 'chokidar';
import path from 'path';
import { vectorStoreService } from './vectorStore.js';
import { extractText, chunkText, normalizePath } from '../utils/fileUtils.js';
import { embeddingClient, embeddingModel } from '../server.js';

/**
 * File System Watcher Service
 * Monitors codebase for changes and triggers incremental indexing
 */
export class FileWatcherService {
  constructor(options = {}) {
    this.watchers = new Map();
    this.indexingQueue = [];
    this.isProcessing = false;
    this.options = {
      ignored: [
        /node_modules/,
        /\.git/,
        /\.next/,
        /\.cache/,
        /dist/,
        /build/,
        /coverage/,
        /\.env/,
        /\.DS_Store/,
        ...(options.ignored || [])
      ],
      persistent: true,
      ignoreInitial: true, // Don't index on initial scan
      awaitWriteFinish: {
        stabilityThreshold: 1000, // Wait 1s after file stops changing
        pollInterval: 100
      },
      ...options
    };
  }

  /**
   * Start watching a directory
   */
  watch(directoryPath) {
    if (this.watchers.has(directoryPath)) {
      console.log(`Already watching: ${directoryPath}`);
      return;
    }

    console.log(`🔍 Starting file watcher for: ${directoryPath}`);

    const watcher = chokidar.watch(directoryPath, this.options);

    watcher
      .on('add', (filePath) => this.handleFileChange('add', filePath))
      .on('change', (filePath) => this.handleFileChange('change', filePath))
      .on('unlink', (filePath) => this.handleFileChange('unlink', filePath))
      .on('error', (error) => console.error('File watcher error:', error))
      .on('ready', () => console.log(`✅ File watcher ready for: ${directoryPath}`));

    this.watchers.set(directoryPath, watcher);
  }

  /**
   * Stop watching a directory
   */
  unwatch(directoryPath) {
    const watcher = this.watchers.get(directoryPath);
    if (watcher) {
      watcher.close();
      this.watchers.delete(directoryPath);
      console.log(`🛑 Stopped watching: ${directoryPath}`);
    }
  }

  /**
   * Stop all watchers
   */
  stopAll() {
    this.watchers.forEach((watcher, path) => {
      watcher.close();
    });
    this.watchers.clear();
    console.log('🛑 Stopped all file watchers');
  }

  /**
   * Handle file change events
   */
  async handleFileChange(event, filePath) {
    // Skip if file should be ignored
    if (this.shouldIgnore(filePath)) {
      return;
    }

    const normalizedPath = normalizePath(filePath);

    if (event === 'unlink') {
      // File deleted - remove from index
      await this.handleFileDelete(normalizedPath);
    } else {
      // File added or changed - add to indexing queue
      this.queueForIndexing(normalizedPath, event);
    }
  }

  /**
   * Check if file should be ignored
   */
  shouldIgnore(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const textExtensions = ['.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.json', '.py', '.java', '.cpp', '.c', '.h', '.cs', '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.scala', '.sh', '.yaml', '.yml', '.xml', '.html', '.css', '.scss', '.less', '.sql', '.r', '.m', '.pl', '.lua', '.vim', '.clj', '.hs', '.elm', '.ex', '.exs', '.ml', '.fs', '.vb', '.dart', '.pas', '.asm'];
    
    if (!textExtensions.includes(ext)) {
      return true;
    }

    // Check against ignore patterns
    for (const pattern of this.options.ignored) {
      if (typeof pattern === 'string' && filePath.includes(pattern)) {
        return true;
      }
      if (pattern instanceof RegExp && pattern.test(filePath)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Queue file for indexing
   */
  queueForIndexing(filePath, event) {
    // Remove existing entry for this path
    this.indexingQueue = this.indexingQueue.filter(item => item.path !== filePath);
    
    // Add to queue
    this.indexingQueue.push({
      path: filePath,
      event,
      timestamp: Date.now()
    });

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process indexing queue
   */
  async processQueue() {
    if (this.isProcessing || this.indexingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Process in batches to avoid overwhelming the system
      const batchSize = 5;
      const batch = this.indexingQueue.splice(0, batchSize);

      const documents = [];

      for (const item of batch) {
        try {
          const content = await extractText(item.path);
          if (!content || content.length < 50) {
            continue;
          }

          // Chunk the content
          const chunks = chunkText(content);
          const limitedChunks = chunks.slice(0, 5); // Limit chunks per file

          for (const chunk of limitedChunks) {
            // For incremental indexing, we'll generate embeddings if available
            // Otherwise store without embeddings for text-based search
            documents.push({
              path: item.path,
              content: chunk,
              embedding: null, // Embeddings can be generated later if needed
              metadata: {
                name: path.basename(item.path),
                event: item.event,
                indexedAt: new Date().toISOString()
              },
              preview: chunk.substring(0, 1000),
            });
          }
        } catch (error) {
          console.error(`Error indexing ${item.path}:`, error.message);
        }
      }

      // Batch upsert to database
      if (documents.length > 0) {
        await vectorStoreService.upsertVectors(documents);
        console.log(`✅ Incrementally indexed ${documents.length} chunks from ${batch.length} files`);
      }

      // Process next batch if queue not empty
      if (this.indexingQueue.length > 0) {
        // Wait a bit before processing next batch
        setTimeout(() => this.processQueue(), 1000);
      } else {
        this.isProcessing = false;
      }
    } catch (error) {
      console.error('Error processing indexing queue:', error);
      this.isProcessing = false;
    }
  }

  /**
   * Handle file deletion
   */
  async handleFileDelete(filePath) {
    try {
      await vectorStoreService.deleteByPath(filePath);
      console.log(`🗑️ Removed ${filePath} from index`);
    } catch (error) {
      console.error(`Error deleting ${filePath} from index:`, error);
    }
  }

  /**
   * Get watcher status
   */
  getStatus() {
    return {
      watching: Array.from(this.watchers.keys()),
      queueSize: this.indexingQueue.length,
      isProcessing: this.isProcessing
    };
  }
}

export const fileWatcher = new FileWatcherService();

