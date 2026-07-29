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
import type { ContentType, PolygonCoordinates, Region } from '../../types';

// What each kind of hotspot looks like. Colour alone would fail anyone who
// can't distinguish these hues, so every type also carries its own glyph —
// the icon is the signal, the colour reinforces it.

export const REGION_TYPE_LABELS: Record<ContentType, string> = {
  video: 'סרטון',
  text: 'הסבר',
  image: 'תמונה',
};

/** Maps to the .hotspot-<type> rules in index.css. */
export function regionTypeClass(contentType: ContentType): string {
  return `hotspot-${contentType}`;
}

export function RegionTypeIcon({ contentType }: { contentType: ContentType }) {
  const common = {
    viewBox: '0 0 24 24',
    'aria-hidden': true as const,
    className: 'h-full w-full',
  };

  if (contentType === 'video') {
    return (
      <svg {...common} fill="currentColor">
        <path d="M8 5.5v13l11-6.5z" />
      </svg>
    );
  }

  if (contentType === 'image') {
    return (
      <svg {...common} fill="currentColor">
        <path d="M3 5.5h18v13H3zM3 15l5-5 4 4 3-3 6 6v2.5H3z" />
        <circle cx="8.5" cy="9.5" r="1.8" />
      </svg>
    );
  }

  // text
  return (
    <svg {...common} fill="currentColor">
      <path d="M4 5.5h16v2.4H4zM4 10.8h16v2.4H4zM4 16.1h10v2.4H4z" />
    </svg>
  );
}

/**
 * Where to pin a polygon's badge: the average of its vertices. Good enough for
 * the broadly convex shapes drawn over a daf, and far simpler than a true
 * centroid — nothing here depends on it being exact.
 */
export function polygonCentre(points: PolygonCoordinates): { x: number; y: number } {
  const total = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: total.x / points.length, y: total.y / points.length };
}

/** Spoken description of a hotspot, so its type is announced, not just its title. */
export function regionAriaLabel(region: Region): string {
  const type = REGION_TYPE_LABELS[region.contentType];
  return region.title ? `${type}: ${region.title}` : `אזור ${type}`;
}
