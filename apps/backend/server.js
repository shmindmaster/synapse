import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import cors from 'cors';
import textract from 'textract';
import walk from 'walk';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import crypto from 'crypto';
import dotenv from 'dotenv';
// ESM/CommonJS compatibility fix for production
import prismaPackage from '@prisma/client';
const { PrismaClient } = prismaPackage;
import bcrypt from 'bcrypt';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

dotenv.config();

// Initialize Prisma Client for database operations
const prisma = new PrismaClient();

// Initialize DigitalOcean Spaces client (S3-compatible)
const spacesClient = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
  region: process.env.DO_SPACES_REGION || 'nyc3',
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY || '',
    secretAccessKey: process.env.DO_SPACES_SECRET || '',
  },
});
const SPACES_BUCKET = process.env.DO_SPACES_BUCKET || 'synapse';
const VECTOR_STORE_KEY = 'synapse_memory.json';

// Content length limits for AI processing
const MAX_CLASSIFICATION_CONTENT_LENGTH = 8000;
const MAX_DOCUMENT_CONTENT_LENGTH = 3000;
const MAX_PREVIEW_LENGTH = 1000;
const MAX_SYNTHESIS_FILES = 10;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Use /app/data in Docker, current directory in development (fallback for local dev)
const DATA_DIR = process.env.DATA_DIR || __dirname;
const INDEX_FILE = path.join(DATA_DIR, 'synapse_memory.json');
// File root directory - fallback to home directory or /tmp
const FILES_ROOT = process.env.FILES_ROOT || process.env.HOME || '/tmp';

const app = express();
const PORT = process.env.PORT || 3001;

// Simple token generation (for demo purposes - use JWT in production)
function generateToken(userId) {
  return crypto.randomBytes(32).toString('hex') + '.' + userId + '.' + Date.now();
}

// DigitalOcean Gradient AI Configuration (OpenAI-compatible)
const inferenceEndpoint = process.env.DIGITALOCEAN_INFERENCE_ENDPOINT || 'https://inference.do-ai.run/v1';
const modelKey = process.env.DIGITALOCEAN_MODEL_KEY || process.env.OPENAI_API_KEY;
const chatModel = process.env.AI_MODEL_CHAT || process.env.AI_MODEL || 'llama-3.1-8b-instruct';
const embeddingModel = process.env.AI_MODEL_EMBEDDINGS || 'gte-large-en-v1.5';

// DigitalOcean client for chat completions
const aiClient = new OpenAI({
  baseURL: inferenceEndpoint,
  apiKey: modelKey,
});

// OpenAI client for embeddings (DigitalOcean doesn't support embeddings endpoint)
// Use OpenAI API directly for embeddings
const openaiKey = process.env.OPENAI_API_KEY;
const embeddingClient = new OpenAI({
  apiKey: openaiKey || 'dummy-key', // Will fail gracefully if not set
});

// Check if embeddings are available
const embeddingsAvailable = !!openaiKey;
console.log(`📊 Embeddings: ${embeddingsAvailable ? 'OpenAI API configured' : 'Not available (set OPENAI_API_KEY for semantic search)'}`);

// Simple text similarity fallback when embeddings unavailable
function simpleTextSimilarity(query, text) {
  const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const textWords = new Set(text.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const intersection = [...queryWords].filter(w => textWords.has(w));
  return intersection.length / Math.max(queryWords.size, 1);
}

// Helper function wrapping DigitalOcean Gradient AI (OpenAI-compatible chat API)
async function callResponsesAPI(input, instructions, previousResponseId) {
  const messages = [];

  if (instructions) {
    messages.push({ role: 'system', content: instructions });
  }

  if (previousResponseId) {
    messages.push({
      role: 'system',
      content: `previous_response_id: ${previousResponseId}`,
    });
  }

  messages.push({ role: 'user', content: input });

  const response = await aiClient.chat.completions.create({
    model: chatModel,
    messages,
    temperature: 0.2,
  });

  const content = response.choices?.[0]?.message?.content || '';

  // Preserve Responses API-like shape expected by callers
  return {
    output: [
      {
        message: {
          content,
        },
      },
    ],
  };
}

// Validate DigitalOcean / OpenAI-compatible configuration
if (!modelKey) {
  console.error('ERROR: No AI model key configured. Please set DIGITALOCEAN_MODEL_KEY or OPENAI_API_KEY in your environment.');
  process.exit(1);
}

// Persistent Vector Store
let vectorStore = [];

// Helper: Stream S3 response body to string
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// Load Memory on Startup - tries Spaces first, falls back to local file
async function loadMemory() {
  // Try loading from DigitalOcean Spaces first (production)
  if (process.env.DO_SPACES_KEY && process.env.DO_SPACES_SECRET) {
    try {
      console.log('📦 Loading Synapse Memory from DigitalOcean Spaces...');
      const command = new GetObjectCommand({
        Bucket: SPACES_BUCKET,
        Key: VECTOR_STORE_KEY,
      });
      const response = await spacesClient.send(command);
      const data = await streamToString(response.Body);
      vectorStore = JSON.parse(data);
      console.log(`✅ Memory Loaded from Spaces: ${vectorStore.length} chunks indexed.`);
      return;
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        console.log('📦 No existing memory in Spaces, starting fresh.');
      } else {
        console.warn('⚠️ Failed to load from Spaces, trying local file:', error.message);
      }
    }
  }

  // Fallback to local file (development)
  if (existsSync(INDEX_FILE)) {
    console.log('📁 Loading Synapse Memory from local file...');
    const data = await fs.readFile(INDEX_FILE, 'utf-8');
    vectorStore = JSON.parse(data);
    console.log(`✅ Memory Loaded: ${vectorStore.length} chunks indexed.`);
  }
}

// Save Memory - saves to Spaces in production, local file in development
async function saveMemory() {
  const data = JSON.stringify(vectorStore);
  
  // Save to DigitalOcean Spaces (production)
  if (process.env.DO_SPACES_KEY && process.env.DO_SPACES_SECRET) {
    try {
      const command = new PutObjectCommand({
        Bucket: SPACES_BUCKET,
        Key: VECTOR_STORE_KEY,
        Body: data,
        ContentType: 'application/json',
        ACL: 'private',
      });
      await spacesClient.send(command);
      console.log(`✅ Memory saved to Spaces: ${vectorStore.length} chunks.`);
    } catch (error) {
      console.error('❌ Failed to save to Spaces:', error.message);
      // Fallback to local file
      await fs.writeFile(INDEX_FILE, data);
      console.log(`📁 Memory saved locally as fallback.`);
    }
  } else {
    // Save to local file (development)
    await fs.writeFile(INDEX_FILE, data);
    console.log(`📁 Memory saved locally: ${vectorStore.length} chunks.`);
  }
}

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for large file analysis

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Synapse API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    aiProvider: process.env.AI_PROVIDER || 'digitalocean',
    aiModel: chatModel,
    embeddingsAvailable,
  });
});

// Single Embedding Endpoint (for client-side indexing)
app.post('/api/embedding', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const response = await embeddingClient.embeddings.create({
      model: embeddingModel,
      input: text.slice(0, 8000), // Limit input size
    });
    res.json({ embedding: response.data[0].embedding });
  } catch (error) {
    console.error('Embedding error:', error);
    res.status(500).json({ error: 'Failed to generate embedding' });
  }
});

// Batch Embeddings Endpoint (for efficient bulk indexing)
app.post('/api/embeddings', async (req, res) => {
  const { texts } = req.body;
  if (!texts || !Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({ error: 'Texts array is required' });
  }

  // Limit batch size to prevent timeouts
  const limitedTexts = texts.slice(0, 50).map(t => t.slice(0, 8000));

  try {
    const response = await embeddingClient.embeddings.create({
      model: embeddingModel,
      input: limitedTexts,
    });
    const embeddings = response.data.map(d => d.embedding);
    res.json({ embeddings });
  } catch (error) {
    console.error('Batch embedding error:', error);
    res.status(500).json({ error: 'Failed to generate embeddings' });
  }
});

// OpenAPI 3.1 Schema Endpoint
app.get('/api/openapi', (req, res) => {
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://synapse.shtrial.com' : `http://localhost:${PORT}`;
  const openApiSpec = {
    openapi: '3.1.0',
    info: {
      title: 'Synapse API',
      version: '2.0.0',
      description: 'Intelligent file system knowledge base with AI-powered analysis. Synapse turns your file system into a queryable knowledge base using AI and vector search.',
      contact: {
        name: 'Synapse Support',
        url: 'https://synapse.shtrial.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      { url: baseUrl, description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development' }
    ],
    paths: {
      '/api/health': {
        get: {
          summary: 'Health Check',
          description: 'Check API health status',
          operationId: 'getHealth',
          tags: ['Health'],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'healthy' },
                      service: { type: 'string', example: 'Synapse API' },
                      version: { type: 'string', example: '2.0.0' },
                      timestamp: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/auth/login': {
        post: {
          summary: 'User Login',
          description: 'Authenticate user and receive access token',
          operationId: 'login',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'demomaster@pendoah.ai' },
                    password: { type: 'string', example: 'Pendoah1225' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Successful login',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          email: { type: 'string' },
                          name: { type: 'string' },
                          role: { type: 'string', enum: ['ADMIN', 'DEVELOPER', 'INTEGRATOR', 'VIEWER'] }
                        }
                      },
                      token: { type: 'string' }
                    }
                  }
                }
              }
            },
            '401': { description: 'Invalid credentials' }
          }
        }
      },
      '/api/analyze': {
        post: {
          summary: 'AI File Analysis',
          description: 'AI-powered file content analysis returning summary, tags, category, and sensitivity',
          operationId: 'analyzeFile',
          tags: ['AI Analysis'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['filePath'],
                  properties: {
                    filePath: { type: 'string', description: 'Path to the file to analyze' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Analysis complete',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      analysis: {
                        type: 'object',
                        properties: {
                          summary: { type: 'string' },
                          tags: { type: 'array', items: { type: 'string' } },
                          category: { type: 'string' },
                          sensitivity: { type: 'string', enum: ['High', 'Low'] }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/chat': {
        post: {
          summary: 'Chat with File',
          description: 'Chat with file content using RAG (Retrieval Augmented Generation)',
          operationId: 'chatWithFile',
          tags: ['AI Analysis'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['filePath', 'message'],
                  properties: {
                    filePath: { type: 'string' },
                    message: { type: 'string' },
                    history: { type: 'array', items: { type: 'object' } }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Chat response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      reply: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/semantic-search': {
        post: {
          summary: 'Semantic Search',
          description: 'Search indexed files using semantic vector embeddings',
          operationId: 'semanticSearch',
          tags: ['Search'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['query'],
                  properties: {
                    query: { type: 'string', description: 'Natural language search query' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Search results',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      results: { type: 'array', items: { type: 'object' } }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/index-status': {
        get: {
          summary: 'Index Status',
          description: 'Check current vector index status',
          operationId: 'getIndexStatus',
          tags: ['Indexing'],
          responses: {
            '200': {
              description: 'Index status',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      hasIndex: { type: 'boolean' },
                      count: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Authentication', description: 'User authentication' },
      { name: 'AI Analysis', description: 'AI-powered file analysis and chat' },
      { name: 'Search', description: 'File search operations' },
      { name: 'Indexing', description: 'Vector index management' }
    ]
  };
  res.json(openApiSpec);
});

// API Documentation Endpoint
app.get('/api/docs', (req, res) => {
  const apiDocs = {
    name: 'Synapse API',
    version: '2.0.0',
    description: 'Intelligent file system knowledge base with AI-powered analysis',
    baseUrl: process.env.NODE_ENV === 'production' ? 'https://synapse.shtrial.com' : `http://localhost:${PORT}`,
    openApiSpec: '/api/openapi',
    endpoints: {
      authentication: {
        'POST /api/auth/login': {
          description: 'Authenticate user and receive access token',
          body: { email: 'string', password: 'string' },
          response: { success: 'boolean', user: 'object', token: 'string' }
        }
      },
      health: {
        'GET /api/health': {
          description: 'Check API health status',
          response: { status: 'string', service: 'string', version: 'string', timestamp: 'string' }
        }
      },
      fileOperations: {
        'POST /api/search': {
          description: 'Search files by keywords in specified directories',
          body: { baseDirectories: 'array', keywordConfigs: 'array' },
          response: { results: 'array', totalFiles: 'number', filesProcessed: 'number' }
        },
        'POST /api/analyze': {
          description: 'AI-powered file content analysis',
          body: { filePath: 'string' },
          response: { success: 'boolean', analysis: 'object' }
        },
        'POST /api/chat': {
          description: 'Chat with file content using RAG',
          body: { filePath: 'string', message: 'string', history: 'array' },
          response: { success: 'boolean', reply: 'string' }
        },
        'POST /api/file-action': {
          description: 'Move or copy files',
          body: { file: 'object', action: 'move|copy', destination: 'string' },
          response: { success: 'boolean', message: 'string' }
        }
      },
      indexing: {
        'POST /api/index-files': {
          description: 'Index files for semantic search with embeddings',
          body: { baseDirectories: 'array' },
          response: { success: 'boolean', count: 'number', status: 'string' }
        },
        'GET /api/index-status': {
          description: 'Check current index status',
          response: { hasIndex: 'boolean', count: 'number' }
        },
        'POST /api/semantic-search': {
          description: 'Semantic search using vector embeddings',
          body: { query: 'string' },
          response: { results: 'array' }
        }
      }
    },
    demoCredentials: {
      email: 'demomaster@pendoah.ai',
      password: 'Pendoah1225',
      note: 'Use these credentials to test the API'
    }
  };
  res.json(apiDocs);
});

// Auth Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  try {
    // Find user by email (case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive'
        }
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify password with bcrypt
    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    // Log authentication for audit (fire-and-forget to prevent blocking login)
    prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'login',
        resource: 'authentication',
        details: { email: user.email }
      }
    }).catch(err => console.error('Audit log failed:', err));

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Helper: Normalize paths for cross-platform consistency
function normalizePath(filePath) {
  return path.normalize(filePath).replace(/\\/g, '/');
}

// Helper: Extract text from files
function extractText(filePath) {
  return new Promise((resolve) => {
    textract.fromFileWithPath(filePath, (error, text) => {
      if (error) resolve(""); 
      else resolve(text);
    });
  });
}

// Split text into overlapping chunks (Context Window Optimization)
function chunkText(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks;
}

// Cosine Similarity Helper
function cosineSimilarity(vecA, vecB) {
  let dot = 0.0, normA = 0.0, normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 1. Smart Scan Endpoint (Preserves existing logic + prepares for AI)
app.post('/api/search', async (req, res) => {
  const { baseDirectories, keywordConfigs } = req.body;
  const results = [];
  let filesProcessed = 0;
  let totalFiles = 0;

  // Note: In a production version, we would offload this walker to a worker thread
  for (const directory of baseDirectories) {
    const walker = walk.walk(directory.path, { followLinks: false });

    walker.on('file', async (root, stats, next) => {
      totalFiles++;
      const filePath = path.join(root, stats.name);
      
      // Skip system files and node_modules
      if (stats.name.startsWith('.') || filePath.includes('node_modules')) {
        filesProcessed++;
        next();
        return;
      }

      try {
        const content = await extractText(filePath);
        // Hybrid Search: Matches keywords OR if content seems relevant
        const matchedConfigs = keywordConfigs.filter(config => 
          config.keywords.every(keyword => 
            content.toLowerCase().includes(keyword.toLowerCase())
          )
        );

        if (matchedConfigs.length > 0) {
          results.push({
            name: stats.name,
            path: normalizePath(filePath),
            keywords: matchedConfigs.flatMap(config => config.keywords),
            size: stats.size,
            type: path.extname(stats.name)
          });
        }
      } catch (error) {
        // Silent fail on unreadable files
      }
      
      filesProcessed++;
      // Send progress updates
      if (filesProcessed % 5 === 0) {
        res.write(JSON.stringify({ filesProcessed, totalFiles }) + '\n');
      }
      next();
    });

    walker.on('end', () => {
      if (directory === baseDirectories[baseDirectories.length - 1]) {
        res.write(JSON.stringify({ results, totalFiles, filesProcessed }));
        res.end();
      }
    });
  }
});

// 2. NEW: AI Analysis Endpoint
app.post('/api/analyze', async (req, res) => {
  const { filePath } = req.body;
  
  try {
    const content = await extractText(filePath);
    // Token limit protection: 10,000 characters ≈ 2,500 tokens for GPT-4
    const MAX_CONTENT_LENGTH_FOR_ANALYSIS = 10000;
    const truncatedContent = content.substring(0, MAX_CONTENT_LENGTH_FOR_ANALYSIS);

    const instructions = "You are an intelligent file system auditor. Return JSON only. The JSON must have these keys: summary (2-sentence executive summary), tags (array of 5 technical or thematic tags), category (suggested folder name), sensitivity (\"High\" if contains PII/Keys or \"Low\").";
    
    const input = `Analyze the following file content and return a strictly valid JSON object (no markdown formatting):
      
      Content:
      ${truncatedContent}`;

    const response = await callResponsesAPI(input, instructions);
    
    // Extract content from Responses API format
    const aiResponseContent = response.output?.[0]?.message?.content || '';
    const analysis = JSON.parse(aiResponseContent);
    res.json({ success: true, analysis });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. NEW: Chat with File (RAG)
app.post('/api/chat', async (req, res) => {
  const { filePath, message, history } = req.body;

  try {
    const content = await extractText(filePath);
    const context = content.substring(0, 15000); 

    // Build input with context and history
    let inputText = `File Context:\n${context}\n\nUser Question: ${message}`;
    
    // Include recent history in the input (Responses API doesn't use message arrays)
    if (history && history.length > 0) {
      const recentHistory = history.slice(-4).map(h => {
        if (h.role === 'user') return `User: ${h.content}`;
        if (h.role === 'assistant') return `Assistant: ${h.content}`;
        return '';
      }).filter(Boolean).join('\n');
      if (recentHistory) {
        inputText = `Previous conversation:\n${recentHistory}\n\n${inputText}`;
      }
    }

    const instructions = "You are a helpful assistant. Answer the user's question based ONLY on the file content provided below.";

    const response = await callResponsesAPI(inputText, instructions);
    
    // Extract content from Responses API format
    const reply = response.output?.[0]?.message?.content || '';

    res.json({ success: true, reply });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. File Actions (Move/Copy)
app.post('/api/file-action', async (req, res) => {
  const { file, action, destination } = req.body;
  const sourcePath = path.resolve(file.path);
  const destPath = path.resolve(destination, file.name);

  try {
    if (action === 'move') {
      await fs.rename(sourcePath, destPath);
    } else if (action === 'copy') {
      await fs.copyFile(sourcePath, destPath);
    }
    res.json({ success: true, message: `File ${action}d successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Indexing Endpoint with Persistence & Chunking
app.post('/api/index-files', async (req, res) => {
  const { baseDirectories } = req.body;
  let newVectors = []; // Temp store to append
  let filesProcessed = 0;
  let totalFiles = 0;

  for (const directory of baseDirectories) {
    const walker = walk.walk(directory.path, { followLinks: false });

    walker.on('file', async (root, stats, next) => {
      const filePath = path.join(root, stats.name);
      if (stats.name.startsWith('.') || filePath.includes('node_modules')) {
        next();
        return;
      }
      totalFiles++;

      try {
        const content = await extractText(filePath);
        if (content && content.length > 50) {
           // Chunking Strategy
           const chunks = chunkText(content);
           
           // Limit to first 5 chunks per file to save tokens/time for this demo
           const limitedChunks = chunks.slice(0, 5); 

           for (const chunk of limitedChunks) {
             const embeddingResponse = await embeddingClient.embeddings.create({
               model: embeddingModel,
               input: chunk,
             });
             
             newVectors.push({
               id: `${filePath}-${Date.now()}-${Math.random()}`,
               name: stats.name,
               path: normalizePath(filePath),
               embedding: embeddingResponse.data[0].embedding,
               preview: chunk // Store actual text chunk for RAG
             });
           }
        }
      } catch (error) {
        console.error(`Skipping ${filePath}: ${error.message}`);
      }
      
      filesProcessed++;
      res.write(JSON.stringify({ filesProcessed, totalFiles, status: 'indexing' }) + '\n');
      next();
    });

    walker.on('end', async () => {
      if (directory === baseDirectories[baseDirectories.length - 1]) {
        // Merge and Save - Remove old entries for same paths, then add new ones
        vectorStore = [...vectorStore.filter(v => !newVectors.find(n => n.path === v.path)), ...newVectors];
        await saveMemory();
        
        res.write(JSON.stringify({ success: true, count: vectorStore.length, status: 'complete' }));
        res.end();
      }
    });
  }
});

// 6. Check Index Status
app.get('/api/index-status', (req, res) => {
  res.json({ hasIndex: vectorStore.length > 0, count: vectorStore.length });
});

// 6.1 Index Summary for Inspector
app.get('/api/index-summary', (req, res) => {
  if (vectorStore.length === 0) {
    return res.json({
      hasIndex: false,
      totalChunks: 0,
      totalFiles: 0,
      files: [],
    });
  }

  const fileMap = new Map();
  vectorStore.forEach(doc => {
    const key = doc.path || doc.name;
    if (!key) return;
    const existing = fileMap.get(key);
    if (existing) {
      existing.chunks += 1;
    } else {
      fileMap.set(key, {
        name: doc.name,
        path: doc.path,
        chunks: 1,
      });
    }
  });

  const files = Array.from(fileMap.values())
    .sort((a, b) => b.chunks - a.chunks)
    .slice(0, 20);

  res.json({
    hasIndex: true,
    totalChunks: vectorStore.length,
    totalFiles: fileMap.size,
    files,
  });
});

// 6.5 Index Browser Files (for File System Access API)
app.post('/api/index-browser-files', async (req, res) => {
  const { files } = req.body;
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'Files array is required' });
  }

  try {
    const newVectors = [];
    
    for (const file of files) {
      if (!file.chunks || !Array.isArray(file.chunks)) continue;
      
      for (const chunk of file.chunks) {
        if (!chunk || chunk.length < 20) continue;
        
        // Store without embeddings - use text-based search as fallback
        newVectors.push({
          name: file.name,
          path: file.path,
          preview: chunk.substring(0, 500),
          content: chunk, // Store full chunk for text search
          embedding: null // No embedding - will use text similarity
        });
      }
    }

    // Merge with existing vectors (replace files with same path)
    const existingPaths = new Set(newVectors.map(v => v.path));
    vectorStore = [
      ...vectorStore.filter(v => !existingPaths.has(v.path)),
      ...newVectors
    ];
    
    await saveMemory();
    
    res.json({ 
      success: true, 
      count: vectorStore.length,
      indexed: newVectors.length 
    });
  } catch (error) {
    console.error('Browser file indexing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Enhanced Semantic Search with Deduplication (with text fallback)
app.post('/api/semantic-search', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Please enter a search query.' });
  if (vectorStore.length === 0) return res.status(400).json({ error: 'No files indexed yet. Click "Select Folder" to index your files first.' });

  try {
    let rawResults;
    
    // Check if we have embeddings or need to use text search
    const hasEmbeddings = vectorStore.some(doc => doc.embedding && Array.isArray(doc.embedding));
    
    if (hasEmbeddings && embeddingsAvailable) {
      // Use vector similarity search
      const queryResponse = await embeddingClient.embeddings.create({
        model: embeddingModel,
        input: query,
      });
      const queryEmbedding = queryResponse.data[0].embedding;
      
      rawResults = vectorStore
        .filter(doc => doc.embedding)
        .map(doc => ({
          ...doc,
          score: cosineSimilarity(queryEmbedding, doc.embedding)
        }))
        .sort((a, b) => b.score - a.score)
        .filter(doc => doc.score > 0.25);
    } else {
      // Fallback to text-based search with weighted scores
      rawResults = vectorStore.map(doc => {
        const nameText = doc.name || '';
        const pathText = doc.path || '';
        const bodyText = doc.content || doc.preview || '';
        const nameScore = simpleTextSimilarity(query, nameText);
        const pathScore = simpleTextSimilarity(query, pathText);
        const bodyScore = simpleTextSimilarity(query, bodyText);
        const score = bodyScore * 0.7 + nameScore * 0.2 + pathScore * 0.1;
        return {
          ...doc,
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .filter(doc => doc.score > 0.05);
    }

    // Deduplicate: Return top file match only once
    const uniqueFiles = new Map();
    rawResults.forEach(r => {
      if (!uniqueFiles.has(r.path)) {
        uniqueFiles.set(r.path, {
          name: r.name,
          path: r.path,
          keywords: [`${(r.score * 100).toFixed(0)}% Match`],
          analysis: {
            summary: (r.preview || '').substring(0, 150) + "...",
            category: "Search Result",
            tags: hasEmbeddings ? ["Vector Match"] : ["Text Match"],
            sensitivity: "Low"
          }
        });
      }
    });

    res.json({ results: Array.from(uniqueFiles.values()).slice(0, 12) });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// ADVANCED AI FEATURES (2025)
// ========================================

// Feature 1: Intelligent Document Classification & Auto-Organization
app.post('/api/classify-document', async (req, res) => {
  const { filePath, content } = req.body;
  
  if (!filePath && !content) {
    return res.status(400).json({ error: 'Either filePath or content is required' });
  }
  
  try {
    let documentContent = content;
    if (!documentContent && filePath) {
      documentContent = await extractText(filePath);
    }
    
    // Check for null/undefined documentContent before truncation
    if (!documentContent) {
      throw new Error('Failed to extract document content');
    }
    // Limit content size for classification
    const truncatedContent = documentContent.substring(0, MAX_CLASSIFICATION_CONTENT_LENGTH);
    const instructions = `You are an expert document classifier. Analyze the document and return ONLY a valid JSON object with these exact keys:
    - documentType: one of [contract, invoice, report, email, presentation, technical_doc, research_paper, marketing_material, legal_document, financial_statement, meeting_notes, proposal, specification, manual, other]
    - category: specific subcategory (e.g., "Q4 Financial Report", "Employment Contract")
    - confidence: number between 0-1 indicating classification confidence
    - suggestedPath: recommended folder structure (e.g., "Finance/Invoices/2024")
    - extractedEntities: array of key entities found (people, organizations, dates, amounts)
    - tags: array of 5-7 relevant tags
    - summary: 1-sentence description`;
    
    const input = `Classify this document and extract key information:

${truncatedContent}`;

    const response = await callResponsesAPI(input, instructions);
    const aiContent = response.output?.[0]?.message?.content || '';
    
    // Clean up response - remove markdown code blocks if present
    const cleanedContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let classification;
    try {
      classification = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse classification response:', parseError);
      throw new Error('AI returned malformed response. Please try again.');
    }
    
    // Store classification in database using DocumentType model
    try {
      await prisma.documentType.upsert({
        where: { typeName: classification.documentType },
        update: {
          category: classification.category,
          analysisRules: classification,
          updatedAt: new Date(),
        },
        create: {
          typeName: classification.documentType,
          category: classification.category,
          analysisRules: classification,
        },
      });
    } catch (dbError) {
      console.warn('Failed to store classification in DB:', dbError.message);
    }
    
    res.json({ 
      success: true, 
      classification,
      filePath,
    });
    
  } catch (error) {
    console.error('Classification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'An internal error occurred while classifying the document.',
      details: 'Failed to classify document'
    });
  }
});

// Feature 2: Multi-Document Synthesis & Knowledge Graph
app.post('/api/synthesize-documents', async (req, res) => {
  const { filePaths, query, analysisType } = req.body;
  
  if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
    return res.status(400).json({ error: 'filePaths array is required' });
  }
  
  if (filePaths.length > MAX_SYNTHESIS_FILES) {
    return res.status(400).json({ error: `Maximum ${MAX_SYNTHESIS_FILES} documents can be synthesized at once` });
  }
  
  try {
    // Extract content from all files
    const documents = await Promise.all(
      filePaths.map(async (fp) => {
        try {
          const content = await extractText(fp);
          // Limit each document to fit within token limits
          return {
            path: fp,
            content: content.substring(0, MAX_DOCUMENT_CONTENT_LENGTH),
            name: path.basename(fp),
          };
        } catch (err) {
          return {
            path: fp,
            content: '',
            name: path.basename(fp),
            error: err.message,
          };
        }
      })
    );
    
    const validDocs = documents.filter(d => d.content);
    
    if (validDocs.length === 0) {
      return res.status(400).json({ error: 'No valid documents could be processed' });
    }
    
    const analysisTypes = {
      'synthesis': 'Create a comprehensive synthesis that identifies common themes, contradictions, and key insights across all documents',
      'timeline': 'Extract all temporal information and create a chronological timeline of events mentioned across documents',
      'entities': 'Extract and map all entities (people, organizations, locations, concepts) and their relationships across documents',
      'comparative': 'Compare and contrast the documents, highlighting similarities, differences, and unique contributions of each',
      'knowledge_graph': 'Create a knowledge graph showing key concepts and their relationships across all documents',
    };
    
    const analysisPrompt = analysisTypes[analysisType] || analysisTypes['synthesis'];
    
    const instructions = `You are an expert knowledge synthesis AI. ${analysisPrompt}. Return ONLY valid JSON with this structure:
    {
      "synthesis": "comprehensive synthesis text",
      "keyThemes": ["theme1", "theme2", ...],
      "entities": [{"name": "entity", "type": "person|org|concept", "mentions": number, "documents": ["doc1", "doc2"]}],
      "relationships": [{"from": "entity1", "to": "entity2", "type": "relationship", "strength": 0-1}],
      "timeline": [{"date": "date", "event": "event", "source": "document"}],
      "insights": ["insight1", "insight2", ...],
      "contradictions": ["contradiction1", ...],
      "confidence": 0-1
    }`;
    
    const docsText = validDocs.map((d, i) => 
      `DOCUMENT ${i + 1}: ${d.name}\n${d.content}\n${'='.repeat(80)}`
    ).join('\n\n');
    
    const input = `${query ? `FOCUS: ${query}\n\n` : ''}Analyze these documents:\n\n${docsText}`;
    
    const response = await callResponsesAPI(input, instructions);
    const aiContent = response.output?.[0]?.message?.content || '';
    const cleanedContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let synthesis;
    try {
      synthesis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse synthesis response:', parseError);
      throw new Error('AI returned malformed response. Please try again.');
    }
    
    // Store synthesis in KnowledgeOrganizationPattern
    try {
      await prisma.knowledgeOrganizationPattern.create({
        data: {
          patternName: `Synthesis_${Date.now()}`,
          organizationType: analysisType || 'synthesis',
          structure: {
            ...synthesis,
            documents: validDocs.map(d => ({ path: d.path, name: d.name })),
            createdAt: new Date().toISOString(),
          },
        },
      });
    } catch (dbError) {
      console.warn('Failed to store synthesis in DB:', dbError.message);
    }
    
    res.json({ 
      success: true, 
      synthesis,
      documentsAnalyzed: validDocs.length,
      documents: validDocs.map(d => ({ path: d.path, name: d.name })),
    });
    
  } catch (error) {
    console.error('Synthesis error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'An internal error occurred while synthesizing documents.',
      details: 'Failed to synthesize documents'
    });
  }
});

// Feature 3: Predictive File Management & Smart Recommendations
app.post('/api/smart-recommendations', async (req, res) => {
  const { context, currentFile, recentActions, userRole } = req.body;
  
  try {
    // Get recent audit logs for pattern analysis
    let auditLogs = [];
    try {
      auditLogs = await prisma.auditLog.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, role: true } } },
      });
    } catch (dbError) {
      console.warn('Failed to fetch audit logs:', dbError.message);
    }
    
    // Get document types and organization patterns from DB
    let documentTypes = [];
    let organizationPatterns = [];
    try {
      [documentTypes, organizationPatterns] = await Promise.all([
        prisma.documentType.findMany({ take: 20 }),
        prisma.knowledgeOrganizationPattern.findMany({ take: 10 }),
      ]);
    } catch (dbError) {
      console.warn('Failed to fetch patterns:', dbError.message);
    }
    
    // Analyze current file if provided
    let fileContext = '';
    if (currentFile) {
      try {
        // Validate that currentFile is within FILES_ROOT
        const resolvedPath = path.resolve(FILES_ROOT, currentFile);
        if (!resolvedPath.startsWith(FILES_ROOT)) {
          throw new Error('Invalid file path');
        }
        const content = await extractText(resolvedPath);
        fileContext = `Current file: ${path.basename(currentFile)}\nContent preview: ${content.substring(0, MAX_PREVIEW_LENGTH)}`;
      } catch (err) {
        fileContext = `Current file: ${path.basename(currentFile)}`;
      }
    }
    
    const instructions = `You are an intelligent file management assistant. Analyze user behavior patterns and provide smart recommendations. Return ONLY valid JSON:
    {
      "recommendations": [
        {
          "type": "organize|duplicate_detection|archive|share|backup|tag",
          "action": "specific action to take",
          "reason": "why this is recommended",
          "priority": "high|medium|low",
          "confidence": 0-1,
          "estimatedImpact": "expected benefit"
        }
      ],
      "patterns": ["observed pattern 1", "pattern 2"],
      "insights": ["insight about user's workflow"],
      "predictions": [
        {
          "prediction": "what user might need next",
          "confidence": 0-1,
          "suggestedAction": "proactive action"
        }
      ],
      "optimizations": ["workflow optimization suggestion"]
    }`;
    
    const contextInfo = [
      context ? `User context: ${context}` : '',
      fileContext,
      recentActions ? `Recent actions: ${JSON.stringify(recentActions)}` : '',
      auditLogs.length > 0 ? `Recent activity patterns: ${auditLogs.slice(0, 10).map(l => `${l.action} on ${l.resource}`).join(', ')}` : '',
      documentTypes.length > 0 ? `Known document types: ${documentTypes.map(dt => dt.typeName).join(', ')}` : '',
      organizationPatterns.length > 0 ? `Organization patterns: ${organizationPatterns.map(p => p.organizationType).join(', ')}` : '',
    ].filter(Boolean).join('\n');
    
    const input = `Provide smart file management recommendations based on:

${contextInfo}

User role: ${userRole || 'VIEWER'}`;
    
    const response = await callResponsesAPI(input, instructions);
    const aiContent = response.output?.[0]?.message?.content || '';
    const cleanedContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let recommendations;
    try {
      recommendations = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse recommendations response:', parseError);
      throw new Error('AI returned malformed response. Please try again.');
    }
    
    // Log recommendation request to audit log
    try {
      await prisma.auditLog.create({
        data: {
          action: 'recommendation_request',
          resource: 'smart_assistant',
          details: {
            context: context || 'general',
            recommendationCount: recommendations.recommendations?.length || 0,
          },
        },
      });
    } catch (dbError) {
      console.warn('Failed to log recommendation:', dbError.message);
    }
    
    res.json({ 
      success: true, 
      ...recommendations,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ 
      success: false, 
      error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred.',
      details: 'Failed to generate recommendations'
    });
  }
});

// Get Knowledge Graph visualization data
app.get('/api/knowledge-graph', async (req, res) => {
  try {
    // Fetch recent synthesis patterns and document types
    const [patterns, docTypes] = await Promise.all([
      prisma.knowledgeOrganizationPattern.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.documentType.findMany({
        take: 50,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);
    
    // Build graph structure
    const nodes = [];
    const edges = [];
    
    // Add document type nodes
    docTypes.forEach(dt => {
      nodes.push({
        id: `doc_${dt.id}`,
        label: dt.typeName,
        type: 'document_type',
        category: dt.category,
        data: dt.analysisRules,
      });
    });
    
    // Add synthesis nodes and extract relationships
    patterns.forEach(pattern => {
      const patternNode = {
        id: `pattern_${pattern.id}`,
        label: pattern.patternName,
        type: 'pattern',
        organizationType: pattern.organizationType,
      };
      nodes.push(patternNode);
      
      // Extract relationships from synthesis structure
      const structure = pattern.structure || {};
      if (structure.relationships && Array.isArray(structure.relationships)) {
        structure.relationships.forEach(rel => {
          edges.push({
            from: rel.from,
            to: rel.to,
            type: rel.type,
            strength: rel.strength || 0.5,
          });
        });
      }
      
      // Connect pattern to documents
      if (structure.documents && Array.isArray(structure.documents)) {
        structure.documents.forEach(doc => {
          edges.push({
            from: patternNode.id,
            to: doc.name,
            type: 'includes',
            strength: 0.7,
          });
        });
      }
    });
    
    res.json({
      success: true,
      graph: { nodes, edges },
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        documentTypes: docTypes.length,
        patterns: patterns.length,
      },
    });
    
  } catch (error) {
    console.error('Knowledge graph error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// --- Production Serving ---
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app build
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  // Handle React routing, return all requests to React app
  // Using '/*' instead of '*' for compatibility with path-to-regexp@8+
  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server after memory is loaded
(async () => {
  await loadMemory();
  
  app.listen(PORT, () => {
    console.log(`Synapse Neural Core running on port ${PORT}`);
    if (process.env.NODE_ENV === 'production') {
      console.log(`🚀 Production Mode: Serving static assets`);
    }
  });
})();