import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

// Schema only needs to be checked/created once per warm server instance —
// re-running 7 CREATE/ALTER/INDEX statements on every single page load was
// adding a full sequential round-trip chain to every navigation.
let schemaReady: Promise<void> | null = null;

export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = runSchema().catch(err => {
      schemaReady = null; // let the next call retry instead of caching a permanent failure
      throw err;
    });
  }
  return schemaReady;
}

async function runSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      school TEXT,
      promotion TEXT,
      cv_url TEXT,
      cv_filename TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS school TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS promotion TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS cv_url TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS cv_filename TEXT`;
  await sql`
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS cards_user_id_idx ON cards(user_id)`;
  await sql`
    CREATE TABLE IF NOT EXISTS folders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS folders_user_id_idx ON folders(user_id)`;
  await sql`
    CREATE TABLE IF NOT EXISTS generations (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      card_id TEXT REFERENCES cards(id) ON DELETE SET NULL,
      company TEXT NOT NULL DEFAULT '',
      poste TEXT NOT NULL DEFAULT '',
      contract_type TEXT NOT NULL DEFAULT 'alternance',
      job_description TEXT NOT NULL DEFAULT '',
      cv_url TEXT NOT NULL,
      lettre_url TEXT NOT NULL,
      analysis JSONB NOT NULL,
      email JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS generations_user_id_idx ON generations(user_id)`;
}
