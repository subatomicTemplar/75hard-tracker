import { supabase } from './supabase';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(userId: string): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported in this browser.');
    return null;
  }

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    console.error('VITE_VAPID_PUBLIC_KEY is not set.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });

    const subscriptionJSON = subscription.toJSON();

    // Try upsert on endpoint first, fall back to user_id
    const row = {
      user_id: userId,
      endpoint: subscriptionJSON.endpoint!,
      keys_p256dh: subscriptionJSON.keys?.p256dh ?? '',
      keys_auth: subscriptionJSON.keys?.auth ?? '',
    };

    let { error } = await supabase
      .from('push_subscriptions')
      .upsert(row, { onConflict: 'user_id' });

    if (error) {
      console.error('Upsert on user_id failed, trying endpoint:', error);
      ({ error } = await supabase
        .from('push_subscriptions')
        .upsert(row, { onConflict: 'endpoint' }));
    }

    if (error) {
      console.error('Failed to save push subscription:', error);
      // Still return the subscription — push will work, just won't persist across sessions
    }

    return subscription;
  } catch (err) {
    console.error('Failed to subscribe to push notifications:', err);
    return null;
  }
}
