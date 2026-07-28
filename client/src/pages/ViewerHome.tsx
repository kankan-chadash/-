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
import { Link } from 'react-router-dom';
import * as api from '../api/publicData';
import type { Page } from '../types';

export function ViewerHome() {
  const [pages, setPages] = useState<Page[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .fetchPages()
      .then(setPages)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="min-h-screen bg-wood">
      <header className="border-b-2 border-gold/40 bg-wood-dark">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <h1 className="font-serif text-3xl text-parchment">The Scholar's Study Table</h1>
          <p className="text-parchment/70 mt-1">Browse Gemara pages with interactive study hotspots</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {error && <p className="text-red-300">Failed to load pages: {error}</p>}

        {pages && pages.length === 0 && (
          <p className="text-parchment/80">No pages have been published yet.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {pages?.map((page) => (
            <Link
              key={page.id}
              to={`/view/${page.id}`}
              className="block rounded bg-parchment p-5 shadow-lg border-t-4 border-gold hover:-translate-y-0.5 transition-transform"
            >
              <h2 className="font-serif text-xl text-wood-dark">
                {page.tractate} {page.daf}{page.side}
              </h2>
              <p className="text-ink-variant text-sm mt-1">Daf {page.daf}, Amud {page.side.toUpperCase()}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
