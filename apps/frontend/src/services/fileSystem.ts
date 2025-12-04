/**
 * File System Access API Service
 * Allows reading local files and directories in the browser
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
}

type ProgressCallback = (progress: IndexingProgress) => void;

// Supported text file extensions
const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.markdown', '.json', '.js', '.ts', '.jsx', '.tsx',
  '.html', '.css', '.scss', '.less', '.xml', '.yaml', '.yml',
  '.py', '.rb', '.java', '.c', '.cpp', '.h', '.hpp', '.cs',
  '.go', '.rs', '.php', '.sql', '.sh', '.bash', '.zsh',
  '.env', '.gitignore', '.dockerfile', '.toml', '.ini', '.cfg',
  '.csv', '.log', '.rst', '.tex', '.vue', '.svelte'
]);

// Files/folders to skip
const SKIP_PATTERNS = [
  'node_modules', '.git', '.svn', '.hg', 'dist', 'build', 
  '__pycache__', '.cache', '.next', '.nuxt', 'coverage',
  '.DS_Store', 'Thumbs.db', '.env.local', '.env.production'
];

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
  const ext = '.' + name.split('.').pop()?.toLowerCase();
  return TEXT_EXTENSIONS.has(ext) || !name.includes('.');
}

/**
 * Check if a path should be skipped
 */
function shouldSkip(name: string): boolean {
  return SKIP_PATTERNS.some(pattern => 
    name === pattern || name.startsWith('.')
  );
}

/**
 * Read text content from a file handle
 */
async function readFileContent(fileHandle: FileSystemFileHandle): Promise<string> {
  try {
    const file = await fileHandle.getFile();
    // Skip large files (> 1MB)
    if (file.size > 1024 * 1024) {
      return '';
    }
    return await file.text();
  } catch {
    return '';
  }
}

/**
 * Recursively get all files from a directory
 */
async function* getFilesRecursively(
  dirHandle: FileSystemDirectoryHandle,
  path: string = ''
): AsyncGenerator<{ handle: FileSystemFileHandle; path: string }> {
  for await (const entry of dirHandle.values()) {
    const entryPath = path ? `${path}/${entry.name}` : entry.name;

    if (shouldSkip(entry.name)) {
      continue;
    }

    if (entry.kind === 'file') {
      if (shouldIndexFile(entry.name)) {
        yield { handle: entry as FileSystemFileHandle, path: entryPath };
      }
    } else if (entry.kind === 'directory') {
      yield* getFilesRecursively(entry as FileSystemDirectoryHandle, entryPath);
    }
  }
}

/**
 * Count total files in a directory (for progress)
 */
async function countFiles(dirHandle: FileSystemDirectoryHandle): Promise<number> {
  let count = 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for await (const _ of getFilesRecursively(dirHandle)) {
    count++;
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
 * Read all files from a directory handle
 */
export async function readDirectory(
  dirHandle: FileSystemDirectoryHandle,
  onProgress?: ProgressCallback
): Promise<FileEntry[]> {
  const files: FileEntry[] = [];

  onProgress?.({
    status: 'scanning',
    totalFiles: 0,
    processedFiles: 0,
    message: 'Scanning directory...'
  });

  // Count files first for progress
  const totalFiles = await countFiles(dirHandle);

  onProgress?.({
    status: 'indexing',
    totalFiles,
    processedFiles: 0,
    message: `Found ${totalFiles} files to index`
  });

  let processedFiles = 0;

  for await (const { handle, path } of getFilesRecursively(dirHandle)) {
    const content = await readFileContent(handle);
    
    if (content && content.length > 50) {
      const file = await handle.getFile();
      files.push({
        name: handle.name,
        path,
        content,
        size: file.size,
        type: '.' + handle.name.split('.').pop()?.toLowerCase() || ''
      });
    }

    processedFiles++;
    
    if (processedFiles % 5 === 0 || processedFiles === totalFiles) {
      onProgress?.({
        status: 'indexing',
        totalFiles,
        processedFiles,
        currentFile: path,
        message: `Processing: ${path}`
      });
    }
  }

  onProgress?.({
    status: 'complete',
    totalFiles,
    processedFiles: totalFiles,
    message: `Indexed ${files.length} files`
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
