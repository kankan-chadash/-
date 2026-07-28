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
import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { config } from '../config';
import { mapPageRow, mapRegionRow } from '../db/mappers';
import { PageRow, RegionRow } from '../types';

// Exports the current database content into static JSON (+ copies referenced
// uploaded images) under client/public/data, so `npm run build:pages` can ship
// a fully static, read-only viewer to GitHub Pages with no backend involved.
// Run this locally after editing pages/regions in the admin panel, then commit
// the resulting client/public/data/** files. See README.md for the full workflow.

const CLIENT_PUBLIC_DATA_DIR = path.resolve(__dirname, '../../../client/public/data');
const IMAGES_DIR = path.join(CLIENT_PUBLIC_DATA_DIR, 'images');
const PAGES_DIR = path.join(CLIENT_PUBLIC_DATA_DIR, 'pages');
const UPLOADS_URL_PREFIX = '/uploads/';

function resetDir(dir: string) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * If `url` points at a locally-uploaded file (`/uploads/<name>`), copies it into
 * client/public/data/images and returns the new relative path. Anything else
 * (an external http(s) URL) is returned unchanged.
 */
function copyIfUpload(url: string, copiedFiles: Set<string>): string {
  if (!url.startsWith(UPLOADS_URL_PREFIX)) return url;

  const filename = url.slice(UPLOADS_URL_PREFIX.length);
  const source = path.join(config.uploadsDir, filename);
  if (!fs.existsSync(source)) {
    console.warn(`  ! Referenced upload not found on disk, skipping copy: ${filename}`);
    return url;
  }
  fs.copyFileSync(source, path.join(IMAGES_DIR, filename));
  copiedFiles.add(filename);
  return `data/images/${filename}`;
}

function main() {
  resetDir(IMAGES_DIR);
  resetDir(PAGES_DIR);

  const copiedFiles = new Set<string>();
  const pageRows = db
    .prepare('SELECT * FROM pages ORDER BY tractate ASC, daf ASC, side ASC')
    .all() as PageRow[];

  const pageIndex = pageRows.map((row) => {
    const page = mapPageRow(row);
    return { ...page, pageImageUrl: copyIfUpload(page.pageImageUrl, copiedFiles) };
  });

  fs.writeFileSync(path.join(CLIENT_PUBLIC_DATA_DIR, 'pages.json'), JSON.stringify(pageIndex, null, 2));

  for (const row of pageRows) {
    const page = mapPageRow(row);
    const regionRows = db
      .prepare('SELECT * FROM regions WHERE page_id = ? ORDER BY sort_order ASC')
      .all(row.id) as RegionRow[];
    const regions = regionRows.map(mapRegionRow).map((region) => ({
      ...region,
      content: region.contentType === 'image' ? copyIfUpload(region.content, copiedFiles) : region.content,
    }));

    const exported = {
      ...page,
      pageImageUrl: copyIfUpload(page.pageImageUrl, copiedFiles),
      regions,
    };
    fs.writeFileSync(path.join(PAGES_DIR, `${row.id}.json`), JSON.stringify(exported, null, 2));
  }

  // Keep the folders tracked in git even when there's no content yet.
  fs.writeFileSync(path.join(IMAGES_DIR, '.gitkeep'), '');
  fs.writeFileSync(path.join(PAGES_DIR, '.gitkeep'), '');

  console.log(`Exported ${pageRows.length} page(s) and copied ${copiedFiles.size} image(s) to`);
  console.log(`  ${CLIENT_PUBLIC_DATA_DIR}`);
  console.log('Commit the client/public/data/** changes, then push/merge to trigger the GitHub Pages deploy.');
}

main();
