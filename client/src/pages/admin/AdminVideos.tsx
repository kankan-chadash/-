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
import { Link } from 'react-router-dom';
import type { Video } from '../../types';
import { useAdminApi } from '../../api/adminData';
import { toThumbnailUrl } from '../../utils/videoEmbed';

export function AdminVideos() {
  const api = useAdminApi();
  const [videos, setVideos] = useState<Video[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');

  function load() {
    api.fetchAdminVideos().then(setVideos).catch((err) => setError(err.message));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [api]);

  function resetForm() {
    setEditing(null);
    setTitle('');
    setUrl('');
    setDescription('');
  }

  function startEditing(video: Video) {
    setEditing(video);
    setTitle(video.title);
    setUrl(video.url);
    setDescription(video.description ?? '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const input = { title, url, description: description.trim() || null };
      if (editing) await api.updateVideo(editing.id, input);
      else await api.createVideo(input);
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שמירת הסרטון נכשלה');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(video: Video) {
    if (!confirm(`למחוק את "${video.title}"? לא ניתן לבטל את הפעולה.`)) return;
    setError(null);
    try {
      await api.deleteVideo(video.id);
      if (editing?.id === video.id) resetForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'מחיקת הסרטון נכשלה');
    }
  }

  /** Moves a video one slot along the rail by swapping sort positions. */
  async function move(video: Video, delta: number) {
    const ordered = [...videos];
    const from = ordered.findIndex((v) => v.id === video.id);
    const to = from + delta;
    if (to < 0 || to >= ordered.length) return;
    setError(null);
    setBusy(true);
    try {
      const other = ordered[to];
      await api.updateVideo(video.id, { sortOrder: other.sortOrder });
      await api.updateVideo(other.id, { sortOrder: video.sortOrder });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שינוי הסדר נכשל');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="surface-wood min-h-screen">
      <header className="border-b-2 border-gold/40 bg-wood-dark">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <h1 className="font-serif text-2xl text-parchment">ניהול — סרטונים חינוכיים</h1>
          <Link to="/admin" className="text-sm text-gold hover:underline">
            → חזרה לדפים
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-6 py-10 md:grid-cols-[1fr_1.4fr]">
        <section className="h-fit rounded border-t-4 border-gold bg-parchment p-6 shadow-lg">
          <h2 className="mb-4 font-serif text-xl text-wood-dark">
            {editing ? 'עריכת סרטון' : 'סרטון חדש'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm text-ink-variant">כותרת</span>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="סרטון פתיחה למסכת"
                className="mt-1 w-full rounded border border-outline bg-white px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="text-sm text-ink-variant">קישור לסרטון (YouTube / Vimeo)</span>
              <input
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                dir="ltr"
                className="mt-1 w-full rounded border border-outline bg-white px-3 py-2 text-start"
              />
            </label>

            <label className="block">
              <span className="text-sm text-ink-variant">תיאור (רשות)</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="על מה הסרטון"
                className="mt-1 w-full rounded border border-outline bg-white px-3 py-2"
              />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded bg-wood-dark py-2.5 font-semibold text-gold transition hover:bg-wood disabled:opacity-60"
              >
                {busy ? 'שומר…' : editing ? 'שמירת שינויים' : 'הוספה למסילה'}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded border border-outline px-4 py-2.5 text-ink-variant hover:bg-black/5"
                >
                  ביטול
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded border-t-4 border-gold bg-parchment p-6 shadow-lg">
          <h2 className="mb-4 font-serif text-xl text-wood-dark">
            הסרטונים במסילה ({videos.length})
          </h2>
          {videos.length === 0 && <p className="text-sm text-ink-variant">עדיין אין סרטונים.</p>}
          <ul className="divide-y divide-outline/40">
            {videos.map((video, i) => {
              const thumbnail = toThumbnailUrl(video.url);
              return (
                <li key={video.id} className="flex items-center gap-3 py-3">
                  <div className="h-12 w-20 shrink-0 overflow-hidden rounded bg-wood-dark">
                    {thumbnail && <img src={thumbnail} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{video.title}</p>
                    <p className="truncate text-xs text-ink-variant" dir="ltr">
                      {video.url}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-sm">
                    <button
                      onClick={() => move(video, -1)}
                      disabled={i === 0 || busy}
                      aria-label="הזזה אחורה"
                      className="rounded px-2 py-1 text-ink-variant hover:bg-black/5 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(video, 1)}
                      disabled={i === videos.length - 1 || busy}
                      aria-label="הזזה קדימה"
                      className="rounded px-2 py-1 text-ink-variant hover:bg-black/5 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => startEditing(video)}
                      className="font-semibold text-wood-dark hover:underline"
                    >
                      עריכה
                    </button>
                    <button onClick={() => handleDelete(video)} className="text-red-600 hover:underline">
                      מחיקה
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
