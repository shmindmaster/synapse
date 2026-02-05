/**
 * Enhanced AI Service with Streaming, Error Handling, and Retries
 * Implements best practices for production OpenAI usage
 */
import { config } from '../config/configuration.js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: config.ai.openaiDirectApiKey || config.ai.doInferenceApiKey || 'not-needed-for-local',
  baseURL: config.ai.baseUrl, // Support for Ollama/vLLM
  maxRetries: 3,
  timeout: 60000,
});

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamChunk {
  content: string;
  finish_reason?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Stream chat completion with enhanced error handling
 */
export async function* streamChatCompletion(
  messages: AIMessage[],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  } = {}
): AsyncGenerator<StreamChunk> {
  const { model = process.env.AI_MODEL || 'gpt-4', temperature = 0.7, max_tokens = 2000 } = options;

  try {
    const stream = await openai.chat.completions.create({
      model,
      messages,
      stream: true,
      temperature,
      max_tokens,
    });

    let totalTokens = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      const content = delta?.content;

      if (content) {
        yield { content };
      }

      // Handle completion
      const finishReason = chunk.choices[0]?.finish_reason;
      if (finishReason) {
        if (finishReason === 'length') {
          yield {
            content: '\n\n[Response truncated due to length limit]',
            finish_reason: finishReason,
          };
        }

        // Note: Usage info not available in streaming mode
        yield {
          content: '',
          finish_reason: finishReason,
        };
      }
    }
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      // Handle rate limits
      if (error.status === 429) {
        const retryAfter = error.headers?.['retry-after'];
        throw new Error(
          `Rate limited. ${retryAfter ? `Retry after ${retryAfter}s` : 'Please try again later'}`
        );
      }

      // Handle authentication errors
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      }

      // Handle quota errors
      if (error.status === 429 && error.message.includes('quota')) {
        throw new Error('OpenAI quota exceeded. Please check your billing.');
      }
    }

    throw error;
  }
}

/**
 * Generate non-streaming chat completion
 */
export async function generateChatCompletion(
  messages: AIMessage[],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  } = {}
): Promise<{ content: string; usage: any }> {
  const { model = process.env.AI_MODEL || 'gpt-4', temperature = 0.7, max_tokens = 2000 } = options;

  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens,
    });

    return {
      content: response.choices[0].message.content || '',
      usage: response.usage,
    };
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        throw new Error('Rate limited. Please try again later.');
      }
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key.');
      }
    }
    throw error;
  }
}

/**
 * Check if AI is properly configured
 */
export function isAIConfigured(): boolean {
  return !!(process.env.OPENAI_API_KEY || process.env.OPENAI_DIRECT_API_KEY);
}
