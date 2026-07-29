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

// A badge that lands on top of a letter hides the very text it points at. To
// avoid that we have to know where the ink actually is, which means reading the
// scan itself: the page is downscaled onto a canvas once, reduced to a
// coarse "is there ink here" grid, and every badge is then nudged sideways into
// the nearest gap. A daf always has channels — the margins and the gutters
// between the commentary columns — so a clear spot is never far away.

/** A coarse map of where a page image is dark. Coordinates are grid cells. */
export interface InkMap {
  width: number;
  height: number;
  /** 1 where the cell is ink, 0 where it's blank page. */
  cells: Uint8Array;
}

/** Wide enough to resolve the gutters of a daf, small enough to scan instantly. */
const GRID_WIDTH = 220;

/**
 * Downscales the image and marks which cells carry ink.
 *
 * Returns null when the pixels can't be read at all — a cross-origin image
 * taints the canvas, and an unreachable one never decodes. Callers fall back to
 * the unadjusted badge position, so a failure here costs placement quality and
 * nothing else.
 */
export async function buildInkMap(imageUrl: string): Promise<InkMap | null> {
  try {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.src = imageUrl;
    await image.decode();

    const naturalWidth = image.naturalWidth || 1;
    const naturalHeight = image.naturalHeight || 1;
    const width = Math.min(GRID_WIDTH, naturalWidth);
    const height = Math.max(1, Math.round((width / naturalWidth) * naturalHeight));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0, width, height);

    const { data } = ctx.getImageData(0, 0, width, height);
    const luminance = new Float32Array(width * height);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      // Rec. 601 luma is plenty for "is this paper or is this ink".
      luminance[p] = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    }

    // Scans vary from bright white to deep sepia, so the threshold is derived
    // from this page's own paper tone rather than being a fixed constant.
    const paper = percentile(luminance, 0.6);
    const threshold = Math.max(0.18, paper * 0.74);

    const cells = new Uint8Array(width * height);
    for (let p = 0; p < luminance.length; p++) {
      cells[p] = luminance[p] < threshold ? 1 : 0;
    }

    return { width, height, cells };
  } catch {
    return null;
  }
}

function percentile(values: Float32Array, fraction: number): number {
  // Histogram rather than a sort: same answer, no 50k-element copy.
  const buckets = new Uint32Array(64);
  for (let i = 0; i < values.length; i++) {
    buckets[Math.min(63, Math.max(0, Math.floor(values[i] * 64)))]++;
  }
  const target = values.length * fraction;
  let seen = 0;
  for (let b = 0; b < buckets.length; b++) {
    seen += buckets[b];
    if (seen >= target) return (b + 0.5) / 64;
  }
  return 1;
}

/** How much ink sits under a box, in cells. All arguments are percentages. */
function inkUnder(map: InkMap, xPct: number, yPct: number, wPct: number, hPct: number): number {
  const x0 = Math.max(0, Math.floor(((xPct - wPct / 2) / 100) * map.width));
  const x1 = Math.min(map.width - 1, Math.ceil(((xPct + wPct / 2) / 100) * map.width));
  const y0 = Math.max(0, Math.floor(((yPct - hPct / 2) / 100) * map.height));
  const y1 = Math.min(map.height - 1, Math.ceil(((yPct + hPct / 2) / 100) * map.height));

  let total = 0;
  for (let y = y0; y <= y1; y++) {
    const row = y * map.width;
    for (let x = x0; x <= x1; x++) total += map.cells[row + x];
  }
  return total;
}

export interface ClearSpotOptions {
  /** Badge footprint, as percentages of the image. */
  widthPct: number;
  heightPct: number;
  /** How far along x the badge may travel from its anchor, in percent. */
  maxShiftPct?: number;
}

/**
 * The nearest x to `anchorXPct`, on the same row, where the badge covers no ink.
 *
 * Candidates are tried in order of distance from the anchor, so the badge moves
 * as little as possible; the first genuinely clear spot wins. If the row is ink
 * all the way across — a solid block of text with no channel — it settles for
 * the emptiest spot found rather than pretending there was a clear one.
 */
export function findClearX(
  map: InkMap,
  anchorXPct: number,
  yPct: number,
  { widthPct, heightPct, maxShiftPct = 26 }: ClearSpotOptions
): number {
  const half = widthPct / 2;
  const min = half;
  const max = 100 - half;
  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  const anchor = clamp(anchorXPct);
  if (inkUnder(map, anchor, yPct, widthPct, heightPct) === 0) return anchor;

  const step = 100 / map.width; // one grid cell
  let best = anchor;
  let bestInk = inkUnder(map, anchor, yPct, widthPct, heightPct);

  for (let shift = step; shift <= maxShiftPct; shift += step) {
    // Both directions at each distance, so the closest clear spot wins
    // regardless of which side of the anchor it lies on.
    for (const candidate of [clamp(anchor - shift), clamp(anchor + shift)]) {
      const ink = inkUnder(map, candidate, yPct, widthPct, heightPct);
      if (ink === 0) return candidate;
      if (ink < bestInk) {
        bestInk = ink;
        best = candidate;
      }
    }
  }

  return best;
}
