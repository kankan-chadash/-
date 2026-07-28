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
import type { Page } from '../types';
import { SiteHeader } from '../components/Layout/SiteHeader';
import { Bookshelf } from '../components/Library/Bookshelf';
import { groupIntoBooks } from '../utils/library';

export function ViewerHome() {
  const [pages, setPages] = useState<Page[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .fetchPages()
      .then(setPages)
      .catch((err) => setError(err.message));
  }, []);

  const books = useMemo(() => (pages ? groupIntoBooks(pages) : []), [pages]);

  return (
    <div className="surface-wood min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-4xl text-parchment sm:text-5xl">The Library</h1>
          <p className="mx-auto mt-3 max-w-xl text-parchment/70">
            Choose a volume to open it at its first daf.
          </p>
        </div>

        {error && (
          <p className="rounded border border-red-400/40 bg-red-950/40 p-4 text-center text-red-200">
            Failed to load the library: {error}
          </p>
        )}

        {!pages && !error && <ShelfSkeleton />}

        {pages && pages.length === 0 && (
          <p className="rounded border border-gold/30 bg-black/20 p-10 text-center text-parchment/80">
            The shelves are still empty — no dapim have been published yet.
          </p>
        )}

        {books.length > 0 && <Bookshelf books={books} />}
      </main>
    </div>
  );
}

function ShelfSkeleton() {
  return (
    <div aria-hidden>
      <div className="flex h-60 items-end justify-center gap-3 rounded-t bg-black/25 px-8 shadow-inner sm:h-72">
        {[80, 88, 72, 84, 76].map((h, i) => (
          <div
            key={i}
            className="w-16 animate-pulse rounded-t-sm bg-white/5"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="surface-shelf h-5 rounded-b shadow-lg" />
    </div>
  );
}
