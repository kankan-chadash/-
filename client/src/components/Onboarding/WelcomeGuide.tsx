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
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useGuide } from './GuideContext';
import {
  SceneLibrary,
  SceneRegions,
  SceneTurning,
  SceneVideos,
  SceneWelcome,
} from './GuideScenes';
import { isAdminPath } from '../../routes';

interface Step {
  title: string;
  body: string;
  scene: ReactNode;
}

const STEPS: Step[] = [
  {
    title: 'ברוכים הבאים לשולחן הלימוד',
    body: 'כאן דף הגמרא נעשה חי: לוחצים על אזור בדף ומקבלים הסבר, תמונה או סרטון. סיור קצר של רגע, ואפשר להתחיל.',
    scene: <SceneWelcome />,
  },
  {
    title: 'בוחרים כרך מהספרייה',
    body: 'המסכתות עומדות על המדף. לחיצה על כרך פותחת אותו בדף הראשון שלו. כרכים מעומעמים עם סרט "בקרוב" עדיין בהכנה.',
    scene: <SceneLibrary />,
  },
  {
    title: 'לוחצים על אזורים בדף',
    body: 'בדף מסומנים אזורים. העבירו את העכבר או הקישו עליהם — וייפתח חלון עם ההסבר, התמונה או הסרטון שמתאים לאותו קטע.',
    scene: <SceneRegions />,
  },
  {
    title: 'מדפדפים בין הדפים',
    body: 'בסרגל התחתון עוברים לדף הבא או הקודם. אפשר גם בחיצי המקלדת, ובמסך מגע פשוט להחליק — בדיוק כמו להפוך דף.',
    scene: <SceneTurning />,
  },
  {
    title: 'וגם סרטונים חינוכיים',
    body: 'בלשונית "סרטונים" יש מסילה של סרטונים כלליים, שאינם קשורים לדף מסוים. לחיצה על סרטון פותחת אותו לצפייה.',
    scene: <SceneVideos />,
  },
];

export function WelcomeGuide() {
  const { isOpen, close } = useGuide();
  const { pathname } = useLocation();
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const primaryRef = useRef<HTMLButtonElement | null>(null);

  const isLast = step === STEPS.length - 1;

  // Always reopen at the beginning, including when reopened from the header.
  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen]);

  // Move focus into the dialog so keyboard and screen-reader users land here.
  useEffect(() => {
    if (isOpen) primaryRef.current?.focus();
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close();
        return;
      }
      // RTL: ArrowLeft moves forward, matching the daf navigation.
      if (e.key === 'ArrowLeft') setStep((s) => Math.min(s + 1, STEPS.length - 1));
      if (e.key === 'ArrowRight') setStep((s) => Math.max(s - 1, 0));
      if (e.key === 'Tab') keepFocusInside(e, dialogRef.current);
    }

    window.addEventListener('keydown', onKeyDown);
    // The page behind must not scroll while the guide is up.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, close]);

  // The tour is for readers. An admin signing in to edit shouldn't be handed a
  // walkthrough of the public site, so it never mounts behind /admin.
  if (!isOpen || isAdminPath(pathname)) return null;

  const current = STEPS[step];

  return (
    <div
      className="guide-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-title"
      onClick={close}
    >
      <div ref={dialogRef} className="guide-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={close} className="guide-skip">
          דילוג על המדריך
        </button>

        {/* Keyed so each step's illustration and text animate in on change. */}
        <div key={step} className="guide-body">
          <div className="guide-stage">{current.scene}</div>

          <h2 id="guide-title" className="guide-title">
            {current.title}
          </h2>
          <p className="guide-text">{current.body}</p>
        </div>

        <div className="guide-footer">
          <div className="guide-dots" role="tablist" aria-label="שלבי המדריך">
            {STEPS.map((s, i) => (
              <button
                key={s.title}
                type="button"
                role="tab"
                aria-selected={i === step}
                aria-label={`שלב ${i + 1}: ${s.title}`}
                onClick={() => setStep(i)}
                className={`guide-dot ${i === step ? 'guide-dot-on' : ''}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button type="button" onClick={() => setStep((s) => s - 1)} className="guide-btn-ghost">
                הקודם
              </button>
            )}
            <button
              ref={primaryRef}
              type="button"
              onClick={() => (isLast ? close() : setStep((s) => s + 1))}
              className="guide-btn"
            >
              {isLast ? 'מתחילים ללמוד' : 'הבא'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Simple focus trap: Tab cycles within the dialog rather than escaping behind it. */
function keepFocusInside(e: KeyboardEvent, container: HTMLElement | null) {
  if (!container) return;
  const focusable = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
