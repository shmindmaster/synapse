import React, { useState } from 'react';
import { Search, BrainCircuit, Loader2 } from 'lucide-react';

interface SemanticSearchBarProps {
  onIndex: () => void;
  onSearch: (query: string) => void;
  isIndexing: boolean;
  isSearching: boolean;
  hasIndex: boolean;
}

const SemanticSearchBar: React.FC<SemanticSearchBarProps> = ({ 
  onIndex, 
  onSearch, 
  isIndexing, 
  isSearching,
  hasIndex 
}) => {
  const [query, setQuery] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      onSearch(query);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
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
                onKeyDown={handleKeyDown}
                disabled={!hasIndex || isIndexing}
                className="w-full p-4 bg-transparent border-none focus:ring-0 text-gray-800 dark:text-gray-100 placeholder-gray-400 text-lg"
                placeholder={hasIndex ? "Ask your knowledge base..." : "Index files to enable semantic search"}
             />
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
                <span>Ask AI</span>
              </button>
            ) : (
              <button
                onClick={onIndex}
                disabled={isIndexing}
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 rounded-xl px-6 py-3 font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isIndexing ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                <span>Build Index</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Status Text */}
      <div className="text-center">
        {isIndexing && <span className="text-sm text-blue-500 font-medium animate-pulse">Processing vector embeddings...</span>}
        {!hasIndex && !isIndexing && <span className="text-sm text-gray-500 dark:text-gray-400">System Index Required for Semantic Features</span>}
      </div>
    </div>
  );
};

export default SemanticSearchBar;

