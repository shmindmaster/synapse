import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Loader2, AlertCircle, TrendingUp, Archive, Share2, Tag, Lightbulb } from 'lucide-react';
import { apiUrl } from '../utils/api';

interface Recommendation {
  type: string;
  action: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  estimatedImpact: string;
}

interface Prediction {
  prediction: string;
  confidence: number;
  suggestedAction: string;
}

interface SmartRecommendationsResult {
  recommendations: Recommendation[];
  patterns: string[];
  insights: string[];
  predictions: Prediction[];
  optimizations: string[];
}

interface SmartRecommendationsProps {
  currentFile?: string;
  context?: string;
  recentActions?: Array<Record<string, unknown>>;
  userRole?: string;
}

const AUTO_REFRESH_INTERVAL_MS = 60000; // 1 minute

export default function SmartRecommendations({
  currentFile,
  context,
  recentActions,
  userRole,
}: SmartRecommendationsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SmartRecommendationsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl('/api/smart-recommendations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentFile,
          context,
          recentActions,
          userRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recommendations');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
    } finally {
      setIsLoading(false);
    }
  }, [currentFile, context, recentActions, userRole]);

  useEffect(() => {
    if (autoRefresh) {
      fetchRecommendations();
      const interval = setInterval(fetchRecommendations, AUTO_REFRESH_INTERVAL_MS);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchRecommendations]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-600 bg-red-900/20 text-red-300';
      case 'medium':
        return 'border-yellow-600 bg-yellow-900/20 text-yellow-300';
      case 'low':
        return 'border-blue-600 bg-blue-900/20 text-blue-300';
      default:
        return 'border-gray-600 bg-gray-900/20 text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'organize':
        return <Archive className="w-4 h-4" />;
      case 'share':
        return <Share2 className="w-4 h-4" />;
      case 'tag':
        return <Tag className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Smart Recommendations</h3>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-yellow-600 focus:ring-yellow-500"
            />
            Auto-refresh
          </label>
          <button
            onClick={fetchRecommendations}
            disabled={isLoading}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Get Recommendations
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {result.recommendations && result.recommendations.length > 0 && (
            <div>
              <div className="text-sm text-gray-400 mb-3">Recommended Actions</div>
              <div className="space-y-3">
                {result.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border p-4 ${getPriorityColor(rec.priority)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(rec.type)}
                        <span className="font-medium">{rec.action}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wide">{rec.priority}</span>
                        <span className="text-xs">
                          {(rec.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-sm mb-2">{rec.reason}</div>
                    <div className="text-xs opacity-75">
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      Impact: {rec.estimatedImpact}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.predictions && result.predictions.length > 0 && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                <Lightbulb className="w-4 h-4" />
                Predictions
              </div>
              <div className="space-y-3">
                {result.predictions.map((pred, idx) => (
                  <div key={idx} className="bg-gray-800/50 rounded p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-white">{pred.prediction}</div>
                      <div className="text-xs text-gray-400 ml-2">
                        {(pred.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="text-sm text-blue-400">→ {pred.suggestedAction}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.insights && result.insights.length > 0 && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-3">Workflow Insights</div>
              <ul className="space-y-2">
                {result.insights.map((insight, idx) => (
                  <li key={idx} className="text-white text-sm flex items-start gap-2">
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.patterns && result.patterns.length > 0 && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-3">Detected Patterns</div>
              <div className="flex flex-wrap gap-2">
                {result.patterns.map((pattern, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-yellow-900/30 text-yellow-300 rounded-full text-sm border border-yellow-800"
                  >
                    {pattern}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.optimizations && result.optimizations.length > 0 && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-3">Workflow Optimizations</div>
              <ul className="space-y-2">
                {result.optimizations.map((opt, idx) => (
                  <li key={idx} className="text-green-300 text-sm flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>{opt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!result && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Click "Get Recommendations" to receive AI-powered suggestions</p>
        </div>
      )}
    </div>
  );
}
