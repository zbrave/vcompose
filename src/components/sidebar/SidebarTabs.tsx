// src/components/sidebar/SidebarTabs.tsx
import { useState } from 'react';
import { StacksPanel } from './StacksPanel';
import { MarketplacePanel } from './MarketplacePanel';
import { AISidebar } from './AISidebar';

type TabKey = 'stacks' | 'marketplace' | 'ai';

const TAB_ACTIVE_CLASSES: Record<TabKey, string> = {
  stacks: 'text-purple-400 border-b-2 border-purple-400',
  marketplace: 'text-blue-400 border-b-2 border-blue-400',
  ai: 'text-green-400 border-b-2 border-green-400',
};

const TABS: { key: TabKey; label: string }[] = [
  { key: 'stacks', label: 'Stacks' },
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'ai', label: 'AI' },
];

export function SidebarTabs() {
  const [active, setActive] = useState<TabKey>('stacks');

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-gray-700">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              active === tab.key
                ? TAB_ACTIVE_CLASSES[tab.key]
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {active === 'stacks' && <StacksPanel />}
        {active === 'marketplace' && <MarketplacePanel />}
        {active === 'ai' && <AISidebar />}
      </div>
    </div>
  );
}
