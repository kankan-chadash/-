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
import type { PolygonPoint, RectangleCoordinates } from '../../types';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function pixelToPercent(
  clientX: number,
  clientY: number,
  container: HTMLElement
): PolygonPoint {
  const rect = container.getBoundingClientRect();
  return {
    x: clamp(((clientX - rect.left) / rect.width) * 100, 0, 100),
    y: clamp(((clientY - rect.top) / rect.height) * 100, 0, 100),
  };
}

/** Pixel distance between two percent-space points, given the container's rendered size. */
export function percentPointPixelDistance(
  a: PolygonPoint,
  b: PolygonPoint,
  container: HTMLElement
): number {
  const rect = container.getBoundingClientRect();
  const dx = ((a.x - b.x) / 100) * rect.width;
  const dy = ((a.y - b.y) / 100) * rect.height;
  return Math.sqrt(dx * dx + dy * dy);
}

export type Corner = 'nw' | 'ne' | 'sw' | 'se';

export function resizeRectangle(
  original: RectangleCoordinates,
  corner: Corner,
  mouse: PolygonPoint
): RectangleCoordinates {
  const x1 = original.x;
  const y1 = original.y;
  const x2 = original.x + original.width;
  const y2 = original.y + original.height;

  const nx1 = corner.includes('w') ? mouse.x : x1;
  const nx2 = corner.includes('e') ? mouse.x : x2;
  const ny1 = corner.includes('n') ? mouse.y : y1;
  const ny2 = corner.includes('s') ? mouse.y : y2;

  return {
    x: Math.min(nx1, nx2),
    y: Math.min(ny1, ny2),
    width: Math.abs(nx2 - nx1),
    height: Math.abs(ny2 - ny1),
  };
}

export function moveRectangle(
  original: RectangleCoordinates,
  dx: number,
  dy: number
): RectangleCoordinates {
  return {
    ...original,
    x: clamp(original.x + dx, 0, 100 - original.width),
    y: clamp(original.y + dy, 0, 100 - original.height),
  };
}

/** Clamps a requested translation so every point of the polygon stays within [0, 100]. */
export function movePolygon(points: PolygonPoint[], dx: number, dy: number): PolygonPoint[] {
  const minX = Math.min(...points.map((p) => p.x));
  const maxX = Math.max(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const maxY = Math.max(...points.map((p) => p.y));

  const clampedDx = clamp(dx, -minX, 100 - maxX);
  const clampedDy = clamp(dy, -minY, 100 - maxY);

  return points.map((p) => ({ x: p.x + clampedDx, y: p.y + clampedDy }));
}
