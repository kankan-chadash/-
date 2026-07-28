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

// Thin wrapper around the GitHub REST "Contents" API. This is what lets the
// GitHub-mode admin panel (see githubAdminClient.ts) run entirely as static
// JS on GitHub Pages with no backend of its own: every "save" is a commit,
// made directly from the browser using a personal access token the admin
// supplies (see GithubAdminAuthContext.tsx). GitHub's API sends CORS headers
// that allow this for token-authenticated requests.

// Overridable mainly for testing against a mock server; real deployments use github.com
// (or set it to a GitHub Enterprise Server instance's API base if ever needed).
const API_BASE = import.meta.env.VITE_GITHUB_API_BASE || 'https://api.github.com';
const OWNER = import.meta.env.VITE_GITHUB_OWNER;
const REPO = import.meta.env.VITE_GITHUB_REPO;
const BRANCH = import.meta.env.VITE_GITHUB_BRANCH || 'main';

export class GithubApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.message ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

/** UTF-8 safe base64 encode — plain btoa() mangles non-Latin1 text (e.g. Hebrew). */
export function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function decodeBase64(base64: string): string {
  const binary = atob(base64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export interface RepoFile {
  content: string;
  sha: string;
}

/** Reads a file's decoded text content + blob sha (needed to update/delete it). Returns null if it doesn't exist. */
export async function getFile(token: string, path: string): Promise<RepoFile | null> {
  const res = await fetch(
    `${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}?ref=${encodeURIComponent(BRANCH)}`,
    { headers: authHeaders(token) }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new GithubApiError(`Reading ${path}: ${await extractErrorMessage(res)}`, res.status);
  const data = await res.json();
  return { content: decodeBase64(data.content), sha: data.sha };
}

/** Creates or updates a text file. Pass `sha` (from a prior getFile) when updating an existing file. */
export async function putTextFile(
  token: string,
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<void> {
  await putRawFile(token, path, encodeBase64(content), message, sha);
}

/** Creates or updates a file from already-base64-encoded content (e.g. an uploaded image). */
export async function putRawFile(
  token: string,
  path: string,
  base64Content: string,
  message: string,
  sha?: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: base64Content, branch: BRANCH, ...(sha ? { sha } : {}) }),
  });
  if (!res.ok) {
    const message = await extractErrorMessage(res);
    if (res.status === 409) {
      throw new GithubApiError(
        `${path} changed on GitHub since it was loaded here. Reload and try again.`,
        409
      );
    }
    throw new GithubApiError(`Writing ${path}: ${message}`, res.status);
  }
}

export async function deleteFile(token: string, path: string, sha: string, message: string): Promise<void> {
  const res = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'DELETE',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha, branch: BRANCH }),
  });
  if (!res.ok) throw new GithubApiError(`Deleting ${path}: ${await extractErrorMessage(res)}`, res.status);
}

export interface GithubIdentity {
  login: string;
  canPush: boolean;
}

/** Validates a token by checking it can actually read+push to the configured repo. */
export async function checkRepoAccess(token: string): Promise<GithubIdentity> {
  const [userRes, repoRes] = await Promise.all([
    fetch(`${API_BASE}/user`, { headers: authHeaders(token) }),
    fetch(`${API_BASE}/repos/${OWNER}/${REPO}`, { headers: authHeaders(token) }),
  ]);
  if (!userRes.ok) {
    throw new GithubApiError(`Invalid token: ${await extractErrorMessage(userRes)}`, userRes.status);
  }
  if (!repoRes.ok) {
    throw new GithubApiError(
      `Token can't access ${OWNER}/${REPO}: ${await extractErrorMessage(repoRes)}`,
      repoRes.status
    );
  }
  const user = await userRes.json();
  const repo = await repoRes.json();
  if (!repo.permissions?.push) {
    throw new GithubApiError(
      `This token doesn't have write access to ${OWNER}/${REPO}. Use a fine-grained token with "Contents: Read and write" permission on this repository.`,
      403
    );
  }
  return { login: user.login, canPush: true };
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(new Error('Could not read the selected file'));
    reader.readAsDataURL(file);
  });
}
