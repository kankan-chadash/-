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
import { Link, useLocation } from 'react-router-dom';
import logoUrl from '../../assets/logo.png';

interface SiteHeaderProps {
  /** Rendered at the end of the bar — page-specific controls (מיקום הדף וכו'). */
  trailing?: ReactNode;
}

const NAV = [
  { to: '/', label: 'הספרייה' },
  { to: '/videos', label: 'סרטונים' },
];

export function SiteHeader({ trailing }: SiteHeaderProps) {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-gold/40 bg-wood-dark/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-3 text-gold transition hover:brightness-110"
          aria-label="שולחן הלימוד — לספרייה"
        >
          <img
            src={logoUrl}
            alt=""
            className="h-10 w-10 rounded border border-gold/40 bg-parchment object-contain p-0.5"
          />
          <span className="hidden font-serif text-lg sm:inline sm:text-xl">שולחן הלימוד</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((item) => {
            const active = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={`rounded px-3 py-1.5 transition ${
                  active
                    ? 'bg-gold/15 font-semibold text-gold'
                    : 'text-parchment/70 hover:bg-white/5 hover:text-gold'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto">{trailing}</div>
      </div>
    </header>
  );
}
