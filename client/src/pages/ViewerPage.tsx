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
import { Link, useParams } from 'react-router-dom';
import * as api from '../api/client';
import type { PageWithRegions, Region } from '../types';
import { HotspotOverlay } from '../components/Overlay/HotspotOverlay';
import { ContentModal } from '../components/Modal/ContentModal';

export function ViewerPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const [page, setPage] = useState<PageWithRegions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<Region | null>(null);

  useEffect(() => {
    if (!pageId) return;
    setPage(null);
    api
      .fetchPage(pageId)
      .then(setPage)
      .catch((err) => setError(err.message));
  }, [pageId]);

  if (error) {
    return (
      <div className="min-h-screen bg-wood flex items-center justify-center">
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wood">
      <header className="border-b-2 border-gold/40 bg-wood-dark">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-parchment/80 hover:text-gold text-sm">
            ← All pages
          </Link>
          {page && (
            <h1 className="font-serif text-2xl text-parchment">
              {page.tractate} {page.daf}{page.side}
            </h1>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="bg-parchment rounded shadow-2xl border-t-4 border-gold overflow-hidden">
          {page ? (
            <HotspotOverlay
              imageUrl={page.pageImageUrl}
              imageAlt={`${page.tractate} ${page.daf}${page.side}`}
              regions={page.regions}
              onSelectRegion={setActiveRegion}
              activeRegionId={activeRegion?.id}
            />
          ) : (
            <div className="p-16 text-center text-ink-variant">Loading page…</div>
          )}
        </div>
      </main>

      {activeRegion && <ContentModal region={activeRegion} onClose={() => setActiveRegion(null)} />}
    </div>
  );
}
