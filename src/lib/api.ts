import { supabase } from './supabase';
import { compressImage } from './imageCompress';
import type { DailyEntry } from '../types';

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

export async function savePushSubscription(
  userId: string,
  sub: { endpoint: string; keys: { p256dh: string; auth: string } }
): Promise<void> {
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
    { onConflict: 'user_id' }
  );

  if (error) throw error;
}
