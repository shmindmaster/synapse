import React from 'react';
import { Cpu, Network } from 'lucide-react';
import SmartFileCard from './shared/SmartFileCard';
import { FileInfo } from '../types';

interface FileGridProps {
  files: FileInfo[];
  onAnalyze: (file: FileInfo) => void;
  onChat: (file: FileInfo) => void;
  onAction: (file: FileInfo, action: 'move' | 'copy') => void;
  selectedIndex?: number | null;
  onSelect?: (file: FileInfo, index: number) => void;
  pinnedPaths?: string[];
  onTogglePin?: (file: FileInfo) => void;
  selectedFiles?: string[];
  onToggleSelection?: (file: FileInfo) => void;
  onClassify?: (file: FileInfo) => void;
  onSynthesizeSelected?: () => void;
}

const FileGrid: React.FC<FileGridProps> = ({ 
  files, 
  onAnalyze, 
  onChat, 
  onAction, 
  selectedIndex, 
  onSelect, 
  pinnedPaths, 
  onTogglePin,
  selectedFiles = [],
  onToggleSelection,
  onClassify,
  onSynthesizeSelected
}) => {
  if (files.length === 0) return null;

  const selectedCount = selectedFiles.length;
  const canSynthesize = selectedCount >= 2 && selectedCount <= 10;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Neural Assets
          </h2>
          {selectedCount > 0 && (
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
              {selectedCount} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canSynthesize && onSynthesizeSelected && (
            <button
              onClick={onSynthesizeSelected}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
            >
              <Network className="w-3.5 h-3.5" />
              Synthesize Selected
            </button>
          )}
          <span className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-gray-500 dark:text-gray-400 shadow-sm">
            {files.length} Items Detected
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {files.map((file, index) => {
          const isPinned = pinnedPaths?.includes(file.path);
          const isSelected = selectedIndex === index;
          const isMultiSelected = selectedFiles.includes(file.path);
          return (
            <div
              key={`${file.path}-${index}`}
              onClick={() => onSelect && onSelect(file, index)}
              className={`cursor-pointer focus:outline-none ${
                isMultiSelected
                  ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900'
                  : isSelected
                    ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900'
                    : ''
              }`}
            >
              <SmartFileCard 
                file={file} 
                onAnalyze={onAnalyze}
                onChat={onChat}
                onAction={onAction}
                isPinned={isPinned}
                onTogglePin={onTogglePin}
                isMultiSelected={isMultiSelected}
                onToggleSelection={onToggleSelection}
                onClassify={onClassify}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileGrid;

