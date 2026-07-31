'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { sql, ensureSchema } from '@/lib/db';

export async function createFolder(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;

  const name = String(formData.get('name') || '').trim().slice(0, 100);
  if (!name) return;

  await ensureSchema();
  await sql`INSERT INTO folders (user_id, name) VALUES (${session.user.id}, ${name})`;
  revalidatePath('/documents');
}

export async function deleteFolder(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;

  const id = Number(formData.get('id'));
  if (!Number.isInteger(id)) return;

  await ensureSchema();
  await sql`DELETE FROM folders WHERE id = ${id} AND user_id = ${session.user.id}`;
  revalidatePath('/documents');
}
