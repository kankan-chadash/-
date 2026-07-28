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
import * as api from '../api/client';

interface AuthState {
  username: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In static (GitHub Pages) builds there is no backend at all, so skip the
    // network round-trip entirely instead of letting it fail on every page view.
    if (import.meta.env.VITE_DATA_MODE === 'static') {
      setIsLoading(false);
      return;
    }
    api
      .fetchMe()
      .then((me) => setUsername(me.username))
      .catch(() => setUsername(null))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(user: string, password: string) {
    const result = await api.login(user, password);
    setUsername(result.username);
  }

  async function logout() {
    await api.logout();
    setUsername(null);
  }

  return (
    <AuthContext.Provider value={{ username, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
