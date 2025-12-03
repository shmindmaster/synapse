import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-2">
        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          System Processing
        </span>
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
          {current} / {total}
        </span>
      </div>
      
      <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        {/* Background Pulse */}
        <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
        
        {/* Actual Progress */}
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
          style={{ width: `${percentage}%` }}
        >
          {/* Leading Edge Sparkle */}
          <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white/30"></div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;