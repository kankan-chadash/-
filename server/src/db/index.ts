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
import Database from 'better-sqlite3';
import { config } from '../config';

const dbDir = path.dirname(config.databasePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(config.databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// schema.sql only creates tables that don't exist yet, so a column added to an
// existing table has to be applied separately. Adding one is idempotent here:
// we check what's actually there first, so this is safe to run on every boot.
function addColumnIfMissing(table: string, column: string, definition: string): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!columns.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// Manual badge placement, added after regions shipped.
addColumnIfMissing('regions', 'badge_x', 'REAL');
addColumnIfMissing('regions', 'badge_y', 'REAL');

// The parasha rail, added after the videos rail shipped. Left nullable rather
// than defaulted: an absent category already means "general" everywhere it's
// read, so existing rows need no backfill. (A CHECK constraint can't be added
// by ALTER TABLE in SQLite, so the values are policed by validation instead.)
addColumnIfMissing('videos', 'category', 'TEXT');
