import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const { Pool } = pg;

console.log("[migrate] Starting migration...");
console.log("[migrate] DATABASE_URL set:", !!process.env.DATABASE_URL);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  // Verify connection first
  const client = await pool.connect();
  const { rows } = await client.query("SELECT current_database(), current_user");
  console.log("[migrate] Connected to:", rows[0].current_database, "as", rows[0].current_user);
  client.release();

  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("[migrate] ✓ Migrations applied successfully");
} catch (err) {
  console.error("[migrate] ✗ Migration failed");
  console.error("[migrate] Error name:", err.name);
  console.error("[migrate] Error message:", err.message);
  if (err.detail) console.error("[migrate] Detail:", err.detail);
  if (err.hint) console.error("[migrate] Hint:", err.hint);
  if (err.where) console.error("[migrate] Where:", err.where);
  if (err.code) console.error("[migrate] PG code:", err.code);
  console.error("[migrate] Stack:", err.stack);
  process.exit(1);
} finally {
  await pool.end();
}
