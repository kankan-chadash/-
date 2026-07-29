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
import { putRawFile, readFileAsBase64, readJsonFile, removeJsonFile, updateJsonFile } from './githubApi';

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

export async function fetchAdminPages(token: string): Promise<Page[]> {
  return sortIndex((await readJsonFile<Page[]>(token, PAGES_INDEX_PATH)) ?? []);
}

export async function fetchAdminPage(token: string, id: string): Promise<PageWithRegions> {
  const page = await readJsonFile<PageWithRegions>(token, pagePath(id));
  if (!page) throw new Error('הדף לא נמצא');
  return page;
}

export async function createPage(token: string, input: CreatePageInput): Promise<PageWithRegions> {
  const existingIndex = (await readJsonFile<Page[]>(token, PAGES_INDEX_PATH)) ?? [];
  if (existingIndex.some((p) => p.tractate === input.tractate && p.daf === input.daf && p.side === input.side)) {
    throw new Error('כבר קיים דף עם אותה מסכת, דף ועמוד');
  }

  // Fixed before the first attempt: a retry must add the same page, not a new one.
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
  const label = `${input.tractate} ${input.daf}${input.side}`;

  await updateJsonFile<PageWithRegions>(token, pagePath(id), () => pageWithRegions, `Add page: ${label}`);
  await updateJsonFile<Page[]>(
    token,
    PAGES_INDEX_PATH,
    (index) => sortIndex([...(index ?? []).filter((p) => p.id !== id), page]),
    `Add page to index: ${label}`
  );

  return pageWithRegions;
}

export async function updatePage(
  token: string,
  id: string,
  input: Partial<CreatePageInput>
): Promise<PageWithRegions> {
  const updatedAt = new Date().toISOString();

  const merge = (existing: Page): Page => ({
    id: existing.id,
    tractate: input.tractate ?? existing.tractate,
    daf: input.daf ?? existing.daf,
    side: (input.side as Page['side'] | undefined) ?? existing.side,
    pageImageUrl: input.pageImageUrl ?? existing.pageImageUrl,
    imageWidth: input.imageWidth !== undefined ? input.imageWidth : existing.imageWidth,
    imageHeight: input.imageHeight !== undefined ? input.imageHeight : existing.imageHeight,
    createdAt: existing.createdAt,
    updatedAt,
  });

  const updated = await updateJsonFile<PageWithRegions>(
    token,
    pagePath(id),
    (existing) => {
      if (!existing) throw new Error('הדף לא נמצא');
      return { ...merge(existing), regions: existing.regions };
    },
    `Update page ${id}`
  );

  await updateJsonFile<Page[]>(
    token,
    PAGES_INDEX_PATH,
    (index) => sortIndex((index ?? []).map((p) => (p.id === id ? merge(p) : p))),
    `Update page ${id} in index`
  );

  return updated;
}

export async function deletePage(token: string, id: string): Promise<void> {
  await removeJsonFile(token, pagePath(id), `Delete page ${id}`);
  await updateJsonFile<Page[]>(
    token,
    PAGES_INDEX_PATH,
    (index) => sortIndex((index ?? []).filter((p) => p.id !== id)),
    `Remove page ${id} from index`
  );
}

export async function saveRegions(token: string, pageId: string, regions: Region[]): Promise<PageWithRegions> {
  const updatedAt = new Date().toISOString();
  return updateJsonFile<PageWithRegions>(
    token,
    pagePath(pageId),
    (existing) => {
      if (!existing) throw new Error('הדף לא נמצא');
      return { ...existing, regions, updatedAt };
    },
    `Update regions for page ${pageId} (${regions.length} region${regions.length === 1 ? '' : 's'})`
  );
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

function sortVideos(videos: Video[]): Video[] {
  return [...videos].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
}

export async function fetchAdminVideos(token: string): Promise<Video[]> {
  return sortVideos((await readJsonFile<Video[]>(token, VIDEOS_PATH)) ?? []);
}

export async function createVideo(token: string, input: VideoInput): Promise<Video> {
  // Identity and timestamps are fixed up front so a retry adds the same video
  // rather than a second one; only the position is read off the current list.
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  let created: Video | null = null;

  await updateJsonFile<Video[]>(
    token,
    VIDEOS_PATH,
    (current) => {
      const videos = (current ?? []).filter((v) => v.id !== id);
      created = {
        id,
        title: input.title,
        description: input.description ?? null,
        url: input.url,
        // Append to the end of the rail unless a position was given.
        sortOrder: input.sortOrder ?? videos.reduce((max, v) => Math.max(max, v.sortOrder), -1) + 1,
        createdAt: now,
        updatedAt: now,
      };
      return sortVideos([...videos, created]);
    },
    `Add video: ${input.title}`
  );

  return created!;
}

export async function updateVideo(token: string, id: string, input: Partial<VideoInput>): Promise<Video> {
  const updatedAt = new Date().toISOString();
  let saved: Video | null = null;

  await updateJsonFile<Video[]>(
    token,
    VIDEOS_PATH,
    (current) => {
      const videos = current ?? [];
      const existing = videos.find((v) => v.id === id);
      if (!existing) throw new Error('הסרטון לא נמצא');
      saved = {
        ...existing,
        title: input.title ?? existing.title,
        description: input.description !== undefined ? input.description : existing.description,
        url: input.url ?? existing.url,
        sortOrder: input.sortOrder ?? existing.sortOrder,
        updatedAt,
      };
      return sortVideos(videos.map((v) => (v.id === id ? saved! : v)));
    },
    `Update video: ${input.title ?? id}`
  );

  return saved!;
}

export async function deleteVideo(token: string, id: string): Promise<void> {
  await updateJsonFile<Video[]>(
    token,
    VIDEOS_PATH,
    (current) => sortVideos((current ?? []).filter((v) => v.id !== id)),
    `Delete video ${id}`
  );
}

/** Lays the rail out in the given order, in one commit rather than one per move. */
export async function reorderVideos(token: string, orderedIds: string[]): Promise<Video[]> {
  const updatedAt = new Date().toISOString();
  return updateJsonFile<Video[]>(
    token,
    VIDEOS_PATH,
    (current) => sortVideos(applyOrder(current ?? [], orderedIds, updatedAt)),
    'Reorder videos'
  );
}

// --- Upcoming volumes (the greyed-out spines on the shelf) ---

function sortUpcoming(books: UpcomingBook[]): UpcomingBook[] {
  return [...books].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
}

export async function fetchAdminUpcomingBooks(token: string): Promise<UpcomingBook[]> {
  return sortUpcoming((await readJsonFile<UpcomingBook[]>(token, UPCOMING_PATH)) ?? []);
}

export async function createUpcomingBook(token: string, input: UpcomingBookInput): Promise<UpcomingBook> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  let created: UpcomingBook | null = null;

  await updateJsonFile<UpcomingBook[]>(
    token,
    UPCOMING_PATH,
    (current) => {
      const books = (current ?? []).filter((b) => b.id !== id);
      created = {
        id,
        tractate: input.tractate,
        note: input.note ?? null,
        sortOrder: input.sortOrder ?? books.reduce((max, b) => Math.max(max, b.sortOrder), -1) + 1,
        createdAt: now,
        updatedAt: now,
      };
      return sortUpcoming([...books, created]);
    },
    `Announce upcoming volume: ${input.tractate}`
  );

  return created!;
}

export async function updateUpcomingBook(
  token: string,
  id: string,
  input: Partial<UpcomingBookInput>
): Promise<UpcomingBook> {
  const updatedAt = new Date().toISOString();
  let saved: UpcomingBook | null = null;

  await updateJsonFile<UpcomingBook[]>(
    token,
    UPCOMING_PATH,
    (current) => {
      const books = current ?? [];
      const existing = books.find((b) => b.id === id);
      if (!existing) throw new Error('הכרך לא נמצא');
      saved = {
        ...existing,
        tractate: input.tractate ?? existing.tractate,
        note: input.note !== undefined ? input.note : existing.note,
        sortOrder: input.sortOrder ?? existing.sortOrder,
        updatedAt,
      };
      return sortUpcoming(books.map((b) => (b.id === id ? saved! : b)));
    },
    `Update upcoming volume: ${input.tractate ?? id}`
  );

  return saved!;
}

export async function deleteUpcomingBook(token: string, id: string): Promise<void> {
  await updateJsonFile<UpcomingBook[]>(
    token,
    UPCOMING_PATH,
    (current) => sortUpcoming((current ?? []).filter((b) => b.id !== id)),
    `Remove upcoming volume ${id}`
  );
}

/** Lays the shelf out in the given order, in one commit rather than one per move. */
export async function reorderUpcomingBooks(token: string, orderedIds: string[]): Promise<UpcomingBook[]> {
  const updatedAt = new Date().toISOString();
  return updateJsonFile<UpcomingBook[]>(
    token,
    UPCOMING_PATH,
    (current) => sortUpcoming(applyOrder(current ?? [], orderedIds, updatedAt)),
    'Reorder upcoming volumes'
  );
}

/**
 * Renumbers `sortOrder` to match `orderedIds`.
 *
 * Anything the caller didn't mention keeps its relative place after the ones it
 * did — so a reorder computed against a slightly older list still lands
 * sensibly if a row was added elsewhere in the meantime.
 */
function applyOrder<T extends { id: string; sortOrder: number; updatedAt: string }>(
  items: T[],
  orderedIds: string[],
  updatedAt: string
): T[] {
  const rank = new Map(orderedIds.map((id, i) => [id, i]));
  const unmentioned = items.filter((item) => !rank.has(item.id)).sort((a, b) => a.sortOrder - b.sortOrder);
  unmentioned.forEach((item, i) => rank.set(item.id, orderedIds.length + i));

  return items.map((item) => {
    const sortOrder = rank.get(item.id)!;
    return sortOrder === item.sortOrder ? item : { ...item, sortOrder, updatedAt };
  });
}
