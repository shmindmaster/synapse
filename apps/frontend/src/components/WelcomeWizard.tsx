import React, { useState } from 'react';
import { Directory, KeywordConfig } from '../types';
import DirectorySelector from './DirectorySelector';
import { Cpu, ArrowRight, Sparkles, X, HelpCircle } from 'lucide-react';

interface WelcomeWizardProps {
  onComplete: () => void;
  setBaseDirectories: React.Dispatch<React.SetStateAction<Directory[]>>;
  setTargetDirectories: React.Dispatch<React.SetStateAction<Directory[]>>;
  setKeywordConfigs: React.Dispatch<React.SetStateAction<KeywordConfig[]>>;
}

const WelcomeWizard: React.FC<WelcomeWizardProps> = ({
  onComplete,
  setBaseDirectories,
  setTargetDirectories,
  setKeywordConfigs,
}) => {
  const [step, setStep] = useState(0);
  const [baseDir, setBaseDir] = useState<Directory[]>([]);
  const [targetDir, setTargetDir] = useState<Directory[]>([]);
  const [keyword, setKeyword] = useState('');
  const [destination, setDestination] = useState('');

  const handleSkip = () => {
    // Allow skipping the wizard entirely for users who just want to use semantic search
    onComplete();
  };

  const handleNext = () => {
    // Make steps optional - users can skip if they only want semantic search
    if (step === 0 && baseDir.length === 0) {
      // Allow skipping source directories
    }
    if (step === 1 && targetDir.length === 0) {
      // Allow skipping target directories
    }
    if (step === 2 && (!keyword || !destination)) {
      // Allow skipping automation rule
    }
    
    if (step < 2) {
      setStep(step + 1);
    } else {
      setBaseDirectories(baseDir);
      setTargetDirectories(targetDir);
      setKeywordConfigs([{ keywords: [keyword], destinationFolder: destination }]);
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-8 text-white text-center relative">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            title="Skip setup and go straight to Synapse"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Cpu className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Welcome to Synapse</h2>
          <p className="text-blue-100">Your AI-powered knowledge base</p>
          <p className="text-blue-200 text-xs mt-2">This wizard sets up file automation. You can skip it and use semantic search right away.</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center gap-2 mt-6">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-1.5 w-12 rounded-full transition-colors ${i <= step ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
          ))}
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 0 && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Set Up File Automation</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-2">Add folders where Synapse should look for files to auto-organize.</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                This is optional. You can skip and use semantic search without automation.
              </p>
              <DirectorySelector label="Source Directories" directories={baseDir} setDirectories={setBaseDir} />
            </div>
          )}

          {step === 1 && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Define Destinations</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-2">Where should organized files be moved or copied to?</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                Skip this if you only want to search your files, not move them.
              </p>
              <DirectorySelector label="Target Directories" directories={targetDir} setDirectories={setTargetDir} />
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Create an Automation Rule</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-2">When a file matches a keyword, Synapse can auto-move it.</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                You can add more rules later from the Automation panel.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trigger Keyword</label>
                  <input
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="e.g. 'invoice', 'urgent'"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destination Folder</label>
                  <select
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  >
                    <option value="">Select a target...</option>
                    {targetDir.map((dir, index) => (
                      <option key={index} value={dir.path}>{dir.path}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Skip setup →
          </button>
          <button
            onClick={handleNext}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30"
          >
            {step < 2 ? 'Next' : 'Finish Setup'}
            {step < 2 ? <ArrowRight className="ml-2 w-5 h-5" /> : <Sparkles className="ml-2 w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeWizard;