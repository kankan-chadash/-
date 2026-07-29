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
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

// Bump the suffix to show the guide again to everyone — e.g. after the tour
// gains a step for a feature existing readers have never seen.
const SEEN_KEY = 'gemara_guide_seen_v1';

interface GuideState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const Ctx = createContext<GuideState | undefined>(undefined);

export function GuideProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only first-time visitors get it unprompted; everyone else can reopen it
    // from the header. Wrapped because Safari private mode can throw here.
    try {
      if (!localStorage.getItem(SEEN_KEY)) setIsOpen(true);
    } catch {
      // No storage: show it once for this session rather than not at all.
      setIsOpen(true);
    }
  }, []);

  const open = useCallback(() => setIsOpen(true), []);

  const close = useCallback(() => {
    setIsOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, new Date().toISOString());
    } catch {
      // Fine — worst case they see it again next visit.
    }
  }, []);

  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGuide(): GuideState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGuide must be used within a GuideProvider');
  return ctx;
}
