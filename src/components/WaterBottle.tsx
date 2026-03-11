import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

interface WaterBottleProps {
  waterOz: number;
  onChange: (oz: number) => void;
}

const INCREMENT_OPTIONS = [8, 12, 16, 20, 24, 32] as const;

export default function WaterBottle({ waterOz, onChange }: WaterBottleProps) {
  const [increment, setIncrement] = useState<number>(16);
  const fillPct = Math.min(waterOz / 128, 1);
  const targetMet = waterOz >= 128;

  function add() {
    onChange(waterOz + increment);
  }

  function remove() {
    onChange(Math.max(0, waterOz - increment));
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      {/* Increment selector */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {INCREMENT_OPTIONS.map((oz) => (
          <button
            key={oz}
            type="button"
            onClick={() => setIncrement(oz)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              increment === oz
                ? 'bg-blue-500 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
            }`}
          >
            {oz}oz
          </button>
        ))}
      </div>

      {/* Bottle SVG */}
      <div className="relative flex items-end justify-center" style={{ width: 100, height: 200 }}>
        <svg viewBox="0 0 100 200" width={100} height={200}>
          {/* Bottle outline */}
          <rect x="15" y="40" width="70" height="150" rx="10" ry="10"
            fill="none" stroke="#334155" strokeWidth="2" />
          {/* Bottle neck */}
          <rect x="35" y="10" width="30" height="35" rx="4" ry="4"
            fill="none" stroke="#334155" strokeWidth="2" />

          {/* Water fill (fills from bottom) */}
          <clipPath id="bottleClip">
            <rect x="16" y="41" width="68" height="148" rx="9" ry="9" />
          </clipPath>
          <rect
            x="16"
            y={41 + 148 * (1 - fillPct)}
            width="68"
            height={148 * fillPct}
            rx="0"
            fill="#3b82f6"
            opacity="0.7"
            clipPath="url(#bottleClip)"
            className="transition-all duration-300"
          />

          {/* Target line at 128 oz (top of fill area) */}
          <line x1="10" y1="41" x2="90" y2="41" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x="93" y="44" fontSize="8" fill="#22c55e" textAnchor="start">128</text>
        </svg>
      </div>

      {/* Current / target display */}
      <p className={`text-center text-lg font-bold ${targetMet ? 'text-red-400' : 'text-blue-400'}`}>
        {waterOz} <span className="text-neutral-400 font-normal text-sm">/ 128 oz</span>
      </p>

      {/* +/- buttons */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={remove}
          disabled={waterOz <= 0}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-800 bg-neutral-800/60 text-neutral-400 transition hover:bg-neutral-700 hover:text-white disabled:opacity-30"
          aria-label={`Remove ${increment} oz`}
        >
          <Minus size={20} />
        </button>

        <span className="min-w-[3rem] text-center text-sm text-neutral-400">
          {increment}oz
        </span>

        <button
          type="button"
          onClick={add}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white transition hover:bg-blue-400"
          aria-label={`Add ${increment} oz`}
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}
