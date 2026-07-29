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
import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/Layout/SiteHeader';
import { routes } from '../routes';

export function NotFound() {
  return (
    <div className="surface-wood flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-20 text-center">
        <p className="font-serif text-5xl text-gold/70">404</p>
        <h1 className="font-serif text-2xl text-parchment">הדף לא נמצא</h1>
        <p className="max-w-sm text-parchment/70">
          הכתובת שהגעתם אליה אינה קיימת. אפשר לחזור לספרייה ולבחור כרך.
        </p>
        <Link
          to={routes.library}
          className="rounded bg-gold px-5 py-2.5 font-semibold text-wood-dark transition hover:brightness-95"
        >
          חזרה לספרייה
        </Link>
      </main>
    </div>
  );
}
