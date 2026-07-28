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
import type { Page, PageWithRegions, Video } from '../types';

// Reads data pre-exported by `server/src/scripts/exportStatic.ts` (see README).
// Used instead of api/client.ts when built with `npm run build:pages`, since a
// static host like GitHub Pages can't run the Express/SQLite backend.

const BASE = import.meta.env.BASE_URL;

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//.test(value);
}

/** Exported asset paths are stored relative (e.g. "data/images/x.png"); resolve them against the site base. */
function resolveAsset(path: string): string {
  return isAbsoluteUrl(path) ? path : `${BASE}${path}`;
}

function resolvePage(page: Page): Page {
  return { ...page, pageImageUrl: resolveAsset(page.pageImageUrl) };
}

function resolvePageWithRegions(page: PageWithRegions): PageWithRegions {
  return {
    ...page,
    pageImageUrl: resolveAsset(page.pageImageUrl),
    regions: page.regions.map((region) =>
      region.contentType === 'image' ? { ...region, content: resolveAsset(region.content) } : region
    ),
  };
}

export async function fetchPages(): Promise<Page[]> {
  const res = await fetch(`${BASE}data/pages.json`);
  if (!res.ok) throw new Error('טעינת הדפים נכשלה');
  const pages: Page[] = await res.json();
  return pages.map(resolvePage);
}

export async function fetchPage(id: string): Promise<PageWithRegions> {
  const res = await fetch(`${BASE}data/pages/${id}.json`);
  if (!res.ok) throw new Error('הדף לא נמצא');
  const page: PageWithRegions = await res.json();
  return resolvePageWithRegions(page);
}

/** The videos rail. Absent videos.json just means none have been published yet. */
export async function fetchVideos(): Promise<Video[]> {
  const res = await fetch(`${BASE}data/videos.json`);
  if (res.status === 404) return [];
  if (!res.ok) throw new Error('טעינת הסרטונים נכשלה');
  return (await res.json()) as Video[];
}
