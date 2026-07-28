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
import * as api from '../api/publicData';
import type { Video } from '../types';
import { SiteHeader } from '../components/Layout/SiteHeader';
import { VideoRail } from '../components/Videos/VideoRail';
import { VideoModal } from '../components/Videos/VideoModal';

export function VideosPage() {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<Video | null>(null);

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
            מסילת הסרטונים — בחרו סרטון כדי לצפות בו.
          </p>
        </div>

        {error && (
          <p className="rounded border border-red-400/40 bg-red-950/40 p-4 text-center text-red-200">
            טעינת הסרטונים נכשלה: {error}
          </p>
        )}

        {!videos && !error && <RailSkeleton />}

        {videos && videos.length === 0 && (
          <p className="rounded border border-gold/30 bg-black/20 p-10 text-center text-parchment/80">
            המסילה עדיין ריקה — לא הועלו סרטונים חינוכיים.
          </p>
        )}

        {videos && videos.length > 0 && <VideoRail videos={videos} onSelect={setPlaying} />}
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
