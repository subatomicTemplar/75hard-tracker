import { Link, Outlet } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import PullToRefresh from './PullToRefresh';

export default function Layout() {
  return (
    <div className="min-h-screen text-white">
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-black/90 backdrop-blur">
        <div className="mx-auto flex max-w-[640px] items-center justify-between px-4 py-3">
          <Link to="/" className="fire-text text-2xl tracking-widest">
            75 HARD
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-full p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
              aria-label="Notifications"
            >
              <Bell size={20} />
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
        <PullToRefresh>
          <Outlet />
        </PullToRefresh>
      </main>
    </div>
  );
}
