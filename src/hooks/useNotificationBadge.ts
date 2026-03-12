import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = '75hard-has-unread';

export function useNotificationBadge() {
  const [hasUnread, setHasUnread] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === '1';
  });

  const clearBadge = useCallback(() => {
    setHasUnread(false);
    localStorage.removeItem(STORAGE_KEY);
    navigator.clearAppBadge?.();
  }, []);

  useEffect(() => {
    const sw = navigator.serviceWorker;
    if (!sw) return;

    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'PUSH_RECEIVED') {
        setHasUnread(true);
        localStorage.setItem(STORAGE_KEY, '1');
      } else if (event.data?.type === 'BADGE_CLEARED') {
        setHasUnread(false);
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    sw.addEventListener('message', handleMessage);
    return () => sw.removeEventListener('message', handleMessage);
  }, []);

  // Clear badge when app becomes visible
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible' && hasUnread) {
        clearBadge();
      }
    }

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [hasUnread, clearBadge]);

  return { hasUnread, clearBadge };
}
