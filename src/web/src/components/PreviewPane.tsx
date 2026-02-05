import React from 'react';
import { FileInfo } from '../types';
import { FileText } from 'lucide-react';

interface PreviewPaneProps {
  file: FileInfo | null;
}

const PreviewPane: React.FC<PreviewPaneProps> = ({ file }) => {
  if (!file) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 h-full flex flex-col items-center justify-center text-center text-sm text-gray-500 dark:text-gray-400">
        <FileText className="w-10 h-10 mb-3 text-gray-300 dark:text-gray-600" />
        <p>Select or search for a file to see a preview here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 h-full flex flex-col gap-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-all">
              {file.name}
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 break-all mt-1">
              {file.path}
            </p>
          </div>
        </div>
        {file.keywords && file.keywords.length > 0 && (
          <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-[11px] font-medium rounded-full whitespace-nowrap">
            {file.keywords[0]}
          </span>
        )}
      </div>

      {file.analysis && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Summary
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">
            {file.analysis.summary}
          </p>
          {file.analysis.tags && file.analysis.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {file.analysis.tags.map((tag, idx) => (
                <span
                  key={`${file.path}-tag-${idx}`}
                  className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-[11px] text-gray-600 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {!file.analysis && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          No AI summary yet. Use the <span className="font-medium">Analyze</span> action on this file to generate one.
        </p>
      )}
    </div>
  );
};

export default PreviewPane;
