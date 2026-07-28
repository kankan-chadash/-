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
import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db';
import { mapVideoRow } from '../db/mappers';
import { VideoRow } from '../types';
import { videoInputSchema, videoUpdateSchema } from '../validation';
import { requireAdmin } from '../middleware/auth';

// Standalone shiurim — videos that belong to the site as a whole rather than to
// a hotspot on a particular daf (those live on the region, see routes/pages.ts).

export const publicVideosRouter = Router();
export const adminVideosRouter = Router();
adminVideosRouter.use(requireAdmin);

const ORDERED = 'SELECT * FROM videos ORDER BY sort_order ASC, created_at ASC';

publicVideosRouter.get('/videos', (_req, res) => {
  const rows = db.prepare(ORDERED).all() as VideoRow[];
  res.json(rows.map(mapVideoRow));
});

adminVideosRouter.get('/videos', (_req, res) => {
  const rows = db.prepare(ORDERED).all() as VideoRow[];
  res.json(rows.map(mapVideoRow));
});

adminVideosRouter.post('/videos', (req, res) => {
  const parsed = videoInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { title, description, url, sortOrder } = parsed.data;
  const id = uuid();
  // Default to the end of the rail so a new shiur doesn't jump the queue.
  const nextOrder =
    sortOrder ??
    ((db.prepare('SELECT MAX(sort_order) AS max FROM videos').get() as { max: number | null }).max ?? -1) + 1;

  db.prepare(
    'INSERT INTO videos (id, title, description, url, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).run(id, title, description ?? null, url, nextOrder);

  res.status(201).json(mapVideoRow(db.prepare('SELECT * FROM videos WHERE id = ?').get(id) as VideoRow));
});

adminVideosRouter.put('/videos/:id', (req, res) => {
  const parsed = videoUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const existing = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id) as VideoRow | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Video not found' });
    return;
  }
  const { title, description, url, sortOrder } = parsed.data;
  db.prepare(
    `UPDATE videos
     SET title = ?, description = ?, url = ?, sort_order = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    title ?? existing.title,
    description !== undefined ? description : existing.description,
    url ?? existing.url,
    sortOrder ?? existing.sort_order,
    req.params.id
  );

  res.json(mapVideoRow(db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id) as VideoRow));
});

adminVideosRouter.delete('/videos/:id', (req, res) => {
  db.prepare('DELETE FROM videos WHERE id = ?').run(req.params.id);
  res.status(204).end();
});
