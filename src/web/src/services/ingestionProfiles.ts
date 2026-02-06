/**
 * Ingestion Profiles — Configurable presets for different document use cases
 * 
 * Profiles control:
 * - Which files to include/exclude
 * - Chunking strategy and parameters
 * - Metadata extraction behavior
 * - Size limits and safety thresholds
 */

export interface ChunkingConfig {
  strategy: 'fixed' | 'semantic' | 'section-aware';
  chunkSize: number;
  overlap: number;
  /** Boundary rules for semantic chunking */
  boundaryRules: ('function' | 'class' | 'paragraph' | 'sentence' | 'heading' | 'clause')[];
}

export interface IngestionProfile {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  
  // File handling
  includeExtensions: string[] | 'auto-detect';
  excludeExtensions: string[];
  excludePatterns: string[];  // Additional glob patterns
  respectGitignore: boolean;
  maxFileSize: number;  // bytes
  maxTotalSize: number; // bytes
  maxFiles: number;
  maxDepth: number;
  
  // Chunking strategy
  chunking: ChunkingConfig;
  
  // Extraction features
  extractMetadata: boolean;
  ocrEnabled: boolean;  // for PDFs/images (requires backend support)
  tableExtraction: boolean;
  
  // Indexing behavior
  deduplication: 'hash' | 'path' | 'none';
}

// ============================================
// Default Profiles
// ============================================

export const PROFILE_CODEBASE: IngestionProfile = {
  id: 'codebase',
  name: 'Codebase',
  description: 'Software projects — respects .gitignore, skips build artifacts, semantic code chunking',
  icon: 'Code',
  
  includeExtensions: 'auto-detect',
  excludeExtensions: ['.min.js', '.min.css', '.map', '.lock'],
  excludePatterns: [
    '**/node_modules/**', '**/vendor/**', '**/dist/**', '**/build/**',
    '**/.git/**', '**/__pycache__/**', '**/.venv/**', '**/target/**',
  ],
  respectGitignore: true,
  maxFileSize: 5 * 1024 * 1024,      // 5MB
  maxTotalSize: 500 * 1024 * 1024,   // 500MB
  maxFiles: 10000,
  maxDepth: 20,
  
  chunking: {
    strategy: 'semantic',
    chunkSize: 1500,
    overlap: 150,
    boundaryRules: ['function', 'class', 'paragraph'],
  },
  
  extractMetadata: true,
  ocrEnabled: false,
  tableExtraction: false,
  deduplication: 'hash',
};

export const PROFILE_LEGAL: IngestionProfile = {
  id: 'legal',
  name: 'Legal Documents',
  description: 'Contracts, agreements, briefs — preserves clause structure, extracts parties and dates',
  icon: 'Scale',
  
  includeExtensions: ['.pdf', '.docx', '.doc', '.txt', '.md', '.rtf'],
  excludeExtensions: [],
  excludePatterns: ['**/drafts/**', '**/archive/**'],
  respectGitignore: false,
  maxFileSize: 50 * 1024 * 1024,     // 50MB (legal docs can be large)
  maxTotalSize: 2 * 1024 * 1024 * 1024, // 2GB
  maxFiles: 5000,
  maxDepth: 10,
  
  chunking: {
    strategy: 'section-aware',
    chunkSize: 2000,
    overlap: 200,
    boundaryRules: ['clause', 'paragraph', 'heading'],
  },
  
  extractMetadata: true,
  ocrEnabled: true,  // Many legal docs are scanned PDFs
  tableExtraction: true,
  deduplication: 'hash',
};

export const PROFILE_KNOWLEDGE_BASE: IngestionProfile = {
  id: 'knowledge-base',
  name: 'Knowledge Base',
  description: 'Documentation, wikis, manuals — header-aware chunking, table extraction',
  icon: 'BookOpen',
  
  includeExtensions: ['.md', '.mdx', '.txt', '.rst', '.adoc', '.html', '.pdf', '.docx'],
  excludeExtensions: [],
  excludePatterns: ['**/node_modules/**', '**/.git/**'],
  respectGitignore: true,
  maxFileSize: 20 * 1024 * 1024,     // 20MB
  maxTotalSize: 1 * 1024 * 1024 * 1024, // 1GB
  maxFiles: 10000,
  maxDepth: 15,
  
  chunking: {
    strategy: 'section-aware',
    chunkSize: 1500,
    overlap: 100,
    boundaryRules: ['heading', 'paragraph'],
  },
  
  extractMetadata: true,
  ocrEnabled: false,
  tableExtraction: true,
  deduplication: 'hash',
};

export const PROFILE_GENERAL: IngestionProfile = {
  id: 'general',
  name: 'General Documents',
  description: 'Mixed content — conservative defaults, broad file type support',
  icon: 'FileText',
  
  includeExtensions: 'auto-detect',
  excludeExtensions: ['.exe', '.dll', '.so', '.dylib', '.bin', '.iso', '.dmg'],
  excludePatterns: ['**/node_modules/**', '**/.git/**', '**/.*cache*/**'],
  respectGitignore: true,
  maxFileSize: 10 * 1024 * 1024,     // 10MB
  maxTotalSize: 500 * 1024 * 1024,   // 500MB
  maxFiles: 5000,
  maxDepth: 15,
  
  chunking: {
    strategy: 'semantic',
    chunkSize: 1500,
    overlap: 150,
    boundaryRules: ['paragraph', 'sentence'],
  },
  
  extractMetadata: true,
  ocrEnabled: false,
  tableExtraction: false,
  deduplication: 'path',
};

export const PROFILE_CONTRACTS: IngestionProfile = {
  id: 'contracts',
  name: 'Contracts & Agreements',
  description: 'Business contracts — clause-level chunking, party extraction, deadline tracking',
  icon: 'FileSignature',
  
  includeExtensions: ['.pdf', '.docx', '.doc'],
  excludeExtensions: [],
  excludePatterns: [],
  respectGitignore: false,
  maxFileSize: 50 * 1024 * 1024,     // 50MB
  maxTotalSize: 1 * 1024 * 1024 * 1024, // 1GB
  maxFiles: 2000,
  maxDepth: 5,
  
  chunking: {
    strategy: 'section-aware',
    chunkSize: 2500,
    overlap: 250,
    boundaryRules: ['clause', 'paragraph'],
  },
  
  extractMetadata: true,
  ocrEnabled: true,
  tableExtraction: true,
  deduplication: 'hash',
};

// ============================================
// Profile Registry
// ============================================

export const INGESTION_PROFILES: Record<string, IngestionProfile> = {
  codebase: PROFILE_CODEBASE,
  legal: PROFILE_LEGAL,
  'knowledge-base': PROFILE_KNOWLEDGE_BASE,
  general: PROFILE_GENERAL,
  contracts: PROFILE_CONTRACTS,
};

export const DEFAULT_PROFILE_ID = 'codebase';

export function getProfile(id: string): IngestionProfile {
  return INGESTION_PROFILES[id] || PROFILE_GENERAL;
}

export function getAllProfiles(): IngestionProfile[] {
  return Object.values(INGESTION_PROFILES);
}

/**
 * Create a custom profile by merging overrides with a base profile
 */
export function createCustomProfile(
  baseId: string,
  overrides: Partial<IngestionProfile>
): IngestionProfile {
  const base = getProfile(baseId);
  return {
    ...base,
    ...overrides,
    id: overrides.id || `custom-${Date.now()}`,
    chunking: {
      ...base.chunking,
      ...(overrides.chunking || {}),
    },
  };
}
