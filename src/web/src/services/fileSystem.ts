/**
 * File System Access API Service
 * 
 * Intelligent file scanner that supports:
 * - Code repositories (respects .gitignore)
 * - Documents (markdown, text, config files)
 * - Industry-standard exclusion patterns
 * - Depth and size limits for safety
 * 
 * Note: Binary document extraction (.pdf, .docx, .xlsx) requires
 * server-side processing — those files are flagged for backend handling.
 */

export interface FileEntry {
  name: string;
  path: string;
  content: string;
  size: number;
  type: string;
}

export interface IndexingProgress {
  status: 'scanning' | 'indexing' | 'complete' | 'error';
  totalFiles: number;
  processedFiles: number;
  currentFile?: string;
  message?: string;
  skippedFiles?: number;
  skippedByGitignore?: number;
}

export interface ScanStats {
  totalScanned: number;
  indexed: number;
  skippedByPattern: number;
  skippedByGitignore: number;
  skippedBySize: number;
  skippedBinary: number;
  skippedEmpty: number;
  depthLimitHit: boolean;
  fileLimitHit: boolean;
  sizeLimitHit: boolean;
}

type ProgressCallback = (progress: IndexingProgress) => void;

// ============================================
// Indexable text file extensions
// ============================================
// Code, config, documentation, and plain-text formats
// that can be read as UTF-8 text in the browser.
const TEXT_EXTENSIONS = new Set([
  // Documentation & prose
  '.txt', '.md', '.markdown', '.rst', '.tex', '.adoc', '.org',
  '.rtf', '.csv', '.tsv', '.log',
  // Web
  '.html', '.htm', '.css', '.scss', '.less', '.sass',
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.vue', '.svelte', '.astro',
  // Data & config
  '.json', '.jsonc', '.json5', '.xml', '.yaml', '.yml',
  '.toml', '.ini', '.cfg', '.conf', '.properties',
  '.env', '.env.example', '.env.local',
  '.editorconfig', '.prettierrc', '.eslintrc',
  // Programming languages
  '.py', '.pyi', '.rb', '.java', '.kt', '.kts', '.scala',
  '.c', '.cpp', '.cc', '.cxx', '.h', '.hpp', '.hxx',
  '.cs', '.fs', '.fsx',
  '.go', '.rs', '.swift', '.m', '.mm',
  '.php', '.pl', '.pm', '.r', '.R', '.jl',
  '.lua', '.ex', '.exs', '.erl', '.hrl',
  '.hs', '.lhs', '.ml', '.mli', '.clj', '.cljs',
  '.dart', '.zig', '.nim', '.v', '.vhdl',
  // Shell & scripting
  '.sh', '.bash', '.zsh', '.fish', '.ps1', '.psm1', '.bat', '.cmd',
  // Database & query
  '.sql', '.graphql', '.gql', '.prisma',
  // DevOps & infra
  '.dockerfile', '.tf', '.hcl', '.vagrant',
  // Docs that look like code
  '.proto', '.thrift', '.avsc', '.wsdl',
  // Makefiles and similar (no extension — handled separately)
]);

// ============================================
// Binary document types (need server-side extraction)
// ============================================
// These are flagged during scan but content extraction
// happens on the backend via pdf-parse, mammoth, etc.
const BINARY_DOC_EXTENSIONS = new Set([
  '.pdf', '.docx', '.doc', '.pptx', '.ppt',
  '.xlsx', '.xls', '.odt', '.ods', '.odp',
  '.epub', '.mobi',
]);

// ============================================
// Directories to always skip
// ============================================
// Industry-standard build artifacts, dependency dirs,
// and version control internals.
const SKIP_DIRS = new Set([
  // Version control
  '.git', '.svn', '.hg', '.fossil',
  // JavaScript / Node
  'node_modules', 'bower_components', '.npm', '.yarn', '.pnp',
  // Build output
  'dist', 'build', 'out', '_build', 'target', 'bin', 'obj',
  '.output', '.vercel', '.netlify', '.serverless',
  // Framework caches
  '.next', '.nuxt', '.svelte-kit', '.astro',
  '.cache', '.parcel-cache', '.turbo', '.angular',
  // Python
  '__pycache__', '.venv', 'venv', 'env', '.tox',
  '.eggs', '*.egg-info', '.mypy_cache', '.pytest_cache',
  'site-packages', '.ruff_cache',
  // Java / JVM
  '.gradle', '.m2', '.ivy2',
  // Rust
  'target',
  // Go
  'vendor',
  // Ruby
  '.bundle',
  // .NET
  'packages', 'TestResults',
  // Terraform
  '.terraform',
  // IDE
  '.idea', '.vs',
  // Test & coverage
  'coverage', '.nyc_output', 'htmlcov',
  // OS junk
  '__MACOSX', '$RECYCLE.BIN', 'System Volume Information',
]);

// ============================================
// Specific files to always skip
// ============================================
const SKIP_FILES = new Set([
  // OS metadata
  '.DS_Store', 'Thumbs.db', 'desktop.ini', 'Icon\r',
  // Lock files (huge, no semantic value)
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  'Gemfile.lock', 'Pipfile.lock', 'poetry.lock',
  'composer.lock', 'Cargo.lock', 'go.sum',
  'flake.lock', 'pubspec.lock', 'packages.lock.json',
  // Compiled / minified
  '.min.js', '.min.css', '.bundle.js',
  // Source maps
  '.map',
]);

// ============================================
// Dotfiles/dotdirs that ARE valuable
// ============================================
// Instead of blanket-skipping all dotfiles, we whitelist
// config files that developers and users care about.
const ALLOWED_DOTFILES = new Set([
  '.gitignore', '.gitattributes', '.gitmodules',
  '.dockerignore', '.dockerfile',
  '.editorconfig', '.prettierrc', '.prettierignore',
  '.eslintrc', '.eslintrc.js', '.eslintrc.json', '.eslintrc.yml',
  '.eslintignore',
  '.babelrc', '.browserslistrc', '.nvmrc', '.node-version',
  '.python-version', '.ruby-version', '.tool-versions',
  '.env', '.env.example', '.env.sample', '.env.template',
  '.npmrc', '.yarnrc', '.yarnrc.yml',
  '.stylelintrc', '.markdownlint.json', '.markdownlintrc',
  '.github', '.vscode', '.devcontainer',
]);

// Dotdirs that contain valuable config
const ALLOWED_DOTDIRS = new Set([
  '.github', '.vscode', '.devcontainer', '.husky',
  '.circleci', '.gitlab',
]);

// ============================================
// Extensionless files worth indexing
// ============================================
const INDEXABLE_EXTENSIONLESS = new Set([
  'Makefile', 'makefile', 'GNUmakefile',
  'Dockerfile', 'Containerfile',
  'Vagrantfile', 'Procfile', 'Brewfile',
  'Rakefile', 'Gemfile', 'Guardfile',
  'Justfile', 'Taskfile',
  'README', 'LICENSE', 'LICENCE', 'CHANGELOG',
  'CONTRIBUTING', 'AUTHORS', 'NOTICE', 'PATENTS',
  'TODO', 'ROADMAP', 'SECURITY', 'CODE_OF_CONDUCT',
]);

// ============================================
// Safety limits
// ============================================
const MAX_DEPTH = 20;             // Max directory nesting
const MAX_FILES = 10000;          // Max files to index per scan
const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB total content budget
const MAX_FILE_SIZE = 5 * 1024 * 1024;    // 5MB per file
const MAX_CONTENT_LENGTH = 1024 * 1024;   // 1MB text content per file

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showDirectoryPicker' in window;
}

/**
 * Check if a file should be indexed based on extension
 */
function shouldIndexFile(name: string): boolean {
  // Skip known junk files
  if (SKIP_FILES.has(name)) return false;
  
  // Check for skip-by-suffix (e.g., .min.js)
  const lowerName = name.toLowerCase();
  if (lowerName.endsWith('.min.js') || lowerName.endsWith('.min.css') || 
      lowerName.endsWith('.bundle.js') || lowerName.endsWith('.map')) {
    return false;
  }

  const ext = getExtension(name);
  
  // Text files we can read directly
  if (TEXT_EXTENSIONS.has(ext)) return true;
  
  // Binary docs — flag for server-side extraction
  if (BINARY_DOC_EXTENSIONS.has(ext)) return true;
  
  // Extensionless files with known names
  if (!name.includes('.') && INDEXABLE_EXTENSIONLESS.has(name)) return true;
  
  // Dotfiles that are whitelisted
  if (name.startsWith('.') && ALLOWED_DOTFILES.has(name)) return true;
  
  return false;
}

/**
 * Check if a directory should be skipped
 */
function shouldSkipDir(name: string): boolean {
  // Always skip known junk directories
  if (SKIP_DIRS.has(name)) return true;
  
  // For dotdirs: skip unless explicitly allowed
  if (name.startsWith('.') && !ALLOWED_DOTDIRS.has(name)) return true;
  
  return false;
}

/**
 * Get file extension (lowercase, with dot)
 */
function getExtension(name: string): string {
  const lastDot = name.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0) return '';
  return name.slice(lastDot).toLowerCase();
}

/**
 * Check if a file is a binary document needing server-side extraction
 */
export function isBinaryDocument(name: string): boolean {
  return BINARY_DOC_EXTENSIONS.has(getExtension(name));
}

// ============================================
// .gitignore support
// ============================================

/**
 * Parse .gitignore content into a list of match functions.
 * Implements a subset of gitignore spec:
 * - Comments (#) and blank lines are ignored
 * - Negation (!) is not supported (rare in practice)
 * - Glob patterns with * and **
 * - Directory-only patterns (trailing /)
 */
function parseGitignore(content: string): ((path: string, isDir: boolean) => boolean)[] {
  const matchers: ((path: string, isDir: boolean) => boolean)[] = [];
  
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('!')) continue;
    
    const isDirOnly = line.endsWith('/');
    const pattern = isDirOnly ? line.slice(0, -1) : line;
    
    // Convert gitignore glob to regex
    const regex = gitignorePatternToRegex(pattern);
    
    matchers.push((path: string, isDir: boolean) => {
      if (isDirOnly && !isDir) return false;
      return regex.test(path);
    });
  }
  
  return matchers;
}

/**
 * Convert a gitignore pattern to a RegExp.
 * Handles: *, **, ?, character classes, path anchoring.
 */
function gitignorePatternToRegex(pattern: string): RegExp {
  let regexStr = '';
  const isAnchored = pattern.includes('/');
  
  // Escape special regex chars, then convert glob syntax
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === '*') {
      if (pattern[i + 1] === '*') {
        if (pattern[i + 2] === '/') {
          regexStr += '(?:.+/)?'; // **/ matches any number of dirs
          i += 3;
          continue;
        }
        regexStr += '.*'; // ** matches everything
        i += 2;
        continue;
      }
      regexStr += '[^/]*'; // * matches within a single path segment
    } else if (ch === '?') {
      regexStr += '[^/]';
    } else if (ch === '[') {
      // Pass through character classes
      const close = pattern.indexOf(']', i);
      if (close !== -1) {
        regexStr += pattern.slice(i, close + 1);
        i = close + 1;
        continue;
      }
      regexStr += '\\[';
    } else if ('.+^${}()|\\'.includes(ch)) {
      regexStr += '\\' + ch;
    } else {
      regexStr += ch;
    }
    i++;
  }
  
  // If pattern doesn't contain /, match against filename only
  // If it does, match against full relative path
  if (isAnchored) {
    return new RegExp('^' + regexStr + '(/|$)');
  } else {
    return new RegExp('(^|/)' + regexStr + '(/|$)');
  }
}

/**
 * Try to read .gitignore from a directory handle
 */
async function readGitignore(
  dirHandle: FileSystemDirectoryHandle
): Promise<((path: string, isDir: boolean) => boolean)[] | null> {
  try {
    const fileHandle = await dirHandle.getFileHandle('.gitignore');
    const file = await fileHandle.getFile();
    const content = await file.text();
    return parseGitignore(content);
  } catch {
    return null; // No .gitignore found
  }
}

/**
 * Read text content from a file handle
 */
async function readFileContent(fileHandle: FileSystemFileHandle): Promise<string> {
  try {
    const file = await fileHandle.getFile();
    if (file.size > MAX_FILE_SIZE) {
      console.warn(`Skipping large file: ${fileHandle.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      return '';
    }
    
    // Binary documents can't be read as text in the browser
    if (isBinaryDocument(fileHandle.name)) {
      // Return a placeholder — actual extraction happens server-side
      return `[Binary document: ${fileHandle.name} (${(file.size / 1024).toFixed(0)}KB) — content will be extracted server-side]`;
    }
    
    const content = await file.text();
    if (content.length > MAX_CONTENT_LENGTH) {
      console.warn(`Truncating large content: ${fileHandle.name} (${content.length} chars)`);
      return content.slice(0, MAX_CONTENT_LENGTH);
    }
    return content;
  } catch (error) {
    console.error(`Error reading file ${fileHandle.name}:`, error);
    return '';
  }
}

interface ScanContext {
  gitignoreMatchers: ((path: string, isDir: boolean) => boolean)[];
  stats: ScanStats;
  totalSizeAccum: number;
}

/**
 * Recursively get all files from a directory.
 * Respects .gitignore, skip patterns, depth limits, and size budgets.
 */
async function* getFilesRecursively(
  dirHandle: FileSystemDirectoryHandle,
  path: string = '',
  depth: number = 0,
  ctx: ScanContext = {
    gitignoreMatchers: [],
    stats: createEmptyStats(),
    totalSizeAccum: 0,
  }
): AsyncGenerator<{ handle: FileSystemFileHandle; path: string }> {
  // Safety: depth limit
  if (depth > MAX_DEPTH) {
    ctx.stats.depthLimitHit = true;
    return;
  }
  
  // Try to read .gitignore at this level (root or nested)
  if (depth === 0 || await hasFile(dirHandle, '.gitignore')) {
    const newMatchers = await readGitignore(dirHandle);
    if (newMatchers) {
      ctx.gitignoreMatchers = [...ctx.gitignoreMatchers, ...newMatchers];
    }
  }

  for await (const entry of dirHandle.values()) {
    const entryPath = path ? `${path}/${entry.name}` : entry.name;
    
    // Safety: file count limit
    if (ctx.stats.indexed >= MAX_FILES) {
      ctx.stats.fileLimitHit = true;
      return;
    }
    
    // Safety: total size limit
    if (ctx.totalSizeAccum >= MAX_TOTAL_SIZE) {
      ctx.stats.sizeLimitHit = true;
      return;
    }

    if (entry.kind === 'directory') {
      if (shouldSkipDir(entry.name)) {
        ctx.stats.skippedByPattern++;
        continue;
      }
      
      // Check .gitignore
      if (isGitignored(ctx.gitignoreMatchers, entryPath, true)) {
        ctx.stats.skippedByGitignore++;
        continue;
      }
      
      yield* getFilesRecursively(
        entry as FileSystemDirectoryHandle, 
        entryPath, 
        depth + 1, 
        ctx
      );
    } else if (entry.kind === 'file') {
      ctx.stats.totalScanned++;
      
      // Check .gitignore
      if (isGitignored(ctx.gitignoreMatchers, entryPath, false)) {
        ctx.stats.skippedByGitignore++;
        continue;
      }
      
      if (shouldIndexFile(entry.name)) {
        yield { handle: entry as FileSystemFileHandle, path: entryPath };
      } else {
        ctx.stats.skippedByPattern++;
      }
    }
  }
}

/**
 * Check if a path matches any .gitignore pattern
 */
function isGitignored(
  matchers: ((path: string, isDir: boolean) => boolean)[],
  path: string,
  isDir: boolean
): boolean {
  return matchers.some(matcher => matcher(path, isDir));
}

/**
 * Check if a directory contains a specific file
 */
async function hasFile(dirHandle: FileSystemDirectoryHandle, name: string): Promise<boolean> {
  try {
    await dirHandle.getFileHandle(name);
    return true;
  } catch {
    return false;
  }
}

function createEmptyStats(): ScanStats {
  return {
    totalScanned: 0,
    indexed: 0,
    skippedByPattern: 0,
    skippedByGitignore: 0,
    skippedBySize: 0,
    skippedBinary: 0,
    skippedEmpty: 0,
    depthLimitHit: false,
    fileLimitHit: false,
    sizeLimitHit: false,
  };
}

/**
 * Count total files in a directory (for progress)
 */
async function countFiles(dirHandle: FileSystemDirectoryHandle): Promise<number> {
  let count = 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for await (const _ of getFilesRecursively(dirHandle)) {
    count++;
    if (count >= MAX_FILES) break; // Don't count forever
  }
  return count;
}

/**
 * Open directory picker and return handle
 */
export async function selectDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser. Please use Chrome, Edge, or Opera.');
  }

  try {
    const dirHandle = await window.showDirectoryPicker({
      mode: 'read'
    });
    return dirHandle;
  } catch (error) {
    // User cancelled
    if ((error as Error).name === 'AbortError') {
      return null;
    }
    throw error;
  }
}

/**
 * Compute a simple hash of file content for deduplication.
 * Uses a fast non-cryptographic hash (djb2 variant).
 */
export function computeContentHash(content: string): string {
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash) ^ content.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export interface FileEntryWithHash extends FileEntry {
  contentHash: string;
}

/**
 * Read all files from a directory handle.
 * Respects .gitignore, skips build artifacts, enforces size/depth limits.
 */
export async function readDirectory(
  dirHandle: FileSystemDirectoryHandle,
  onProgress?: ProgressCallback
): Promise<FileEntry[]> {
  const files: FileEntry[] = [];
  const ctx: ScanContext = {
    gitignoreMatchers: [],
    stats: createEmptyStats(),
    totalSizeAccum: 0,
  };

  onProgress?.({
    status: 'scanning',
    totalFiles: 0,
    processedFiles: 0,
    message: 'Scanning directory (respecting .gitignore)...'
  });

  // Count files first for progress (uses same filtering logic)
  const totalFiles = await countFiles(dirHandle);

  onProgress?.({
    status: 'indexing',
    totalFiles,
    processedFiles: 0,
    message: `Found ${totalFiles} indexable files`
  });

  let processedFiles = 0;

  // Reset context for actual scan (countFiles consumed the first pass)
  ctx.gitignoreMatchers = [];
  ctx.stats = createEmptyStats();
  ctx.totalSizeAccum = 0;

  for await (const { handle, path } of getFilesRecursively(dirHandle, '', 0, ctx)) {
    const content = await readFileContent(handle);
    
    if (!content || content.length < 10) {
      ctx.stats.skippedEmpty++;
      processedFiles++;
      continue;
    }
    
    const file = await handle.getFile();
    ctx.totalSizeAccum += file.size;
    
    if (ctx.totalSizeAccum >= MAX_TOTAL_SIZE) {
      ctx.stats.sizeLimitHit = true;
      onProgress?.({
        status: 'indexing',
        totalFiles,
        processedFiles,
        message: `Size limit reached (${(MAX_TOTAL_SIZE / 1024 / 1024).toFixed(0)}MB). Stopping scan.`
      });
      break;
    }
    
    files.push({
      name: handle.name,
      path,
      content,
      size: file.size,
      type: getExtension(handle.name) || (isBinaryDocument(handle.name) ? '.bin' : '.txt')
    });
    ctx.stats.indexed++;

    processedFiles++;
    
    if (processedFiles % 5 === 0 || processedFiles === totalFiles) {
      onProgress?.({
        status: 'indexing',
        totalFiles,
        processedFiles,
        currentFile: path,
        message: `Processing: ${path}`,
        skippedByGitignore: ctx.stats.skippedByGitignore,
      });
    }
  }

  // Build summary message
  const parts = [`Indexed ${files.length} files`];
  if (ctx.stats.skippedByGitignore > 0) {
    parts.push(`${ctx.stats.skippedByGitignore} skipped by .gitignore`);
  }
  if (ctx.stats.skippedByPattern > 0) {
    parts.push(`${ctx.stats.skippedByPattern} skipped (build artifacts, deps)`);
  }
  if (ctx.stats.depthLimitHit) parts.push('depth limit reached');
  if (ctx.stats.fileLimitHit) parts.push(`file limit (${MAX_FILES}) reached`);
  if (ctx.stats.sizeLimitHit) parts.push('size limit reached');

  onProgress?.({
    status: 'complete',
    totalFiles: files.length,
    processedFiles: files.length,
    message: parts.join(' · '),
    skippedByGitignore: ctx.stats.skippedByGitignore,
    skippedFiles: ctx.stats.skippedByPattern + ctx.stats.skippedByGitignore,
  });

  return files;
}

/**
 * Store directory handle in IndexedDB for persistence
 */
export async function storeDirectoryHandle(
  dirHandle: FileSystemDirectoryHandle,
  name: string = 'default'
): Promise<void> {
  const db = await openHandleDB();
  await db.put('handles', { name, handle: dirHandle });
}

/**
 * Retrieve stored directory handle
 */
export async function getStoredDirectoryHandle(
  name: string = 'default'
): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openHandleDB();
    const result = await db.get('handles', name);
    if (result?.handle) {
      // Verify permission
      const permission = await result.handle.queryPermission({ mode: 'read' });
      if (permission === 'granted') {
        return result.handle;
      }
      // Request permission
      const newPermission = await result.handle.requestPermission({ mode: 'read' });
      if (newPermission === 'granted') {
        return result.handle;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Simple IndexedDB wrapper for storing handles
async function openHandleDB(): Promise<{
  put: (store: string, value: unknown) => Promise<void>;
  get: (store: string, key: string) => Promise<{ handle: FileSystemDirectoryHandle } | undefined>;
}> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('synapse-handles', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('handles')) {
        db.createObjectStore('handles', { keyPath: 'name' });
      }
    };
    
    request.onsuccess = () => {
      const db = request.result;
      resolve({
        put: (store, value) => new Promise((res, rej) => {
          const tx = db.transaction(store, 'readwrite');
          const req = tx.objectStore(store).put(value);
          req.onsuccess = () => res();
          req.onerror = () => rej(req.error);
        }),
        get: (store, key) => new Promise((res, rej) => {
          const tx = db.transaction(store, 'readonly');
          const req = tx.objectStore(store).get(key);
          req.onsuccess = () => res(req.result);
          req.onerror = () => rej(req.error);
        })
      });
    };
  });
}
