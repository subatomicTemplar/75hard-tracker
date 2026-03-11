import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';

interface DateNavigatorProps {
  date: string;
  seasonStartDate: string;
  seasonEndDate: string;
  onChange: (date: string) => void;
}

export default function DateNavigator({ date, seasonStartDate, seasonEndDate, onChange }: DateNavigatorProps) {
  const current = parseISO(date);
  const start = parseISO(seasonStartDate);
  const end = parseISO(seasonEndDate);

  const dayNumber = differenceInDays(current, start) + 1;
  const totalDays = differenceInDays(end, start) + 1;
  const progressPct = Math.min((dayNumber / 75) * 100, 100);

  const canGoBack = date > seasonStartDate;
  const canGoForward = date < seasonEndDate;

  function navigate(delta: number) {
    const next = addDays(current, delta);
    const nextStr = format(next, 'yyyy-MM-dd');

    if (nextStr < seasonStartDate) {
      onChange(seasonStartDate);
    } else if (nextStr > seasonEndDate) {
      onChange(seasonEndDate);
    } else {
      onChange(nextStr);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={!canGoBack}
          onClick={() => navigate(-1)}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
          aria-label="Previous day"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="text-center">
          <p className="text-lg font-semibold text-slate-50">
            {format(current, 'MMMM d, yyyy')}
          </p>
          <p className="text-sm text-slate-400">
            Day {dayNumber} of {Math.min(totalDays, 75)}
          </p>
        </div>

        <button
          type="button"
          disabled={!canGoForward}
          onClick={() => navigate(1)}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
          aria-label="Next day"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}
