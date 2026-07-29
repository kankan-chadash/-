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
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Page } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useGithubAdminAuth } from '../../context/GithubAdminAuthContext';
import { isGithubAdminMode, useAdminApi } from '../../api/adminData';
import { formatDaf } from '../../utils/library';
import { routes } from '../../routes';

export function AdminDashboard() {
  const expressAuth = useAuth();
  const githubAuth = useGithubAdminAuth();
  const username = isGithubAdminMode ? githubAuth.username : expressAuth.username;
  const signOut = isGithubAdminMode ? githubAuth.signOut : expressAuth.logout;
  const api = useAdminApi();
  const navigate = useNavigate();
  const [pages, setPages] = useState<Page[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [tractate, setTractate] = useState('');
  const [daf, setDaf] = useState('2');
  const [side, setSide] = useState<'a' | 'b'>('a');
  const [file, setFile] = useState<File | null>(null);

  function loadPages() {
    api.fetchAdminPages().then(setPages).catch((err) => setError(err.message));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(loadPages, [api]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('בחרו תמונת דף להעלאה');
      return;
    }
    setError(null);
    setIsCreating(true);
    try {
      const { url } = await api.uploadImage(file);
      const dimensions = await readImageDimensions(file);
      const page = await api.createPage({
        tractate,
        daf: parseInt(daf, 10),
        side,
        pageImageUrl: url,
        imageWidth: dimensions.width,
        imageHeight: dimensions.height,
      });
      // In GitHub-commit mode the uploaded image isn't fetchable from its real
      // URL until the next Pages deploy finishes (~1-2 min). Pass a local blob
      // URL so the editor can preview it immediately in this session.
      navigate(routes.adminPage(page.id), { state: { previewImageUrl: URL.createObjectURL(file) } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'יצירת הדף נכשלה');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('למחוק את הדף וכל האזורים שבו? לא ניתן לבטל את הפעולה.')) return;
    await api.deletePage(id);
    loadPages();
  }

  return (
    <div className="min-h-screen bg-wood">
      <header className="border-b-2 border-gold/40 bg-wood-dark">
        <div className="mx-auto max-w-5xl px-6 py-5 flex items-center justify-between">
          <h1 className="font-serif text-2xl text-parchment">ניהול — דפים</h1>
          <div className="flex items-center gap-4 text-parchment/80 text-sm">
            <Link to={routes.adminVideos} className="text-gold hover:underline">
              סרטונים חינוכיים
            </Link>
            <Link to={routes.adminUpcoming} className="text-gold hover:underline">
              כרכים בקרוב
            </Link>
            <span>{username}</span>
            <button onClick={() => signOut()} className="text-gold hover:underline">
              יציאה
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 grid gap-8 md:grid-cols-[1fr_1.4fr]">
        <section className="bg-parchment rounded shadow-lg border-t-4 border-gold p-6 h-fit">
          <h2 className="font-serif text-xl text-wood-dark mb-4">דף חדש</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <label className="block">
              <span className="text-sm text-ink-variant">מסכת</span>
              <input
                required
                value={tractate}
                onChange={(e) => setTractate(e.target.value)}
                placeholder="ברכות"
                className="mt-1 w-full rounded border border-outline bg-white px-3 py-2"
              />
            </label>
            <div className="flex gap-4">
              <label className="block flex-1">
                <span className="text-sm text-ink-variant">דף</span>
                <input
                  type="number"
                  min={2}
                  required
                  value={daf}
                  onChange={(e) => setDaf(e.target.value)}
                  className="mt-1 w-full rounded border border-outline bg-white px-3 py-2"
                />
              </label>
              <label className="block flex-1">
                <span className="text-sm text-ink-variant">עמוד</span>
                <select
                  value={side}
                  onChange={(e) => setSide(e.target.value as 'a' | 'b')}
                  className="mt-1 w-full rounded border border-outline bg-white px-3 py-2"
                >
                  <option value="a">a</option>
                  <option value="b">b</option>
                </select>
              </label>
            </div>
            <label className="block">
              <span className="text-sm text-ink-variant">תמונת הדף</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1 w-full text-sm"
              />
            </label>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={isCreating}
              className="w-full rounded bg-wood-dark text-gold py-2.5 font-semibold hover:bg-wood transition disabled:opacity-60"
            >
              {isCreating ? 'יוצר…' : 'יצירה ועריכת אזורים'}
            </button>
          </form>
        </section>

        <section className="bg-parchment rounded shadow-lg border-t-4 border-gold p-6">
          <h2 className="font-serif text-xl text-wood-dark mb-4">דפים קיימים</h2>
          {pages.length === 0 && <p className="text-ink-variant text-sm">עדיין אין דפים.</p>}
          <ul className="divide-y divide-outline/40">
            {pages.map((page) => (
              <li key={page.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-ink">
                    <bdi>{page.tractate}</bdi> {formatDaf(page)}
                  </p>
                  <Link to={`/view/${page.id}`} className="text-xs text-ink-variant hover:underline">
                    צפייה בדף הציבורי
                  </Link>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Link to={routes.adminPage(page.id)} className="text-wood-dark font-semibold hover:underline">
                    עריכה
                  </Link>
                  <button onClick={() => handleDelete(page.id)} className="text-red-600 hover:underline">
                    מחיקה
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('לא ניתן לקרוא את מידות התמונה'));
    };
    img.src = objectUrl;
  });
}
