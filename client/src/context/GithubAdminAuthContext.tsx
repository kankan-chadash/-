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
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { checkRepoAccess } from '../api/githubApi';

// Holds the admin's own GitHub personal access token for VITE_ADMIN_MODE=github
// builds (see README: "Fully GitHub-native admin"). The token is the only
// credential — there is no separate username/password, and no server checks
// anything: GitHub itself rejects any write the token isn't authorized for.
// It's kept in localStorage only, on this device/browser.

const STORAGE_KEY = 'gemara_admin_github_token';

interface GithubAdminAuthState {
  token: string | null;
  username: string | null;
  isLoading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => void;
}

const Ctx = createContext<GithubAdminAuthState | undefined>(undefined);

export function GithubAdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }
    checkRepoAccess(stored)
      .then((identity) => {
        setToken(stored);
        setUsername(identity.login);
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function signIn(newToken: string) {
    const identity = await checkRepoAccess(newToken); // throws if invalid / no write access
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
    setUsername(identity.login);
  }

  function signOut() {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUsername(null);
  }

  return <Ctx.Provider value={{ token, username, isLoading, signIn, signOut }}>{children}</Ctx.Provider>;
}

export function useGithubAdminAuth(): GithubAdminAuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGithubAdminAuth must be used within a GithubAdminAuthProvider');
  return ctx;
}
