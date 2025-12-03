import React from 'react';
import { Cpu } from 'lucide-react';
import SmartFileCard from './shared/SmartFileCard';
import { FileInfo } from '../types';

interface FileGridProps {
  files: FileInfo[];
  onAnalyze: (file: FileInfo) => void;
  onChat: (file: FileInfo) => void;
  onAction: (file: FileInfo, action: 'move' | 'copy') => void;
}

const FileGrid: React.FC<FileGridProps> = ({ files, onAnalyze, onChat, onAction }) => {
  if (files.length === 0) return null;

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
        </div>
        <span className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-gray-500 dark:text-gray-400 shadow-sm">
          {files.length} Items Detected
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {files.map((file, index) => (
          <SmartFileCard 
            key={`${file.path}-${index}`} 
            file={file} 
            onAnalyze={onAnalyze}
            onChat={onChat}
            onAction={onAction}
          />
        ))}
      </div>
    </div>
  );
};

export default FileGrid;

