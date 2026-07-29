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
import type { ReactNode } from 'react';

export type TurnDirection = 'next' | 'prev';

/** Keep in sync with the turn animations in index.css. */
export const TURN_DURATION_MS = 900;

interface DafTurnerProps {
  /** Stable key for the daf being shown — a change is what drives the turn. */
  turnKey: string;
  /** The daf leaving the stage, rendered only while the turn is in flight. */
  outgoing?: { key: string; content: ReactNode } | null;
  direction: TurnDirection;
  children: ReactNode;
}

/**
 * Turns a daf the way a leaf of a sefer actually turns.
 *
 * A Gemara leaf carries amud א on its front and amud ב on its back, so the
 * turning element here is a genuine two-sided leaf: the outgoing daf is printed
 * on the front, the incoming daf on the back, and it swings a full 180° about
 * the right-hand binding. Past 90° the back face comes into view and lands
 * exactly on the copy sitting underneath, so the turn resolves seamlessly.
 *
 * Turning back runs the same leaf in reverse, with the faces swapped.
 */
export function DafTurner({ turnKey, outgoing, direction, children }: DafTurnerProps) {
  const turningBack = direction === 'prev';

  return (
    <div className="daf-stage relative">
      {/* The daf at rest. During a turn this is the incoming one, already in
          place, waiting for the leaf above it to land. */}
      <div key={turnKey} className="relative z-0">
        <Leaf>{children}</Leaf>
        {/* Shadow the turning leaf casts across the page beneath it. */}
        {outgoing && <div aria-hidden className={`daf-cast ${turningBack ? 'daf-cast-in' : 'daf-cast-out'}`} />}
      </div>

      {outgoing && (
        <div className="absolute inset-0 z-20" aria-hidden>
          <div className={`daf-leaf ${turningBack ? 'daf-turning-in' : 'daf-turning-out'}`}>
            {/* Front: what you were looking at (or, turning back, where you end up). */}
            <div className="daf-face daf-face-front">
              <Leaf>{turningBack ? children : outgoing.content}</Leaf>
              <div className="daf-sheen" />
            </div>
            {/* Back: the reverse of the same leaf. */}
            <div className="daf-face daf-face-back">
              <Leaf>{turningBack ? outgoing.content : children}</Leaf>
              <div className="daf-sheen daf-sheen-back" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Leaf({ children }: { children: ReactNode }) {
  return (
    <div className="daf-sheet relative overflow-hidden">
      {children}
      {/* The binding shadow along the hinge, present on any open volume. */}
      <div aria-hidden className="daf-spine-shadow pointer-events-none absolute inset-y-0 start-0 w-12" />
    </div>
  );
}
