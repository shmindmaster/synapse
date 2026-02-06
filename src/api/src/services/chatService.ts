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

      // Detect dominant content type from search results for prompt tuning
      const systemPrompt = this.buildSystemPrompt(searchResults, context);

      // Prepare messages for OpenAI
      const messages: Array<{ role: string; content: string }> = [
        {
          role: 'system',
          content: systemPrompt,
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
        ? (config.ai.local.llmModel || 'qwen2.5-coder:7b')
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
        ? (config.ai.local.llmModel || 'qwen2.5-coder:7b')
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
  /**
   * Build a content-aware system prompt based on the types of documents
   * found in search results. Improves response quality for different
   * use cases: code, legal, business, research, general docs.
   */
  private buildSystemPrompt(searchResults: any[], context: string): string {
    const base = 'You are Synapse, an AI assistant for knowledge base search and analysis.';
    
    if (searchResults.length === 0) {
      return `${base} You help users find and understand information from their indexed documents. No relevant documents were found for this query — answer based on your general knowledge and suggest the user index more content.`;
    }

    // Detect dominant content type from file paths
    const paths = searchResults.map(r => r.path?.toLowerCase() || '');
    const codeExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.c', '.cpp', '.cs', '.rb', '.php', '.swift', '.kt'];
    const docExts = ['.md', '.rst', '.txt', '.adoc'];
    const legalExts = ['.pdf', '.docx', '.doc'];
    const dataExts = ['.json', '.yaml', '.yml', '.xml', '.csv', '.sql'];
    
    const codeCount = paths.filter(p => codeExts.some(e => p.endsWith(e))).length;
    const docCount = paths.filter(p => docExts.some(e => p.endsWith(e))).length;
    const legalKeywords = ['contract', 'agreement', 'nda', 'terms', 'policy', 'compliance', 'legal', 'license'];
    const legalCount = paths.filter(p => legalKeywords.some(k => p.includes(k))).length;
    const dataCount = paths.filter(p => dataExts.some(e => p.endsWith(e))).length;

    let persona: string;
    
    if (codeCount > searchResults.length * 0.5) {
      persona = `${base} You are an expert code analyst. When answering questions about code:
- Reference specific files, functions, and line-level details
- Explain architecture patterns and design decisions
- Suggest improvements when relevant
- Use code formatting for technical terms`;
    } else if (legalCount > 0) {
      persona = `${base} You are analyzing legal or compliance documents. When answering:
- Be precise about terms, obligations, and conditions
- Flag any ambiguities or risks
- Reference specific clauses and sections
- Note any dates, deadlines, or parties mentioned
- Caveat that this is not legal advice`;
    } else if (dataCount > searchResults.length * 0.5) {
      persona = `${base} You are analyzing data files and configurations. When answering:
- Reference specific fields, schemas, and data structures
- Explain relationships between data elements
- Note any patterns or anomalies in the data`;
    } else if (docCount > searchResults.length * 0.5) {
      persona = `${base} You are analyzing documentation and written content. When answering:
- Synthesize information across multiple sections
- Highlight key points and actionable items
- Reference specific sections and headings`;
    } else {
      persona = `${base} You help users find and understand information from their indexed documents.`;
    }

    return `${persona} ${context}`;
  }
}

export const chatService = new ChatService();
