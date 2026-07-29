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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as api from '../api/publicData';
import type { Page, PageWithRegions, Region } from '../types';
import { HotspotOverlay } from '../components/Overlay/HotspotOverlay';
import { ContentModal } from '../components/Modal/ContentModal';
import { SiteHeader } from '../components/Layout/SiteHeader';
import { DafTurner, TURN_DURATION_MS } from '../components/Viewer/DafTurner';
import type { TurnDirection } from '../components/Viewer/DafTurner';
import { DafTitle } from '../components/Viewer/DafTitle';
import { Chevron } from '../components/Layout/Chevron';
import { RegionLegend } from '../components/Viewer/RegionLegend';
import { findSiblings, formatDaf, formatPageTitle } from '../utils/library';

export function ViewerPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();

  const [allPages, setAllPages] = useState<Page[]>([]);
  const [page, setPage] = useState<PageWithRegions | null>(null);
  const [outgoing, setOutgoing] = useState<{ page: PageWithRegions; direction: TurnDirection } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<Region | null>(null);
  const [showAllRegions, setShowAllRegions] = useState(readShowAllPreference);
  const [locatedRegionId, setLocatedRegionId] = useState<string | null>(null);

  // Which way the next daf change should turn. Set by whatever triggered the
  // navigation (button, key, swipe) just before the URL changes.
  const directionRef = useRef<TurnDirection>('next');
  const pageRef = useRef<PageWithRegions | null>(null);
  pageRef.current = page;

  useEffect(() => {
    api.fetchPages().then(setAllPages).catch(() => setAllPages([]));
  }, []);

  useEffect(() => {
    if (!pageId) return;
    let cancelled = false;

    api
      .fetchPage(pageId)
      .then((next) => {
        if (cancelled) return;
        const previous = pageRef.current;
        // Only turn when moving between two different dapim — not on first load.
        if (previous && previous.id !== next.id) {
          setOutgoing({ page: previous, direction: directionRef.current });
        }
        setPage(next);
        setActiveRegion(null);
      })
      .catch((err) => !cancelled && setError(err.message));

    return () => {
      cancelled = true;
    };
  }, [pageId]);

  // Retire the outgoing leaf once its animation has played.
  useEffect(() => {
    if (!outgoing) return;
    const timer = setTimeout(() => setOutgoing(null), TURN_DURATION_MS);
    return () => clearTimeout(timer);
  }, [outgoing]);

  const siblings = useMemo(
    () => (page ? findSiblings(allPages, page) : { prev: null, next: null, index: 0, total: 0 }),
    [allPages, page]
  );

  const goTo = useCallback(
    (target: Page | null, direction: TurnDirection) => {
      if (!target || outgoing) return; // ignore input while a turn is mid-flight
      directionRef.current = direction;
      navigate(`/view/${target.id}`);
    },
    [navigate, outgoing]
  );

  // Preload the neighbouring daf images so a turn reveals a painted page, not a gap.
  useEffect(() => {
    for (const neighbour of [siblings.prev, siblings.next]) {
      if (neighbour) new Image().src = neighbour.pageImageUrl;
    }
  }, [siblings.prev, siblings.next]);

  // Arrow keys page through the volume, unless a modal has focus.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (activeRegion) return;
      // RTL: the next daf lies to the left, so ArrowLeft advances.
      if (e.key === 'ArrowLeft') goTo(siblings.next, 'next');
      else if (e.key === 'ArrowRight') goTo(siblings.prev, 'prev');
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goTo, siblings.next, siblings.prev, activeRegion]);

  // Walk the reader from a list entry back to the spot on the daf it came from:
  // scroll it into view, then flag it just long enough to catch the eye.
  const locateRegion = useCallback((region: Region) => {
    setLocatedRegionId(region.id);
    const target =
      document.querySelector(`[data-region-id="${region.id}"]`) ??
      document.querySelector(`[data-badge-region-id="${region.id}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  useEffect(() => {
    if (!locatedRegionId) return;
    const timer = setTimeout(() => setLocatedRegionId(null), LOCATE_FLAG_MS);
    return () => clearTimeout(timer);
  }, [locatedRegionId]);

  const swipe = useSwipe({
    // RTL: dragging the page rightwards pulls the next daf in from the left.
    onSwipeLeft: () => goTo(siblings.prev, 'prev'),
    onSwipeRight: () => goTo(siblings.next, 'next'),
  });

  if (error) {
    return (
      <div className="surface-wood flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <p className="text-red-300">{error}</p>
          <Link to="/" className="text-gold underline">
            חזרה לספרייה
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-wood min-h-screen pb-28">
      <SiteHeader
        trailing={
          page && (
            <div className="hidden text-end sm:block">
              <p className="font-serif text-lg text-parchment">
                <DafTitle page={page} />
              </p>
              {siblings.total > 1 && (
                <p className="text-xs text-parchment/60">
                  דף {siblings.index} מתוך {siblings.total}
                </p>
              )}
            </div>
          )
        }
      />

      <main className="mx-auto max-w-4xl px-3 py-6 sm:px-6 sm:py-10" {...swipe}>
        {page && (
          <h1 className="mb-4 text-center font-serif text-2xl text-parchment sm:hidden">
            <DafTitle page={page} />
          </h1>
        )}

        {page && (
          <RegionLegend
            regions={page.regions}
            showAll={showAllRegions}
            onToggleShowAll={(next) => {
              setShowAllRegions(next);
              writeShowAllPreference(next);
            }}
            onLocateRegion={locateRegion}
            onOpenRegion={setActiveRegion}
          />
        )}

        {page ? (
          <DafTurner
            turnKey={page.id}
            direction={outgoing?.direction ?? 'next'}
            outgoing={
              outgoing
                ? {
                    key: outgoing.page.id,
                    content: (
                      <HotspotOverlay
                        imageUrl={outgoing.page.pageImageUrl}
                        imageAlt={formatPageTitle(outgoing.page)}
                        regions={[]}
                        onSelectRegion={() => {}}
                      />
                    ),
                  }
                : null
            }
          >
            <HotspotOverlay
              imageUrl={page.pageImageUrl}
              imageAlt={formatPageTitle(page)}
              regions={page.regions}
              onSelectRegion={setActiveRegion}
              activeRegionId={activeRegion?.id}
              showAll={showAllRegions}
              locatedRegionId={locatedRegionId}
            />
          </DafTurner>
        ) : (
          <div className="daf-sheet p-16 text-center text-ink-variant">פותח את הכרך…</div>
        )}
      </main>

      {page && (
        <DafNav
          prev={siblings.prev}
          next={siblings.next}
          onPrev={() => goTo(siblings.prev, 'prev')}
          onNext={() => goTo(siblings.next, 'next')}
        />
      )}

      {activeRegion && <ContentModal region={activeRegion} onClose={() => setActiveRegion(null)} />}
    </div>
  );
}

interface DafNavProps {
  prev: Page | null;
  next: Page | null;
  onPrev: () => void;
  onNext: () => void;
}

/** Docked so paging through a long daf never means scrolling back up to navigate. */
function DafNav({ prev, next, onPrev, onNext }: DafNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-gold/40 bg-wood-dark/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
        <TurnButton onClick={onPrev} target={prev} label="הדף הקודם" toward="start" />
        <Link to="/" className="shrink-0 text-xs text-parchment/60 underline hover:text-gold sm:text-sm">
          הספרייה
        </Link>
        <TurnButton onClick={onNext} target={next} label="הדף הבא" toward="end" alignEnd />
      </div>
    </nav>
  );
}

function TurnButton({
  onClick,
  target,
  label,
  toward,
  alignEnd,
}: {
  onClick: () => void;
  target: Page | null;
  label: string;
  toward: 'start' | 'end';
  alignEnd?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!target}
      aria-label={target ? `${label}: ${formatDaf(target)}` : `${label} (אין)`}
      className={`flex min-w-0 flex-1 items-center gap-2 rounded px-3 py-2 text-parchment transition enabled:hover:bg-white/10 disabled:opacity-30 ${
        alignEnd ? 'justify-end' : ''
      }`}
    >
      {!alignEnd && <Chevron toward={toward} className="h-5 w-5 shrink-0" />}
      <span className="min-w-0">
        <span className="block truncate text-[11px] uppercase tracking-wide text-parchment/60">{label}</span>
        <span className="block truncate font-serif text-base">{target ? formatDaf(target) : '—'}</span>
      </span>
      {alignEnd && <Chevron toward={toward} className="h-5 w-5 shrink-0" />}
    </button>
  );
}

// Revealing every hotspot is a deliberate choice, so it's off by default and
// remembered once made — a reader who wants the map shouldn't re-enable it on
// every daf.
const SHOW_ALL_KEY = 'gemara_show_all_regions';

/** Long enough to notice the flagged region, short enough not to nag. */
const LOCATE_FLAG_MS = 2600;

function readShowAllPreference(): boolean {
  try {
    return localStorage.getItem(SHOW_ALL_KEY) === '1';
  } catch {
    return false;
  }
}

function writeShowAllPreference(next: boolean): void {
  try {
    localStorage.setItem(SHOW_ALL_KEY, next ? '1' : '0');
  } catch {
    // No storage available: the choice simply doesn't persist.
  }
}

/** Horizontal swipe detection that ignores vertical scrolling and stray taps. */
function useSwipe({ onSwipeLeft, onSwipeRight }: { onSwipeLeft: () => void; onSwipeRight: () => void }) {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse') return; // dragging with a mouse shouldn't page
      start.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: React.PointerEvent) => {
      const from = start.current;
      start.current = null;
      if (!from) return;
      const dx = e.clientX - from.x;
      const dy = e.clientY - from.y;
      // Must be clearly horizontal, and long enough not to be a tap on a hotspot.
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) onSwipeLeft();
      else onSwipeRight();
    },
  };
}
