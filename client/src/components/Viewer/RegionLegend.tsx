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
import type { ContentType } from '../../types';
import {
  REGION_TYPE_LABELS,
  RegionTypeIcon,
  regionTypeClass,
} from '../Overlay/regionTypes';

const TYPES: ContentType[] = ['video', 'text', 'image'];

interface RegionLegendProps {
  showAll: boolean;
  onToggleShowAll: (next: boolean) => void;
  /** How many hotspots this daf has; the row is pointless when there are none. */
  regionCount: number;
}

/** Says what the badges on the daf mean, and offers to outline them all. */
export function RegionLegend({ showAll, onToggleShowAll, regionCount }: RegionLegendProps) {
  if (regionCount === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {TYPES.map((type) => (
          <span key={type} className={`legend-chip ${regionTypeClass(type)}`}>
            <span className="legend-swatch">
              <RegionTypeIcon contentType={type} />
            </span>
            {REGION_TYPE_LABELS[type]}
          </span>
        ))}
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
  );
}
