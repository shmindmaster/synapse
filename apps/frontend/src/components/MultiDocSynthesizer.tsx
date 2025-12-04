import { useState } from 'react';
import { Network, Loader2, AlertCircle, GitBranch, Calendar, Lightbulb, FileStack } from 'lucide-react';
import { apiUrl } from '../utils/api';

interface Entity {
  name: string;
  type: string;
  mentions: number;
  documents: string[];
}

interface Relationship {
  from: string;
  to: string;
  type: string;
  strength: number;
}

interface TimelineEvent {
  date: string;
  event: string;
  source: string;
}

interface SynthesisResult {
  synthesis: string;
  keyThemes: string[];
  entities: Entity[];
  relationships: Relationship[];
  timeline: TimelineEvent[];
  insights: string[];
  contradictions: string[];
  confidence: number;
}

interface MultiDocSynthesizerProps {
  filePaths: string[];
  onSynthesized?: (result: SynthesisResult) => void;
}

export default function MultiDocSynthesizer({ filePaths, onSynthesized }: MultiDocSynthesizerProps) {
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [result, setResult] = useState<SynthesisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<string>('synthesis');
  const [query, setQuery] = useState<string>('');

  const handleSynthesize = async () => {
    if (!filePaths || filePaths.length === 0) {
      setError('At least one file is required');
      return;
    }

    if (filePaths.length > 10) {
      setError('Maximum 10 files can be synthesized at once');
      return;
    }

    setIsSynthesizing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(apiUrl('/api/synthesize-documents'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePaths, query, analysisType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Synthesis failed');
      }

      setResult(data.synthesis);
      if (onSynthesized) {
        onSynthesized(data.synthesis);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Synthesis failed');
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Multi-Document Synthesizer</h3>
        </div>
      </div>

      <div className="space-y-4 mb-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Analysis Type</label>
          <select
            value={analysisType}
            onChange={(e) => setAnalysisType(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="synthesis">Comprehensive Synthesis</option>
            <option value="timeline">Timeline Analysis</option>
            <option value="entities">Entity Mapping</option>
            <option value="comparative">Comparative Analysis</option>
            <option value="knowledge_graph">Knowledge Graph</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Focus Query (Optional)</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Focus on financial implications..."
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            <FileStack className="w-4 h-4 inline mr-1" />
            {filePaths.length} document{filePaths.length !== 1 ? 's' : ''} selected
          </div>
          <button
            onClick={handleSynthesize}
            disabled={isSynthesizing || filePaths.length === 0}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            {isSynthesizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Synthesizing...
              </>
            ) : (
              <>
                <Network className="w-4 h-4" />
                Synthesize
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
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-2">Synthesis</div>
            <div className="text-white leading-relaxed">{result.synthesis}</div>
            <div className="mt-2 text-xs text-gray-500">
              Confidence: {(result.confidence * 100).toFixed(1)}%
            </div>
          </div>

          {result.keyThemes && result.keyThemes.length > 0 && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-2">Key Themes</div>
              <div className="flex flex-wrap gap-2">
                {result.keyThemes.map((theme, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-900/30 text-purple-300 rounded-full text-sm border border-purple-800"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.insights && result.insights.length > 0 && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                <Lightbulb className="w-4 h-4" />
                Key Insights
              </div>
              <ul className="space-y-2">
                {result.insights.map((insight, idx) => (
                  <li key={idx} className="text-white flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.timeline && result.timeline.length > 0 && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                <Calendar className="w-4 h-4" />
                Timeline
              </div>
              <div className="space-y-3">
                {result.timeline.map((event, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="text-purple-400 font-mono text-sm whitespace-nowrap">
                      {event.date}
                    </div>
                    <div className="flex-1">
                      <div className="text-white">{event.event}</div>
                      <div className="text-xs text-gray-500">{event.source}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.entities && result.entities.length > 0 && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                <GitBranch className="w-4 h-4" />
                Extracted Entities
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.entities.slice(0, 10).map((entity, idx) => (
                  <div key={idx} className="bg-gray-800/50 rounded p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">{entity.name}</span>
                      <span className="text-xs text-gray-500">{entity.type}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {entity.mentions} mention{entity.mentions !== 1 ? 's' : ''} across{' '}
                      {entity.documents.length} document{entity.documents.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.relationships && result.relationships.length > 0 && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-3">Relationships</div>
              <div className="space-y-2">
                {result.relationships.slice(0, 8).map((rel, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-blue-400">{rel.from}</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-gray-400 text-xs">{rel.type}</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-green-400">{rel.to}</span>
                    <div className="ml-auto">
                      <div
                        className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden"
                        title={`Strength: ${(rel.strength * 100).toFixed(0)}%`}
                      >
                        <div
                          className="h-full bg-purple-500"
                          style={{ width: `${rel.strength * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.contradictions && result.contradictions.length > 0 && (
            <div className="bg-gray-900/50 rounded-lg p-4 border border-yellow-800/30">
              <div className="text-sm text-yellow-400 mb-2">Contradictions Found</div>
              <ul className="space-y-2">
                {result.contradictions.map((contradiction, idx) => (
                  <li key={idx} className="text-yellow-300 text-sm flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">⚠</span>
                    <span>{contradiction}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
