import { useState, useEffect } from 'react';
import { Camera, Sun, X } from 'lucide-react';
import WaterBottle from './WaterBottle';
import type { DailyEntry } from '../types';
import { WORKOUT_TYPES } from '../types';

export interface EntryFormData {
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
  photo: File | null;
}

interface EntryFormProps {
  initialEntry: DailyEntry | null;
  seasonId: string;
  previousBookTitle?: string | null;
  onSubmit: (data: EntryFormData) => Promise<void>;
  submitting?: boolean;
}

export default function EntryForm({
  initialEntry,
  seasonId: _seasonId,
  previousBookTitle,
  onSubmit,
  submitting = false,
}: EntryFormProps) {
  void _seasonId;
  const [weightLbs, setWeightLbs] = useState<string>(
    initialEntry?.weight_lbs?.toString() ?? ''
  );
  const [waterOz, setWaterOz] = useState(initialEntry?.water_oz ?? 0);
  const [workout1Type, setWorkout1Type] = useState(initialEntry?.workout1_type ?? '');
  const [workout1Outdoor, setWorkout1Outdoor] = useState(initialEntry?.workout1_outdoor ?? false);
  const [workout1Duration, setWorkout1Duration] = useState<string>(
    initialEntry?.workout1_duration_min?.toString() ?? ''
  );
  const [workout1Notes, setWorkout1Notes] = useState(initialEntry?.workout1_notes ?? '');
  const [workout2Type, setWorkout2Type] = useState(initialEntry?.workout2_type ?? '');
  const [workout2Outdoor, setWorkout2Outdoor] = useState(initialEntry?.workout2_outdoor ?? false);
  const [workout2Duration, setWorkout2Duration] = useState<string>(
    initialEntry?.workout2_duration_min?.toString() ?? ''
  );
  const [workout2Notes, setWorkout2Notes] = useState(initialEntry?.workout2_notes ?? '');
  const [pagesRead, setPagesRead] = useState<string>(
    initialEntry?.pages_read?.toString() ?? '0'
  );
  const [bookTitle, setBookTitle] = useState(
    initialEntry?.book_title ?? previousBookTitle ?? ''
  );
  const [dietFollowed, setDietFollowed] = useState(initialEntry?.diet_followed ?? false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    initialEntry?.photo_url ?? null
  );

  // Update preview when photo changes
  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
    }
  }

  function clearPhoto() {
    setPhoto(null);
    setPhotoPreview(initialEntry?.photo_url ?? null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await onSubmit({
      weight_lbs: weightLbs ? parseFloat(weightLbs) : null,
      water_oz: waterOz,
      workout1_type: workout1Type || null,
      workout1_outdoor: workout1Outdoor,
      workout1_duration_min: workout1Duration ? parseInt(workout1Duration, 10) : null,
      workout1_notes: workout1Notes || null,
      workout2_type: workout2Type || null,
      workout2_outdoor: workout2Outdoor,
      workout2_duration_min: workout2Duration ? parseInt(workout2Duration, 10) : null,
      workout2_notes: workout2Notes || null,
      pages_read: parseInt(pagesRead, 10) || 0,
      book_title: bookTitle || null,
      diet_followed: dietFollowed,
      photo,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Weight */}
      <fieldset className="space-y-1.5">
        <label htmlFor="weight" className="block text-sm font-medium text-slate-300">
          Weight (lbs)
        </label>
        <input
          id="weight"
          type="number"
          step="0.1"
          min="50"
          max="500"
          value={weightLbs}
          onChange={(e) => setWeightLbs(e.target.value)}
          placeholder="e.g. 185.0"
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-50 placeholder:text-slate-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </fieldset>

      {/* Water */}
      <fieldset className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <WaterBottle waterOz={waterOz} onChange={setWaterOz} />
      </fieldset>

      {/* Workout 1 */}
      <fieldset className="space-y-3 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <legend className="text-sm font-semibold text-green-400">Workout 1</legend>

        <div>
          <label htmlFor="w1type" className="block text-xs font-medium text-slate-400 mb-1">
            Type
          </label>
          <select
            id="w1type"
            value={workout1Type}
            onChange={(e) => setWorkout1Type(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-50 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">Select type...</option>
            {WORKOUT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setWorkout1Outdoor(!workout1Outdoor)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
              workout1Outdoor
                ? 'border-green-500 bg-green-500/20 text-green-400'
                : 'border-slate-700 bg-slate-800 text-slate-400'
            }`}
          >
            <Sun size={16} />
            Outdoor
          </button>
        </div>

        <div>
          <label htmlFor="w1dur" className="block text-xs font-medium text-slate-400 mb-1">
            Duration (minutes)
          </label>
          <input
            id="w1dur"
            type="number"
            min="0"
            max="300"
            value={workout1Duration}
            onChange={(e) => setWorkout1Duration(e.target.value)}
            placeholder="45"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-50 placeholder:text-slate-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div>
          <label htmlFor="w1notes" className="block text-xs font-medium text-slate-400 mb-1">
            Notes
          </label>
          <input
            id="w1notes"
            type="text"
            value={workout1Notes}
            onChange={(e) => setWorkout1Notes(e.target.value)}
            placeholder="Optional notes..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-50 placeholder:text-slate-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
      </fieldset>

      {/* Workout 2 */}
      <fieldset className="space-y-3 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <legend className="text-sm font-semibold text-green-400">Workout 2</legend>

        <div>
          <label htmlFor="w2type" className="block text-xs font-medium text-slate-400 mb-1">
            Type
          </label>
          <select
            id="w2type"
            value={workout2Type}
            onChange={(e) => setWorkout2Type(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-50 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">Select type...</option>
            {WORKOUT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setWorkout2Outdoor(!workout2Outdoor)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
              workout2Outdoor
                ? 'border-green-500 bg-green-500/20 text-green-400'
                : 'border-slate-700 bg-slate-800 text-slate-400'
            }`}
          >
            <Sun size={16} />
            Outdoor
          </button>
        </div>

        <div>
          <label htmlFor="w2dur" className="block text-xs font-medium text-slate-400 mb-1">
            Duration (minutes)
          </label>
          <input
            id="w2dur"
            type="number"
            min="0"
            max="300"
            value={workout2Duration}
            onChange={(e) => setWorkout2Duration(e.target.value)}
            placeholder="45"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-50 placeholder:text-slate-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div>
          <label htmlFor="w2notes" className="block text-xs font-medium text-slate-400 mb-1">
            Notes
          </label>
          <input
            id="w2notes"
            type="text"
            value={workout2Notes}
            onChange={(e) => setWorkout2Notes(e.target.value)}
            placeholder="Optional notes..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-50 placeholder:text-slate-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
      </fieldset>

      {/* Reading */}
      <fieldset className="space-y-3 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <legend className="text-sm font-semibold text-green-400">Reading</legend>

        <div>
          <label htmlFor="pages" className="block text-xs font-medium text-slate-400 mb-1">
            Pages Read
          </label>
          <input
            id="pages"
            type="number"
            min="0"
            max="500"
            value={pagesRead}
            onChange={(e) => setPagesRead(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-50 placeholder:text-slate-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div>
          <label htmlFor="book" className="block text-xs font-medium text-slate-400 mb-1">
            Book Title
          </label>
          <input
            id="book"
            type="text"
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            placeholder="What are you reading?"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-50 placeholder:text-slate-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
      </fieldset>

      {/* Diet */}
      <fieldset className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-green-400">Diet Followed</span>
          <button
            type="button"
            onClick={() => setDietFollowed(!dietFollowed)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              dietFollowed ? 'bg-green-500' : 'bg-slate-600'
            }`}
            role="switch"
            aria-checked={dietFollowed}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
                dietFollowed ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </fieldset>

      {/* Progress Photo */}
      <fieldset className="space-y-3 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <legend className="text-sm font-semibold text-green-400">Progress Photo</legend>

        {photoPreview ? (
          <div className="relative">
            <img
              src={photoPreview}
              alt="Progress preview"
              className="h-48 w-full rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={clearPhoto}
              className="absolute top-2 right-2 rounded-full bg-slate-900/80 p-1.5 text-slate-300 transition hover:bg-slate-900 hover:text-white"
              aria-label="Remove photo"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <label className="flex flex-1 h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-600 transition hover:border-green-500 hover:bg-slate-800">
              <Camera size={28} className="text-slate-500" />
              <span className="mt-1 text-sm text-slate-500">Take photo</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
            <label className="flex flex-1 h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-600 transition hover:border-green-500 hover:bg-slate-800">
              <Camera size={28} className="text-slate-500" />
              <span className="mt-1 text-sm text-slate-500">Choose from library</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          </div>
        )}
      </fieldset>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-green-500 py-3 text-center font-bold text-slate-900 transition hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Saving...' : 'Save Entry'}
      </button>
    </form>
  );
}
