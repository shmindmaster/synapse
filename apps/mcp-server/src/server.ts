import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

/**
 * Synapse MCP Server
 * Provides codebase indexing and search tools for AI agents like Devin
 */
class SynapseMCPServer {
  private server: Server;
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.SYNAPSE_API_URL || 'http://localhost:3001';
    this.server = new Server(
      {
        name: 'synapse-codebase',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'search_codebase',
          description: 'Perform semantic search across the indexed codebase. Finds code by meaning, not just keywords.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Natural language search query (e.g., "How does authentication work?")',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results to return (default: 10)',
                default: 10,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'index_codebase',
          description: 'Index a codebase directory for semantic search. Can be called multiple times for different directories.',
          inputSchema: {
            type: 'object',
            properties: {
              directoryPath: {
                type: 'string',
                description: 'Path to the directory to index',
              },
              enableWatching: {
                type: 'boolean',
                description: 'Enable file watching for incremental updates (default: true)',
                default: true,
              },
            },
            required: ['directoryPath'],
          },
        },
        {
          name: 'get_code_context',
          description: 'Get context about a specific file or function in the codebase.',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: 'Path to the file',
              },
              functionName: {
                type: 'string',
                description: 'Optional: specific function or class name to get context for',
              },
            },
            required: ['filePath'],
          },
        },
        {
          name: 'chat_with_codebase',
          description: 'Chat with the codebase using RAG. Ask questions and get answers based on indexed code.',
          inputSchema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Your question or message about the codebase',
              },
              context: {
                type: 'object',
                description: 'Optional context (e.g., current file path)',
                properties: {
                  files: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of file paths to focus on',
                  },
                },
              },
            },
            required: ['message'],
          },
        },
        {
          name: 'get_knowledge_graph',
          description: 'Get the knowledge graph showing relationships between code entities.',
          inputSchema: {
            type: 'object',
            properties: {
              depth: {
                type: 'number',
                description: 'Depth of relationships to explore (default: 2)',
                default: 2,
              },
              focus: {
                type: 'string',
                description: 'Optional: focus on a specific topic or entity',
              },
            },
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'search_codebase':
            return await this.searchCodebase(args as { query: string; limit?: number });
          case 'index_codebase':
            return await this.indexCodebase(args as { directoryPath: string; enableWatching?: boolean });
          case 'get_code_context':
            return await this.getCodeContext(args as { filePath: string; functionName?: string });
          case 'chat_with_codebase':
            return await this.chatWithCodebase(args as { message: string; context?: { files?: string[] } });
          case 'get_knowledge_graph':
            return await this.getKnowledgeGraph(args as { depth?: number; focus?: string });
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error: any) {
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  private async searchCodebase(args: { query: string; limit?: number }) {
    try {
      const response = await axios.post(`${this.apiUrl}/api/semantic-search`, {
        query: args.query,
      });

      const results = (response.data.results || []).slice(0, args.limit || 10);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              query: args.query,
              results: results.map((r: any) => ({
                file: r.path,
                name: r.name,
                summary: r.analysis?.summary,
                score: r.keywords?.[0] || 'N/A',
              })),
              totalResults: results.length,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  private async indexCodebase(args: { directoryPath: string; enableWatching?: boolean }) {
    try {
      await axios.post(`${this.apiUrl}/api/index-files`, {
        baseDirectories: [{ path: args.directoryPath }],
        enableWatching: args.enableWatching !== false,
      });

      if (args.enableWatching) {
        await axios.post(`${this.apiUrl}/api/watch-directory`, {
          directoryPath: args.directoryPath,
        });
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Codebase indexed: ${args.directoryPath}`,
              watching: args.enableWatching !== false,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      throw new Error(`Indexing failed: ${error.message}`);
    }
  }

  private async getCodeContext(args: { filePath: string; functionName?: string }) {
    try {
      // Search for the specific file/function
      const query = args.functionName
        ? `function ${args.functionName} in ${args.filePath}`
        : `file ${args.filePath}`;

      const response = await axios.post(`${this.apiUrl}/api/semantic-search`, {
        query,
      });

      const results = response.data.results || [];
      const relevantResult = results.find((r: any) =>
        r.path.includes(args.filePath)
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              filePath: args.filePath,
              functionName: args.functionName,
              context: relevantResult
                ? {
                    summary: relevantResult.analysis?.summary,
                    path: relevantResult.path,
                    tags: relevantResult.analysis?.tags,
                  }
                : null,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      throw new Error(`Failed to get code context: ${error.message}`);
    }
  }

  private async chatWithCodebase(args: { message: string; context?: { files?: string[] } }) {
    try {
      const response = await axios.post(`${this.apiUrl}/api/chat`, {
        message: args.message,
        context: args.context,
      });

      return {
        content: [
          {
            type: 'text',
            text: response.data.reply || 'No response received',
          },
        ],
      };
    } catch (error: any) {
      throw new Error(`Chat failed: ${error.message}`);
    }
  }

  private async getKnowledgeGraph(args: { depth?: number; focus?: string }) {
    try {
      const url = `${this.apiUrl}/api/knowledge-graph${args.focus ? `?focus=${encodeURIComponent(args.focus)}` : ''}`;
      const response = await axios.get(url);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      throw new Error(`Failed to get knowledge graph: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Synapse MCP server running on stdio');
  }
}

// Start server
const server = new SynapseMCPServer();
server.run().catch(console.error);

