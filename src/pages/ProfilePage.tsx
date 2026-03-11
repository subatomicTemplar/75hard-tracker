import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Bell, BellOff, Loader2, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { compressImage } from '../lib/imageCompress';
import { subscribeToPush } from '../lib/pushNotifications';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  // Sync form when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setAvatarUrl(profile.avatar_url ?? '');
    }
  }, [profile]);

  // Check current push subscription status
  useEffect(() => {
    async function checkPush() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setPushEnabled(!!subscription);
      } catch {
        // ignore
      }
    }
    checkPush();
  }, []);

  async function handleSave() {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          avatar_url: avatarUrl.trim() || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      showToast('Profile updated!');
    } catch (err) {
      console.error('Failed to update profile:', err);
      showToast('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePush() {
    if (!user) return;
    setPushLoading(true);

    try {
      if (pushEnabled) {
        // Unsubscribe
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
        setPushEnabled(false);
        showToast('Push notifications disabled.');
      } else {
        // Subscribe
        const result = await subscribeToPush(user.id);
        if (result) {
          setPushEnabled(true);
          showToast('Push notifications enabled!');
        } else {
          showToast('Could not enable notifications. Check browser permissions.');
        }
      }
    } catch (err) {
      console.error('Push toggle error:', err);
      showToast('Failed to toggle push notifications.');
    } finally {
      setPushLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setSaving(true);
    try {
      const compressed = await compressImage(file);
      const path = `${user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, compressed, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      const url = `${urlData.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(url);
      showToast('Avatar uploaded! Press Save to keep changes.');
    } catch (err) {
      console.error('Avatar upload error:', err);
      showToast('Failed to upload avatar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-50"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-slate-50">Profile</h1>
      </div>

      {/* Avatar preview */}
      <div className="flex flex-col items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="h-24 w-24 rounded-full object-cover border-2 border-slate-700"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-700 text-2xl font-bold text-slate-50">
            {displayName.charAt(0).toUpperCase() || '?'}
          </div>
        )}
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        {/* Display name */}
        <div className="space-y-1.5">
          <label htmlFor="displayName" className="block text-sm font-medium text-slate-300">
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-50 placeholder:text-slate-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        {/* Avatar URL */}
        <div className="space-y-1.5">
          <label htmlFor="avatarUrl" className="block text-sm font-medium text-slate-300">
            Avatar URL
          </label>
          <input
            id="avatarUrl"
            type="text"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-50 placeholder:text-slate-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <p className="text-xs text-slate-500">Or upload a file:</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-50 file:transition hover:file:bg-slate-600"
          />
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !displayName.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-3 font-bold text-slate-900 transition hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          Save Profile
        </button>
      </div>

      {/* Push notifications */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {pushEnabled ? (
              <Bell size={18} className="text-green-400" />
            ) : (
              <BellOff size={18} className="text-slate-500" />
            )}
            <span className="text-sm font-medium text-slate-50">Push Notifications</span>
          </div>

          <button
            type="button"
            onClick={handleTogglePush}
            disabled={pushLoading}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              pushEnabled ? 'bg-green-500' : 'bg-slate-600'
            }`}
            role="switch"
            aria-checked={pushEnabled}
          >
            {pushLoading ? (
              <Loader2 size={14} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-white" />
            ) : (
              <span
                className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
                  pushEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            )}
          </button>
        </div>
      </div>

      {/* Sign out */}
      <button
        type="button"
        onClick={handleSignOut}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-3 font-medium text-red-400 transition hover:bg-red-500/20"
      >
        <LogOut size={18} />
        Sign Out
      </button>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-green-500 px-5 py-3 text-sm font-medium text-slate-900 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
