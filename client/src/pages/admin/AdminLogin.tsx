/**
 * B.H. Copyright (c) 2026 Yemot HaMashiach Ltd.
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Yemot HaMashiach Ltd. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with Yemot HaMashiach Ltd.
 *
 * Unauthorized copying of this file, via any medium, is strictly prohibited.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function AdminLogin() {
  const { username, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: Location } };
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (username) {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(user, password);
      const from = location.state?.from?.pathname ?? '/admin';
      navigate(from, { replace: true });
    } catch {
      setError('Invalid username or password');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-wood flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded bg-parchment p-8 shadow-2xl border-t-4 border-gold"
      >
        <h1 className="font-serif text-2xl text-wood-dark mb-6">Admin Sign In</h1>

        <label className="block mb-4">
          <span className="text-sm text-ink-variant">Username</span>
          <input
            type="text"
            required
            autoFocus
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="mt-1 w-full rounded border border-outline bg-white px-3 py-2 focus:outline-none focus:border-gold"
          />
        </label>

        <label className="block mb-6">
          <span className="text-sm text-ink-variant">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-outline bg-white px-3 py-2 focus:outline-none focus:border-gold"
          />
        </label>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-wood-dark text-gold py-2.5 font-semibold hover:bg-wood transition disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
