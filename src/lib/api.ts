import { supabase } from './supabase';
import { compressImage } from './imageCompress';
import type { DailyEntry, Season } from '../types';

export async function upsertDailyEntry(entry: Partial<DailyEntry>): Promise<DailyEntry> {
  const { data, error } = await supabase
    .from('daily_entries')
    .upsert(entry, { onConflict: 'user_id,season_id,entry_date' })
    .select()
    .single();

  if (error) throw error;
  return data as DailyEntry;
}

export async function uploadProgressPhoto(
  userId: string,
  date: string,
  file: File
): Promise<string> {
  const compressed = await compressImage(file);
  const path = `${userId}/${date}.jpg`;

  const { error } = await supabase.storage
    .from('progress-photos')
    .upload(path, compressed, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('progress-photos')
    .getPublicUrl(path);

  return `${urlData.publicUrl}?t=${Date.now()}`;
}

export async function createSeason(
  name: string,
  startDate: string
): Promise<Season> {
  // Calculate end date: 75 days from start (start + 74 days inclusive)
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 74);
  const endDate = end.toISOString().split('T')[0];

  // Unset any existing current season
  await supabase
    .from('seasons')
    .update({ is_current: false })
    .eq('is_current', true);

  const { data, error } = await supabase
    .from('seasons')
    .insert({
      name,
      start_date: startDate,
      end_date: endDate,
      is_current: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Season;
}

export async function savePushSubscription(
  userId: string,
  sub: { endpoint: string; keys: { p256dh: string; auth: string } }
): Promise<void> {
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      keys_p256dh: sub.keys.p256dh,
      keys_auth: sub.keys.auth,
    },
    { onConflict: 'user_id' }
  );

  if (error) throw error;
}
