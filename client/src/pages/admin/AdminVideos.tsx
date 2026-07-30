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
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Video, VideoCategory } from '../../types';
import { useAdminApi } from '../../api/adminData';
import { PublishNote } from '../../components/Admin/PublishNote';
import { useThumbnail } from '../../hooks/useThumbnail';
import { routes } from '../../routes';
import {
  VIDEO_CATEGORIES,
  VIDEO_CATEGORY_LABELS,
  byCategory,
  videoCategory,
} from '../../utils/videoCategories';

export function AdminVideos() {
  const api = useAdminApi();
  const [videos, setVideos] = useState<Video[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<VideoCategory>('general');

  const rails = useMemo(() => byCategory(videos), [videos]);

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
    setCategory('general');
  }

  function startEditing(video: Video) {
    setEditing(video);
    setTitle(video.title);
    setUrl(video.url);
    setDescription(video.description ?? '');
    setCategory(videoCategory(video));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const input = { title, url, description: description.trim() || null, category };
    const wasEditing = editing;
    try {
      // Show the change on the rail list at once; the commit follows.
      if (wasEditing) {
        setVideos((current) => current.map((v) => (v.id === wasEditing.id ? { ...v, ...input } : v)));
      }
      resetForm();
      if (wasEditing) await api.updateVideo(wasEditing.id, input);
      else {
        const created = await api.createVideo(input);
        setVideos((current) => [...current.filter((v) => v.id !== created.id), created]);
      }
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שמירת הסרטון נכשלה');
      load(); // the optimistic list is no longer trustworthy
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(video: Video) {
    if (!confirm(`למחוק את "${video.title}"? לא ניתן לבטל את הפעולה.`)) return;
    setError(null);
    const before = videos;
    setVideos(videos.filter((v) => v.id !== video.id));
    if (editing?.id === video.id) resetForm();
    try {
      await api.deleteVideo(video.id);
      setSavedAt(Date.now());
    } catch (err) {
      setVideos(before); // put it back where it was
      setError(err instanceof Error ? err.message : 'מחיקת הסרטון נכשלה');
    }
  }

  /**
   * Moves a video one slot along its own rail.
   *
   * The list reorders on the spot and the whole new order goes up as a single
   * write, so a run of moves is a run of instant reorderings rather than a
   * queue of round trips — and, in GitHub mode, one commit per move instead of
   * two, which means one deploy.
   */
  async function move(video: Video, delta: number) {
    const rail = rails[videoCategory(video)];
    const from = rail.indexOf(video);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= rail.length) return;

    // Swap within the rail, then flatten every rail back into one list: the
    // arrows move a video past its own neighbours, not past the other rail's.
    const swapped = [...rail];
    [swapped[from], swapped[to]] = [swapped[to], swapped[from]];
    const reordered = { ...rails, [videoCategory(video)]: swapped };
    const next = VIDEO_CATEGORIES.flatMap((c) => reordered[c]);

    const before = videos;
    setVideos(next);
    setError(null);

    try {
      await api.reorderVideos(next.map((v) => v.id));
      setSavedAt(Date.now());
    } catch (err) {
      setVideos(before);
      setError(err instanceof Error ? err.message : 'שינוי הסדר נכשל');
    }
  }

  return (
    <div className="surface-wood min-h-screen">
      <header className="border-b-2 border-gold/40 bg-wood-dark">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <h1 className="font-serif text-2xl text-parchment">ניהול — סרטונים חינוכיים</h1>
          <Link to={routes.admin} className="text-sm text-gold hover:underline">
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

            <fieldset className="block">
              <legend className="text-sm text-ink-variant">מסילה</legend>
              <div className="mt-1 flex gap-2">
                {VIDEO_CATEGORIES.map((option) => (
                  <label
                    key={option}
                    className={`flex-1 cursor-pointer rounded border px-3 py-2 text-center text-sm transition ${
                      category === option
                        ? 'border-wood-dark bg-wood-dark font-semibold text-gold'
                        : 'border-outline bg-white text-ink-variant hover:border-wood-dark/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={option}
                      checked={category === option}
                      onChange={() => setCategory(option)}
                      className="sr-only"
                    />
                    {VIDEO_CATEGORY_LABELS[option]}
                  </label>
                ))}
              </div>
            </fieldset>

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
            <PublishNote savedAt={savedAt} />

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
            הסרטונים במסילות ({videos.length})
          </h2>

          {/* Listed rail by rail, matching the page: the up/down arrows only make
              sense against the order you can actually see on the site. */}
          {VIDEO_CATEGORIES.map((category) => {
            const rail = rails[category];
            return (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="mb-2 border-b border-outline/50 pb-1 text-sm font-semibold text-wood-dark">
                  {VIDEO_CATEGORY_LABELS[category]} ({rail.length})
                </h3>
                {rail.length === 0 && (
                  <p className="py-2 text-sm text-ink-variant">אין עדיין סרטונים במסילה הזו.</p>
                )}
                <ul className="divide-y divide-outline/40">
                  {rail.map((video, i) => (
                    <li key={video.id} className="flex items-center gap-3 py-3">
                      <VideoThumb url={video.url} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink">{video.title}</p>
                        <p className="truncate text-xs text-ink-variant" dir="ltr">
                          {video.url}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 text-sm">
                        <button
                          onClick={() => move(video, -1)}
                          disabled={i === 0}
                          aria-label="הזזה אחורה"
                          className="rounded px-2 py-1 text-ink-variant hover:bg-black/5 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => move(video, 1)}
                          disabled={i === rail.length - 1}
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
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}

/** Its own component so the poster lookup can be a hook (Vimeo resolves async). */
function VideoThumb({ url }: { url: string }) {
  const thumbnail = useThumbnail(url, 320);
  return (
    <div className="h-12 w-20 shrink-0 overflow-hidden rounded bg-wood-dark">
      {thumbnail && <img src={thumbnail} alt="" className="h-full w-full object-cover" />}
    </div>
  );
}
