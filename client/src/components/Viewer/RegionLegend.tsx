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
import { useState } from 'react';
import type { ContentType, Region } from '../../types';
import {
  REGION_TYPE_LABELS,
  RegionTypeIcon,
  regionTypeClass,
} from '../Overlay/regionTypes';
import { RegionTypePanel } from './RegionTypePanel';

const TYPES: ContentType[] = ['video', 'text', 'image'];

interface RegionLegendProps {
  regions: Region[];
  showAll: boolean;
  onToggleShowAll: (next: boolean) => void;
  /** Point the reader at where a region sits on the daf. */
  onLocateRegion: (region: Region) => void;
  /** Open a region's content. */
  onOpenRegion: (region: Region) => void;
}

/**
 * Says what the badges on the daf mean, and offers to outline them all.
 *
 * Each entry is also a way in: choosing one lists every region of that kind on
 * this daf, so "which videos are here?" is answerable without hunting the page.
 */
export function RegionLegend({
  regions,
  showAll,
  onToggleShowAll,
  onLocateRegion,
  onOpenRegion,
}: RegionLegendProps) {
  const [browsing, setBrowsing] = useState<ContentType | null>(null);

  if (regions.length === 0) return null;

  const byType = (type: ContentType) => regions.filter((r) => r.contentType === type);

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {TYPES.map((type) => {
            const count = byType(type).length;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setBrowsing(type)}
                disabled={count === 0}
                aria-label={`${REGION_TYPE_LABELS[type]} — ${count} בדף, לחצו לרשימה`}
                className={`legend-chip ${regionTypeClass(type)} ${
                  count > 0 ? 'legend-chip-active' : 'legend-chip-empty'
                }`}
              >
                <span className="legend-swatch">
                  <RegionTypeIcon contentType={type} />
                </span>
                {REGION_TYPE_LABELS[type]}
                <span className="legend-count">{count}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={showAll}
          onClick={() => onToggleShowAll(!showAll)}
          className={`rounded-full border px-3 py-1.5 text-xs transition ${
            showAll
              ? 'border-gold bg-gold/20 font-semibold text-gold'
              : 'border-parchment/25 text-parchment/70 hover:border-gold/60 hover:text-gold'
          }`}
        >
          {showAll ? 'הסתרת סימון האזורים' : 'הצגת כל האזורים בדף'}
        </button>
      </div>

      {browsing && (
        <RegionTypePanel
          contentType={browsing}
          regions={byType(browsing)}
          onLocate={(region) => {
            setBrowsing(null);
            onLocateRegion(region);
          }}
          onOpen={(region) => {
            setBrowsing(null);
            onOpenRegion(region);
          }}
          onClose={() => setBrowsing(null)}
        />
      )}
    </>
  );
}
