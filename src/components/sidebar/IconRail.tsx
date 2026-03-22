import { Layers, Package, Bot, Network, Import } from 'lucide-react';

interface IconRailProps {
  activePanel: string | null;
  onPanelChange: (panel: string | null) => void;
  onImportClick: () => void;
}

interface RailButtonProps {
  icon: React.ReactNode;
  panel: string;
  label: string;
  activePanel: string | null;
  onClick: (panel: string) => void;
  testId: string;
}

function RailButton({ icon, panel, label, activePanel, onClick, testId }: RailButtonProps) {
  const isActive = activePanel === panel;

  return (
    <button
      data-testid={testId}
      title={label}
      onClick={() => onClick(panel)}
      className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-colors relative ${
        isActive
          ? 'bg-accent/10 text-accent'
          : 'text-text-muted hover:text-text-primary'
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent rounded-r" />
      )}
      {icon}
    </button>
  );
}

export function IconRail({ activePanel, onPanelChange, onImportClick }: IconRailProps) {
  const handleClick = (panel: string) => {
    if (activePanel === panel) {
      onPanelChange(null);
    } else {
      onPanelChange(panel);
    }
  };

  return (
    <div className="flex flex-col h-full w-12 py-2 bg-surface border-r border-subtle">
      {/* Top section */}
      <div className="flex flex-col gap-1">
        <RailButton
          icon={<Layers size={20} />}
          panel="stacks"
          label="Stacks"
          activePanel={activePanel}
          onClick={handleClick}
          testId="rail-stacks"
        />
        <RailButton
          icon={<Package size={20} />}
          panel="marketplace"
          label="Marketplace"
          activePanel={activePanel}
          onClick={handleClick}
          testId="rail-marketplace"
        />
        <RailButton
          icon={<Bot size={20} />}
          panel="ai"
          label="AI"
          activePanel={activePanel}
          onClick={handleClick}
          testId="rail-ai"
        />
      </div>

      {/* Separator */}
      <div
        className="mx-3 my-2 h-px"
        style={{ backgroundColor: 'var(--border-subtle)' }}
      />

      {/* Bottom section */}
      <div className="flex flex-col gap-1 mt-auto">
        <RailButton
          icon={<Network size={20} />}
          panel="networks"
          label="Networks"
          activePanel={activePanel}
          onClick={handleClick}
          testId="rail-networks"
        />
        <button
          data-testid="import-btn"
          title="Import"
          onClick={onImportClick}
          className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary transition-colors relative"
        >
          <Import size={20} />
        </button>
      </div>
    </div>
  );
}
