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
import type { UpcomingBook } from '../../types';
import { useAdminApi } from '../../api/adminData';
import { PublishNote } from '../../components/Admin/PublishNote';
import { routes } from '../../routes';

export function AdminUpcoming() {
  const api = useAdminApi();
  const [books, setBooks] = useState<UpcomingBook[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<UpcomingBook | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [tractate, setTractate] = useState('');
  const [note, setNote] = useState('');

  function load() {
    api.fetchAdminUpcomingBooks().then(setBooks).catch((err) => setError(err.message));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [api]);

  function resetForm() {
    setEditing(null);
    setTractate('');
    setNote('');
  }

  function startEditing(book: UpcomingBook) {
    setEditing(book);
    setTractate(book.tractate);
    setNote(book.note ?? '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const input = { tractate, note: note.trim() || null };
    const wasEditing = editing;
    try {
      // Show the change on the shelf list at once; the commit follows.
      if (wasEditing) {
        setBooks((current) =>
          current.map((b) => (b.id === wasEditing.id ? { ...b, ...input } : b))
        );
      }
      resetForm();
      if (wasEditing) await api.updateUpcomingBook(wasEditing.id, input);
      else setBooks(await appended(api.createUpcomingBook(input)));
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שמירת הכרך נכשלה');
      load(); // the optimistic list is no longer trustworthy
    } finally {
      setBusy(false);
    }
  }

  /** Resolves to the list with a newly created volume on the end. */
  async function appended(pending: Promise<UpcomingBook>): Promise<UpcomingBook[]> {
    const created = await pending;
    return [...books.filter((b) => b.id !== created.id), created];
  }

  async function handleDelete(book: UpcomingBook) {
    if (!confirm(`להסיר את "${book.tractate}" מהמדף? לא ניתן לבטל את הפעולה.`)) return;
    setError(null);
    const before = books;
    setBooks(books.filter((b) => b.id !== book.id));
    if (editing?.id === book.id) resetForm();
    try {
      await api.deleteUpcomingBook(book.id);
      setSavedAt(Date.now());
    } catch (err) {
      setBooks(before); // put it back where it was
      setError(err instanceof Error ? err.message : 'הסרת הכרך נכשלה');
    }
  }

  /**
   * Moves a volume one place along the shelf.
   *
   * The list reorders on the spot and the whole new order goes up as a single
   * write, so a run of moves is a run of instant reorderings rather than a
   * queue of round trips — and, in GitHub mode, one commit per move instead of
   * two, which means one deploy.
   */
  async function move(book: UpcomingBook, delta: number) {
    const from = books.findIndex((b) => b.id === book.id);
    const to = from + delta;
    if (to < 0 || to >= books.length) return;

    const before = books;
    const next = [...books];
    [next[from], next[to]] = [next[to], next[from]];
    setBooks(next);
    setError(null);

    try {
      await api.reorderUpcomingBooks(next.map((b) => b.id));
      setSavedAt(Date.now());
    } catch (err) {
      setBooks(before);
      setError(err instanceof Error ? err.message : 'שינוי הסדר נכשל');
    }
  }

  return (
    <div className="surface-wood min-h-screen">
      <header className="border-b-2 border-gold/40 bg-wood-dark">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <h1 className="font-serif text-2xl text-parchment">ניהול — כרכים בקרוב</h1>
          <Link to={routes.admin} className="text-sm text-gold hover:underline">
            → חזרה לדפים
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-6 py-10 md:grid-cols-[1fr_1.4fr]">
        <section className="h-fit rounded border-t-4 border-gold bg-parchment p-6 shadow-lg">
          <h2 className="mb-2 font-serif text-xl text-wood-dark">
            {editing ? 'עריכת כרך' : 'כרך חדש בקרוב'}
          </h2>
          <p className="mb-4 text-sm text-ink-variant">
            הכרך יופיע במדף מעומעם, עם סרט "בקרוב", ולא יהיה ניתן לפתיחה.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm text-ink-variant">שם המסכת</span>
              <input
                required
                value={tractate}
                onChange={(e) => setTractate(e.target.value)}
                placeholder="בבא מציעא"
                className="mt-1 w-full rounded border border-outline bg-white px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="text-sm text-ink-variant">הערה (רשות)</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="בעריכה"
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
                {busy ? 'שומר…' : editing ? 'שמירת שינויים' : 'הוספה למדף'}
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
          <h2 className="mb-4 font-serif text-xl text-wood-dark">כרכים בקרוב ({books.length})</h2>
          {books.length === 0 && (
            <p className="text-sm text-ink-variant">עדיין לא הוכרזו כרכים.</p>
          )}
          <ul className="divide-y divide-outline/40">
            {books.map((book, i) => (
              <li key={book.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{book.tractate}</p>
                  {book.note && <p className="truncate text-xs text-ink-variant">{book.note}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1 text-sm">
                  <button
                    onClick={() => move(book, -1)}
                    disabled={i === 0}
                    aria-label="הזזה אחורה"
                    className="rounded px-2 py-1 text-ink-variant hover:bg-black/5 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(book, 1)}
                    disabled={i === books.length - 1}
                    aria-label="הזזה קדימה"
                    className="rounded px-2 py-1 text-ink-variant hover:bg-black/5 disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => startEditing(book)}
                    className="font-semibold text-wood-dark hover:underline"
                  >
                    עריכה
                  </button>
                  <button onClick={() => handleDelete(book)} className="text-red-600 hover:underline">
                    הסרה
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
