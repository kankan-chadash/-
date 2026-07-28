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
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface SiteHeaderProps {
  /** Rendered at the end of the bar — page-specific controls (daf position, etc.). */
  trailing?: ReactNode;
}

export function SiteHeader({ trailing }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-gold/40 bg-wood-dark/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-3 text-gold transition hover:brightness-110"
          aria-label="The Scholar's Study Table — back to the library"
        >
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded border border-gold/40 bg-wood text-lg"
          >
            📖
          </span>
          <span className="font-serif text-lg sm:text-xl">The Scholar's Study Table</span>
        </Link>
        {trailing}
      </div>
    </header>
  );
}
