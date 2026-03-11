import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfiles() {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('profiles')
        .select('*');

      if (cancelled) return;

      if (err) {
        setError(err.message);
      } else {
        setProfiles(data ?? []);
      }

      setLoading(false);
    }

    fetchProfiles();

    return () => {
      cancelled = true;
    };
  }, []);

  return { profiles, loading, error };
}
