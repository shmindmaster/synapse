import React, { useState } from 'react';
import { Search, BrainCircuit, Loader2, FolderOpen, HardDrive, AlertCircle } from 'lucide-react';
import { isFileSystemAccessSupported } from '../services/fileSystem';

interface IndexingProgress {
  status: 'idle' | 'loading-model' | 'scanning' | 'indexing' | 'complete' | 'error';
  totalFiles: number;
  processedFiles: number;
  currentFile?: string;
  message?: string;
  modelProgress?: number;
}

interface SemanticSearchBarProps {
  onIndex: () => void;
  onSearch: (query: string) => void;
  isIndexing: boolean;
  isSearching: boolean;
  hasIndex: boolean;
  indexCount?: number;
  indexingProgress?: IndexingProgress;
  onSearchKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const SemanticSearchBar: React.FC<SemanticSearchBarProps> = ({ 
  onIndex, 
  onSearch, 
  isIndexing, 
  isSearching,
  hasIndex,
  indexCount = 0,
  indexingProgress,
  onSearchKeyDown,
  inputRef
}) => {
  const [query, setQuery] = useState('');
  const isSupported = isFileSystemAccessSupported();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim() && hasIndex) {
      onSearch(query);
    }
  };

  const getProgressPercentage = () => {
    if (!indexingProgress) return 0;
    if (indexingProgress.status === 'loading-model') {
      return indexingProgress.modelProgress || 0;
    }
    if (indexingProgress.totalFiles === 0) return 0;
    return Math.round((indexingProgress.processedFiles / indexingProgress.totalFiles) * 100);
  };

  const getStatusMessage = () => {
    if (!indexingProgress) return '';
    
    switch (indexingProgress.status) {
      case 'loading-model':
        return `Loading AI model... ${indexingProgress.modelProgress || 0}%`;
      case 'scanning':
        return 'Scanning directory...';
      case 'indexing':
        return `Indexing: ${indexingProgress.processedFiles}/${indexingProgress.totalFiles} files`;
      case 'complete':
        return `✓ Indexed ${indexCount} documents`;
      case 'error':
        return `Error: ${indexingProgress.message}`;
      default:
        return '';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Browser Support Warning */}
      {!isSupported && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>File System Access requires Chrome, Edge, or Opera. Other browsers are not supported.</span>
        </div>
      )}

      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-75 blur group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
        <div className="relative flex items-center bg-white dark:bg-gray-900 rounded-2xl leading-none divide-x divide-gray-200 dark:divide-gray-700 shadow-2xl">
          
          {/* Search Input */}
          <div className="flex-1 flex items-center p-2">
             <Search className="w-6 h-6 ml-3 text-gray-400" />
             <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { handleKeyDown(e); onSearchKeyDown?.(e); }}
                disabled={!hasIndex || isIndexing}
                ref={inputRef}
                className="w-full p-4 bg-transparent border-none focus:ring-0 text-gray-800 dark:text-gray-100 placeholder-gray-400 text-lg"
                placeholder={hasIndex ? "Ask your knowledge base..." : "Select a folder to index"}
             />
             <span className="hidden sm:inline-flex items-center px-2 py-1 mr-2 text-[10px] font-mono text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg">
               Ctrl+K
             </span>
          </div>

          {/* Action Button */}
          <div className="p-2 pr-3">
            {hasIndex ? (
              <button
                onClick={() => onSearch(query)}
                disabled={isSearching || !query.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3 font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                <span>Search</span>
              </button>
            ) : (
              <button
                onClick={onIndex}
                disabled={isIndexing || !isSupported}
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 rounded-xl px-6 py-3 font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isIndexing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FolderOpen className="w-5 h-5" />}
                <span>{isIndexing ? 'Indexing...' : 'Select Folder'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      {isIndexing && indexingProgress && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{getStatusMessage()}</span>
            <span>{getProgressPercentage()}%</span>
          </div>
          {indexingProgress.currentFile && (
            <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
              {indexingProgress.currentFile}
            </div>
          )}
        </div>
      )}

      {/* Status Text */}
      <div className="text-center">
        {!isIndexing && hasIndex && (
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
            <HardDrive className="w-4 h-4" />
            <span>{indexCount} documents indexed locally</span>
          </div>
        )}
        {!hasIndex && !isIndexing && isSupported && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Select a folder to build your local knowledge base
          </span>
        )}
      </div>
    </div>
  );
};

export default SemanticSearchBar;

