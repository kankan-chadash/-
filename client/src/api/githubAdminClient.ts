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
import type {
  Page,
  PageWithRegions,
  Region,
  UpcomingBook,
  UpcomingBookInput,
  Video,
  VideoInput,
} from '../types';
import type { CreatePageInput } from './client';
import { deleteFile, getFile, putRawFile, putTextFile, readFileAsBase64 } from './githubApi';

// Admin data layer for VITE_ADMIN_MODE=github builds: every read/write goes
// straight to the same client/public/data/** files the static viewer (see
// staticClient.ts) reads, via GitHub commits instead of a database. This is
// what lets the whole app — viewer AND admin — run with no backend at all.

const PAGES_INDEX_PATH = 'client/public/data/pages.json';
const pagePath = (id: string) => `client/public/data/pages/${id}.json`;
const imagePath = (filename: string) => `client/public/data/images/${filename}`;
const VIDEOS_PATH = 'client/public/data/videos.json';
const UPCOMING_PATH = 'client/public/data/upcoming.json';

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
  if (!file) throw new Error('הדף לא נמצא');
  return JSON.parse(file.content) as PageWithRegions;
}

export async function createPage(token: string, input: CreatePageInput): Promise<PageWithRegions> {
  const { pages, sha } = await readIndex(token);
  if (pages.some((p) => p.tractate === input.tractate && p.daf === input.daf && p.side === input.side)) {
    throw new Error('כבר קיים דף עם אותה מסכת, דף ועמוד');
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
  if (!file) throw new Error('הדף לא נמצא');
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
  if (!file) throw new Error('הדף לא נמצא');
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

// --- Standalone videos (the rail on /videos) ---

async function readVideos(token: string): Promise<{ videos: Video[]; sha?: string }> {
  const file = await getFile(token, VIDEOS_PATH);
  return { videos: file ? (JSON.parse(file.content) as Video[]) : [], sha: file?.sha };
}

function sortVideos(videos: Video[]): Video[] {
  return [...videos].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
}

async function writeVideos(token: string, videos: Video[], sha: string | undefined, message: string) {
  await putTextFile(token, VIDEOS_PATH, JSON.stringify(sortVideos(videos), null, 2), message, sha);
}

export async function fetchAdminVideos(token: string): Promise<Video[]> {
  const { videos } = await readVideos(token);
  return sortVideos(videos);
}

export async function createVideo(token: string, input: VideoInput): Promise<Video> {
  const { videos, sha } = await readVideos(token);
  const now = new Date().toISOString();
  const video: Video = {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description ?? null,
    url: input.url,
    // Append to the end of the rail unless a position was given.
    sortOrder: input.sortOrder ?? videos.reduce((max, v) => Math.max(max, v.sortOrder), -1) + 1,
    createdAt: now,
    updatedAt: now,
  };
  await writeVideos(token, [...videos, video], sha, `Add video: ${input.title}`);
  return video;
}

export async function updateVideo(token: string, id: string, input: Partial<VideoInput>): Promise<Video> {
  const { videos, sha } = await readVideos(token);
  const existing = videos.find((v) => v.id === id);
  if (!existing) throw new Error('הסרטון לא נמצא');
  const updated: Video = {
    ...existing,
    title: input.title ?? existing.title,
    description: input.description !== undefined ? input.description : existing.description,
    url: input.url ?? existing.url,
    sortOrder: input.sortOrder ?? existing.sortOrder,
    updatedAt: new Date().toISOString(),
  };
  await writeVideos(
    token,
    videos.map((v) => (v.id === id ? updated : v)),
    sha,
    `Update video: ${updated.title}`
  );
  return updated;
}

export async function deleteVideo(token: string, id: string): Promise<void> {
  const { videos, sha } = await readVideos(token);
  if (!videos.some((v) => v.id === id)) return;
  await writeVideos(token, videos.filter((v) => v.id !== id), sha, `Delete video ${id}`);
}

// --- Upcoming volumes (the greyed-out spines on the shelf) ---

async function readUpcoming(token: string): Promise<{ books: UpcomingBook[]; sha?: string }> {
  const file = await getFile(token, UPCOMING_PATH);
  return { books: file ? (JSON.parse(file.content) as UpcomingBook[]) : [], sha: file?.sha };
}

function sortUpcoming(books: UpcomingBook[]): UpcomingBook[] {
  return [...books].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
}

async function writeUpcoming(token: string, books: UpcomingBook[], sha: string | undefined, message: string) {
  await putTextFile(token, UPCOMING_PATH, JSON.stringify(sortUpcoming(books), null, 2), message, sha);
}

export async function fetchAdminUpcomingBooks(token: string): Promise<UpcomingBook[]> {
  const { books } = await readUpcoming(token);
  return sortUpcoming(books);
}

export async function createUpcomingBook(token: string, input: UpcomingBookInput): Promise<UpcomingBook> {
  const { books, sha } = await readUpcoming(token);
  const now = new Date().toISOString();
  const book: UpcomingBook = {
    id: crypto.randomUUID(),
    tractate: input.tractate,
    note: input.note ?? null,
    sortOrder: input.sortOrder ?? books.reduce((max, b) => Math.max(max, b.sortOrder), -1) + 1,
    createdAt: now,
    updatedAt: now,
  };
  await writeUpcoming(token, [...books, book], sha, `Announce upcoming volume: ${input.tractate}`);
  return book;
}

export async function updateUpcomingBook(
  token: string,
  id: string,
  input: Partial<UpcomingBookInput>
): Promise<UpcomingBook> {
  const { books, sha } = await readUpcoming(token);
  const existing = books.find((b) => b.id === id);
  if (!existing) throw new Error('הכרך לא נמצא');
  const updated: UpcomingBook = {
    ...existing,
    tractate: input.tractate ?? existing.tractate,
    note: input.note !== undefined ? input.note : existing.note,
    sortOrder: input.sortOrder ?? existing.sortOrder,
    updatedAt: new Date().toISOString(),
  };
  await writeUpcoming(
    token,
    books.map((b) => (b.id === id ? updated : b)),
    sha,
    `Update upcoming volume: ${updated.tractate}`
  );
  return updated;
}

export async function deleteUpcomingBook(token: string, id: string): Promise<void> {
  const { books, sha } = await readUpcoming(token);
  if (!books.some((b) => b.id === id)) return;
  await writeUpcoming(token, books.filter((b) => b.id !== id), sha, `Remove upcoming volume ${id}`);
}
