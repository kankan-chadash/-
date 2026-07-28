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
import type { Page, PageWithRegions, Region } from '../types';
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
    if (!isGithubAdminMode) return expressApi;

    const token = githubAuth.token;
    if (!token) {
      const notSignedIn = () => Promise.reject(new Error('Not signed in to GitHub'));
      return {
        fetchAdminPages: notSignedIn,
        fetchAdminPage: notSignedIn,
        createPage: notSignedIn,
        updatePage: notSignedIn,
        deletePage: notSignedIn,
        saveRegions: notSignedIn,
        uploadImage: notSignedIn,
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
    };
  }, [githubAuth.token]);
}
