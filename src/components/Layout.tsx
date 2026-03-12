import { Link, Outlet } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import PullToRefresh from './PullToRefresh';
import { useRefresh } from '../contexts/RefreshContext';
import { useNotificationBadge } from '../hooks/useNotificationBadge';

export default function Layout() {
  const { triggerRefresh } = useRefresh();
  const { hasUnread, clearBadge } = useNotificationBadge();

  return (
    <div className="min-h-screen text-white">
      {/* Fixed background image — stays still while content scrolls */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background.webp')" }}
      />
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-black/90 backdrop-blur">
        <div className="mx-auto flex max-w-[640px] items-center justify-between px-4 py-3">
          <Link to="/" className="fire-text text-2xl tracking-widest">
            75 HARD
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={clearBadge}
              className="relative rounded-full p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {hasUnread && (
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />
              )}
            </button>

            <Link
              to="/profile"
              className="rounded-full p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
              aria-label="Profile"
            >
              <User size={20} />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[640px] px-4 py-4">
        <PullToRefresh onRefresh={triggerRefresh}>
          <Outlet />
        </PullToRefresh>
      </main>
    </div>
  );
}
