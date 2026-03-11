import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { DailyEntry } from '../types';

export function useDailyEntries(seasonId: string | undefined, date: string | undefined) {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!seasonId || !date) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('season_id', seasonId)
      .eq('entry_date', date);

    if (err) {
      setError(err.message);
    } else {
      setEntries(data ?? []);
    }

    setLoading(false);
  }, [seasonId, date]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Realtime subscription filtered by seasonId
  useEffect(() => {
    if (!seasonId) return;

    const channel = supabase
      .channel(`daily_entries:season_${seasonId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_entries',
          filter: `season_id=eq.${seasonId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newEntry = payload.new as DailyEntry;
            if (newEntry.entry_date === date) {
              setEntries((prev) => {
                const exists = prev.some((e) => e.id === newEntry.id);
                return exists ? prev : [...prev, newEntry];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as DailyEntry;
            setEntries((prev) =>
              prev.map((e) => (e.id === updated.id ? updated : e))
            );
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as Partial<DailyEntry>;
            setEntries((prev) => prev.filter((e) => e.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [seasonId, date]);

  return { entries, loading, error, refetch: fetchEntries };
}
