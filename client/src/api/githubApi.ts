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
  /** True when GitHub rejected the write because the blob moved under us. */
  conflict: boolean;
  constructor(message: string, status: number, conflict = false) {
    super(message);
    this.status = status;
    this.conflict = conflict;
  }
}

/** How many times a write will re-read and re-apply before giving up. */
const CONFLICT_ATTEMPTS = 4;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

/**
 * The version of each file this tab last wrote successfully.
 *
 * GitHub serves Contents reads from a cache that lags behind writes: a GET
 * issued moments after a PUT can still hand back the *previous* blob's sha, and
 * writing with that sha is rejected. That is what made two edits in a row to
 * one file — reordering, or deleting twice — fail reliably, and what made a
 * row that had genuinely been deleted reappear in the admin list.
 *
 * Every successful write returns the new sha, so the next write needn't ask.
 * This is only ever a shortcut past a read we already know the answer to: if it
 * turns out to be wrong (another admin, another tab), the write conflicts and
 * we re-read for real.
 */
const lastWritten = new Map<string, RepoFile>();

/**
 * Reads a file's decoded text content + blob sha (needed to update/delete it).
 * Returns null if it doesn't exist. Pass `fresh` after a conflict to defeat the
 * caches between here and the blob.
 */
export async function getFile(token: string, path: string, fresh = false): Promise<RepoFile | null> {
  const bust = fresh ? `&_=${Date.now()}` : '';
  const res = await fetch(
    `${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}?ref=${encodeURIComponent(BRANCH)}${bust}`,
    { headers: authHeaders(token), cache: 'no-store' }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new GithubApiError(`קריאת ${path} נכשלה: ${await extractErrorMessage(res)}`, res.status);
  const data = await res.json();
  return { content: decodeBase64(data.content), sha: data.sha };
}

/** Reads and parses a JSON file, preferring the version this tab last wrote. */
export async function readJsonFile<T>(token: string, path: string): Promise<T | null> {
  const known = lastWritten.get(path);
  if (known) return JSON.parse(known.content) as T;
  const file = await getFile(token, path);
  return file ? (JSON.parse(file.content) as T) : null;
}

/**
 * Read, change, write — retried against genuinely current content if the file
 * moved underneath us.
 *
 * `mutate` is handed whatever the file holds now (null if it doesn't exist yet)
 * and returns what it should hold next. It may be called more than once, so it
 * must describe the change rather than a fixed result: "drop the row with this
 * id" survives a retry, "here is the list I saw a moment ago" does not. Ids and
 * timestamps therefore belong outside it, fixed before the first attempt.
 */
export function updateJsonFile<T>(
  token: string,
  path: string,
  mutate: (current: T | null) => T,
  message: string
): Promise<T> {
  return serialize(path, () => writeJson(token, path, mutate, message));
}

/**
 * One write at a time per file.
 *
 * The admin panel now applies edits to its list immediately, so an admin can
 * comfortably click twice before the first commit lands. Two writes running at
 * once would both read the same starting point and the second would erase the
 * first; queueing them means the second sees the first's result, which is what
 * makes rapid edits add up instead of fighting.
 */
const queues = new Map<string, Promise<unknown>>();

function serialize<T>(path: string, work: () => Promise<T>): Promise<T> {
  const previous = queues.get(path) ?? Promise.resolve();
  const run = previous.then(work, work); // a failed neighbour must not block the queue
  queues.set(
    path,
    run.catch(() => undefined)
  );
  return run;
}

async function writeJson<T>(
  token: string,
  path: string,
  mutate: (current: T | null) => T,
  message: string
): Promise<T> {
  let known = lastWritten.get(path) ?? null;

  for (let attempt = 0; ; attempt++) {
    const file = known ?? (await getFile(token, path, attempt > 0));
    const next = mutate(file ? (JSON.parse(file.content) as T) : null);
    const content = JSON.stringify(next, null, 2);

    try {
      const sha = await putRawFile(token, path, encodeBase64(content), message, file?.sha);
      if (sha) lastWritten.set(path, { content, sha });
      else lastWritten.delete(path);
      return next;
    } catch (err) {
      // Whatever we thought we knew about this file is now suspect.
      lastWritten.delete(path);
      known = null;
      if (!(err instanceof GithubApiError && err.conflict) || attempt + 1 >= CONFLICT_ATTEMPTS) throw err;
      // Someone got here first. Read what the file actually says now and apply
      // the same change on top, instead of handing the admin an error to retry.
      await wait(400 * 2 ** attempt);
    }
  }
}

/** Removes a file, re-reading its sha if the first one turns out to be stale. */
export function removeJsonFile(token: string, path: string, message: string): Promise<void> {
  return serialize(path, () => removeNow(token, path, message));
}

async function removeNow(token: string, path: string, message: string): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    const file = lastWritten.get(path) ?? (await getFile(token, path, attempt > 0));
    if (!file) {
      lastWritten.delete(path);
      return; // already gone — deleting twice is not an error
    }
    try {
      await deleteFile(token, path, file.sha, message);
      lastWritten.delete(path);
      return;
    } catch (err) {
      lastWritten.delete(path);
      if (!(err instanceof GithubApiError && err.conflict) || attempt + 1 >= CONFLICT_ATTEMPTS) throw err;
      await wait(400 * 2 ** attempt);
    }
  }
}

/** Creates or updates a text file. Pass `sha` (from a prior getFile) when updating an existing file. */
export async function putTextFile(
  token: string,
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<string | undefined> {
  return putRawFile(token, path, encodeBase64(content), message, sha);
}

/**
 * Creates or updates a file from already-base64-encoded content (e.g. an
 * uploaded image), and hands back the sha of the blob it just wrote — which is
 * the one piece of state that is never stale.
 */
export async function putRawFile(
  token: string,
  path: string,
  base64Content: string,
  message: string,
  sha?: string
): Promise<string | undefined> {
  const res = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: base64Content, branch: BRANCH, ...(sha ? { sha } : {}) }),
  });
  if (!res.ok) throw await writeError(res, path, 'כתיבת');
  const data = await res.json().catch(() => null);
  return data?.content?.sha as string | undefined;
}

export async function deleteFile(token: string, path: string, sha: string, message: string): Promise<void> {
  const res = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'DELETE',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha, branch: BRANCH }),
  });
  if (!res.ok) throw await writeError(res, path, 'מחיקת');
}

/**
 * Turns a failed write into an error, marking the ones worth retrying.
 *
 * GitHub says 409 when the sha we sent isn't the current one, and 422 "sha
 * wasn't supplied" when we thought the file was new and it isn't. Both mean the
 * same thing — our picture of the file is out of date — and both are fixed by
 * reading again rather than by anything the admin could do.
 */
async function writeError(res: Response, path: string, verb: string): Promise<GithubApiError> {
  const message = await extractErrorMessage(res);
  const stale = res.status === 409 || (res.status === 422 && /sha/i.test(message));
  if (stale) {
    return new GithubApiError(
      `${path} משתנה כרגע ב-GitHub וניסינו לשמור עליו כמה פעמים ללא הצלחה. המתינו רגע ונסו שוב.`,
      res.status,
      true
    );
  }
  return new GithubApiError(`${verb} ${path} נכשלה: ${message}`, res.status);
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
    throw new GithubApiError(`טוקן לא תקין: ${await extractErrorMessage(userRes)}`, userRes.status);
  }
  if (!repoRes.ok) {
    throw new GithubApiError(
      `לטוקן אין גישה אל ${OWNER}/${REPO}: ${await extractErrorMessage(repoRes)}`,
      repoRes.status
    );
  }
  const user = await userRes.json();
  const repo = await repoRes.json();
  if (!repo.permissions?.push) {
    throw new GithubApiError(
      `לטוקן אין הרשאת כתיבה אל ${OWNER}/${REPO}. יש להשתמש בטוקן fine-grained עם הרשאת "Contents: Read and write" על המאגר הזה.`,
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
    reader.onerror = () => reject(new Error('לא ניתן לקרוא את הקובץ שנבחר'));
    reader.readAsDataURL(file);
  });
}
