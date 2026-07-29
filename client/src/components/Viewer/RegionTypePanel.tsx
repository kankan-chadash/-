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
import { useEffect, useRef } from 'react';
import type { ContentType, Region } from '../../types';
import {
  REGION_TYPE_LABELS,
  RegionTypeIcon,
  regionTypeClass,
} from '../Overlay/regionTypes';

const PANEL_TITLES: Record<ContentType, string> = {
  video: 'הסרטונים שבדף',
  text: 'ההסברים שבדף',
  image: 'התמונות שבדף',
};

interface RegionTypePanelProps {
  contentType: ContentType;
  regions: Region[];
  /** Point the reader at where this one sits on the daf. */
  onLocate: (region: Region) => void;
  /** Open its content outright. */
  onOpen: (region: Region) => void;
  onClose: () => void;
}

/**
 * Everything of one kind that this daf holds, in one list.
 *
 * The badges say what's on the page but not what's in it; this answers "which
 * videos are here?" without hunting the daf for teal squares. Choosing one
 * walks the reader back to the spot it was taken from.
 */
export function RegionTypePanel({
  contentType,
  regions,
  onLocate,
  onOpen,
  onClose,
}: RegionTypePanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="region-panel-backdrop" onClick={onClose}>
      <div
        ref={panelRef}
        className={`region-panel ${regionTypeClass(contentType)}`}
        role="dialog"
        aria-modal="true"
        aria-label={PANEL_TITLES[contentType]}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="region-panel-head">
          <span className="legend-swatch">
            <RegionTypeIcon contentType={contentType} />
          </span>
          <h2 className="font-serif text-lg text-parchment">{PANEL_TITLES[contentType]}</h2>
          <span className="ms-auto text-sm text-parchment/50">{regions.length}</span>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="סגירה" className="region-panel-close">
            ✕
          </button>
        </header>

        {regions.length === 0 ? (
          <p className="p-5 text-center text-sm text-parchment/60">
            אין בדף אזורים מסוג {REGION_TYPE_LABELS[contentType]}.
          </p>
        ) : (
          <ul className="region-panel-list">
            {regions.map((region, i) => (
              <li key={region.id}>
                <div className="region-panel-row">
                  <button
                    type="button"
                    onClick={() => onLocate(region)}
                    className="region-panel-locate"
                    title="הצגת האזור בדף"
                  >
                    <span className="region-panel-index">{i + 1}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-parchment">
                        {region.title || `${REGION_TYPE_LABELS[contentType]} ללא כותרת`}
                      </span>
                      {contentType === 'text' && (
                        <span className="block truncate text-xs text-parchment/50">
                          {plainTextOf(region.content)}
                        </span>
                      )}
                    </span>
                  </button>
                  <button type="button" onClick={() => onOpen(region)} className="region-panel-open">
                    צפייה
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="region-panel-foot">לחיצה על פריט תסמן את מיקומו בדף.</p>
      </div>
    </div>
  );
}

/** A one-line preview of a text region, with its markup stripped. */
function plainTextOf(html: string): string {
  // Parsed rather than regex-stripped, and into an inert document — nothing
  // here runs scripts or loads resources.
  const text = new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '';
  return text.replace(/\s+/g, ' ').trim();
}
