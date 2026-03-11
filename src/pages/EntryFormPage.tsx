import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useDailyEntries } from '../hooks/useDailyEntries';
import { upsertDailyEntry, uploadProgressPhoto } from '../lib/api';
import { supabase } from '../lib/supabase';
import EntryForm from '../components/EntryForm';
import type { EntryFormData } from '../components/EntryForm';

export default function EntryFormPage() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const activeDate = date ?? todayStr;

  const { seasons } = useData();

  // Default to current season
  const activeSeason = useMemo(
    () => seasons.find((s) => s.is_current) ?? seasons[0] ?? null,
    [seasons]
  );

  const { entries, loading: entriesLoading } = useDailyEntries(activeSeason?.id, activeDate);

  // Find existing entry for this user
  const existingEntry = useMemo(() => {
    if (!user) return null;
    return entries.find((e) => e.user_id === user.id) ?? null;
  }, [entries, user]);

  // Fetch previous entry's book title for auto-fill
  const [previousBookTitle, setPreviousBookTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !activeSeason) return;

    async function fetchPreviousBookTitle() {
      const { data } = await supabase
        .from('daily_entries')
        .select('book_title')
        .eq('user_id', user!.id)
        .eq('season_id', activeSeason!.id)
        .lt('entry_date', activeDate)
        .order('entry_date', { ascending: false })
        .limit(1)
        .single();

      if (data?.book_title) {
        setPreviousBookTitle(data.book_title);
      }
    }

    fetchPreviousBookTitle();
  }, [user, activeSeason, activeDate]);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function handleSubmit(formData: EntryFormData) {
    if (!user || !activeSeason) return;

    setSubmitting(true);

    try {
      let photoUrl = existingEntry?.photo_url ?? null;

      // Upload photo if a new one was selected
      if (formData.photo) {
        photoUrl = await uploadProgressPhoto(user.id, activeDate, formData.photo);
      }

      await upsertDailyEntry({
        ...(existingEntry?.id ? { id: existingEntry.id } : {}),
        user_id: user.id,
        season_id: activeSeason.id,
        entry_date: activeDate,
        weight_lbs: formData.weight_lbs,
        water_oz: formData.water_oz,
        workout1_type: formData.workout1_type,
        workout1_outdoor: formData.workout1_outdoor,
        workout1_duration_min: formData.workout1_duration_min,
        workout1_notes: formData.workout1_notes,
        workout2_type: formData.workout2_type,
        workout2_outdoor: formData.workout2_outdoor,
        workout2_duration_min: formData.workout2_duration_min,
        workout2_notes: formData.workout2_notes,
        pages_read: formData.pages_read,
        book_title: formData.book_title,
        diet_followed: formData.diet_followed,
        photo_url: photoUrl,
      });

      setToast('Entry saved successfully!');
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      console.error('Failed to save entry:', err);
      setToast('Failed to save entry. Please try again.');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSubmitting(false);
    }
  }

  const isLoading = entriesLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-green-500" />
      </div>
    );
  }

  if (!activeSeason) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-lg font-semibold text-slate-50">No Season Found</p>
        <p className="text-sm text-slate-400">Cannot log an entry without an active season.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-50"
          aria-label="Back to main page"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-50">
            {existingEntry ? 'Edit Entry' : 'New Entry'}
          </h1>
          <p className="text-sm text-slate-400">
            {format(parseISO(activeDate), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* Entry form */}
      <EntryForm
        initialEntry={existingEntry}
        seasonId={activeSeason.id}
        previousBookTitle={previousBookTitle}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.includes('success')
              ? 'bg-green-500 text-slate-900'
              : 'bg-red-500 text-white'
          }`}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
