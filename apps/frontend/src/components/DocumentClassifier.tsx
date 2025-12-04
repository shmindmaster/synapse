import { useState } from 'react';
import { FileText, Loader2, CheckCircle, AlertCircle, FolderTree, Tags } from 'lucide-react';
import { apiUrl } from '../utils/api';

interface ClassificationResult {
  documentType: string;
  category: string;
  confidence: number;
  suggestedPath: string;
  extractedEntities: string[];
  tags: string[];
  summary: string;
}

interface DocumentClassifierProps {
  filePath?: string;
  content?: string;
  onClassified?: (result: ClassificationResult) => void;
}

export default function DocumentClassifier({ filePath, content, onClassified }: DocumentClassifierProps) {
  const [isClassifying, setIsClassifying] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClassify = async () => {
    if (!filePath && !content) {
      setError('Either file path or content is required');
      return;
    }

    setIsClassifying(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(apiUrl('/api/classify-document'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Classification failed');
      }

      setResult(data.classification);
      if (onClassified) {
        onClassified(data.classification);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Classification failed');
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Document Classifier</h3>
        </div>
        <button
          onClick={handleClassify}
          disabled={isClassifying}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          {isClassifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Classifying...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Classify Document
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Classification Complete</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Document Type</div>
              <div className="text-white font-medium">{result.documentType}</div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Category</div>
              <div className="text-white font-medium">{result.category}</div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Confidence</div>
              <div className="text-white font-medium">
                {(result.confidence * 100).toFixed(1)}%
              </div>
              <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <FolderTree className="w-4 h-4" />
                Suggested Path
              </div>
              <div className="text-white font-mono text-sm">{result.suggestedPath}</div>
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-2">Summary</div>
            <div className="text-white">{result.summary}</div>
          </div>

          {result.extractedEntities && result.extractedEntities.length > 0 && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-2">Extracted Entities</div>
              <div className="flex flex-wrap gap-2">
                {result.extractedEntities.map((entity, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-900/30 text-purple-300 rounded-full text-sm border border-purple-800"
                  >
                    {entity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.tags && result.tags.length > 0 && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <Tags className="w-4 h-4" />
                Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {result.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-sm border border-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
