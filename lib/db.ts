import { unstable_cache as nextCache, revalidateTag } from 'next/cache';
import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

// Same pattern as lib/school.ts's isUserSchoolAdmin: cv_url/cv_filename
// used to be re-fetched from the DB on every single navigation to "/" or
// "/generate" — cached for a short window instead, invalidated immediately
// via revalidateTag the moment a CV is actually uploaded (see
// app/api/profile/cv/route.ts), so a reload during that window is instant
// instead of paying a full round-trip for a value that almost never changes.
export const getUserCv = (userId: string): Promise<{ cvUrl: string; cvFilename: string }> =>
  nextCache(
    async (id: string) => {
      const rows = await sql`SELECT cv_url, cv_filename FROM users WHERE id = ${id}`;
      return { cvUrl: rows[0]?.cv_url || '', cvFilename: rows[0]?.cv_filename || '' };
    },
    ['user-cv'],
    { tags: [`user-cv:${userId}`], revalidate: 60 },
  )(userId);

export const invalidateUserCv = (userId: string) => revalidateTag(`user-cv:${userId}`);

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
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS cv_thumbnail_url TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile JSONB`;
  await sql`
    CREATE TABLE IF NOT EXISTS schools (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      rhythm TEXT NOT NULL DEFAULT '',
      availability TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_school_admin BOOLEAN NOT NULL DEFAULT false`;
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
    CREATE TABLE IF NOT EXISTS folder_files (
      id TEXT PRIMARY KEY,
      folder_id INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      filename TEXT NOT NULL,
      thumbnail_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`ALTER TABLE folder_files ADD COLUMN IF NOT EXISTS thumbnail_url TEXT`;
  await sql`CREATE INDEX IF NOT EXISTS folder_files_folder_id_idx ON folder_files(folder_id)`;
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
