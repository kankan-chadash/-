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

// Every route in one place, so the admin area can be moved by editing a single
// line instead of hunting for stragglers across links, redirects, and guards.

/**
 * The admin area lives under a Hebrew segment rather than the guessable
 * /admin, to keep it out of the way of casual visitors.
 *
 * This is obscurity, not access control, and it is not what keeps the site
 * safe: anyone who reaches the page still cannot change anything without a
 * GitHub token that can push to the repo, and GitHub — not this app — is what
 * rejects them. Treat the path as tidiness, and the token as the lock.
 */
export const ADMIN_ROOT = '/הנהלה';

export const routes = {
  library: '/',
  daf: (pageId: string) => `/view/${pageId}`,
  dafPattern: '/view/:pageId',
  videos: '/videos',

  admin: ADMIN_ROOT,
  adminLogin: `${ADMIN_ROOT}/כניסה`,
  adminPage: (pageId: string) => `${ADMIN_ROOT}/דפים/${pageId}`,
  adminPagePattern: `${ADMIN_ROOT}/דפים/:pageId`,
  adminVideos: `${ADMIN_ROOT}/סרטונים`,
  adminUpcoming: `${ADMIN_ROOT}/בקרוב`,
} as const;

/** True for any path inside the admin area, however it was reached. */
export function isAdminPath(pathname: string): boolean {
  // Router pathnames may arrive percent-encoded depending on how the URL was
  // entered, so compare on the decoded form.
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // Malformed escape sequence — fall back to the raw value.
  }
  return decoded.startsWith(ADMIN_ROOT);
}
