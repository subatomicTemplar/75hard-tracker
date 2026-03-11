import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Season, Profile } from '../types';

interface DataContextType {
  seasons: Season[];
  profiles: Profile[];
  loading: boolean;
  error: string | null;
  refetchProfiles: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [seasonsLoading, setSeasonsLoading] = useState(true);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setSeasons([]);
      setProfiles([]);
      setSeasonsLoading(false);
      setProfilesLoading(false);
      setError(null);
      return;
    }

    async function fetchSeasons() {
      setSeasonsLoading(true);
      const { data, error: err } = await supabase
        .from('seasons')
        .select('*')
        .order('start_date', { ascending: false });
      if (err) {
        console.error('Failed to fetch seasons:', err.message);
        setError(err.message);
      } else {
        setSeasons(data ?? []);
      }
      setSeasonsLoading(false);
    }

    async function fetchProfiles() {
      setProfilesLoading(true);
      const { data, error: err } = await supabase.from('profiles').select('*');
      if (err) {
        console.error('Failed to fetch profiles:', err.message);
        setError(err.message);
      } else {
        setProfiles(data ?? []);
      }
      setProfilesLoading(false);
    }

    fetchSeasons();
    fetchProfiles();
  }, [session]);

  const refetchProfiles = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*');
    setProfiles(data ?? []);
  }, []);

  return (
    <DataContext.Provider
      value={{
        seasons,
        profiles,
        loading: seasonsLoading || profilesLoading,
        error,
        refetchProfiles,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
