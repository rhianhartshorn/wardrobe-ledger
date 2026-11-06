import 'server-only';
import { MIGRATIONS } from './migrations';

export type Db = {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  exec(sql: string): Promise<void>;
};

let ready: Promise<Db> | null = null;

// Production must use a real, durable Postgres. The original app silently fell
// back to non-durable storage and lost the whole wardrobe when its only
// database disappeared — never again. Locally (and in tests) an embedded
// Postgres (PGlite) stands in, persisted to .local-pg unless PGLITE_DIR is
// ':memory:'.
async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: url, max: 5 });
    return {
      query: async (sql, params) => (await pool.query(sql, params as unknown[])).rows,
      exec: async (sql) => { await pool.query(sql); },
    };
  }
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_EMBEDDED_DB) {
    throw new Error('DATABASE_URL is not set — refusing to start on non-durable storage in production.');
  }
  const { PGlite } = await import('@electric-sql/pglite');
  const dir = process.env.PGLITE_DIR ?? '.local-pg';
  const lite = dir === ':memory:' ? new PGlite() : new PGlite(dir);
  return {
    query: async <T,>(sql: string, params?: unknown[]) => (await lite.query<T>(sql, params)).rows,
    exec: async (sql) => { await lite.exec(sql); },
  };
}

async function migrate(db: Db): Promise<void> {
  await db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version int PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const applied = new Set(
    (await db.query<{ version: number }>('SELECT version FROM schema_migrations')).map((r) => r.version),
  );
  for (const m of MIGRATIONS) {
    if (applied.has(m.version)) continue;
    await db.exec(`BEGIN; ${m.sql}; INSERT INTO schema_migrations (version) VALUES (${m.version}); COMMIT;`);
  }
}

export function getDb(): Promise<Db> {
  if (!ready) {
    ready = connect().then(async (db) => { await migrate(db); return db; });
    // A failed connection must not be cached forever — let the next request retry.
    ready.catch(() => { ready = null; });
  }
  return ready;
}

export async function query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
  const db = await getDb();
  return db.query<T>(sql, params);
}
