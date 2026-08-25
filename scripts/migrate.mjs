#!/usr/bin/env node
//
// Applies migrations/*.sql in filename order, exactly once each.
//
// Runs from entrypoint.sh on every container start, so it must be safe when two
// tasks boot at the same time: a session-level advisory lock serializes them and
// the loser simply finds nothing left to apply.
//
//   npm run migrate        (locally, against DATABASE_URL)
//
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "migrations"
);

// Arbitrary, but every instance racing for the schema must pick the same key.
const ADVISORY_LOCK_KEY = 8410771;

const CONNECT_RETRIES = 10;
const CONNECT_RETRY_DELAY_MS = 2000;

function sslConfig() {
  if (process.env.DATABASE_SSL !== "true") return undefined;
  return {
    rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
  };
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function connect() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const ssl = sslConfig();

  let lastErr;
  for (let attempt = 1; attempt <= CONNECT_RETRIES; attempt++) {
    const client = new pg.Client({ connectionString, ...(ssl ? { ssl } : {}) });
    try {
      await client.connect();
      return client;
    } catch (err) {
      lastErr = err;
      await client.end().catch(() => {});
      if (attempt === CONNECT_RETRIES) break;
      console.log(
        `[migrate] database not ready (${err.message}); retrying in ${
          CONNECT_RETRY_DELAY_MS / 1000
        }s (${attempt}/${CONNECT_RETRIES})`
      );
      await sleep(CONNECT_RETRY_DELAY_MS);
    }
  }
  throw lastErr;
}

async function main() {
  const client = await connect();
  let locked = false;

  try {
    // Take the lock *before* touching the ledger table — two tasks racing on
    // CREATE TABLE IF NOT EXISTS can still collide in the system catalog.
    await client.query("SELECT pg_advisory_lock($1)", [ADVISORY_LOCK_KEY]);
    locked = true;

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   TEXT        PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const { rows } = await client.query("SELECT filename FROM schema_migrations");
    const applied = new Set(rows.map((r) => r.filename));

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const pending = files.filter((f) => !applied.has(f));
    if (pending.length === 0) {
      console.log(`[migrate] up to date (${files.length} applied)`);
      return;
    }

    for (const filename of pending) {
      const statements = await readFile(path.join(MIGRATIONS_DIR, filename), "utf8");
      console.log(`[migrate] applying ${filename}`);
      try {
        await client.query("BEGIN");
        await client.query(statements);
        await client.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1)",
          [filename]
        );
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        throw new Error(`${filename} failed: ${err.message}`);
      }
    }

    console.log(`[migrate] applied ${pending.length} migration(s)`);
  } finally {
    if (locked) {
      await client
        .query("SELECT pg_advisory_unlock($1)", [ADVISORY_LOCK_KEY])
        .catch(() => {});
    }
    await client.end().catch(() => {});
  }
}

main().catch((err) => {
  console.error(`[migrate] ${err.message}`);
  process.exit(1);
});
