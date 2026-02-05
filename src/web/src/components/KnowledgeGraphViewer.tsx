import { useState, useEffect } from 'react';
import { Network, Loader2, AlertCircle, Info } from 'lucide-react';
import { apiUrl } from '../utils/api';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  category?: string;
  data?: Record<string, unknown>;
}

interface GraphEdge {
  from: string;
  to: string;
  type: string;
  strength: number;
}

interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface KnowledgeGraphStats {
  totalNodes: number;
  totalEdges: number;
  documentTypes: number;
  patterns: number;
}

export default function KnowledgeGraphViewer() {
  const [isLoading, setIsLoading] = useState(false);
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [stats, setStats] = useState<KnowledgeGraphStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const fetchGraph = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl('/api/knowledge-graph'));
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch knowledge graph');
      }

      setGraphData(data.graph);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch knowledge graph');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'document_type':
        return 'bg-blue-600';
      case 'pattern':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Knowledge Graph</h3>
        </div>
        <button
          onClick={fetchGraph}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Network className="w-4 h-4" />
              Refresh Graph
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

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-white">{stats.totalNodes}</div>
            <div className="text-xs text-gray-400">Total Nodes</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-white">{stats.totalEdges}</div>
            <div className="text-xs text-gray-400">Connections</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-white">{stats.documentTypes}</div>
            <div className="text-xs text-gray-400">Document Types</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-white">{stats.patterns}</div>
            <div className="text-xs text-gray-400">Patterns</div>
          </div>
        </div>
      )}

      {graphData && graphData.nodes.length > 0 ? (
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-auto">
            <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Simplified graph view - nodes and relationships
            </div>
            
            {/* Simplified node list view */}
            <div className="space-y-2">
              {graphData.nodes.slice(0, 20).map((node) => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    selectedNode?.id === node.id
                      ? 'bg-gray-700 border border-green-500'
                      : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getNodeColor(node.type)}`} />
                    <span className="text-white font-medium">{node.label}</span>
                    <span className="text-xs text-gray-500 ml-auto">{node.type}</span>
                  </div>
                  {node.category && (
                    <div className="text-xs text-gray-400 mt-1 ml-5">{node.category}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {selectedNode && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-2">Node Details</div>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-500 text-sm">ID:</span>
                  <span className="text-white ml-2 font-mono text-sm">{selectedNode.id}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Label:</span>
                  <span className="text-white ml-2">{selectedNode.label}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Type:</span>
                  <span className="text-white ml-2">{selectedNode.type}</span>
                </div>
                {selectedNode.category && (
                  <div>
                    <span className="text-gray-500 text-sm">Category:</span>
                    <span className="text-white ml-2">{selectedNode.category}</span>
                  </div>
                )}
              </div>

              {/* Show connected edges */}
              <div className="mt-4">
                <div className="text-sm text-gray-400 mb-2">Connections</div>
                <div className="space-y-1">
                  {graphData.edges
                    .filter((e) => e.from === selectedNode.id || e.to === selectedNode.id)
                    .slice(0, 5)
                    .map((edge, idx) => (
                      <div
                        key={idx}
                        className="text-sm bg-gray-800/50 rounded p-2 flex items-center gap-2"
                      >
                        <span className="text-blue-400">
                          {edge.from === selectedNode.id ? edge.to : edge.from}
                        </span>
                        <span className="text-gray-500 text-xs">({edge.type})</span>
                        <div
                          className="ml-auto w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden"
                          title={`Strength: ${(edge.strength * 100).toFixed(0)}%`}
                        >
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${edge.strength * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-300">
                This is a simplified view of your knowledge graph. In a production environment,
                consider integrating a proper graph visualization library like D3.js, vis.js, or Cytoscape
                for interactive network diagrams.
              </div>
            </div>
          </div>
        </div>
      ) : (
        !isLoading && (
          <div className="text-center py-12 text-gray-500">
            <Network className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No knowledge graph data available</p>
            <p className="text-sm mt-2">
              Start synthesizing documents to build your knowledge graph
            </p>
          </div>
        )
      )}
    </div>
  );
}
