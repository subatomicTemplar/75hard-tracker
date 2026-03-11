import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  'mailto:notifications@75hard-tracker.app',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*');

  if (error) {
    console.error('Failed to fetch subscriptions:', error);
    return res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }

  const payload = JSON.stringify({
    title: '75 Hard Reminder',
    body: "Don't forget to log your progress today!",
  });

  const results = await Promise.allSettled(
    (subscriptions || []).map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
        return { endpoint: sub.endpoint, status: 'sent' };
      } catch (err: any) {
        if (err.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint);
          return { endpoint: sub.endpoint, status: 'removed (expired)' };
        }
        console.error(`Failed to send to ${sub.endpoint}:`, err);
        return { endpoint: sub.endpoint, status: 'failed' };
      }
    })
  );

  const fulfilled = results.filter((r) => r.status === 'fulfilled');
  const sent = fulfilled.filter(
    (r) => r.status === 'fulfilled' && r.value?.status === 'sent'
  ).length;

  return res.status(200).json({
    sent,
    total: subscriptions?.length || 0,
  });
}
