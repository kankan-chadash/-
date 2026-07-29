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
import { mapUpcomingBookRow } from '../db/mappers';
import { UpcomingBookRow } from '../types';
import { upcomingBookInputSchema, upcomingBookUpdateSchema } from '../validation';
import { requireAdmin } from '../middleware/auth';

// Volumes announced on the shelf before any daf of them is published — they
// stand alongside the real books, greyed out, so readers can see what's coming.

export const publicUpcomingRouter = Router();
export const adminUpcomingRouter = Router();
adminUpcomingRouter.use(requireAdmin);

const ORDERED = 'SELECT * FROM upcoming_books ORDER BY sort_order ASC, created_at ASC';

publicUpcomingRouter.get('/upcoming', (_req, res) => {
  const rows = db.prepare(ORDERED).all() as UpcomingBookRow[];
  res.json(rows.map(mapUpcomingBookRow));
});

adminUpcomingRouter.get('/upcoming', (_req, res) => {
  const rows = db.prepare(ORDERED).all() as UpcomingBookRow[];
  res.json(rows.map(mapUpcomingBookRow));
});

adminUpcomingRouter.post('/upcoming', (req, res) => {
  const parsed = upcomingBookInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { tractate, note, sortOrder } = parsed.data;
  const id = uuid();
  const nextOrder =
    sortOrder ??
    ((db.prepare('SELECT MAX(sort_order) AS max FROM upcoming_books').get() as { max: number | null }).max ??
      -1) + 1;

  db.prepare('INSERT INTO upcoming_books (id, tractate, note, sort_order) VALUES (?, ?, ?, ?)').run(
    id,
    tractate,
    note ?? null,
    nextOrder
  );

  res
    .status(201)
    .json(
      mapUpcomingBookRow(db.prepare('SELECT * FROM upcoming_books WHERE id = ?').get(id) as UpcomingBookRow)
    );
});

adminUpcomingRouter.put('/upcoming/:id', (req, res) => {
  const parsed = upcomingBookUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const existing = db.prepare('SELECT * FROM upcoming_books WHERE id = ?').get(req.params.id) as
    | UpcomingBookRow
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Upcoming book not found' });
    return;
  }
  const { tractate, note, sortOrder } = parsed.data;
  db.prepare(
    `UPDATE upcoming_books
     SET tractate = ?, note = ?, sort_order = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    tractate ?? existing.tractate,
    note !== undefined ? note : existing.note,
    sortOrder ?? existing.sort_order,
    req.params.id
  );

  res.json(
    mapUpcomingBookRow(
      db.prepare('SELECT * FROM upcoming_books WHERE id = ?').get(req.params.id) as UpcomingBookRow
    )
  );
});

adminUpcomingRouter.delete('/upcoming/:id', (req, res) => {
  db.prepare('DELETE FROM upcoming_books WHERE id = ?').run(req.params.id);
  res.status(204).end();
});
