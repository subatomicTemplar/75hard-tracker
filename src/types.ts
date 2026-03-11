export interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface DailyEntry {
  id: string;
  user_id: string;
  season_id: string;
  entry_date: string;
  weight_lbs: number | null;
  water_oz: number;
  workout1_type: string | null;
  workout1_outdoor: boolean;
  workout1_duration_min: number | null;
  workout1_notes: string | null;
  workout2_type: string | null;
  workout2_outdoor: boolean;
  workout2_duration_min: number | null;
  workout2_notes: string | null;
  pages_read: number;
  book_title: string | null;
  diet_followed: boolean;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  keys_p256dh: string;
  keys_auth: string;
}

export const WORKOUT_TYPES = [
  'Run', 'Walk', 'Hike', 'Bike', 'Swim',
  'Gym', 'Yoga', 'Pilates', 'CrossFit',
  'Sport', 'Dance', 'Martial Arts', 'Other'
] as const;
