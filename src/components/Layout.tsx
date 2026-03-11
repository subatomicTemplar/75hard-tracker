import { Link, Outlet } from 'react-router-dom';
import { Bell, User } from 'lucide-react';

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-700 bg-slate-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-[640px] items-center justify-between px-4 py-3">
          <Link to="/" className="text-xl font-extrabold tracking-widest text-green-500">
            75 HARD
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-50"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>

            <Link
              to="/profile"
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-50"
              aria-label="Profile"
            >
              <User size={20} />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[640px] px-4 py-4">
        <Outlet />
      </main>
    </div>
  );
}
