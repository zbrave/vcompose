import type { PresetImageKey } from '../../store/types';

const PRESETS: { key: PresetImageKey; label: string; icon: string }[] = [
  { key: 'nginx', label: 'Nginx', icon: '🌐' },
  { key: 'postgres', label: 'PostgreSQL', icon: '🐘' },
  { key: 'redis', label: 'Redis', icon: '⚡' },
  { key: 'node', label: 'Node.js', icon: '💚' },
  { key: 'custom', label: 'Custom', icon: '📦' },
];

export function NodePalette() {
  const onDragStart = (e: React.DragEvent, preset: PresetImageKey) => {
    e.dataTransfer.setData('application/vdc-preset', preset);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="flex flex-col gap-2">
      {PRESETS.map((p) => (
        <div
          key={p.key}
          draggable
          onDragStart={(e) => onDragStart(e, p.key)}
          className="flex cursor-grab items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 transition-colors hover:border-blue-500 hover:bg-gray-750 active:cursor-grabbing"
        >
          <span className="text-lg">{p.icon}</span>
          <span>{p.label}</span>
        </div>
      ))}
    </div>
  );
}
