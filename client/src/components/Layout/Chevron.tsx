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

/**
 * A direction arrow drawn as a path rather than a glyph.
 *
 * The obvious characters for this (‹ › ← →) are bidi-mirrored, so in an RTL
 * document they silently render the opposite way round and stop matching the
 * side of the control they sit on. Drawing the chevron and flipping it with an
 * explicit `rtl:` variant keeps "toward the start" and "toward the end"
 * meaningful in both directions.
 */
export function Chevron({ toward, className = '' }: { toward: 'start' | 'end'; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`rtl:-scale-x-100 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={toward === 'start' ? 'M15 5 L8 12 L15 19' : 'M9 5 L16 12 L9 19'} />
    </svg>
  );
}
