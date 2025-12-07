import React from 'react';
import { Directory, KeywordConfig } from '../types';
import { Cpu, X, Sparkles, Search, FolderOpen } from 'lucide-react';

interface WelcomeWizardProps {
  onComplete: () => void;
  setBaseDirectories: React.Dispatch<React.SetStateAction<Directory[]>>;
  setTargetDirectories: React.Dispatch<React.SetStateAction<Directory[]>>;
  setKeywordConfigs: React.Dispatch<React.SetStateAction<KeywordConfig[]>>;
}

const WelcomeWizard: React.FC<WelcomeWizardProps> = ({
  onComplete,
}) => {

  const handleGetStarted = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-8 text-white text-center relative">
          <button
            onClick={handleGetStarted}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            title="Close and get started"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Cpu className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Welcome to Synapse</h2>
          <p className="text-blue-100">Your AI-powered knowledge base</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
                Get Started in 2 Simple Steps
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Transform your files into an intelligent, searchable knowledge base
              </p>
            </div>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-blue-500" />
                    Index Your Files
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click the <strong>"Index Folder"</strong> or <strong>"Upload Files"</strong> button on the main dashboard to build your knowledge base
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                    <Search className="w-5 h-5 text-purple-500" />
                    Ask Questions
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Use the search bar to ask natural language questions about your documents
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
                      💡 "Q4 revenue concerns"
                    </span>
                    <span className="text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
                      💡 "meeting action items"
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleGetStarted}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
              >
                Get Started →
              </button>
            </div>

            <div className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
              <p>Advanced features like document classification and multi-doc synthesis are available after indexing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeWizard;
