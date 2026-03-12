import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Loader2 } from 'lucide-react';
import SeasonPicker from '../components/SeasonPicker';
import DateNavigator from '../components/DateNavigator';
import UserTile from '../components/UserTile';
import ComboCelebration from '../components/ComboCelebration';
import { useData } from '../contexts/DataContext';
import { useRefresh } from '../contexts/RefreshContext';
import { useDailyEntries } from '../hooks/useDailyEntries';
import { useSeasonEntries } from '../hooks/useSeasonEntries';
import { isFullCombo, comboSeenKey } from '../lib/completionCheck';

export default function MainPage() {
  const navigate = useNavigate();
  const { seasons, profiles, loading: dataLoading, refetchProfiles, refetchSeasons } = useData();
  const { registerRefresh } = useRefresh();

  // Default to current season
  const currentSeason = useMemo(
    () => seasons.find((s) => s.is_current) ?? seasons[0] ?? null,
    [seasons]
  );

  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');

  // Resolve the active season object
  const activeSeason = useMemo(() => {
    if (selectedSeasonId) {
      return seasons.find((s) => s.id === selectedSeasonId) ?? currentSeason;
    }
    return currentSeason;
  }, [seasons, selectedSeasonId, currentSeason]);

  // Clamp today's date to season range
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const [selectedDate, setSelectedDate] = useState<string>('');

  const activeDate = useMemo(() => {
    if (!activeSeason) return todayStr;
    const date = selectedDate || todayStr;
    if (date < activeSeason.start_date) return activeSeason.start_date;
    if (date > activeSeason.end_date) return activeSeason.end_date;
    return date;
  }, [activeSeason, selectedDate, todayStr]);

  // When season changes, pick the effective season id
  const effectiveSeasonId = activeSeason?.id;

  // Sync selectedSeasonId once seasons load
  useEffect(() => {
    if (currentSeason && !selectedSeasonId) {
      setSelectedSeasonId(currentSeason.id);
    }
  }, [currentSeason, selectedSeasonId]);

  const { entries, loading: entriesLoading, refetch: refetchDailyEntries } = useDailyEntries(effectiveSeasonId, activeDate);
  const { entries: allSeasonEntries, refetch: refetchSeasonEntries } = useSeasonEntries(effectiveSeasonId);

  // Register pull-to-refresh handler
  useEffect(() => {
    registerRefresh(async () => {
      await Promise.all([
        refetchProfiles(),
        refetchSeasons(),
        refetchDailyEntries(),
        refetchSeasonEntries(),
      ]);
    });
  }, [registerRefresh, refetchProfiles, refetchSeasons, refetchDailyEntries, refetchSeasonEntries]);

  // Combo celebration state
  const [showCombo, setShowCombo] = useState(false);

  // Check for unseen combo on load / when entries change
  useEffect(() => {
    if (!effectiveSeasonId || !activeDate || profiles.length === 0 || entries.length === 0) return;
    const key = comboSeenKey(effectiveSeasonId, activeDate);
    if (localStorage.getItem(key)) return;
    if (isFullCombo(profiles, entries)) {
      setShowCombo(true);
      localStorage.setItem(key, '1');
    }
  }, [effectiveSeasonId, activeDate, profiles, entries]);

  const handleComboComplete = useCallback(() => {
    setShowCombo(false);
  }, []);

  function handleSeasonChange(id: string) {
    setSelectedSeasonId(id);
    setSelectedDate(''); // reset date when switching seasons
  }

  function handleDateChange(date: string) {
    setSelectedDate(date);
  }

  const isLoading = dataLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-red-500" />
      </div>
    );
  }

  if (!activeSeason) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-lg font-semibold text-white">No Season Found</p>
        <p className="text-sm text-neutral-400">
          There are no seasons configured yet. Ask an admin to create one.
        </p>
      </div>
    );
  }

  return (
    <>
      {showCombo && <ComboCelebration onComplete={handleComboComplete} />}
      <div className="space-y-5">
        {/* Season picker */}
        <div className="flex items-center justify-between">
          <SeasonPicker
            seasons={seasons}
            selectedSeasonId={activeSeason.id}
            onChange={handleSeasonChange}
          />
        </div>

        {/* Date navigator */}
        <DateNavigator
          date={activeDate}
          seasonStartDate={activeSeason.start_date}
          seasonEndDate={activeSeason.end_date}
          onChange={handleDateChange}
        />

        {/* Log Today button */}
        <button
          type="button"
          onClick={() => navigate(`/entry/${todayStr}`)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-bold text-white transition hover:bg-red-500 active:scale-[0.98]"
        >
          <Plus size={20} />
          Log Today
        </button>

        {/* User tiles */}
        <div className="space-y-3">
          {entriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-neutral-500" />
            </div>
          ) : (
            profiles.map((profile) => {
              const entry = entries.find((e) => e.user_id === profile.id) ?? null;
              const userSeasonEntries = allSeasonEntries.filter((e) => e.user_id === profile.id);
              return (
                <UserTile
                  key={profile.id}
                  profile={profile}
                  entry={entry}
                  seasonId={activeSeason.id}
                  seasonStartDate={activeSeason.start_date}
                  seasonEntries={userSeasonEntries}
                />
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
