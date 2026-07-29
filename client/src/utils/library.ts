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
import type { Page } from '../types';
import { amudLabel, toGematria } from './gematria';

// Turns the flat published page list into the shelf-of-volumes model the viewer
// presents: one "book" per tractate, its dapim in reading order.

export interface Book {
  tractate: string;
  pages: Page[];
  /** The daf a click on the spine opens — the lowest daf/amud published for this tractate. */
  firstPage: Page;
}

/** Reading order within a tractate: daf ascending, amud a before b. */
export function comparePages(a: Page, b: Page): number {
  return a.daf - b.daf || a.side.localeCompare(b.side);
}

export function groupIntoBooks(pages: Page[]): Book[] {
  const byTractate = new Map<string, Page[]>();
  for (const page of pages) {
    const existing = byTractate.get(page.tractate);
    if (existing) existing.push(page);
    else byTractate.set(page.tractate, [page]);
  }

  return [...byTractate.entries()]
    .map(([tractate, tractatePages]) => {
      const sorted = [...tractatePages].sort(comparePages);
      return { tractate, pages: sorted, firstPage: sorted[0] };
    })
    .sort((a, b) => a.tractate.localeCompare(b.tractate, 'he'));
}

export interface Siblings {
  prev: Page | null;
  next: Page | null;
  /** 1-based position of the current daf within its tractate, for "3 of 12". */
  index: number;
  total: number;
}

/** Previous/next daf within the same tractate — the volume is the unit you page through. */
export function findSiblings(pages: Page[], current: Page): Siblings {
  const volume = pages.filter((p) => p.tractate === current.tractate).sort(comparePages);
  const i = volume.findIndex((p) => p.id === current.id);
  if (i === -1) return { prev: null, next: null, index: 0, total: volume.length };
  return {
    prev: i > 0 ? volume[i - 1] : null,
    next: i < volume.length - 1 ? volume[i + 1] : null,
    index: i + 1,
    total: volume.length,
  };
}

/** How the daf is said: נ״ד ע״א. The stored number is only ever for sorting. */
export function formatDaf(page: Pick<Page, 'daf' | 'side'>): string {
  return `${toGematria(page.daf)} ${amudLabel(page.side)}`;
}

/** Plain-string title, for alt text and aria-labels. Use <DafTitle> for anything on screen. */
export function formatPageTitle(page: Pick<Page, 'tractate' | 'daf' | 'side'>): string {
  return `${page.tractate} ${formatDaf(page)}`;
}

// --- Spine appearance -------------------------------------------------------

const LEATHERS = [
  'leather-brown',
  'leather-red',
  'leather-blue',
  'leather-green',
  'leather-black',
] as const;

/** Stable hash so a given tractate always gets the same binding, across reloads and devices. */
function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export interface SpineStyle {
  leather: string;
  /** Percent of the shelf's usable height, so the row looks hand-shelved rather than uniform. */
  heightPct: number;
  widthPx: number;
  /** Slight lean for the last book on a shelf, like a volume resting against nothing. */
  tilted: boolean;
}

export function spineStyle(tractate: string, isLastOnShelf: boolean): SpineStyle {
  const h = hash(tractate);
  return {
    leather: LEATHERS[h % LEATHERS.length],
    heightPct: 74 + (h % 5) * 4, // 74%..90%
    widthPx: 56 + (h % 4) * 10, // 56px..86px
    tilted: isLastOnShelf,
  };
}

/** Books are laid out across fixed-size shelves so each row can sit on its own plank. */
export function chunkIntoShelves<T>(items: T[], perShelf: number): T[][] {
  const shelves: T[][] = [];
  for (let i = 0; i < items.length; i += perShelf) {
    shelves.push(items.slice(i, i + perShelf));
  }
  return shelves;
}
