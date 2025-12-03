import React, { useState } from 'react';
import { Directory, KeywordConfig } from '../types';
import DirectorySelector from './DirectorySelector';
import { Cpu, ArrowRight, Sparkles } from 'lucide-react';

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

  const handleNext = () => {
    if (step === 0 && baseDir.length === 0) return alert('Select at least one source.');
    if (step === 1 && targetDir.length === 0) return alert('Select at least one target.');
    if (step === 2 && (!keyword || !destination)) return alert('Configure one rule.');
    
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
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Cpu className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Welcome to Synapse</h2>
          <p className="text-blue-100">AI-Native Knowledge Operating System</p>
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
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Connect Your Data</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Select the folders Synapse should monitor for analysis.</p>
              <DirectorySelector label="Source Directories" directories={baseDir} setDirectories={setBaseDir} />
            </div>
          )}

          {step === 1 && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Define Destinations</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Where should organized files be moved or copied to?</p>
              <DirectorySelector label="Target Directories" directories={targetDir} setDirectories={setTargetDir} />
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Create First Neuron</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Set up a simple keyword rule to get started.</p>
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
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button
            onClick={handleNext}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30"
          >
            {step < 2 ? 'Next Step' : 'Launch Synapse'}
            {step < 2 ? <ArrowRight className="ml-2 w-5 h-5" /> : <Sparkles className="ml-2 w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeWizard;