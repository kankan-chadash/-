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
import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/Layout/SiteHeader';
import { Chevron } from '../components/Layout/Chevron';
import { toGematria } from '../utils/gematria';
import { routes } from '../routes';

/** The daf a reader lands on when the address doesn't exist. */
const NOT_FOUND_DAF = 404;

// The Bavli is counted at 2,702 dapim — the gematria of בראשית — so a reader
// standing on daf 404 has exactly 2,298 to go. The arithmetic is left in
// rather than the answer typed out, so the joke stays checkable.
const SHAS_DAPIM = 2702;
const dapimLeft = (SHAS_DAPIM - NOT_FOUND_DAF).toLocaleString('he-IL');

/**
 * A wrong address, answered in the idiom of the sefer rather than the browser's.
 *
 * The daf is torn out of the volume: there is no daf 404, so the page it would
 * have been is shown missing. It carries its number in Hebrew letters in the
 * margin — the same way every real daf here is named — which is what makes the
 * count underneath land as a joke about learning rather than an error message.
 */
export function NotFound() {
  return (
    <div className="surface-wood flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-5 py-12 sm:py-16">
        <div className="notfound-sheet">
          <h1 className="notfound-head">
            <span className="notfound-lead">הגעת לדף</span>
            <span className="notfound-number">
              <span className="notfound-digits">{NOT_FOUND_DAF}</span>
              {/* The marginal gloss every daf here carries. Silent to a screen
                  reader, which has already announced the digits. */}
              <span className="notfound-gloss" aria-hidden="true">
                {toGematria(NOT_FOUND_DAF)}
              </span>
            </span>
          </h1>

          <p className="notfound-line">
            נשארו לך עוד <bdi className="notfound-count">{dapimLeft}</bdi> דפים לסיים את הש״ס
          </p>

          <Link to={routes.library} className="notfound-cta">
            יאללה
            <Chevron toward="end" className="h-5 w-5 shrink-0" />
          </Link>
        </div>
      </main>
    </div>
  );
}
