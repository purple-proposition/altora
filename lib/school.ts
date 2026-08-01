import { unstable_cache as cache, revalidateTag } from 'next/cache';
import { sql, ensureSchema } from './db';

export type School = {
  id: number;
  name: string;
  rhythm: string;
  availability: string;
};

export type SchoolStudent = {
  id: string;
  name: string | null;
  email: string;
  promotion: string | null;
  isSchoolAdmin: boolean;
  createdAt: string;
  cardCount: number;
};

// Bootstrap: this app is currently single-school in practice, so a user with
// no school_id yet is attached to the first school row (creating one named
// "Mon école" if none exists) rather than requiring an invite flow.
export async function ensureUserSchool(userId: string): Promise<School> {
  await ensureSchema();
  const rows = await sql`
    SELECT s.id, s.name, s.rhythm, s.availability
    FROM users u JOIN schools s ON s.id = u.school_id
    WHERE u.id = ${userId}
  `;
  if (rows[0]) return rows[0] as School;

  const existing = await sql`SELECT id, name, rhythm, availability FROM schools ORDER BY id ASC LIMIT 1`;
  let school = existing[0] as School | undefined;
  if (!school) {
    const created = await sql`INSERT INTO schools (name) VALUES ('Mon école') RETURNING id, name, rhythm, availability`;
    school = created[0] as School;
  }
  await sql`UPDATE users SET school_id = ${school.id} WHERE id = ${userId}`;
  return school;
}

// This runs on every single navigation (checked once in the (tracker) layout
// for every page), so it's cached for a short window instead of hitting the
// DB on each nav — invalidated immediately via revalidateTag whenever the
// flag actually changes (toggleSelfSchoolAdmin below).
export const isUserSchoolAdmin = (userId: string): Promise<boolean> =>
  cache(
    async (id: string) => {
      await ensureSchema();
      const rows = await sql`SELECT is_school_admin FROM users WHERE id = ${id}`;
      return !!rows[0]?.is_school_admin;
    },
    ['school-admin-flag'],
    { tags: [`school-admin:${userId}`], revalidate: 60 },
  )(userId);

// Dev/demo shortcut only (bound to a keyboard chord in the UI) — flips the
// current user's own admin flag with no other checks. Not the production
// path for granting admin rights to someone else.
export async function toggleSelfSchoolAdmin(userId: string): Promise<boolean> {
  await ensureSchema();
  const rows = await sql`UPDATE users SET is_school_admin = NOT is_school_admin WHERE id = ${userId} RETURNING is_school_admin`;
  revalidateTag(`school-admin:${userId}`);
  return !!rows[0]?.is_school_admin;
}

export async function updateSchool(schoolId: number, data: { name: string; rhythm: string; availability: string }): Promise<School> {
  await ensureSchema();
  const rows = await sql`
    UPDATE schools SET name = ${data.name}, rhythm = ${data.rhythm}, availability = ${data.availability}
    WHERE id = ${schoolId}
    RETURNING id, name, rhythm, availability
  `;
  return rows[0] as School;
}

export async function listSchoolStudents(schoolId: number): Promise<SchoolStudent[]> {
  await ensureSchema();
  const rows = await sql`
    SELECT u.id, u.name, u.email, u.promotion, u.is_school_admin, u.created_at,
           COUNT(c.id)::int AS card_count
    FROM users u
    LEFT JOIN cards c ON c.user_id = u.id
    WHERE u.school_id = ${schoolId}
    GROUP BY u.id
    ORDER BY u.promotion NULLS LAST, u.name NULLS LAST, u.created_at ASC
  `;
  return rows.map((r) => ({
    id: String(r.id),
    name: r.name,
    email: r.email,
    promotion: r.promotion,
    isSchoolAdmin: r.is_school_admin,
    createdAt: r.created_at,
    cardCount: r.card_count,
  }));
}
