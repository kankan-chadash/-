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

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers:
      options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json', ...options.headers }
        : options.headers,
    ...options,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : undefined;

  if (!res.ok) {
    const message =
      (data && typeof data.error === 'string' && data.error) ||
      (data && data.error?.formErrors?.join(', ')) ||
      res.statusText;
    throw new ApiError(message, res.status);
  }

  return data as T;
}

// --- Public ---

export function fetchPages(): Promise<Page[]> {
  return request('/api/pages');
}

export function fetchPage(id: string): Promise<PageWithRegions> {
  return request(`/api/pages/${id}`);
}

export function fetchPageByRef(tractate: string, daf: number, side: string): Promise<PageWithRegions> {
  const params = new URLSearchParams({ tractate, daf: String(daf), side });
  return request(`/api/pages/lookup/by-ref?${params.toString()}`);
}

// --- Auth ---

export function login(username: string, password: string): Promise<{ username: string }> {
  return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
}

export function logout(): Promise<void> {
  return request('/api/auth/logout', { method: 'POST' });
}

export function fetchMe(): Promise<{ username: string }> {
  return request('/api/auth/me');
}

// --- Admin ---

export function fetchAdminPages(): Promise<Page[]> {
  return request('/api/admin/pages');
}

export function fetchAdminPage(id: string): Promise<PageWithRegions> {
  return request(`/api/admin/pages/${id}`);
}

export interface CreatePageInput {
  tractate: string;
  daf: number;
  side: string;
  pageImageUrl: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
}

export function createPage(input: CreatePageInput): Promise<PageWithRegions> {
  return request('/api/admin/pages', { method: 'POST', body: JSON.stringify(input) });
}

export function updatePage(id: string, input: Partial<CreatePageInput>): Promise<PageWithRegions> {
  return request(`/api/admin/pages/${id}`, { method: 'PUT', body: JSON.stringify(input) });
}

export function deletePage(id: string): Promise<void> {
  return request(`/api/admin/pages/${id}`, { method: 'DELETE' });
}

export function saveRegions(pageId: string, regions: Region[]): Promise<PageWithRegions> {
  return request(`/api/admin/pages/${pageId}/regions`, {
    method: 'PUT',
    body: JSON.stringify({ regions }),
  });
}

export async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('image', file);
  return request('/api/admin/upload', { method: 'POST', body: formData });
}
