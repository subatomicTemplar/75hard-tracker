import type { DailyEntry, Profile } from '../types';

/** Check if a single entry meets full 75 Hard completion for the day */
export function isEntryFullyComplete(e: DailyEntry): boolean {
  const hasWeight = e.weight_lbs !== null && e.weight_lbs > 0;
  const hasPhoto = !!e.photo_url;
  const waterOk = e.water_oz >= 128;
  const w1Ok = !!e.workout1_type;
  const w2Ok = !!e.workout2_type;
  const outdoorOk = e.workout1_outdoor || e.workout2_outdoor;
  const pagesOk = e.pages_read >= 10;
  const dietOk = e.diet_followed;
  return hasWeight && hasPhoto && waterOk && w1Ok && w2Ok && outdoorOk && pagesOk && dietOk;
}

/** Check if ALL members have fully complete entries for a given date */
export function isFullCombo(profiles: Profile[], entries: DailyEntry[]): boolean {
  if (profiles.length === 0) return false;
  return profiles.every((p) => {
    const entry = entries.find((e) => e.user_id === p.id);
    return entry ? isEntryFullyComplete(entry) : false;
  });
}

/** localStorage key for tracking seen combo celebrations */
export function comboSeenKey(seasonId: string, date: string): string {
  return `combo_seen_${seasonId}_${date}`;
}
