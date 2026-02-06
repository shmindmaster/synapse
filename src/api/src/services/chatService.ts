import { OpenAI } from 'openai';
import { searchService } from './searchService.js';
import { config } from '../config/configuration.js';

/**
 * Chat service for RAG-based chat with context from indexed documents
 */
export class ChatService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.ai.openaiApiKey || config.ai.doInferenceApiKey || 'not-needed-for-local',
      baseURL: config.ai.useLocalModels ? config.ai.local.llmEndpoint : config.ai.baseUrl,
      maxRetries: 3,
      timeout: config.ai.local.llmTimeout || 60000,
    });
  }

  /**
   * Check if AI is properly configured (cloud key or local endpoint)
   */
  private isConfigured(): boolean {
    return !!(config.ai.openaiApiKey || config.ai.doInferenceApiKey || config.ai.baseUrl || config.ai.useLocalModels);
  }

  /**
   * Generate chat response with RAG context
   */
  async chat(
    message: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<string> {
    try {
      // Get relevant context from search
      const searchResults = await searchService.semanticSearch(message, 5, 0.7);

      // Build context from search results
      const context =
        searchResults.length > 0
          ? `\n\nRelevant context from documents:\n${searchResults
              .map(r => `- ${r.path}: ${r.preview}`)
              .join('\n')}`
          : '';

      // Prepare messages for OpenAI
      const messages: Array<{ role: string; content: string }> = [
        {
          role: 'system',
          content: `You are Synapse, an AI assistant for knowledge base search and analysis. You help users find and understand information from their indexed documents. ${context}`,
        },
        ...conversationHistory,
        {
          role: 'user',
          content: message,
        },
      ];

      // Check if AI is configured (cloud or local)
      if (!this.isConfigured()) {
        return `I'm ready to help! To enable AI responses, please configure an OpenAI API key or local model endpoint.

Found ${searchResults.length} relevant documents:
${searchResults.map(r => `- ${r.path}: ${r.preview}`).join('\n')}`;
      }

      // Call OpenAI-compatible API (works with OpenAI, Ollama, vLLM, etc.)
      const model = config.ai.useLocalModels 
        ? (config.ai.local.llmModel || 'llama3.2')
        : config.ai.chatModel;
      
      const response = await this.openai.chat.completions.create({
        model,
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.choices[0].message.content || 'No response generated';
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  }

  /**
   * Stream chat response
   */
  async *chatStream(
    message: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): AsyncGenerator<string> {
    try {
      // Get relevant context from search
      const searchResults = await searchService.semanticSearch(message, 5, 0.7);

      // Build context from search results
      const context =
        searchResults.length > 0
          ? `\n\nRelevant context from documents:\n${searchResults
              .map(r => `- ${r.path}: ${r.preview}`)
              .join('\n')}`
          : '';

      // Prepare messages for OpenAI
      const messages: Array<{ role: string; content: string }> = [
        {
          role: 'system',
          content: `You are Synapse, an AI assistant for knowledge base search and analysis. You help users find and understand information from their indexed documents. ${context}`,
        },
        ...conversationHistory,
        {
          role: 'user',
          content: message,
        },
      ];

      // Check if AI is configured (cloud or local)
      if (!this.isConfigured()) {
        yield `I'm ready to help! To enable AI responses, please configure an OpenAI API key or local model endpoint.

Found ${searchResults.length} relevant documents:
${searchResults.map(r => `- ${r.path}: ${r.preview}`).join('\n')}`;
        return;
      }

      // Call OpenAI-compatible API with streaming (works with OpenAI, Ollama, vLLM, etc.)
      const model = config.ai.useLocalModels 
        ? (config.ai.local.llmModel || 'llama3.2')
        : config.ai.chatModel;
        
      const stream = await this.openai.chat.completions.create({
        model,
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.choices[0].delta.content) {
          yield chunk.choices[0].delta.content;
        }
      }
    } catch (error) {
      console.error('Chat stream error:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService();
