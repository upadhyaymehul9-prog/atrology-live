import { getYogaCatalog } from '../lib/yogas';
import type { YogaId } from '../types';

interface YogaFilterProps {
  value: YogaId | 'all' | 'any-dosha';
  onChange: (value: YogaId | 'all' | 'any-dosha') => void;
  counts: Record<string, number>;
}

export function YogaFilter({ value, onChange, counts }: YogaFilterProps) {
  const catalog = getYogaCatalog();

  return (
    <div className="yoga-filter">
      <label htmlFor="yoga-select">Filter by Yoga / Dosh</label>
      <select
        id="yoga-select"
        value={value}
        onChange={(e) => onChange(e.target.value as YogaId | 'all' | 'any-dosha')}
      >
        <option value="all">All Yogas ({counts.all ?? 0} people)</option>
        <option value="any-dosha">Any Dosha ({counts['any-dosha'] ?? 0} people)</option>
        {catalog.map((y) => (
          <option key={y.id} value={y.id}>
            {y.name} ({counts[y.id] ?? 0})
          </option>
        ))}
      </select>
    </div>
  );
}
