/**
 * Lightweight migration script that creates tables if they don't exist.
 * Runs at container startup before the Next.js server.
 * No dependency on drizzle-kit — uses pg directly.
 */
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  credits INTEGER NOT NULL DEFAULT 300,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  referral_code TEXT,
  referred_by TEXT,
  avatar_url TEXT,
  last_login_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS designs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  tokens TEXT NOT NULL,
  resolved TEXT NOT NULL,
  design_md TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS designs_user_slug_idx ON designs(user_id, slug);

CREATE TABLE IF NOT EXISTS quest_completions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  quest_id TEXT NOT NULL,
  credits_awarded INTEGER NOT NULL,
  completed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS quest_user_idx ON quest_completions(user_id, quest_id);
`;

try {
  await pool.query(SQL);
  console.log("✓ Database tables ready");
} catch (err) {
  console.error("✗ Migration failed:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
