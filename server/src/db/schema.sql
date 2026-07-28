CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  tractate TEXT NOT NULL,
  daf INTEGER NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('a', 'b')),
  page_image_url TEXT NOT NULL,
  image_width INTEGER,
  image_height INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_tractate_daf_side ON pages (tractate, daf, side);

CREATE TABLE IF NOT EXISTS regions (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES pages (id) ON DELETE CASCADE,
  shape TEXT NOT NULL CHECK (shape IN ('rectangle', 'polygon')),
  coordinates TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'image', 'text')),
  content TEXT NOT NULL,
  title TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_regions_page_id ON regions (page_id);
