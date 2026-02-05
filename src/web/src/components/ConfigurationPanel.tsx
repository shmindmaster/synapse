import React, { useState } from 'react';
import { X, Plus, Trash2, FolderDown, Tag } from 'lucide-react';
import { KeywordConfig, Directory } from '../types';

interface ConfigurationPanelProps {
  onClose: () => void;
  keywordConfigs: KeywordConfig[];
  setKeywordConfigs: React.Dispatch<React.SetStateAction<KeywordConfig[]>>;
  targetDirectories: Directory[];
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  onClose,
  keywordConfigs,
  setKeywordConfigs,
  targetDirectories,
}) => {
  const [newKeywords, setNewKeywords] = useState('');
  const [newDestination, setNewDestination] = useState('');

  const handleAdd = () => {
    if (newKeywords && newDestination) {
      const keywords = newKeywords.split(',').map(k => k.trim()).filter(k => k);
      setKeywordConfigs([...keywordConfigs, { keywords, destinationFolder: newDestination }]);
      setNewKeywords('');
      setNewDestination('');
    }
  };

  const handleRemove = (index: number) => {
    setKeywordConfigs(keywordConfigs.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FolderDown className="w-5 h-5 text-blue-500" />
            Automation Rules
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          
          {/* Add New Rule */}
          <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30">
            <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">New Sorting Rule</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">If file matches keywords:</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. invoice, receipt, tax"
                    value={newKeywords}
                    onChange={(e) => setNewKeywords(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Move to folder:</label>
                <div className="relative">
                  <FolderDown className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <select
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                  >
                    <option value="">Select destination...</option>
                    {targetDirectories.map((dir, index) => (
                      <option key={index} value={dir.path}>{dir.path}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleAdd}
                disabled={!newKeywords || !newDestination}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Create Rule
              </button>
            </div>
          </div>

          {/* Existing Rules */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Active Rules</h3>
            {keywordConfigs.length === 0 && (
              <p className="text-sm text-gray-400 italic text-center py-4">No rules configured.</p>
            )}
            {keywordConfigs.map((config, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl group hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                <div className="overflow-hidden">
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {config.keywords.map((k, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium text-gray-600 dark:text-gray-300">
                        {k}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <ArrowRightIcon className="w-3 h-3" />
                    <span className="truncate font-mono" title={config.destinationFolder}>{config.destinationFolder}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(index)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default ConfigurationPanel;