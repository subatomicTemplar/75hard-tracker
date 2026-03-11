import { useMemo } from 'react';

interface ComplianceBarrelProps {
  percentage: number; // 0-100+
}

export default function ComplianceBarrel({ percentage }: ComplianceBarrelProps) {
  const isOverflowing = percentage > 100;
  const fillPct = Math.min(percentage, 100);
  const displayPct = percentage;

  // Barrel dimensions
  const W = 28;
  const H = 34;
  const barrelTop = 2;
  const barrelBottom = H - 2;
  const barrelHeight = barrelBottom - barrelTop;

  // Liquid top Y position (higher = more filled)
  const liquidTopY = barrelBottom - (barrelHeight * fillPct) / 100;

  // Unique id for clip path per instance
  const clipId = useMemo(() => `barrel-clip-${Math.random().toString(36).slice(2, 8)}`, []);

  return (
    <div className="group relative flex items-center gap-1.5" title="Compliance">
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="barrel-svg shrink-0"
        aria-hidden="true"
      >
        <defs>
          {/* Clip to barrel interior shape */}
          <clipPath id={clipId}>
            <path d={`M 3,${barrelTop} Q ${W / 2},-1 ${W - 3},${barrelTop} L ${W - 2},${barrelBottom} Q ${W / 2},${H + 1} 2,${barrelBottom} Z`} />
          </clipPath>

          {/* Red glow filter */}
          <filter id={`${clipId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Barrel outline – open top */}
        <path
          d={`M 2,${barrelTop} Q ${W / 2},-1 ${W - 2},${barrelTop} L ${W - 2},${barrelBottom} Q ${W / 2},${H + 1} 2,${barrelBottom} Z`}
          fill="none"
          stroke="#666"
          strokeWidth="1.2"
        />
        {/* Barrel bands */}
        <line x1="2" y1={barrelTop + barrelHeight * 0.25} x2={W - 2} y2={barrelTop + barrelHeight * 0.25} stroke="#555" strokeWidth="0.6" />
        <line x1="2" y1={barrelTop + barrelHeight * 0.75} x2={W - 2} y2={barrelTop + barrelHeight * 0.75} stroke="#555" strokeWidth="0.6" />

        {/* Liquid fill */}
        {fillPct > 0 && (
          <g clipPath={`url(#${clipId})`}>
            {/* Liquid body */}
            <rect
              x="0"
              y={liquidTopY}
              width={W}
              height={barrelBottom - liquidTopY + 4}
              className="barrel-liquid"
              filter={`url(#${clipId}-glow)`}
            />
            {/* Sloshing wave surface */}
            <path
              d={`M 0,${liquidTopY} Q 7,${liquidTopY - 2} 14,${liquidTopY} T 28,${liquidTopY}`}
              className="barrel-wave"
              filter={`url(#${clipId}-glow)`}
            />
            <path
              d={`M 0,${liquidTopY + 0.5} Q 7,${liquidTopY + 2} 14,${liquidTopY + 0.5} T 28,${liquidTopY + 0.5}`}
              className="barrel-wave barrel-wave-2"
              filter={`url(#${clipId}-glow)`}
            />
          </g>
        )}

        {/* Overflow drips */}
        {isOverflowing && (
          <>
            <circle cx="6" cy="1" r="1.2" className="barrel-drip barrel-drip-1" />
            <circle cx="14" cy="0" r="1" className="barrel-drip barrel-drip-2" />
            <circle cx="22" cy="1.5" r="1.1" className="barrel-drip barrel-drip-3" />
            {/* Overflow puddle glow at top */}
            <ellipse cx={W / 2} cy={barrelTop - 0.5} rx="10" ry="2" className="barrel-overflow-glow" />
          </>
        )}
      </svg>

      <span
        className={`text-xs font-bold tabular-nums ${
          isOverflowing
            ? 'text-red-400 barrel-overflow-text'
            : fillPct >= 80
              ? 'text-red-400'
              : fillPct >= 50
                ? 'text-yellow-400'
                : 'text-neutral-400'
        }`}
      >
        {displayPct}%
      </span>
    </div>
  );
}
