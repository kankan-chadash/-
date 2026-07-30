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
import type { Video } from '../types';
import { SiteHeader } from '../components/Layout/SiteHeader';
import { VideoRail } from '../components/Videos/VideoRail';
import { VideoModal } from '../components/Videos/VideoModal';
import {
  VIDEO_CATEGORIES,
  VIDEO_CATEGORY_EMPTY,
  VIDEO_CATEGORY_LABELS,
  byCategory,
} from '../utils/videoCategories';

export function VideosPage() {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<Video | null>(null);

  const rails = useMemo(() => (videos ? byCategory(videos) : null), [videos]);

  useEffect(() => {
    api
      .fetchVideos()
      .then(setVideos)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="surface-wood min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-4xl text-parchment sm:text-5xl">סרטונים חינוכיים</h1>
          <p className="mx-auto mt-3 max-w-xl text-parchment/70">
            שתי מסילות: סרטונים כלליים, ולמטה סרטונים על פרשת השבוע. בחרו סרטון כדי לצפות בו.
          </p>
        </div>

        {error && (
          <p className="rounded border border-red-400/40 bg-red-950/40 p-4 text-center text-red-200">
            טעינת הסרטונים נכשלה: {error}
          </p>
        )}

        {!videos && !error && <RailSkeleton />}

        {/* One rail per kind, hung one above the other. Both are shown even when
            empty: a named empty shelf says what belongs there and that more is
            coming, where a missing one would just look like the site has less. */}
        {rails &&
          VIDEO_CATEGORIES.map((category) => {
            const rail = rails[category];
            return (
              <section key={category} className="mb-14 last:mb-0">
                <h2 className="mb-5 flex items-center gap-3 font-serif text-2xl text-parchment">
                  <span className="rail-heading-rule" aria-hidden />
                  {VIDEO_CATEGORY_LABELS[category]}
                  <span className="rail-heading-rule" aria-hidden />
                </h2>

                {rail.length > 0 ? (
                  <VideoRail videos={rail} onSelect={setPlaying} />
                ) : (
                  <p className="rounded border border-gold/25 bg-black/20 p-8 text-center text-parchment/70">
                    {VIDEO_CATEGORY_EMPTY[category]}
                  </p>
                )}
              </section>
            );
          })}
      </main>

      {playing && <VideoModal video={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}

function RailSkeleton() {
  return (
    <div aria-hidden>
      <div className="rail-beam h-7 rounded-sm" />
      <div className="flex gap-5 overflow-hidden px-2 pt-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="shrink-0 animate-pulse rounded-lg border border-gold/15 bg-black/25"
            style={{ width: 'min(19rem, 78vw)', height: '15rem' }}
          />
        ))}
      </div>
    </div>
  );
}
