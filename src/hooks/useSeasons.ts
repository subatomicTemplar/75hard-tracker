import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Season } from '../types';

export function useSeasons() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSeasons() {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('seasons')
        .select('*')
        .order('start_date', { ascending: false });

      if (cancelled) return;

      if (err) {
        setError(err.message);
      } else {
        setSeasons(data ?? []);
      }

      setLoading(false);
    }

    fetchSeasons();

    return () => {
      cancelled = true;
    };
  }, []);

  return { seasons, loading, error };
}
