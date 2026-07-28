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
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Video } from '../../types';
import { useThumbnail } from '../../hooks/useThumbnail';
import logoUrl from '../../assets/logo.png';
import { Chevron } from '../Layout/Chevron';

interface VideoRailProps {
  videos: Video[];
  onSelect: (video: Video) => void;
}

/** Alternating hang angles so the plaques look hung by hand, not laid out by a grid. */
const HANG_ANGLES = [-1.6, 1.1, -0.7, 1.8, -1.2, 0.8];

export function VideoRail({ videos, onSelect }: VideoRailProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const syncEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    // scrollLeft runs negative in RTL on most engines, so compare on magnitude.
    const offset = Math.abs(el.scrollLeft);
    setAtStart(offset < 8);
    setAtEnd(offset + el.clientWidth >= el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    syncEdges();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', syncEdges, { passive: true });
    window.addEventListener('resize', syncEdges);
    return () => {
      el.removeEventListener('scroll', syncEdges);
      window.removeEventListener('resize', syncEdges);
    };
  }, [syncEdges, videos.length]);

  function scrollByCards(cards: number) {
    const el = trackRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.8 * cards;
    el.scrollBy({ left: step, behavior: 'smooth' });
  }

  return (
    <div className="relative" style={{ perspective: '1400px' }}>
      {/* The beam the plaques hang from */}
      <div className="rail-beam relative h-7 rounded-sm">
        <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className="rail-stud h-2.5 w-2.5 rounded-full" aria-hidden />
          ))}
        </div>
      </div>

      <div
        ref={trackRef}
        className="rail-track flex gap-5 overflow-x-auto px-2 pb-6 pt-0"
        // Room for the lift-on-hover transform so it isn't clipped by the scroller.
        style={{ paddingTop: '0.5rem' }}
      >
        {videos.map((video, i) => (
          <RailCard
            key={video.id}
            video={video}
            index={i}
            angle={HANG_ANGLES[i % HANG_ANGLES.length]}
            onSelect={onSelect}
          />
        ))}
      </div>

      {videos.length > 1 && (
        <>
          <RailArrow side="start" disabled={atStart} onClick={() => scrollByCards(-1)} />
          <RailArrow side="end" disabled={atEnd} onClick={() => scrollByCards(1)} />
        </>
      )}
    </div>
  );
}

function RailCard({
  video,
  index,
  angle,
  onSelect,
}: {
  video: Video;
  index: number;
  angle: number;
  onSelect: (video: Video) => void;
}) {
  const thumbnail = useThumbnail(video.url);

  return (
    <div className="rail-slot shrink-0 pt-4" style={{ width: 'min(19rem, 78vw)' }}>
      {/* Hook and cord tying the plaque to the beam */}
      <div className="relative mx-auto -mt-4 mb-1 h-4 w-px bg-gold/50" aria-hidden>
        <span className="rail-hook absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full" />
      </div>

      <button
        type="button"
        onClick={() => onSelect(video)}
        className="rail-card rail-settling group relative block w-full overflow-hidden rounded-lg border border-gold/25 bg-wood-dark text-start shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        style={
          {
            '--rail-rot': `${angle}deg`,
            animationDelay: `${Math.min(index, 8) * 70}ms`,
          } as React.CSSProperties
        }
      >
        <div className="relative aspect-video overflow-hidden bg-black">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-wood to-wood-dark">
              <img src={logoUrl} alt="" className="h-16 w-16 opacity-70 mix-blend-screen" />
            </div>
          )}

          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          <span
            aria-hidden
            className="rail-play pointer-events-none absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-gold bg-black/55 text-2xl text-gold"
          >
            ▶
          </span>
        </div>

        <div className="p-4">
          <h3 className="font-serif text-lg text-parchment line-clamp-2">{video.title}</h3>
          {video.description && (
            <p className="mt-1 line-clamp-2 text-sm text-parchment/60">{video.description}</p>
          )}
        </div>
      </button>
    </div>
  );
}

function RailArrow({
  side,
  disabled,
  onClick,
}: {
  side: 'start' | 'end';
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === 'start' ? 'הקודם' : 'הבא'}
      className={`absolute top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gold/50 bg-wood-dark/90 text-gold shadow-lg backdrop-blur transition hover:bg-wood disabled:pointer-events-none disabled:opacity-0 ${
        side === 'start' ? 'start-0 -translate-x-1/2 rtl:translate-x-1/2' : 'end-0 translate-x-1/2 rtl:-translate-x-1/2'
      }`}
    >
      <Chevron toward={side} className="h-6 w-6" />
    </button>
  );
}
