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
import type { PolygonCoordinates, PolygonPoint, RectangleCoordinates } from '../../types';
import type { EditableRegion } from './types';
import {
  type Corner,
  clamp,
  movePolygon,
  moveRectangle,
  percentPointPixelDistance,
  pixelToPercent,
  resizeRectangle,
} from './geometry';

export type EditorMode = 'select' | 'rectangle' | 'polygon';

interface DrawingCanvasProps {
  imageUrl: string;
  regions: EditableRegion[];
  selectedId: string | null;
  mode: EditorMode;
  onSelect: (id: string | null) => void;
  onRegionsChange: (updater: (regions: EditableRegion[]) => EditableRegion[]) => void;
  onRegionCreated: (region: EditableRegion) => void;
  onModeChange: (mode: EditorMode) => void;
}

type DragState =
  | { type: 'move-rect'; regionId: string; startMouse: PolygonPoint; startRect: RectangleCoordinates }
  | { type: 'resize-rect'; regionId: string; corner: Corner; startRect: RectangleCoordinates }
  | {
      type: 'move-polygon';
      regionId: string;
      startMouse: PolygonPoint;
      startPoints: PolygonCoordinates;
    }
  | { type: 'move-vertex'; regionId: string; vertexIndex: number };

type Draft =
  | { type: 'rectangle'; start: PolygonPoint; current: PolygonPoint }
  | { type: 'polygon'; points: PolygonPoint[]; cursor: PolygonPoint | null };

const MIN_RECT_SIZE = 1; // percent
const CLOSE_DISTANCE_PX = 14;

function applyDrag(ds: DragState, region: EditableRegion, point: PolygonPoint): EditableRegion {
  if (ds.type === 'move-rect') {
    const dx = point.x - ds.startMouse.x;
    const dy = point.y - ds.startMouse.y;
    return { ...region, coordinates: moveRectangle(ds.startRect, dx, dy) };
  }
  if (ds.type === 'resize-rect') {
    return { ...region, coordinates: resizeRectangle(ds.startRect, ds.corner, point) };
  }
  if (ds.type === 'move-polygon') {
    const dx = point.x - ds.startMouse.x;
    const dy = point.y - ds.startMouse.y;
    return { ...region, coordinates: movePolygon(ds.startPoints, dx, dy) };
  }
  const points = [...(region.coordinates as PolygonCoordinates)];
  points[ds.vertexIndex] = { x: clamp(point.x, 0, 100), y: clamp(point.y, 0, 100) };
  return { ...region, coordinates: points };
}

export function DrawingCanvas({
  imageUrl,
  regions,
  selectedId,
  mode,
  onSelect,
  onRegionsChange,
  onRegionCreated,
  onModeChange,
}: DrawingCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Reset any in-progress draft when switching modes.
  useEffect(() => {
    setDraft(null);
  }, [mode]);

  function toPercent(e: { clientX: number; clientY: number }): PolygonPoint {
    return pixelToPercent(e.clientX, e.clientY, containerRef.current!);
  }

  // --- Rectangle drawing ---

  function handleContainerMouseDown(e: React.MouseEvent) {
    if (mode === 'rectangle') {
      const point = toPercent(e);
      setDraft({ type: 'rectangle', start: point, current: point });
    } else if (mode === 'select') {
      onSelect(null);
    }
  }

  useEffect(() => {
    if (!draft || draft.type !== 'rectangle') return;

    function handleMouseMove(e: MouseEvent) {
      setDraft((prev) => (prev && prev.type === 'rectangle' ? { ...prev, current: toPercent(e) } : prev));
    }

    function handleMouseUp(e: MouseEvent) {
      // Read the draft directly rather than via a setDraft updater: calling the
      // onRegionsChange/onRegionCreated/onModeChange callbacks (which update the
      // parent's state) from inside a setState updater triggers React's
      // "Cannot update a component while rendering a different component" warning.
      if (!draft || draft.type !== 'rectangle') return;
      const current = toPercent(e);
      const x = Math.min(draft.start.x, current.x);
      const y = Math.min(draft.start.y, current.y);
      const width = Math.abs(current.x - draft.start.x);
      const height = Math.abs(current.y - draft.start.y);
      setDraft(null);
      if (width >= MIN_RECT_SIZE && height >= MIN_RECT_SIZE) {
        const region: EditableRegion = {
          id: crypto.randomUUID(),
          shape: 'rectangle',
          coordinates: { x, y, width, height },
          contentType: 'text',
          content: '',
          title: null,
        };
        onRegionsChange((regs) => [...regs, region]);
        onRegionCreated(region);
        onModeChange('select');
      }
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp, { once: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  // --- Polygon drawing ---

  function handleContainerClick(e: React.MouseEvent) {
    if (mode !== 'polygon') return;
    const point = toPercent(e);

    if (!draft || draft.type !== 'polygon') {
      setDraft({ type: 'polygon', points: [point], cursor: point });
      return;
    }
    if (draft.points.length >= 3) {
      const dist = percentPointPixelDistance(point, draft.points[0], containerRef.current!);
      if (dist <= CLOSE_DISTANCE_PX) {
        setDraft(null);
        finishPolygon(draft.points);
        return;
      }
    }
    setDraft({ ...draft, points: [...draft.points, point] });
  }

  function handleContainerDoubleClick() {
    if (mode !== 'polygon') return;
    if (draft && draft.type === 'polygon' && draft.points.length >= 3) {
      setDraft(null);
      finishPolygon(draft.points);
    }
  }

  function finishPolygon(points: PolygonCoordinates) {
    const region: EditableRegion = {
      id: crypto.randomUUID(),
      shape: 'polygon',
      coordinates: points,
      contentType: 'text',
      content: '',
      title: null,
    };
    onRegionsChange((regs) => [...regs, region]);
    onRegionCreated(region);
    onModeChange('select');
  }

  function handleContainerMouseMoveForRubberBand(e: React.MouseEvent) {
    if (mode !== 'polygon') return;
    const point = toPercent(e);
    setDraft((prev) => (prev && prev.type === 'polygon' ? { ...prev, cursor: point } : prev));
  }

  useEffect(() => {
    if (mode !== 'polygon') return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        if (draft && draft.type === 'polygon' && draft.points.length >= 3) {
          setDraft(null);
          finishPolygon(draft.points);
        }
      } else if (e.key === 'Escape') {
        setDraft(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, draft]);

  // --- Editing existing regions (select mode) ---

  function startMoveRect(e: React.MouseEvent, region: EditableRegion) {
    e.stopPropagation();
    onSelect(region.id);
    setDragState({
      type: 'move-rect',
      regionId: region.id,
      startMouse: toPercent(e),
      startRect: region.coordinates as RectangleCoordinates,
    });
  }

  function startResizeRect(e: React.MouseEvent, region: EditableRegion, corner: Corner) {
    e.stopPropagation();
    onSelect(region.id);
    setDragState({
      type: 'resize-rect',
      regionId: region.id,
      corner,
      startRect: region.coordinates as RectangleCoordinates,
    });
  }

  function startMovePolygon(e: React.MouseEvent, region: EditableRegion) {
    e.stopPropagation();
    onSelect(region.id);
    setDragState({
      type: 'move-polygon',
      regionId: region.id,
      startMouse: toPercent(e),
      startPoints: region.coordinates as PolygonCoordinates,
    });
  }

  function startMoveVertex(e: React.MouseEvent, region: EditableRegion, vertexIndex: number) {
    e.stopPropagation();
    onSelect(region.id);
    setDragState({ type: 'move-vertex', regionId: region.id, vertexIndex });
  }

  function deleteVertex(e: React.MouseEvent, region: EditableRegion, vertexIndex: number) {
    e.stopPropagation();
    const points = region.coordinates as PolygonCoordinates;
    if (points.length <= 3) return;
    onRegionsChange((regs) =>
      regs.map((r) =>
        r.id === region.id ? { ...r, coordinates: points.filter((_, i) => i !== vertexIndex) } : r
      )
    );
  }

  useEffect(() => {
    const ds = dragState;
    if (!ds) return;

    function handleMouseMove(e: MouseEvent) {
      if (!ds) return;
      const point = pixelToPercent(e.clientX, e.clientY, containerRef.current!);
      onRegionsChange((regs) => regs.map((r) => (r.id === ds.regionId ? applyDrag(ds, r, point) : r)));
    }

    function handleMouseUp() {
      setDragState(null);
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp, { once: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragState]);

  // --- Delete selected region with Delete/Backspace ---

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!selectedId) return;
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        onRegionsChange((regs) => regs.filter((r) => r.id !== selectedId));
        onSelect(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const cursorClass =
    mode === 'rectangle' || mode === 'polygon' ? 'cursor-crosshair' : 'cursor-default';

  return (
    <div
      ref={containerRef}
      className={`relative w-full select-none ${cursorClass}`}
      onMouseDown={handleContainerMouseDown}
      onMouseMove={handleContainerMouseMoveForRubberBand}
      onClick={handleContainerClick}
      onDoubleClick={handleContainerDoubleClick}
    >
      <img src={imageUrl} alt="Page being edited" className="block w-full h-auto pointer-events-none" draggable={false} />

      {/* Completed shapes + draft preview, rendered in image percent space */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        {regions
          .filter((r) => r.shape === 'polygon')
          .map((region) => {
            const points = (region.coordinates as PolygonCoordinates).map((p) => `${p.x},${p.y}`).join(' ');
            const isSelected = region.id === selectedId;
            return (
              <polygon
                key={region.id}
                points={points}
                fill={isSelected ? 'rgba(212,175,55,0.22)' : 'rgba(54,31,26,0.12)'}
                stroke={isSelected ? '#D4AF37' : '#4E342E'}
                strokeWidth={isSelected ? 1.5 : 1}
                vectorEffect="non-scaling-stroke"
                className="pointer-events-auto cursor-move"
                onMouseDown={(e) => startMovePolygon(e, region)}
              />
            );
          })}

        {draft?.type === 'polygon' && (
          <>
            <polyline
              points={draft.points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#D4AF37"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
            {draft.cursor && draft.points.length > 0 && (
              <line
                x1={draft.points[draft.points.length - 1].x}
                y1={draft.points[draft.points.length - 1].y}
                x2={draft.cursor.x}
                y2={draft.cursor.y}
                stroke="#D4AF37"
                strokeDasharray="2,2"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            )}
          </>
        )}
      </svg>

      {/* Rectangle bodies as HTML divs (independent x/y % scaling, easier hit-testing) */}
      {regions
        .filter((r) => r.shape === 'rectangle')
        .map((region) => {
          const coords = region.coordinates as RectangleCoordinates;
          const isSelected = region.id === selectedId;
          return (
            <div
              key={region.id}
              className={`absolute cursor-move border ${
                isSelected ? 'border-gold bg-gold/20' : 'border-wood-dark/70 bg-wood-dark/10'
              }`}
              style={{ left: `${coords.x}%`, top: `${coords.y}%`, width: `${coords.width}%`, height: `${coords.height}%` }}
              onMouseDown={(e) => startMoveRect(e, region)}
            >
              {isSelected &&
                (['nw', 'ne', 'sw', 'se'] as Corner[]).map((corner) => (
                  <div
                    key={corner}
                    onMouseDown={(e) => startResizeRect(e, region, corner)}
                    className="absolute h-3 w-3 rounded-full border border-wood-dark bg-gold"
                    style={{
                      left: corner.includes('w') ? '-6px' : undefined,
                      right: corner.includes('e') ? '-6px' : undefined,
                      top: corner.includes('n') ? '-6px' : undefined,
                      bottom: corner.includes('s') ? '-6px' : undefined,
                      cursor: corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize',
                    }}
                  />
                ))}
            </div>
          );
        })}

      {/* Polygon vertex handles (fixed pixel size regardless of image aspect ratio) */}
      {regions
        .filter((r) => r.shape === 'polygon' && r.id === selectedId)
        .flatMap((region) =>
          (region.coordinates as PolygonCoordinates).map((point, index) => (
            <div
              key={`${region.id}-${index}`}
              onMouseDown={(e) => startMoveVertex(e, region, index)}
              onDoubleClick={(e) => deleteVertex(e, region, index)}
              title="Drag to move, double-click to delete"
              className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-wood-dark bg-gold cursor-pointer"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
            />
          ))
        )}

      {/* In-progress polygon vertex markers */}
      {draft?.type === 'polygon' &&
        draft.points.map((point, index) => (
          <div
            key={index}
            className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold border border-wood-dark pointer-events-none"
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
          />
        ))}

      {draft?.type === 'rectangle' &&
        (() => {
          const x = Math.min(draft.start.x, draft.current.x);
          const y = Math.min(draft.start.y, draft.current.y);
          const width = Math.abs(draft.current.x - draft.start.x);
          const height = Math.abs(draft.current.y - draft.start.y);
          return (
            <div
              className="absolute border-2 border-dashed border-gold bg-gold/10 pointer-events-none"
              style={{ left: `${x}%`, top: `${y}%`, width: `${width}%`, height: `${height}%` }}
            />
          );
        })()}
    </div>
  );
}
