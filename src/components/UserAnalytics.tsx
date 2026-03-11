import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { useUserEntries } from '../hooks/useUserEntries';

interface UserAnalyticsProps {
  userId: string;
  seasonId: string;
}

const CHART_HEIGHT = 250;
const PIE_COLORS = [
  '#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7',
  '#f97316', '#06b6d4', '#ec4899', '#14b8a6', '#6366f1',
  '#84cc16', '#f43f5e', '#8b5cf6',
];

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-[250px] animate-pulse rounded-lg bg-slate-700/40" />
      ))}
    </div>
  );
}

function formatDateLabel(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'M/d');
  } catch {
    return dateStr;
  }
}

export default function UserAnalytics({ userId, seasonId }: UserAnalyticsProps) {
  const { entries, loading, error } = useUserEntries(userId, seasonId);

  // Weight data (skip null weights)
  const weightData = useMemo(
    () =>
      entries
        .filter((e) => e.weight_lbs !== null)
        .map((e) => ({ date: e.entry_date, weight: e.weight_lbs })),
    [entries],
  );

  // Water data
  const waterData = useMemo(
    () =>
      entries.map((e) => ({
        date: e.entry_date,
        water: e.water_oz,
        fill: e.water_oz >= 128 ? '#22c55e' : '#eab308',
      })),
    [entries],
  );

  // Pages data
  const pagesData = useMemo(
    () =>
      entries.map((e) => ({
        date: e.entry_date,
        pages: e.pages_read,
      })),
    [entries],
  );

  // Workout type breakdown
  const workoutPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entries) {
      if (e.workout1_type) counts[e.workout1_type] = (counts[e.workout1_type] || 0) + 1;
      if (e.workout2_type) counts[e.workout2_type] = (counts[e.workout2_type] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [entries]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <p className="text-sm text-red-400">Error loading analytics: {error}</p>;
  if (entries.length === 0)
    return <p className="text-sm text-slate-400">No entries yet for this season.</p>;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Weight Over Time */}
      <div className="rounded-lg bg-slate-800 p-3">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Weight Over Time
        </h4>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <LineChart data={weightData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tickFormatter={formatDateLabel} tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelFormatter={(v) => formatDateLabel(String(v))}
            />
            <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Water Per Day */}
      <div className="rounded-lg bg-slate-800 p-3">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Water Per Day
        </h4>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={waterData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tickFormatter={formatDateLabel} tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelFormatter={(v) => formatDateLabel(String(v))}
            />
            <ReferenceLine y={128} stroke="#22c55e" strokeDasharray="4 2" label={{ value: '128oz', fill: '#22c55e', fontSize: 10 }} />
            <Bar dataKey="water" radius={[4, 4, 0, 0]}>
              {waterData.map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pages Read Per Day */}
      <div className="rounded-lg bg-slate-800 p-3">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Pages Read Per Day
        </h4>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={pagesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tickFormatter={formatDateLabel} tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelFormatter={(v) => formatDateLabel(String(v))}
            />
            <ReferenceLine y={10} stroke="#22c55e" strokeDasharray="4 2" label={{ value: '10pg', fill: '#22c55e', fontSize: 10 }} />
            <Bar dataKey="pages" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Workout Types Breakdown */}
      <div className="rounded-lg bg-slate-800 p-3">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Workout Types
        </h4>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <PieChart>
            <Pie
              data={workoutPieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={false}
              fontSize={10}
            >
              {workoutPieData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            />
            <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
