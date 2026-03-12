import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isToday,
} from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useSeasons } from '../hooks/useSeasons';
import { useUserEntries } from '../hooks/useUserEntries';
import type { DailyEntry } from '../types';

function getCompletionPct(e: DailyEntry): number {
  let done = 0;
  if (e.water_oz >= 128) done++;
  if (!!e.workout1_type && e.workout1_duration_min !== null && e.workout1_duration_min >= 45) done++;
  if (!!e.workout2_type && e.workout2_duration_min !== null && e.workout2_duration_min >= 45) done++;
  if (e.workout1_outdoor || e.workout2_outdoor) done++;
  if (e.pages_read >= 10) done++;
  if (e.diet_followed) done++;
  if (!!e.photo_url) done++;
  return Math.round((done / 7) * 100);
}

export default function CalendarDropdown() {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date());
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { user } = useAuth();
  const { seasons } = useSeasons();
  const currentSeason = useMemo(
    () => seasons.find((s) => s.is_current) ?? seasons[0] ?? null,
    [seasons],
  );

  const { entries } = useUserEntries(user?.id, currentSeason?.id);

  // Map entry_date -> entry for quick lookup
  const entryMap = useMemo(() => {
    const map = new Map<string, DailyEntry>();
    for (const e of entries) {
      map.set(e.entry_date, e);
    }
    return map;
  }, [entries]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Build calendar grid
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  let cursor = calStart;
  while (cursor <= calEnd) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-50"
        aria-label="Calendar"
      >
        <CalendarDays size={20} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-[60] w-[320px] rounded-xl border border-slate-700 bg-slate-800 p-3 shadow-xl">
          {/* Month navigation */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-50"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-slate-50">
              {format(viewMonth, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-medium text-slate-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-[2px]">
            {weeks.flat().map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const inMonth = isSameMonth(day, viewMonth);
              const today = isToday(day);
              const entry = entryMap.get(dateStr);
              const pct = entry ? getCompletionPct(entry) : null;
              const complete = pct === 100;

              return (
                <button
                  type="button"
                  key={dateStr}
                  onClick={() => {
                    navigate(`/?date=${dateStr}`);
                    setOpen(false);
                  }}
                  className={`relative flex flex-col items-center justify-start rounded-lg py-1 text-[11px] leading-tight cursor-pointer transition hover:bg-slate-600/50 ${
                    !inMonth ? 'opacity-30' : ''
                  } ${
                    today
                      ? 'ring-2 ring-green-500 bg-slate-700/60'
                      : 'bg-slate-700/20'
                  }`}
                  style={{ minHeight: '40px' }}
                >
                  {/* Day number */}
                  <span
                    className={`font-medium ${
                      today ? 'text-green-400' : 'text-slate-300'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>

                  {/* Completion percentage */}
                  {pct !== null && inMonth && (
                    <span
                      className={`text-[9px] font-semibold ${
                        complete
                          ? 'text-green-400'
                          : pct > 0
                            ? 'text-yellow-400'
                            : 'text-slate-500'
                      }`}
                    >
                      {pct}%
                    </span>
                  )}

                  {/* Completed day checkmark badge */}
                  {complete && inMonth && (
                    <div className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-500">
                      <Check size={9} className="text-slate-900" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
