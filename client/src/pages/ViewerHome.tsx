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
import * as api from '../api/publicData';
import type { Page, UpcomingBook } from '../types';
import { SiteHeader } from '../components/Layout/SiteHeader';
import { Bookshelf } from '../components/Library/Bookshelf';
import type { ShelfEntry } from '../components/Library/Bookshelf';
import { groupIntoBooks } from '../utils/library';

export function ViewerHome() {
  const [pages, setPages] = useState<Page[] | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingBook[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .fetchPages()
      .then(setPages)
      .catch((err) => setError(err.message));
    // An empty or missing announcements file is normal — never block the shelf on it.
    api.fetchUpcomingBooks().then(setUpcoming).catch(() => setUpcoming([]));
  }, []);

  // Published volumes first, then the announced ones trailing at the end of the run.
  const entries = useMemo<ShelfEntry[]>(() => {
    const books = pages ? groupIntoBooks(pages) : [];
    const published: ShelfEntry[] = books.map((book) => ({
      kind: 'published',
      key: `book:${book.tractate}`,
      book,
    }));
    const announced: ShelfEntry[] = [...upcoming]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({ kind: 'upcoming', key: `upcoming:${item.id}`, item }));
    return [...published, ...announced];
  }, [pages, upcoming]);

  const hasNothing = pages !== null && entries.length === 0;

  return (
    <div className="surface-wood min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-12 text-center">
          <h1 className="font-serif text-4xl text-parchment drop-shadow sm:text-5xl">הספרייה</h1>
          <span aria-hidden className="mx-auto mt-4 block h-px w-32 bg-gradient-to-l from-transparent via-gold/70 to-transparent" />
          <p className="mx-auto mt-4 max-w-xl text-parchment/70">
            בחרו כרך כדי לפתוח אותו בדף הראשון שלו.
          </p>
        </div>

        {error && (
          <p className="rounded border border-red-400/40 bg-red-950/40 p-4 text-center text-red-200">
            טעינת הספרייה נכשלה: {error}
          </p>
        )}

        {!pages && !error && <ShelfSkeleton />}

        {hasNothing && (
          <p className="rounded border border-gold/30 bg-black/20 p-10 text-center text-parchment/80">
            המדפים עדיין ריקים — לא פורסמו דפים.
          </p>
        )}

        {entries.length > 0 && <Bookshelf entries={entries} />}
      </main>
    </div>
  );
}

function ShelfSkeleton() {
  return (
    <div aria-hidden className="shelf-unit">
      <div className="shelf-back flex h-64 items-end justify-center gap-3 px-10 sm:h-80">
        {[80, 88, 72, 84, 76].map((h, i) => (
          <div key={i} className="w-16 animate-pulse rounded-t bg-white/5" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="shelf-plank" />
    </div>
  );
}
