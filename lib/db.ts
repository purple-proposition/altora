import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

export async function ensureSchema() {
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
}
