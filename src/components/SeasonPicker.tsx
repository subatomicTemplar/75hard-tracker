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
        className="appearance-none rounded-lg border border-slate-700 bg-slate-800 py-2 pl-3 pr-9 text-sm font-medium text-slate-50 transition focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
      >
        {seasons.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}
