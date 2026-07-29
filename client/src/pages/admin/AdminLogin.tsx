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
import { useGithubAdminAuth } from '../../context/GithubAdminAuthContext';
import { isGithubAdminMode } from '../../api/adminData';
import { routes } from '../../routes';

export function AdminLogin() {
  return isGithubAdminMode ? <GithubTokenLogin /> : <UsernamePasswordLogin />;
}

function LoginShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-wood flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded bg-parchment p-8 shadow-2xl border-t-4 border-gold">
        <h1 className="font-serif text-2xl text-wood-dark mb-6">{title}</h1>
        {children}
      </div>
    </div>
  );
}

function UsernamePasswordLogin() {
  const { username, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: Location } };
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (username) {
    return <Navigate to={routes.admin} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(user, password);
      const from = location.state?.from?.pathname ?? routes.admin;
      navigate(from, { replace: true });
    } catch {
      setError('שם משתמש או סיסמה שגויים');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <LoginShell title="כניסת מנהל">
      <form onSubmit={handleSubmit}>
        <label className="block mb-4">
          <span className="text-sm text-ink-variant">שם משתמש</span>
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
          <span className="text-sm text-ink-variant">סיסמה</span>
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
          {isSubmitting ? 'מתחבר…' : 'כניסה'}
        </button>
      </form>
    </LoginShell>
  );
}

function GithubTokenLogin() {
  const { token, signIn } = useGithubAdminAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: Location } };
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (token) {
    return <Navigate to={routes.admin} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(value.trim());
      const from = location.state?.from?.pathname ?? routes.admin;
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'לא ניתן לאמת את הטוקן');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <LoginShell title="כניסת מנהל">
      <p className="text-sm text-ink-variant mb-4">
        פאנל הניהול רץ כולו בדפדפן שלכם ושומר שינויים ישירות למאגר באמצעות טוקן GitHub אישי —
        אין כאן משתמש וסיסמה נפרדים. הדביקו{' '}
        <a
          href="https://github.com/settings/personal-access-tokens/new"
          target="_blank"
          rel="noreferrer"
          className="text-wood-dark underline"
        >
          טוקן גישה אישי מסוג fine-grained
        </a>{' '}
        המוגבל למאגר הזה בלבד, עם הרשאת <strong>Contents: Read and write</strong> ותו לא.
      </p>

      <form onSubmit={handleSubmit}>
        <label className="block mb-4">
          <span className="text-sm text-ink-variant">טוקן גישה אישי של GitHub</span>
          <input
            type="password"
            required
            autoFocus
            autoComplete="off"
            placeholder="github_pat_..."
            dir="ltr"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-1 w-full rounded border border-outline bg-white px-3 py-2 font-mono text-sm focus:outline-none focus:border-gold"
          />
        </label>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting || !value.trim()}
          className="w-full rounded bg-wood-dark text-gold py-2.5 font-semibold hover:bg-wood transition disabled:opacity-60"
        >
          {isSubmitting ? 'בודק גישה…' : 'שימוש בטוקן'}
        </button>
      </form>

      <p className="text-xs text-ink-variant mt-4">
        הטוקן נשמר רק בדפדפן הזה (localStorage) ונשלח רק ל-API של GitHub — לעולם לא לשרת אחר.
        כל מי שמחזיק בו יכול לערוך את המאגר, לכן השתמשו רק בטוקן המוגבל למאגר הזה, ואל תתחברו
        ממחשב משותף.
      </p>
    </LoginShell>
  );
}
