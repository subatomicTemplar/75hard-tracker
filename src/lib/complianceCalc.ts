import type { DailyEntry } from '../types';
import { differenceInCalendarDays, parseISO, min as dateMin } from 'date-fns';

/**
 * Calculate overall compliance percentage for a user across a season.
 *
 * Categories (equally weighted):
 *   Water  – cumulative, overage at 50% value
 *   Pages  – cumulative, overage at 50% value
 *   Workouts – binary per day (can't make up)
 *   Photo  – binary per day (can't make up)
 *
 * Overage rule: On any day where a stat exceeds its goal, the excess
 * counts at half value toward the running total.
 */
export function calcCompliance(
  entries: DailyEntry[],
  seasonStartDate: string,
): number {
  const today = new Date();
  const start = parseISO(seasonStartDate);
  const effectiveEnd = dateMin([today, parseISO('2099-12-31')]); // clamp to today
  const daysElapsed = differenceInCalendarDays(effectiveEnd, start) + 1;

  if (daysElapsed <= 0) return 0;

  const WATER_TARGET = 128;
  const PAGES_TARGET = 10;

  let effectiveWater = 0;
  let effectivePages = 0;
  let workoutScore = 0;
  let photoScore = 0;

  for (const e of entries) {
    // Water – overage at half
    if (e.water_oz <= WATER_TARGET) {
      effectiveWater += e.water_oz;
    } else {
      effectiveWater += WATER_TARGET + (e.water_oz - WATER_TARGET) * 0.5;
    }

    // Pages – overage at half
    if (e.pages_read <= PAGES_TARGET) {
      effectivePages += e.pages_read;
    } else {
      effectivePages += PAGES_TARGET + (e.pages_read - PAGES_TARGET) * 0.5;
    }

    // Workouts – binary per day, each workout is 0.5
    const w1 = !!e.workout1_type && e.workout1_duration_min !== null && e.workout1_duration_min >= 45;
    const w2 = !!e.workout2_type && e.workout2_duration_min !== null && e.workout2_duration_min >= 45;
    workoutScore += (w1 ? 0.5 : 0) + (w2 ? 0.5 : 0);

    // Photo – binary per day
    if (e.photo_url) photoScore += 1;
  }

  const waterPct = effectiveWater / (WATER_TARGET * daysElapsed);
  const pagesPct = effectivePages / (PAGES_TARGET * daysElapsed);
  const workoutPct = workoutScore / daysElapsed;
  const photoPct = photoScore / daysElapsed;

  // Average of all four pillars
  const overall = (waterPct + pagesPct + workoutPct + photoPct) / 4;

  return Math.round(overall * 100);
}
