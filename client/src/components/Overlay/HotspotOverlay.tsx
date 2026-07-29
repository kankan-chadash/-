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
import type { CSSProperties } from 'react';
import type { PolygonCoordinates, RectangleCoordinates, Region } from '../../types';
import {
  REGION_TYPE_LABELS,
  RegionTypeIcon,
  polygonCentre,
  regionAriaLabel,
  regionTypeClass,
} from './regionTypes';

interface HotspotOverlayProps {
  imageUrl: string;
  imageAlt: string;
  regions: Region[];
  onSelectRegion: (region: Region) => void;
  activeRegionId?: string | null;
  /** Outline every hotspot in full, rather than only marking it with a badge. */
  showAll?: boolean;
}

/**
 * Coordinates are stored as percentages of the image's natural width/height, so
 * both the rectangle divs (CSS %) and the polygon SVG (viewBox 0 0 100 100,
 * preserveAspectRatio="none") stay perfectly aligned across any screen size
 * without needing a resize listener — the browser recomputes percentages on layout.
 *
 * Each hotspot carries a small badge marking what it holds — a video, an
 * explanation, or a picture — so a reader can tell them apart without clicking.
 * The region body itself stays discreet until hovered, unless `showAll` is on.
 */
export function HotspotOverlay({
  imageUrl,
  imageAlt,
  regions,
  onSelectRegion,
  activeRegionId,
  showAll = false,
}: HotspotOverlayProps) {
  const rectangles = regions.filter((r) => r.shape === 'rectangle');
  const polygons = regions.filter((r) => r.shape === 'polygon');

  function stateClass(region: Region): string {
    return [
      'hotspot-region',
      regionTypeClass(region.contentType),
      region.id === activeRegionId ? 'is-active' : '',
      showAll ? 'is-revealed' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  return (
    <div className="relative w-full leading-none select-none">
      <img src={imageUrl} alt={imageAlt} className="block w-full h-auto" draggable={false} />

      {rectangles.map((region) => {
        const coords = region.coordinates as RectangleCoordinates;
        const style: CSSProperties = {
          left: `${coords.x}%`,
          top: `${coords.y}%`,
          width: `${coords.width}%`,
          height: `${coords.height}%`,
        };
        return (
          <div
            key={region.id}
            role="button"
            tabIndex={0}
            aria-label={regionAriaLabel(region)}
            className={stateClass(region)}
            style={style}
            onClick={() => onSelectRegion(region)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectRegion(region);
              }
            }}
          >
            <span className="hotspot-badge" aria-hidden>
              <RegionTypeIcon contentType={region.contentType} />
            </span>
          </div>
        );
      })}

      {polygons.length > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {polygons.map((region) => {
            const points = (region.coordinates as PolygonCoordinates)
              .map((p) => `${p.x},${p.y}`)
              .join(' ');
            return (
              <polygon
                key={region.id}
                points={points}
                className={stateClass(region)}
                vectorEffect="non-scaling-stroke"
                tabIndex={0}
                role="button"
                aria-label={regionAriaLabel(region)}
                onClick={() => onSelectRegion(region)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectRegion(region);
                  }
                }}
              />
            );
          })}
        </svg>
      )}

      {/* Polygon badges live outside the SVG: inside it they'd be stretched by
          preserveAspectRatio="none" along with the shapes they sit on. */}
      {polygons.map((region) => {
        const centre = polygonCentre(region.coordinates as PolygonCoordinates);
        return (
          <span
            key={`${region.id}-badge`}
            aria-hidden
            title={REGION_TYPE_LABELS[region.contentType]}
            className={`hotspot-badge hotspot-badge-floating ${regionTypeClass(region.contentType)} ${
              showAll ? 'is-revealed' : ''
            }`}
            style={{ left: `${centre.x}%`, top: `${centre.y}%` }}
            onClick={() => onSelectRegion(region)}
          >
            <RegionTypeIcon contentType={region.contentType} />
          </span>
        );
      })}
    </div>
  );
}
