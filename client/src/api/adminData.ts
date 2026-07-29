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
import { useMemo } from 'react';
import * as expressApi from './client';
import * as githubApi from './githubAdminClient';
import type { CreatePageInput } from './client';
import type {
  Page,
  PageWithRegions,
  Region,
  UpcomingBook,
  UpcomingBookInput,
  Video,
  VideoInput,
} from '../types';
import { useGithubAdminAuth } from '../context/GithubAdminAuthContext';

export const isGithubAdminMode = import.meta.env.VITE_ADMIN_MODE === 'github';

export interface AdminApi {
  fetchAdminPages: () => Promise<Page[]>;
  fetchAdminPage: (id: string) => Promise<PageWithRegions>;
  createPage: (input: CreatePageInput) => Promise<PageWithRegions>;
  updatePage: (id: string, input: Partial<CreatePageInput>) => Promise<PageWithRegions>;
  deletePage: (id: string) => Promise<void>;
  saveRegions: (pageId: string, regions: Region[]) => Promise<PageWithRegions>;
  uploadImage: (file: File) => Promise<{ url: string }>;
  fetchAdminVideos: () => Promise<Video[]>;
  createVideo: (input: VideoInput) => Promise<Video>;
  updateVideo: (id: string, input: Partial<VideoInput>) => Promise<Video>;
  deleteVideo: (id: string) => Promise<void>;
  /** Puts the rail in this order. One write in GitHub mode, so one deploy. */
  reorderVideos: (orderedIds: string[]) => Promise<unknown>;
  fetchAdminUpcomingBooks: () => Promise<UpcomingBook[]>;
  createUpcomingBook: (input: UpcomingBookInput) => Promise<UpcomingBook>;
  updateUpcomingBook: (id: string, input: Partial<UpcomingBookInput>) => Promise<UpcomingBook>;
  deleteUpcomingBook: (id: string) => Promise<void>;
  /** Puts the shelf in this order. One write in GitHub mode, so one deploy. */
  reorderUpcomingBooks: (orderedIds: string[]) => Promise<unknown>;
}

/**
 * Reordering over the Express backend, which has no bulk endpoint: renumber
 * each row that actually moved. Rows are separate records there, so this costs
 * nothing beyond the requests — unlike GitHub mode, where every write is a
 * commit and therefore a deploy, which is why that mode does it in one.
 */
function reorderOverExpress<T extends { id: string; sortOrder: number }>(
  fetchAll: () => Promise<T[]>,
  update: (id: string, input: { sortOrder: number }) => Promise<unknown>
) {
  return async (orderedIds: string[]) => {
    const current = await fetchAll();
    const by = new Map(current.map((item) => [item.id, item]));
    await Promise.all(
      orderedIds.map((id, i) => (by.get(id)?.sortOrder === i ? null : update(id, { sortOrder: i })))
    );
  };
}

/**
 * Admin pages call this instead of importing api/client.ts directly, so the
 * same UI works against either the Express backend (local/self-hosted) or
 * direct GitHub commits (VITE_ADMIN_MODE=github, e.g. the GitHub Pages build).
 */
export function useAdminApi(): AdminApi {
  // Always call the hook (Rules of Hooks) — the provider is mounted unconditionally in App.tsx.
  const githubAuth = useGithubAdminAuth();

  return useMemo(() => {
    if (!isGithubAdminMode) {
      return {
        ...expressApi,
        reorderVideos: reorderOverExpress(expressApi.fetchAdminVideos, expressApi.updateVideo),
        reorderUpcomingBooks: reorderOverExpress(
          expressApi.fetchAdminUpcomingBooks,
          expressApi.updateUpcomingBook
        ),
      };
    }

    const token = githubAuth.token;
    if (!token) {
      const notSignedIn = () => Promise.reject(new Error('לא מחוברים ל-GitHub'));
      return {
        fetchAdminPages: notSignedIn,
        fetchAdminPage: notSignedIn,
        createPage: notSignedIn,
        updatePage: notSignedIn,
        deletePage: notSignedIn,
        saveRegions: notSignedIn,
        uploadImage: notSignedIn,
        fetchAdminVideos: notSignedIn,
        createVideo: notSignedIn,
        updateVideo: notSignedIn,
        deleteVideo: notSignedIn,
        reorderVideos: notSignedIn,
        fetchAdminUpcomingBooks: notSignedIn,
        createUpcomingBook: notSignedIn,
        updateUpcomingBook: notSignedIn,
        deleteUpcomingBook: notSignedIn,
        reorderUpcomingBooks: notSignedIn,
      };
    }

    return {
      fetchAdminPages: () => githubApi.fetchAdminPages(token),
      fetchAdminPage: (id) => githubApi.fetchAdminPage(token, id),
      createPage: (input) => githubApi.createPage(token, input),
      updatePage: (id, input) => githubApi.updatePage(token, id, input),
      deletePage: (id) => githubApi.deletePage(token, id),
      saveRegions: (pageId, regions) => githubApi.saveRegions(token, pageId, regions),
      uploadImage: (file) => githubApi.uploadImage(token, file),
      fetchAdminVideos: () => githubApi.fetchAdminVideos(token),
      createVideo: (input) => githubApi.createVideo(token, input),
      updateVideo: (id, input) => githubApi.updateVideo(token, id, input),
      deleteVideo: (id) => githubApi.deleteVideo(token, id),
      reorderVideos: (ids) => githubApi.reorderVideos(token, ids),
      fetchAdminUpcomingBooks: () => githubApi.fetchAdminUpcomingBooks(token),
      createUpcomingBook: (input) => githubApi.createUpcomingBook(token, input),
      updateUpcomingBook: (id, input) => githubApi.updateUpcomingBook(token, id, input),
      deleteUpcomingBook: (id) => githubApi.deleteUpcomingBook(token, id),
      reorderUpcomingBooks: (ids) => githubApi.reorderUpcomingBooks(token, ids),
    };
  }, [githubAuth.token]);
}
