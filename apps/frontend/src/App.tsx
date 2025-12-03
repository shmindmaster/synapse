import { useState, useEffect, useCallback } from 'react';
import { Settings, Moon, Sun, Cpu, LogOut } from 'lucide-react';
import SemanticSearchBar from './components/SemanticSearchBar';
import ConfigurationPanel from './components/ConfigurationPanel';
import ProgressBar from './components/ProgressBar';
import DirectorySelector from './components/DirectorySelector';
import ErrorLog from './components/ErrorLog';
import FileGrid from './components/FileGrid';
import WelcomeWizard from './components/WelcomeWizard';
import InsightDrawer from './components/shared/InsightDrawer';
import LoginPage from './components/LoginPage';
import { useAuth } from './contexts/useAuth';
import { FileInfo, KeywordConfig, Directory, AppError } from './types';
import { apiUrl } from './utils/api';

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

function Dashboard() {
  const { user, logout } = useAuth();
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [showConfig, setShowConfig] = useState(false);
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
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (keywordConfigs.length > 0) {
      localStorage.setItem('appConfig', JSON.stringify({ keywordConfigs, baseDirectories, targetDirectories }));
    }
  }, [keywordConfigs, baseDirectories, targetDirectories]);

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
      const fileData = files.map(file => ({
        name: file.name,
        path: file.path,
        chunks: chunkText(file.content).slice(0, 5) // Limit chunks per file
      }));

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

      if (data.results.length === 0) {
        addError('No matching documents found. Try a different query.');
      }
    } catch (error) {
      addError('Search failed: ' + (error as Error).message);
    } finally {
      setIsSearching(false);
    }
  }, []);

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
                    Memory {hasIndex ? 'Online' : 'Offline'}
                  </span>
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
                onClick={() => setDarkMode(!darkMode)}
                className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="flex items-center px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:opacity-90 transition-opacity font-medium text-sm shadow-sm"
              >
                <Settings className="w-4 h-4 mr-2" />
                Config
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
          
          {/* Configuration Zone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
               <DirectorySelector
                label="Input Sources"
                directories={baseDirectories}
                setDirectories={setBaseDirectories}
              />
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <DirectorySelector
                label="Sort Destinations"
                directories={targetDirectories}
                setDirectories={setTargetDirectories}
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-6 py-4">
            <SemanticSearchBar 
              onIndex={handleIndexFiles}
              onSearch={handleSemanticSearch}
              isIndexing={isIndexing}
              isSearching={isSearching}
              hasIndex={hasIndex}
              indexCount={indexCount}
              indexingProgress={indexingProgress}
            />
            {(isIndexing || progress.total > 0) && (
               <ProgressBar current={progress.current} total={progress.total} />
            )}
          </div>

          {/* Use the new FileGrid Component */}
          <FileGrid 
            files={files}
            onAnalyze={handleAnalyze}
            onChat={handleChat}
            onAction={handleFileAction}
          />
          
          {files.length === 0 && !isIndexing && !isSearching && (
            <div className="text-center py-24 opacity-40">
              <Cpu className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium">Knowledge Base Ready</p>
              <p className="text-sm">Build an index to start chatting with your files.</p>
            </div>
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
