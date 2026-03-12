import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { DailyEntry } from '../types';

export function useUserEntries(userId: string | undefined, seasonId: string | undefined) {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchEntries() {
      if (!userId || !seasonId) {
        setEntries([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('season_id', seasonId)
        .order('entry_date', { ascending: true });

      if (cancelled) return;

      if (err) {
        setError(err.message);
      } else {
        setEntries(data ?? []);
      }

      setLoading(false);
    }

    fetchEntries();

    return () => {
      cancelled = true;
    };
  }, [userId, seasonId]);

  return { entries, loading, error };
}
