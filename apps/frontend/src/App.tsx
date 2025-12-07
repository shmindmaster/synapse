import { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, Moon, Sun, Cpu, LogOut, Sparkles } from 'lucide-react';
import SemanticSearchBar from './components/SemanticSearchBar';
import ConfigurationPanel from './components/ConfigurationPanel';
import ProgressBar from './components/ProgressBar';
import DirectorySelector from './components/DirectorySelector';
import ErrorLog from './components/ErrorLog';
import FileGrid from './components/FileGrid';
import WelcomeWizard from './components/WelcomeWizard';
import InsightDrawer from './components/shared/InsightDrawer';
import LoginPage from './components/LoginPage';
import DocumentClassifier from './components/DocumentClassifier';
import MultiDocSynthesizer from './components/MultiDocSynthesizer';
import SmartRecommendations from './components/SmartRecommendations';
import { useAuth } from './contexts/useAuth';
import { FileInfo, KeywordConfig, Directory, AppError } from './types';
import { apiUrl } from './utils/api';
import PreviewPane from './components/PreviewPane';

// Client-side services
import { selectDirectory, readDirectory, isFileSystemAccessSupported } from './services/fileSystem';
import { chunkText } from './services/embeddings';

interface IndexingProgress {
  status: 'idle' | 'loading-model' | 'scanning' | 'indexing' | 'complete' | 'error';
  totalFiles: number;
  processedFiles: number;
  currentFile?: string;
  message?: string;
  modelProgress?: number;
}

interface AiStatus {
  provider: string;
  model: string;
  embeddingsAvailable: boolean;
}

interface IndexFileSummary {
  name: string;
  path: string;
  chunks: number;
}

interface IndexSummary {
  hasIndex: boolean;
  totalChunks: number;
  totalFiles: number;
  files: IndexFileSummary[];
}

function Dashboard() {
  const { user, logout } = useAuth();
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [progress, _setProgress] = useState({ current: 0, total: 0 });
  const [keywordConfigs, setKeywordConfigs] = useState<KeywordConfig[]>([]);
  const [baseDirectories, setBaseDirectories] = useState<Directory[]>([]);
  const [targetDirectories, setTargetDirectories] = useState<Directory[]>([]);
  const [errors, setErrors] = useState<AppError[]>([]);
  const [darkMode, setDarkMode] = useState(true);
  const [showWelcomeWizard, setShowWelcomeWizard] = useState(true);

  // New AI State
  const [isIndexing, setIsIndexing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasIndex, setHasIndex] = useState(false);
  const [indexCount, setIndexCount] = useState(0);
  const [indexingProgress, setIndexingProgress] = useState<IndexingProgress | undefined>(undefined);
  
  // AI Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'analyze' | 'chat'>('analyze');
  const [activeFile, setActiveFile] = useState<FileInfo | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [pathFilter, setPathFilter] = useState<string | null>(null);
  const [pinnedPaths, setPinnedPaths] = useState<string[]>([]);
  const [indexSummary, setIndexSummary] = useState<IndexSummary | null>(null);

  // Advanced Features State
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showClassifier, setShowClassifier] = useState(false);
  const [classifierFile, setClassifierFile] = useState<FileInfo | null>(null);
  const [showSynthesizer, setShowSynthesizer] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  async function fetchIndexSummary() {
    try {
      const response = await fetch(apiUrl('/api/index-summary'));
      const data = await response.json();
      setIndexSummary(data);
    } catch (e) {
      console.error('Failed to fetch index summary:', e);
    }
  }

  // Persist Settings & Check Index Status
  useEffect(() => {
    const savedConfig = localStorage.getItem('appConfig');
    if (savedConfig) {
      const { keywordConfigs, baseDirectories, targetDirectories } = JSON.parse(savedConfig);
      setKeywordConfigs(keywordConfigs);
      setBaseDirectories(baseDirectories);
      setTargetDirectories(targetDirectories);
      setShowWelcomeWizard(false);
    }
    const savedRecent = localStorage.getItem('synapse_recent_searches');
    if (savedRecent) {
      try {
        setRecentSearches(JSON.parse(savedRecent));
      } catch {
        // ignore parse errors
      }
    }
    const savedPinned = localStorage.getItem('synapse_pinned_files');
    if (savedPinned) {
      try {
        setPinnedPaths(JSON.parse(savedPinned));
      } catch {
        // ignore parse errors
      }
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setDarkMode(true);
    }
    
    // Check server for existing index
    const checkServerIndex = async () => {
      try {
        const response = await fetch(apiUrl('/api/index-status'));
        const data = await response.json();
        if (data.hasIndex) {
          setHasIndex(true);
          setIndexCount(data.count || 0);
        }
      } catch (e) {
        console.error('Failed to check server index:', e);
      }
    };
    checkServerIndex();

    const fetchAiStatus = async () => {
      try {
        const res = await fetch(apiUrl('/api/health'));
        const data = await res.json();
        setAiStatus({
          provider: data.aiProvider || 'digitalocean',
          model: data.aiModel || 'unknown',
          embeddingsAvailable: !!data.embeddingsAvailable,
        });
      } catch (e) {
        console.error('Failed to fetch AI status:', e);
      }
    };
    fetchAiStatus();
    fetchIndexSummary();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Global keyboard shortcut: Ctrl+K (or Cmd+K) focuses the search bar
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (keywordConfigs.length > 0) {
      localStorage.setItem('appConfig', JSON.stringify({ keywordConfigs, baseDirectories, targetDirectories }));
    }
  }, [keywordConfigs, baseDirectories, targetDirectories]);

  useEffect(() => {
    localStorage.setItem('synapse_pinned_files', JSON.stringify(pinnedPaths));
  }, [pinnedPaths]);

  // --- Actions ---

  const handleAnalyze = (file: FileInfo) => {
    setActiveFile(file);
    setDrawerMode('analyze');
    setDrawerOpen(true);
  };

  const handleChat = (file: FileInfo) => {
    setActiveFile(file);
    setDrawerMode('chat');
    setDrawerOpen(true);
  };

  const handleToggleSelection = (file: FileInfo) => {
    setSelectedFiles(prev => {
      if (prev.includes(file.path)) {
        return prev.filter(p => p !== file.path);
      }
      if (prev.length >= 10) {
        addError('Maximum 10 files can be selected for synthesis');
        return prev;
      }
      return [...prev, file.path];
    });
  };

  const handleClassify = (file: FileInfo) => {
    setClassifierFile(file);
    setShowClassifier(true);
  };

  const handleSynthesizeSelected = () => {
    if (selectedFiles.length < 2) {
      addError('Please select at least 2 files for synthesis');
      return;
    }
    if (selectedFiles.length > 10) {
      addError('Maximum 10 files can be selected for synthesis');
      return;
    }
    setShowSynthesizer(true);
  };

  const handleIndexFiles = useCallback(async () => {
    if (!isFileSystemAccessSupported()) {
      addError('File System Access API is not supported. Please use Chrome, Edge, or Opera.');
      return;
    }

    setIsIndexing(true);
    setIndexingProgress({ status: 'idle', totalFiles: 0, processedFiles: 0 });

    try {
      // Step 1: Select directory
      const dirHandle = await selectDirectory();
      if (!dirHandle) {
        setIsIndexing(false);
        return; // User cancelled
      }

      // Step 2: Read files from directory
      setIndexingProgress({ 
        status: 'scanning', 
        totalFiles: 0, 
        processedFiles: 0,
        message: 'Scanning directory...' 
      });

      const files = await readDirectory(dirHandle, (progress) => {
        setIndexingProgress({
          status: progress.status === 'complete' ? 'indexing' : progress.status as 'scanning' | 'indexing',
          totalFiles: progress.totalFiles,
          processedFiles: progress.processedFiles,
          currentFile: progress.currentFile,
          message: progress.message
        });
      });

      if (files.length === 0) {
        addError('No indexable files found in the selected directory.');
        setIsIndexing(false);
        return;
      }

      // Step 3: Send files to backend for server-side indexing
      setIndexingProgress({ 
        status: 'indexing', 
        totalFiles: files.length, 
        processedFiles: 0,
        message: 'Uploading to server for indexing...' 
      });

      // Prepare file data for backend (chunk on client to reduce payload)
      const fileData = files.map(file => {
        // Limit content size before chunking
        const MAX_CONTENT_LENGTH = 1024 * 1024; // 1MB
        const safeContent = file.content.length > MAX_CONTENT_LENGTH 
          ? file.content.slice(0, MAX_CONTENT_LENGTH) 
          : file.content;
        
        return {
          name: file.name,
          path: file.path,
          chunks: chunkText(safeContent).slice(0, 10) // Increased from 5 to 10 chunks max
        };
      });

      // Send to backend for indexing
      const response = await fetch(apiUrl('/api/index-browser-files'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: fileData })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to index files');
      }

      const result = await response.json();

      setHasIndex(true);
      setIndexCount(result.count);
      setIndexingProgress({ 
        status: 'complete', 
        totalFiles: files.length, 
        processedFiles: files.length,
        message: `Indexed ${result.count} documents` 
      });
      addError(`Successfully indexed ${result.count} documents from ${files.length} files.`, 'success');
      fetchIndexSummary();

    } catch (error) {
      console.error('Indexing error:', error);
      setIndexingProgress({ 
        status: 'error', 
        totalFiles: 0, 
        processedFiles: 0,
        message: (error as Error).message 
      });
      addError('Indexing failed: ' + (error as Error).message);
    } finally {
      setIsIndexing(false);
    }
  }, []);

  const handleUploadIndex = useCallback(async (filesList: FileList) => {
    const files = Array.from(filesList);
    if (files.length === 0) {
      addError('No files selected.');
      return;
    }

    setIsIndexing(true);
    setIndexingProgress({
      status: 'scanning',
      totalFiles: files.length,
      processedFiles: 0,
      message: 'Reading files...'
    });

    try {
      const preparedFiles: { name: string; path: string; chunks: string[] }[] = [];
      let processed = 0;
      let skippedLarge = 0;
      let skippedEmpty = 0;
      let skippedError = 0;

      for (const file of files) {
        // Skip files larger than 5MB (was 1MB)
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_FILE_SIZE) {
          console.warn(`Skipping large file: ${file.name} (${file.size} bytes)`);
          skippedLarge++;
          processed++;
          continue;
        }

        try {
          const content = await file.text();
          
          // Skip empty or very small files
          if (!content || content.length < 50) {
            skippedEmpty++;
            processed++;
            continue;
          }

          // Limit content size before chunking (safety measure)
          const MAX_CONTENT_LENGTH = 1024 * 1024; // 1MB text content
          const safeContent = content.length > MAX_CONTENT_LENGTH 
            ? content.slice(0, MAX_CONTENT_LENGTH) 
            : content;

          // Chunk text with safety limits
          const chunks = chunkText(safeContent).slice(0, 10); // Increased from 5 to 10 chunks max
          if (chunks.length === 0) {
            skippedEmpty++;
            processed++;
            continue;
          }

          preparedFiles.push({
            name: file.name,
            path: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
            chunks
          });

        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          skippedError++;
        }

        processed++;
        setIndexingProgress({
          status: 'indexing',
          totalFiles: files.length,
          processedFiles: processed,
          currentFile: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
          message: `Processing: ${file.name}`
        });
      }

      if (preparedFiles.length === 0) {
        let message = 'No indexable files found in the selected upload.';
        if (skippedLarge > 0) message += ` Skipped ${skippedLarge} large files (>5MB).`;
        if (skippedEmpty > 0) message += ` Skipped ${skippedEmpty} empty/small files.`;
        if (skippedError > 0) message += ` ${skippedError} files had errors.`;
        addError(message);
        setIsIndexing(false);
        return;
      }

      console.log(`Prepared ${preparedFiles.length} files for indexing (skipped: ${skippedLarge} large, ${skippedEmpty} empty, ${skippedError} errors)`);

      setIndexingProgress({
        status: 'indexing',
        totalFiles: preparedFiles.length,
        processedFiles: 0,
        message: 'Uploading to server for indexing...'
      });

      const response = await fetch(apiUrl('/api/index-browser-files'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: preparedFiles })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to index files');
      }

      const result = await response.json();

      setHasIndex(true);
      setIndexCount(result.count);
      setIndexingProgress({
        status: 'complete',
        totalFiles: preparedFiles.length,
        processedFiles: preparedFiles.length,
        message: `Indexed ${result.count} documents`
      });
      addError(`Successfully indexed ${result.count} documents from ${preparedFiles.length} uploaded files.`, 'success');
      fetchIndexSummary();
    } catch (error) {
      console.error('Upload indexing error:', error);
      setIndexingProgress({
        status: 'error',
        totalFiles: 0,
        processedFiles: 0,
        message: (error as Error).message
      });
      addError('Indexing failed: ' + (error as Error).message);
    } finally {
      setIsIndexing(false);
    }
  }, []);

  const handleSemanticSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      // Use backend for semantic search
      const response = await fetch(apiUrl('/api/semantic-search'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setFiles(data.results);
      setSelectedIndex(data.results.length > 0 ? 0 : null);

      setRecentSearches(prev => {
        const next = [query, ...prev.filter(q => q !== query)];
        const limited = next.slice(0, 5);
        localStorage.setItem('synapse_recent_searches', JSON.stringify(limited));
        return limited;
      });

      if (data.results.length === 0) {
        addError('No matching documents found. Try a different query.');
      }
    } catch (error) {
      addError('Search failed: ' + (error as Error).message);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSelectFile = (_file: FileInfo, index: number) => {
    setSelectedIndex(index);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!filteredFiles.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => {
        if (prev === null) return 0;
        return Math.min(prev + 1, filteredFiles.length - 1);
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => {
        if (prev === null) return filteredFiles.length - 1;
        return Math.max(prev - 1, 0);
      });
    }
  };

  const getFileType = (file: FileInfo) => {
    if (file.type) return file.type;
    const parts = file.name.split('.');
    if (parts.length > 1) return parts[parts.length - 1].toLowerCase();
    return '';
  };

  const getTopFolder = (file: FileInfo) => {
    const parts = file.path.split(/[/\\]+/).filter(Boolean);
    if (parts.length <= 1) return '';
    return parts[0];
  };

  const baseFilteredFiles = files.filter(file => {
    if (typeFilter) {
      if (getFileType(file) !== typeFilter) return false;
    }
    if (pathFilter) {
      if (getTopFolder(file) !== pathFilter) return false;
    }
    return true;
  });

  const filteredFiles = baseFilteredFiles.slice().sort((a, b) => {
    const aPinned = pinnedPaths.includes(a.path);
    const bPinned = pinnedPaths.includes(b.path);
    if (aPinned === bPinned) return 0;
    return aPinned ? -1 : 1;
  });

  const fileTypes = Array.from(new Set(baseFilteredFiles.map(getFileType).filter(Boolean))).slice(0, 6);
  const topFolders = Array.from(new Set(baseFilteredFiles.map(getTopFolder).filter(Boolean))).slice(0, 6);

  const selectedFile: FileInfo | null =
    filteredFiles.length === 0
      ? null
      : selectedIndex !== null && filteredFiles[selectedIndex]
      ? filteredFiles[selectedIndex]
      : filteredFiles[0];

  const togglePinFile = (file: FileInfo) => {
    setPinnedPaths(prev => {
      if (prev.includes(file.path)) {
        return prev.filter(p => p !== file.path);
      }
      return [file.path, ...prev];
    });
  };

  const handleFileAction = async (file: FileInfo, action: 'move' | 'copy') => {
    // Find matching config: ALL keywords must be present in the filename
    // This ensures files only match when they contain all configured keywords
    const matchingConfig = keywordConfigs.find(config => 
      config.keywords.every(k => file.name.toLowerCase().includes(k.toLowerCase()))
    );
    
    if (!matchingConfig) {
      addError('No automated destination found based on file name match.');
      return;
    }

    try {
      const response = await fetch(apiUrl('/api/file-action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file, action, destination: matchingConfig.destinationFolder }),
      });
      const result = await response.json();
      if (result.success) {
        addError(result.message, 'success');
        // Remove file from view if moved
        if (action === 'move') {
           setFiles(prev => prev.filter(f => f.path !== file.path));
        }
      } else {
        addError(`Error: ${result.message}`);
      }
    } catch (error) {
      addError(`Error: ${(error as Error).message}`);
    }
  };

  const addError = (message: string, type: 'error' | 'success' = 'error') => {
    setErrors(prev => [...prev, { message, type, timestamp: new Date() }]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200 font-sans">
      
      <InsightDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        activeFile={activeFile}
        mode={drawerMode}
      />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${drawerOpen ? 'mr-0 md:mr-96' : ''}`}>
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-blue-600 to-cyan-500 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                <Cpu className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
                  Synapse
                </h1>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">AI Knowledge OS</p>
                  <span className="text-[10px] text-gray-300 dark:text-gray-700">•</span>
                  <span className={`text-[10px] font-bold flex items-center gap-1 ${hasIndex ? 'text-green-500' : 'text-amber-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${hasIndex ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></span>
                    Memory {hasIndex ? 'Online' : 'Offline'}{hasIndex ? ` • ${indexCount} docs` : ''}
                  </span>
                  {aiStatus && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">
                      • AI: {aiStatus.provider} · {aiStatus.model}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* User Info */}
              {user && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <span className="text-xs text-gray-600 dark:text-gray-400">{user.email}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded font-medium">
                    {user.role}
                  </span>
                </div>
              )}
              <button
                onClick={() => setShowRecommendations(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:opacity-90 transition-opacity font-medium text-sm shadow-sm"
                title="Get AI-powered recommendations"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden md:inline">Smart Suggestions</span>
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="hidden md:flex items-center px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-sm"
                title="File automation settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={logout}
                className="p-2.5 rounded-xl text-gray-500 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
          
          {/* Hidden Configuration Zone - Only shown when explicitly toggled */}
          {showConfig && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                   <DirectorySelector
                    label="Automation Input Folders"
                    directories={baseDirectories}
                    setDirectories={setBaseDirectories}
                  />
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <DirectorySelector
                    label="Automation Destination Folders"
                    directories={targetDirectories}
                    setDirectories={setTargetDirectories}
                  />
                </div>
              </div>

              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                These folders and rules are used for Move/Copy automation. They do not affect the semantic search index below.
              </p>
            </>
          )}

          <div className="flex flex-col items-center justify-center space-y-6 py-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              <span className="font-semibold uppercase tracking-wide text-[10px]">Step 1:</span> Index a folder or upload files
              <span className="mx-1 text-gray-300 dark:text-gray-600">•</span>
              <span className="font-semibold uppercase tracking-wide text-[10px]">Step 2:</span> Ask your knowledge base a question
            </div>

            <SemanticSearchBar 
              onIndex={handleIndexFiles}
              onUploadIndex={handleUploadIndex}
              onSearch={handleSemanticSearch}
              isIndexing={isIndexing}
              isSearching={isSearching}
              hasIndex={hasIndex}
              indexCount={indexCount}
              indexingProgress={indexingProgress}
              onSearchKeyDown={handleSearchKeyDown}
              inputRef={searchInputRef}
              recentSearches={recentSearches}
            />
            
            {hasIndex && (
              <div className="text-xs text-gray-400 dark:text-gray-500 text-center max-w-2xl">
                <span className="font-medium">💡 Try:</span>{' '}
                <button 
                  onClick={() => handleSemanticSearch('Q4 revenue concerns')}
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
                >
                  "Q4 revenue concerns"
                </button>
                {' '}or{' '}
                <button 
                  onClick={() => handleSemanticSearch('meeting action items')}
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
                >
                  "meeting action items"
                </button>
                {' '}or{' '}
                <button 
                  onClick={() => handleSemanticSearch('contract termination clause')}
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
                >
                  "contract termination clause"
                </button>
              </div>
            )}
            
            {(isIndexing || progress.total > 0) && (
               <ProgressBar current={progress.current} total={progress.total} />
            )}
          </div>

          {/* Index Inspector */}
          {indexSummary && (
            <div className="flex flex-wrap items-center justify-between mb-2 text-xs text-gray-500 dark:text-gray-400">
              <span>
                Index: {indexSummary.totalFiles} files · {indexSummary.totalChunks} chunks
              </span>
              {indexSummary.files.length > 0 && (
                <div className="hidden sm:flex flex-wrap items-center gap-1">
                  <span className="uppercase tracking-wide text-[10px]">Top:</span>
                  {indexSummary.files.slice(0, 3).map((f) => (
                    <span
                      key={f.path}
                      className="px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-600 dark:text-gray-300"
                    >
                      {f.name} · {f.chunks}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Filters + Results & Preview */}
          {files.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="uppercase tracking-wide text-[10px]">Filters</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTypeFilter(null)}
                    className={`px-2 py-1 rounded-full border ${
                      typeFilter === null
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    All types
                  </button>
                  {fileTypes.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTypeFilter(t)}
                      className={`px-2 py-1 rounded-full border ${
                        typeFilter === t
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {t || 'unknown'}
                    </button>
                  ))}
                </div>
                {topFolders.length > 0 && (
                  <div className="flex flex-wrap gap-2 ml-4">
                    <button
                      type="button"
                      onClick={() => setPathFilter(null)}
                      className={`px-2 py-1 rounded-full border ${
                        pathFilter === null
                          ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-300'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      All folders
                    </button>
                    {topFolders.map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setPathFilter(f)}
                        className={`px-2 py-1 rounded-full border ${
                          pathFilter === f
                            ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-300'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6 items-start">
                <FileGrid 
                  files={filteredFiles}
                  onAnalyze={handleAnalyze}
                  onChat={handleChat}
                  onAction={handleFileAction}
                  selectedIndex={selectedIndex}
                  onSelect={handleSelectFile}
                  pinnedPaths={pinnedPaths}
                  onTogglePin={togglePinFile}
                  selectedFiles={selectedFiles}
                  onToggleSelection={handleToggleSelection}
                  onClassify={handleClassify}
                  onSynthesizeSelected={handleSynthesizeSelected}
                />
                <PreviewPane file={selectedFile} />
              </div>
            </>
          ) : (
            !isIndexing && !isSearching && (
              <div className="text-center py-24 opacity-40">
                <Cpu className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-lg font-medium">Knowledge Base Ready</p>
                <p className="text-sm">Build an index to start chatting with your files.</p>
              </div>
            )
          )}
        </main>

        {/* Modals */}
        {showConfig && (
          <ConfigurationPanel
            onClose={() => setShowConfig(false)}
            keywordConfigs={keywordConfigs}
            setKeywordConfigs={setKeywordConfigs}
            targetDirectories={targetDirectories}
          />
        )}

        {showWelcomeWizard && (
          <WelcomeWizard
            onComplete={() => setShowWelcomeWizard(false)}
            setBaseDirectories={setBaseDirectories}
            setTargetDirectories={setTargetDirectories}
            setKeywordConfigs={setKeywordConfigs}
          />
        )}

        {/* Advanced Feature Modals */}
        {showClassifier && classifierFile && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Document Classification</h2>
                <button
                  onClick={() => setShowClassifier(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <DocumentClassifier
                  filePath={classifierFile.path}
                  onClassified={(result) => {
                    console.log('Classification result:', result);
                    addError(`Document classified as ${result.documentType} with ${(result.confidence * 100).toFixed(0)}% confidence`, 'success');
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {showSynthesizer && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Multi-Document Synthesis</h2>
                <button
                  onClick={() => {
                    setShowSynthesizer(false);
                    setSelectedFiles([]);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close multi-document synthesis modal"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <MultiDocSynthesizer
                  filePaths={selectedFiles}
                  onSynthesized={(result) => {
                    console.log('Synthesis result:', result);
                    addError(`Successfully synthesized ${selectedFiles.length} documents`, 'success');
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {showRecommendations && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recommendations-modal-title"
          >
            <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
                <h2 id="recommendations-modal-title" className="text-xl font-bold text-white">Smart Recommendations</h2>
                <button
                  onClick={() => setShowRecommendations(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <SmartRecommendations
                  currentFile={activeFile?.path}
                  userRole={user?.role}
                />
              </div>
            </div>
          </div>
        )}

        <ErrorLog errors={errors} setErrors={setErrors} />
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Cpu className="w-8 h-8 text-blue-500 animate-pulse" />
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Show dashboard if authenticated
  return <Dashboard />;
}

export default App;
