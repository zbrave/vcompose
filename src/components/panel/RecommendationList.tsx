import { useStore } from '../../store';
import { getRecommendations } from '../../lib/recommendation-engine';
import { calculateRecommendedPosition } from '../../lib/position-calculator';
import graph from '../../data/recommendation-graph.json';
import type { RecommendationGraph } from '../../lib/recommendation-types';

export function RecommendationList() {
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const nodes = useStore((s) => s.nodes);
  const addRecommendedNode = useStore((s) => s.addRecommendedNode);

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const existingNodes = nodes.map((n) => ({ preset: n.data.preset, image: n.data.image }));
  const recommendations = getRecommendations(
    node.data,
    existingNodes,
    graph as RecommendationGraph,
  );

  if (recommendations.length === 0) return null;

  const handleAdd = (key: string, index: number) => {
    const existingPositions = nodes.map((n) => n.position);
    const position = calculateRecommendedPosition(node.position, existingPositions, index);
    addRecommendedNode(key, node.id, position);
  };

  return (
    <div className="mt-4 border-t border-gray-700 pt-4">
      <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
        Recommended Services
      </h4>
      <div className="space-y-2">
        {recommendations.map((rec, idx) => (
          <div
            key={rec.key}
            className="flex items-center justify-between rounded border border-gray-700 bg-gray-800/50 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm text-gray-200">{rec.image}</span>
              <span className="text-xs text-gray-500">{rec.reason}</span>
            </div>
            <button
              disabled={rec.alreadyExists}
              onClick={() => handleAdd(rec.key, idx)}
              className={`ml-2 shrink-0 rounded px-2 py-1 text-xs transition-colors ${
                rec.alreadyExists
                  ? 'cursor-not-allowed bg-gray-700 text-gray-500'
                  : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              {rec.alreadyExists ? 'Added' : '+ Add'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
