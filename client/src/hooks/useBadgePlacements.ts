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
import { useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { PolygonCoordinates, RectangleCoordinates, Region } from '../types';
import { buildInkMap, findClearX } from '../utils/inkMap';
import type { InkMap } from '../utils/inkMap';
import { polygonCentre } from '../components/Overlay/regionTypes';

/** Where a badge should sit, in percentages of the page image. */
export interface BadgePlacement {
  x: number;
  y: number;
}

/** On-screen badge size, matching .hotspot-badge in index.css. */
const BADGE_PX = 17;
/** A little breathing room so the badge doesn't touch the letters it dodged. */
const BADGE_PADDING_PX = 3;

/** The spot a badge would take if nothing were in the way. */
function anchorFor(region: Region, badgeWPct: number, badgeHPct: number): BadgePlacement {
  if (region.shape === 'polygon') {
    return polygonCentre(region.coordinates as PolygonCoordinates);
  }
  const coords = region.coordinates as RectangleCoordinates;
  // The reading-order corner of the region: its right edge, since the page is RTL.
  return {
    x: coords.x + coords.width - badgeWPct / 2,
    y: coords.y + badgeHPct / 2,
  };
}

/**
 * Places each region's badge on a clear patch of page.
 *
 * The anchor is wherever the badge naturally belongs; if ink sits under it, the
 * badge slides along x to the nearest gap. Only x moves, so a badge stays on
 * the line it belongs to and never drifts away vertically from its region.
 *
 * Until the page has been analysed — and permanently, if it can't be — every
 * badge simply uses its anchor, so this only ever improves placement.
 */
export function useBadgePlacements(
  imageUrl: string,
  regions: Region[],
  containerRef: RefObject<HTMLElement | null>
): Map<string, BadgePlacement> {
  const [inkMap, setInkMap] = useState<InkMap | null>(null);
  const [renderedWidth, setRenderedWidth] = useState(0);
  const analysedUrl = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    analysedUrl.current = imageUrl;
    setInkMap(null);
    buildInkMap(imageUrl).then((map) => {
      // A turn may have moved us on before the analysis finished.
      if (!cancelled && analysedUrl.current === imageUrl) setInkMap(map);
    });
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  // The badge is a fixed pixel size, so how much of the page it covers depends
  // on how wide the page is drawn — which changes with the viewport.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const update = () => setRenderedWidth(element.getBoundingClientRect().width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef]);

  return useMemo(() => {
    const placements = new Map<string, BadgePlacement>();
    const footprintPx = BADGE_PX + BADGE_PADDING_PX * 2;
    // Before the first measurement, assume a typical reading width.
    const widthPct = (footprintPx / Math.max(renderedWidth || 700, 1)) * 100;

    for (const region of regions) {
      // The map's cells are square in image space, so the badge's height in
      // percent-of-height equals its width in percent-of-width scaled by aspect.
      const heightPct = inkMap ? widthPct * (inkMap.width / inkMap.height) : widthPct;
      const anchor = anchorFor(region, widthPct, heightPct);

      placements.set(
        region.id,
        inkMap
          ? { x: findClearX(inkMap, anchor.x, anchor.y, { widthPct, heightPct }), y: anchor.y }
          : anchor
      );
    }
    return placements;
  }, [inkMap, regions, renderedWidth]);
}
