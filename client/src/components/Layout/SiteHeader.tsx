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
import { useGuide } from '../Onboarding/GuideContext';

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
  const { open: openGuide } = useGuide();

  return (
    <header className="sticky top-0 z-40 relative bg-wood-dark/95 shadow-lg shadow-black/40 backdrop-blur">
      {/* A drawn rule rather than a flat border: it fades at the edges like an
          inlay, which reads far better against the wood than a hard line. */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-gold/70 to-transparent"
      />
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

        <div className="ms-auto flex items-center gap-2">
          {trailing}
          <button
            type="button"
            onClick={openGuide}
            aria-label="פתיחת המדריך"
            title="איך זה עובד?"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/40 text-sm text-gold/80 transition hover:bg-gold/15 hover:text-gold"
          >
            ?
          </button>
        </div>
      </div>
    </header>
  );
}
