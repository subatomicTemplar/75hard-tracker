import { ChevronDown } from 'lucide-react';
import type { Season } from '../types';

interface SeasonPickerProps {
  seasons: Season[];
  selectedSeasonId: string;
  onChange: (id: string) => void;
}

export default function SeasonPicker({ seasons, selectedSeasonId, onChange }: SeasonPickerProps) {
  return (
    <div className="relative inline-block">
      <select
        value={selectedSeasonId}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-neutral-800 bg-neutral-900 py-2 pl-3 pr-9 text-sm font-medium text-white transition focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
      >
        {seasons.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
      />
    </div>
  );
}
