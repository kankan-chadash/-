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

interface HotspotOverlayProps {
  imageUrl: string;
  imageAlt: string;
  regions: Region[];
  onSelectRegion: (region: Region) => void;
  activeRegionId?: string | null;
}

/**
 * Coordinates are stored as percentages of the image's natural width/height, so
 * both the rectangle divs (CSS %) and the polygon SVG (viewBox 0 0 100 100,
 * preserveAspectRatio="none") stay perfectly aligned across any screen size
 * without needing a resize listener — the browser recomputes percentages on layout.
 */
export function HotspotOverlay({
  imageUrl,
  imageAlt,
  regions,
  onSelectRegion,
  activeRegionId,
}: HotspotOverlayProps) {
  const rectangles = regions.filter((r) => r.shape === 'rectangle');
  const polygons = regions.filter((r) => r.shape === 'polygon');

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
            aria-label={region.title ?? 'Hotspot region'}
            className={`hotspot-region${region.id === activeRegionId ? ' is-active' : ''}`}
            style={style}
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
                className={`hotspot-region${region.id === activeRegionId ? ' is-active' : ''}`}
                vectorEffect="non-scaling-stroke"
                tabIndex={0}
                role="button"
                aria-label={region.title ?? 'Hotspot region'}
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
    </div>
  );
}
