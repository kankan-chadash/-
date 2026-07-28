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

/** Keep in sync with the 620ms animations in index.css. */
export const TURN_DURATION_MS = 620;

interface DafTurnerProps {
  /** Stable key for the daf being shown — a change is what drives the turn. */
  turnKey: string;
  /** The daf leaving the stage, rendered only while the turn is in flight. */
  outgoing?: { key: string; content: ReactNode } | null;
  direction: TurnDirection;
  children: ReactNode;
}

/**
 * Renders one daf as a leaf of an open sefer, in real CSS perspective.
 *
 * Turning forward, the outgoing daf lifts off its right-hand binding and swings
 * away, revealing the incoming daf that was already sitting underneath. Turning
 * back runs the mirror image: the incoming daf swings down on top. Only one leaf
 * is ever animated, which is what keeps this smooth on a phone.
 */
export function DafTurner({ turnKey, outgoing, direction, children }: DafTurnerProps) {
  const isTurning = !!outgoing;
  const turningBack = direction === 'prev';

  return (
    <div className="daf-stage relative">
      {/* Incoming daf. On a backward turn it's the leaf that animates, on top. */}
      <div
        key={turnKey}
        className={`daf-leaf relative ${isTurning && turningBack ? 'daf-turning-in z-20' : 'z-0'}`}
      >
        <Leaf shaded={isTurning && turningBack}>{children}</Leaf>
      </div>

      {/* Outgoing daf. On a forward turn it's the leaf that animates, on top. */}
      {outgoing && (
        <div
          key={outgoing.key}
          className={`daf-leaf absolute inset-0 ${turningBack ? 'z-0' : 'daf-turning-out z-20'}`}
          aria-hidden
        >
          <Leaf shaded={!turningBack}>{outgoing.content}</Leaf>
        </div>
      )}
    </div>
  );
}

function Leaf({ children, shaded }: { children: ReactNode; shaded: boolean }) {
  return (
    <div className="surface-parchment relative overflow-hidden rounded border-t-4 border-gold">
      {children}
      {/* Binding shadow down the hinge edge — present whether or not a turn is running. */}
      <div aria-hidden className="daf-spine-shadow pointer-events-none absolute inset-y-0 right-0 w-10" />
      {/* Light falling off the leaf as it rotates. Only mounted for the leaf that moves. */}
      {shaded && <div aria-hidden className="daf-shade pointer-events-none absolute inset-0 opacity-0" />}
    </div>
  );
}
