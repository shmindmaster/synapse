import { OpenAI } from 'openai';
import { VectorStoreService } from './vectorStore.js';
import { config } from '../config/configuration.js';

/**
 * Search service for semantic and text-based search
 */
export class SearchService {
  private vectorStore: VectorStoreService;
  private openai: OpenAI;

  constructor() {
    this.vectorStore = new VectorStoreService();
    
    // Use local embedding endpoint if configured, otherwise cloud
    const baseURL = config.ai.useLocalModels 
      ? config.ai.local.embeddingEndpoint 
      : config.ai.baseUrl;
    
    this.openai = new OpenAI({
      apiKey: config.ai.openaiApiKey || config.ai.doInferenceApiKey || 'not-needed-for-local',
      baseURL,
      maxRetries: 3,
      timeout: 60000,
    });
  }

  /**
   * Perform semantic search using query embedding
   */
  async semanticSearch(query: string, limit: number = 10, threshold: number = 0.7): Promise<any[]> {
    try {
      // Get embedding for query
      const embedding = await this.getEmbedding(query);

      if (!embedding) {
        // Fallback to text search if embedding fails
        return this.textSearch(query, limit);
      }

      // Perform similarity search
      const results = await this.vectorStore.similaritySearch(embedding, limit, threshold);

      return results.map(result => ({
        id: result.id,
        path: result.path,
        content: result.content,
        preview: result.preview || result.content.substring(0, 200),
        keywords: this.extractKeywords(result.content),
        analysis: this.generateAnalysis(result.content),
        score: result.score,
      }));
    } catch (error) {
      console.error('Semantic search error:', error);
      // Fallback to text search
      return this.textSearch(query, limit);
    }
  }

  /**
   * Perform text-based search (fallback)
   */
  async textSearch(query: string, limit: number = 10): Promise<any[]> {
    try {
      const results = await this.vectorStore.textSearch(query, limit);

      return results.map(result => ({
        id: result.id,
        path: result.path,
        content: result.content,
        preview: result.preview || result.content.substring(0, 200),
        keywords: this.extractKeywords(result.content),
        analysis: this.generateAnalysis(result.content),
        score: result.score,
      }));
    } catch (error) {
      console.error('Text search error:', error);
      return [];
    }
  }

  /**
   * Get embedding for text (using OpenAI)
   */
  private async getEmbedding(text: string): Promise<number[] | null> {
    try {
      // Check if AI is configured (cloud key or local endpoint)
      const isConfigured = config.ai.openaiApiKey || config.ai.doInferenceApiKey || 
                           config.ai.baseUrl || config.ai.useLocalModels;
      
      if (!isConfigured) {
        console.warn('No AI configured (no API key or local endpoint), skipping embedding');
        return null;
      }

      // Select model based on configuration
      const model = config.ai.useLocalModels 
        ? (config.ai.local.embeddingModel || 'nomic-embed-text')
        : config.ai.embeddingModel;

      const response = await this.openai.embeddings.create({
        model,
        input: text,
      });

      return response.data[0].embedding as number[];
    } catch (error) {
      console.error('Error getting embedding:', error);
      return null;
    }
  }

  /**
   * Extract keywords from content
   */
  private extractKeywords(content: string): string[] {
    // Simple keyword extraction - split by spaces and filter common words
    const commonWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'of',
      'to',
      'in',
      'is',
      'was',
      'are',
      'be',
      'at',
      'by',
      'for',
      'with',
      'from',
      'as',
      'on',
      'this',
      'that',
      'it',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'must',
      'can',
      'if',
      'which',
      'who',
      'what',
      'where',
      'when',
      'why',
      'how',
    ]);

    const words = content
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3 && !commonWords.has(word))
      .slice(0, 10);

    return [...new Set(words)];
  }

  /**
   * Generate simple analysis metadata
   */
  private generateAnalysis(content: string): string {
    // Simple analysis - first sentence or snippet
    const firstSentence = content.split(/[.!?]+/)[0];
    return firstSentence ? firstSentence.substring(0, 150) + '...' : 'No analysis available';
  }

  /**
   * Get index statistics
   */
  async getIndexStats(): Promise<{
    hasIndex: boolean;
    documentCount: number;
    withEmbeddings: boolean;
  }> {
    try {
      const count = await this.vectorStore.getCount();
      const hasEmbeddings = await this.vectorStore.hasEmbeddings();

      return {
        hasIndex: count > 0,
        documentCount: count,
        withEmbeddings: hasEmbeddings,
      };
    } catch (error) {
      console.error('Error getting index stats:', error);
      return {
        hasIndex: false,
        documentCount: 0,
        withEmbeddings: false,
      };
    }
  }
}

export const searchService = new SearchService();
