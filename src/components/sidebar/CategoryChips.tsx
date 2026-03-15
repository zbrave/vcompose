// src/components/sidebar/CategoryChips.tsx
import { CATEGORIES } from '../../data/categories';
import type { ServiceCategory } from '../../data/types';

interface CategoryChipsProps {
  selected: ServiceCategory | null;
  onChange: (category: ServiceCategory | null) => void;
}

export function CategoryChips({ selected, onChange }: CategoryChipsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-2">
      <button
        onClick={() => onChange(null)}
        className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
          selected === null
            ? 'bg-blue-600 text-white'
            : 'bg-gray-800 text-gray-400 hover:text-gray-200'
        }`}
      >
        All
      </button>
      {CATEGORIES.map(cat => (
        <button
          key={cat.key}
          onClick={() => onChange(selected === cat.key ? null : cat.key)}
          className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
            selected === cat.key
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          {cat.icon} {cat.label}
        </button>
      ))}
    </div>
  );
}
