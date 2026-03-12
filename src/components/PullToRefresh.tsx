import { useState, useRef, useCallback, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 80;

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
}

export default function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0 && !refreshing) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, [refreshing]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.4, 120));
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      if (onRefresh) {
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setTimeout(() => window.location.reload(), 300);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh]);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-150"
        style={{ height: pullDistance > 10 ? pullDistance : 0 }}
      >
        <RefreshCw
          size={20}
          className={`text-neutral-400 transition-transform ${
            refreshing ? 'animate-spin' : ''
          }`}
          style={{
            transform: refreshing
              ? undefined
              : `rotate(${(pullDistance / THRESHOLD) * 360}deg)`,
            opacity: Math.min(pullDistance / THRESHOLD, 1),
          }}
        />
      </div>
      {children}
    </div>
  );
}
