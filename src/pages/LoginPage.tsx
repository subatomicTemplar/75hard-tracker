import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { signIn, resetPassword, session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (session) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
    }

    setSubmitting(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email address first, then click "Forgot password?"');
      return;
    }

    setError('');
    setSubmitting(true);

    const { error } = await resetPassword(email);
    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }

    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
            <LogIn className="h-7 w-7 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-50">Welcome Back</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to your 75 Hard Tracker</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {resetSent && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Password reset link sent! Check your email.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-400">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2.5 pl-10 pr-4 text-slate-50 placeholder-slate-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-400">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2.5 pl-10 pr-4 text-slate-50 placeholder-slate-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={submitting}
              className="text-sm text-green-500 hover:text-green-400"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-green-500 py-2.5 font-semibold text-slate-900 transition hover:bg-green-400 disabled:opacity-50"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-green-500 hover:text-green-400">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
