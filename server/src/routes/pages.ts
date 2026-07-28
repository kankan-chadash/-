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
import { mapPageRow, mapRegionRow } from '../db/mappers';
import { PageRow, RegionRow } from '../types';
import { pageInputSchema, pageUpdateSchema, regionsReplaceSchema } from '../validation';
import { requireAdmin } from '../middleware/auth';

export const publicPagesRouter = Router();
export const adminPagesRouter = Router();
adminPagesRouter.use(requireAdmin);

function getPageWithRegions(id: string) {
  const pageRow = db.prepare('SELECT * FROM pages WHERE id = ?').get(id) as PageRow | undefined;
  if (!pageRow) return null;
  const regionRows = db
    .prepare('SELECT * FROM regions WHERE page_id = ? ORDER BY sort_order ASC')
    .all(id) as RegionRow[];
  return { ...mapPageRow(pageRow), regions: regionRows.map(mapRegionRow) };
}

// --- Public routes ---

publicPagesRouter.get('/pages', (_req, res) => {
  const rows = db.prepare('SELECT * FROM pages ORDER BY tractate ASC, daf ASC, side ASC').all() as PageRow[];
  res.json(rows.map(mapPageRow));
});

publicPagesRouter.get('/pages/:id', (req, res) => {
  const page = getPageWithRegions(req.params.id);
  if (!page) {
    res.status(404).json({ error: 'Page not found' });
    return;
  }
  res.json(page);
});

publicPagesRouter.get('/pages/lookup/by-ref', (req, res) => {
  const { tractate, daf, side } = req.query;
  if (typeof tractate !== 'string' || typeof daf !== 'string' || (side !== 'a' && side !== 'b')) {
    res.status(400).json({ error: 'tractate, daf, and side query params are required' });
    return;
  }
  const row = db
    .prepare('SELECT * FROM pages WHERE tractate = ? AND daf = ? AND side = ?')
    .get(tractate, parseInt(daf, 10), side) as PageRow | undefined;
  if (!row) {
    res.status(404).json({ error: 'Page not found' });
    return;
  }
  const page = getPageWithRegions(row.id);
  res.json(page);
});

// --- Admin routes (mounted behind requireAdmin in index.ts) ---

adminPagesRouter.get('/pages', (_req, res) => {
  const rows = db.prepare('SELECT * FROM pages ORDER BY tractate ASC, daf ASC, side ASC').all() as PageRow[];
  res.json(rows.map(mapPageRow));
});

adminPagesRouter.get('/pages/:id', (req, res) => {
  const page = getPageWithRegions(req.params.id);
  if (!page) {
    res.status(404).json({ error: 'Page not found' });
    return;
  }
  res.json(page);
});

adminPagesRouter.post('/pages', (req, res) => {
  const parsed = pageInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { tractate, daf, side, pageImageUrl, imageWidth, imageHeight } = parsed.data;
  const id = uuid();

  try {
    db.prepare(
      `INSERT INTO pages (id, tractate, daf, side, page_image_url, image_width, image_height)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, tractate, daf, side, pageImageUrl, imageWidth ?? null, imageHeight ?? null);
  } catch (err) {
    res.status(409).json({ error: 'A page with this tractate, daf, and side already exists' });
    return;
  }

  res.status(201).json(getPageWithRegions(id));
});

adminPagesRouter.put('/pages/:id', (req, res) => {
  const parsed = pageUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const existing = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id) as
    | PageRow
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Page not found' });
    return;
  }

  const merged = {
    tractate: parsed.data.tractate ?? existing.tractate,
    daf: parsed.data.daf ?? existing.daf,
    side: parsed.data.side ?? existing.side,
    pageImageUrl: parsed.data.pageImageUrl ?? existing.page_image_url,
    imageWidth: parsed.data.imageWidth !== undefined ? parsed.data.imageWidth : existing.image_width,
    imageHeight:
      parsed.data.imageHeight !== undefined ? parsed.data.imageHeight : existing.image_height,
  };

  db.prepare(
    `UPDATE pages SET tractate = ?, daf = ?, side = ?, page_image_url = ?, image_width = ?, image_height = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    merged.tractate,
    merged.daf,
    merged.side,
    merged.pageImageUrl,
    merged.imageWidth,
    merged.imageHeight,
    req.params.id
  );

  res.json(getPageWithRegions(req.params.id));
});

adminPagesRouter.delete('/pages/:id', (req, res) => {
  const result = db.prepare('DELETE FROM pages WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Page not found' });
    return;
  }
  res.status(204).end();
});

adminPagesRouter.put('/pages/:id/regions', (req, res) => {
  const page = db.prepare('SELECT id FROM pages WHERE id = ?').get(req.params.id);
  if (!page) {
    res.status(404).json({ error: 'Page not found' });
    return;
  }

  const parsed = regionsReplaceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const replaceRegions = db.transaction((pageId: string, regions: typeof parsed.data.regions) => {
    db.prepare('DELETE FROM regions WHERE page_id = ?').run(pageId);
    const insert = db.prepare(
      `INSERT INTO regions (id, page_id, shape, coordinates, content_type, content, title, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    regions.forEach((region, index) => {
      insert.run(
        region.id ?? uuid(),
        pageId,
        region.shape,
        JSON.stringify(region.coordinates),
        region.contentType,
        region.content,
        region.title ?? null,
        region.sortOrder ?? index
      );
    });
  });

  replaceRegions(req.params.id, parsed.data.regions);
  res.json(getPageWithRegions(req.params.id));
});

export default adminPagesRouter;
