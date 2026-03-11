import { useRef, useState } from 'react';
import { useDockerHubSearch } from '../../hooks/useDockerHubSearch';

interface Props {
  value: string;
  disabled?: boolean;
  className: string;
  onChange: (value: string) => void;
}

export function ImageSearchInput({ value, disabled, className, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { results, isLoading } = useDockerHubSearch(value);

  const showDropdown = open && results.length > 0;

  const select = (name: string) => {
    onChange(name);
    setOpen(false);
    setActiveIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (i < results.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (i > 0 ? i - 1 : results.length - 1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      select(results[activeIdx].name);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        className={className}
        value={value}
        disabled={disabled}
        placeholder="Search Docker Hub..."
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIdx(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        onKeyDown={handleKeyDown}
        data-testid="image-input"
      />
      {isLoading && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">...</span>
      )}
      {showDropdown && (
        <ul
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded border border-gray-600 bg-gray-800 shadow-lg"
          data-testid="dockerhub-dropdown"
        >
          {results.map((r, i) => (
            <li
              key={r.name}
              className={`cursor-pointer px-2 py-1.5 text-sm ${
                i === activeIdx ? 'bg-blue-600 text-white' : 'text-gray-200 hover:bg-gray-700'
              }`}
              onMouseDown={() => select(r.name)}
            >
              <div className="flex items-center gap-1">
                <span className="font-medium">{r.name}</span>
                {r.isOfficial && (
                  <span className="rounded bg-blue-500/20 px-1 text-[10px] text-blue-400">official</span>
                )}
                <span className="ml-auto text-xs text-gray-500">{r.starCount.toLocaleString()}</span>
              </div>
              {r.description && (
                <p className="truncate text-xs text-gray-500">{r.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
