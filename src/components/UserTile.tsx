import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Droplets,
  Dumbbell,
  BookOpen,
  Salad,
  Camera,
  TreePine,
} from 'lucide-react';
import type { Profile, DailyEntry } from '../types';
import UserAnalytics from './UserAnalytics';

interface UserTileProps {
  profile: Profile;
  entry: DailyEntry | null;
  seasonId: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function isComplete(e: DailyEntry): boolean {
  const waterOk = e.water_oz >= 128;
  const w1Ok =
    !!e.workout1_type && e.workout1_duration_min !== null && e.workout1_duration_min >= 45;
  const w2Ok =
    !!e.workout2_type && e.workout2_duration_min !== null && e.workout2_duration_min >= 45;
  const outdoorOk = e.workout1_outdoor || e.workout2_outdoor;
  const pagesOk = e.pages_read >= 10;
  const dietOk = e.diet_followed;
  const photoOk = !!e.photo_url;
  return waterOk && w1Ok && w2Ok && outdoorOk && pagesOk && dietOk && photoOk;
}

function isPartial(e: DailyEntry): boolean {
  return (
    e.water_oz > 0 ||
    !!e.workout1_type ||
    !!e.workout2_type ||
    e.pages_read > 0 ||
    e.diet_followed ||
    !!e.photo_url
  );
}

function borderColor(entry: DailyEntry | null): string {
  if (!entry) return 'border-slate-700';
  if (isComplete(entry)) return 'border-green-500';
  if (isPartial(entry)) return 'border-yellow-500';
  return 'border-slate-700';
}

function workoutSummary(
  type: string | null,
  duration: number | null,
  outdoor: boolean,
): string {
  if (!type) return 'Not logged';
  const parts = [type];
  if (duration !== null) parts.push(`${duration}min`);
  if (outdoor) parts.push('(outdoor)');
  return parts.join(' ');
}

export default function UserTile({ profile, entry, seasonId }: UserTileProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`overflow-hidden rounded-xl border-2 bg-slate-800 ${borderColor(entry)}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-slate-50">
            {getInitials(profile.display_name)}
          </div>
        )}
        <span className="text-lg font-semibold text-slate-50">{profile.display_name}</span>
      </div>

      {/* Photo */}
      <div className="px-4 py-2">
        {entry?.photo_url ? (
          <img
            src={entry.photo_url}
            alt="Progress"
            className="h-48 w-full rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-48 w-full items-center justify-center rounded-lg bg-slate-700/50">
            <Camera size={32} className="text-slate-600" />
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 px-4 py-2">
        {/* Weight */}
        <Stat
          icon={<Dumbbell size={16} className="text-slate-400" />}
          label="Weight"
          value={entry?.weight_lbs ? `${entry.weight_lbs} lbs` : '--'}
        />

        {/* Water */}
        <Stat
          icon={<Droplets size={16} className="text-blue-500" />}
          label="Water"
          value={`${entry?.water_oz ?? 0} / 128 oz`}
          highlight={entry ? entry.water_oz >= 128 : false}
        />

        {/* Workout 1 */}
        <Stat
          icon={
            <span className="flex items-center gap-0.5">
              <Dumbbell size={16} className="text-slate-400" />
              {entry?.workout1_outdoor && <TreePine size={12} className="text-green-500" />}
            </span>
          }
          label="Workout 1"
          value={workoutSummary(
            entry?.workout1_type ?? null,
            entry?.workout1_duration_min ?? null,
            entry?.workout1_outdoor ?? false,
          )}
        />

        {/* Workout 2 */}
        <Stat
          icon={
            <span className="flex items-center gap-0.5">
              <Dumbbell size={16} className="text-slate-400" />
              {entry?.workout2_outdoor && <TreePine size={12} className="text-green-500" />}
            </span>
          }
          label="Workout 2"
          value={workoutSummary(
            entry?.workout2_type ?? null,
            entry?.workout2_duration_min ?? null,
            entry?.workout2_outdoor ?? false,
          )}
        />

        {/* Pages */}
        <Stat
          icon={<BookOpen size={16} className="text-slate-400" />}
          label="Reading"
          value={`${entry?.pages_read ?? 0} pages`}
          highlight={entry ? entry.pages_read >= 10 : false}
        />

        {/* Diet */}
        <Stat
          icon={<Salad size={16} className="text-slate-400" />}
          label="Diet"
          value={entry?.diet_followed ? 'Followed' : 'Not followed'}
          highlight={entry?.diet_followed ?? false}
        />
      </div>

      {/* Analytics toggle */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-center justify-center gap-1 border-t border-slate-700 py-2.5 text-sm text-slate-400 transition hover:bg-slate-700/40 hover:text-slate-50"
      >
        {expanded ? (
          <>
            Hide Analytics <ChevronUp size={16} />
          </>
        ) : (
          <>
            Show Analytics <ChevronDown size={16} />
          </>
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-700 p-4">
          <UserAnalytics userId={profile.id} seasonId={seasonId} />
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg bg-slate-700/40 px-3 py-2">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className={`mt-0.5 text-sm font-medium ${highlight ? 'text-green-400' : 'text-slate-50'}`}>
        {value}
      </p>
    </div>
  );
}
