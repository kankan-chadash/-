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
import type { Page, PageWithRegions, Region } from '../types';
import type { CreatePageInput } from './client';
import { deleteFile, getFile, putRawFile, putTextFile, readFileAsBase64 } from './githubApi';

// Admin data layer for VITE_ADMIN_MODE=github builds: every read/write goes
// straight to the same client/public/data/** files the static viewer (see
// staticClient.ts) reads, via GitHub commits instead of a database. This is
// what lets the whole app — viewer AND admin — run with no backend at all.

const PAGES_INDEX_PATH = 'client/public/data/pages.json';
const pagePath = (id: string) => `client/public/data/pages/${id}.json`;
const imagePath = (filename: string) => `client/public/data/images/${filename}`;

function sortIndex(pages: Page[]): Page[] {
  return [...pages].sort(
    (a, b) => a.tractate.localeCompare(b.tractate) || a.daf - b.daf || a.side.localeCompare(b.side)
  );
}

async function readIndex(token: string): Promise<{ pages: Page[]; sha?: string }> {
  const file = await getFile(token, PAGES_INDEX_PATH);
  return { pages: file ? (JSON.parse(file.content) as Page[]) : [], sha: file?.sha };
}

export async function fetchAdminPages(token: string): Promise<Page[]> {
  const { pages } = await readIndex(token);
  return sortIndex(pages);
}

export async function fetchAdminPage(token: string, id: string): Promise<PageWithRegions> {
  const file = await getFile(token, pagePath(id));
  if (!file) throw new Error('Page not found');
  return JSON.parse(file.content) as PageWithRegions;
}

export async function createPage(token: string, input: CreatePageInput): Promise<PageWithRegions> {
  const { pages, sha } = await readIndex(token);
  if (pages.some((p) => p.tractate === input.tractate && p.daf === input.daf && p.side === input.side)) {
    throw new Error('A page with this tractate, daf, and side already exists');
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const page: Page = {
    id,
    tractate: input.tractate,
    daf: input.daf,
    side: input.side as Page['side'],
    pageImageUrl: input.pageImageUrl,
    imageWidth: input.imageWidth ?? null,
    imageHeight: input.imageHeight ?? null,
    createdAt: now,
    updatedAt: now,
  };
  const pageWithRegions: PageWithRegions = { ...page, regions: [] };

  await putTextFile(
    token,
    pagePath(id),
    JSON.stringify(pageWithRegions, null, 2),
    `Add page: ${input.tractate} ${input.daf}${input.side}`
  );
  await putTextFile(
    token,
    PAGES_INDEX_PATH,
    JSON.stringify(sortIndex([...pages, page]), null, 2),
    `Add page to index: ${input.tractate} ${input.daf}${input.side}`,
    sha
  );

  return pageWithRegions;
}

export async function updatePage(
  token: string,
  id: string,
  input: Partial<CreatePageInput>
): Promise<PageWithRegions> {
  const file = await getFile(token, pagePath(id));
  if (!file) throw new Error('Page not found');
  const existing = JSON.parse(file.content) as PageWithRegions;
  const merged: Page = {
    id: existing.id,
    tractate: input.tractate ?? existing.tractate,
    daf: input.daf ?? existing.daf,
    side: (input.side as Page['side'] | undefined) ?? existing.side,
    pageImageUrl: input.pageImageUrl ?? existing.pageImageUrl,
    imageWidth: input.imageWidth !== undefined ? input.imageWidth : existing.imageWidth,
    imageHeight: input.imageHeight !== undefined ? input.imageHeight : existing.imageHeight,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  const updated: PageWithRegions = { ...merged, regions: existing.regions };

  await putTextFile(token, pagePath(id), JSON.stringify(updated, null, 2), `Update page ${id}`, file.sha);

  const { pages, sha } = await readIndex(token);
  const nextIndex = pages.map((p) => (p.id === id ? merged : p));
  await putTextFile(token, PAGES_INDEX_PATH, JSON.stringify(sortIndex(nextIndex), null, 2), `Update page ${id} in index`, sha);

  return updated;
}

export async function deletePage(token: string, id: string): Promise<void> {
  const file = await getFile(token, pagePath(id));
  if (file) {
    await deleteFile(token, pagePath(id), file.sha, `Delete page ${id}`);
  }
  const { pages, sha } = await readIndex(token);
  if (sha) {
    await putTextFile(
      token,
      PAGES_INDEX_PATH,
      JSON.stringify(sortIndex(pages.filter((p) => p.id !== id)), null, 2),
      `Remove page ${id} from index`,
      sha
    );
  }
}

export async function saveRegions(token: string, pageId: string, regions: Region[]): Promise<PageWithRegions> {
  const file = await getFile(token, pagePath(pageId));
  if (!file) throw new Error('Page not found');
  const existing = JSON.parse(file.content) as PageWithRegions;
  const updated: PageWithRegions = { ...existing, regions, updatedAt: new Date().toISOString() };
  await putTextFile(
    token,
    pagePath(pageId),
    JSON.stringify(updated, null, 2),
    `Update regions for page ${pageId} (${regions.length} region${regions.length === 1 ? '' : 's'})`,
    file.sha
  );
  return updated;
}

export async function uploadImage(token: string, file: File): Promise<{ url: string }> {
  const base64 = await readFileAsBase64(file);
  const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '';
  const filename = `${crypto.randomUUID()}${ext}`;
  await putRawFile(token, imagePath(filename), base64, `Upload image ${filename}`);
  // Relative path, matching the convention the static viewer's resolveAsset() expects.
  return { url: `data/images/${filename}` };
}
