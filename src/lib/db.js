import { Pool } from "pg";

// Next.js hot-reloads modules in dev, which would leak a fresh pool on every
// edit. Stash it on globalThis so reloads reuse one pool.
const globalForDb = globalThis;

function sslConfig() {
  if (process.env.DATABASE_SSL !== "true") {
    // Left undefined so a `?sslmode=` in DATABASE_URL still takes effect.
    return undefined;
  }
  return {
    rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
  };
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const ssl = sslConfig();
  const pool = new Pool({
    connectionString,
    ...(ssl ? { ssl } : {}),
    // Small on purpose: one Fargate task serving ~15 users. RDS Proxy, if it is
    // ever added, does the real pooling.
    max: Number(process.env.DATABASE_POOL_MAX || 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  // An idle client dropped by the server emits 'error' on the pool. Without a
  // listener that becomes an unhandled exception and kills the task.
  pool.on("error", (err) => {
    console.error("Postgres idle client error:", err.message);
  });
  return pool;
}

export function getPool() {
  if (!globalForDb.__naievePool) {
    globalForDb.__naievePool = createPool();
  }
  return globalForDb.__naievePool;
}

/**
 * Parameterized tagged-template query.
 *
 * Drop-in replacement for the `sql` export that `@vercel/postgres` provided, so
 * call sites read identically:
 *
 *   const { rows } = await sql`SELECT * FROM chat_logs WHERE id = ${id}`;
 *
 * Every interpolation becomes a $1..$n placeholder — values are never
 * concatenated into the statement text.
 */
export function sql(strings, ...values) {
  const text = strings.reduce(
    (acc, part, i) => acc + part + (i < values.length ? `$${i + 1}` : ""),
    ""
  );
  return getPool().query(text, values);
}
