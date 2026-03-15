import { useState } from 'react';
import { NodePalette } from './NodePalette';
import { NetworkPanel } from './NetworkPanel';
import { AISidebar } from './AISidebar';

export function SidebarTabs() {
  const [activeTab, setActiveTab] = useState<'services' | 'ai'>('services');

  return (
    <div className="flex h-full flex-col overflow-x-hidden">
      <div className="mb-4 flex border-b border-gray-700">
        <button
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'services'
              ? 'border-b-2 border-blue-500 text-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('services')}
        >
          Services
        </button>
        <button
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'ai'
              ? 'border-b-2 border-purple-500 text-purple-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('ai')}
        >
          AI
        </button>
      </div>

      {activeTab === 'services' ? (
        <>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Services
          </h2>
          <NodePalette />
          <div className="mt-6 border-t border-gray-800 pt-4">
            <NetworkPanel />
          </div>
        </>
      ) : (
        <AISidebar />
      )}
    </div>
  );
}
