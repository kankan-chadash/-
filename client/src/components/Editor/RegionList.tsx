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
import type { EditableRegion } from './types';

interface RegionListProps {
  regions: EditableRegion[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function RegionList({ regions, selectedId, onSelect }: RegionListProps) {
  if (regions.length === 0) {
    return <p className="text-sm text-ink-variant">No regions yet — draw one on the image.</p>;
  }

  return (
    <ul className="space-y-1 max-h-48 overflow-auto">
      {regions.map((region, index) => (
        <li key={region.id}>
          <button
            type="button"
            onClick={() => onSelect(region.id)}
            className={`w-full text-left px-3 py-2 rounded text-sm flex items-center justify-between ${
              region.id === selectedId ? 'bg-gold/25 text-wood-dark font-semibold' : 'hover:bg-black/5'
            }`}
          >
            <span>
              {index + 1}. {region.title || `Untitled ${region.shape}`}
            </span>
            <span className="text-xs uppercase text-ink-variant">{region.contentType}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
