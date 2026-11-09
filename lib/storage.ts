// Stockage des fichiers (CV, dossiers, générations) dans Cloudflare R2.
// Les objets ne sont jamais publics : ils sont servis par /api/files/[...key],
// qui vérifie que la personne connectée en est le propriétaire.
import { getCloudflareContext } from '@opennextjs/cloudflare';

type R2Object = { body: ReadableStream; size: number; httpMetadata?: { contentType?: string } };
type R2Bucket = {
  put(key: string, value: ArrayBuffer | Uint8Array, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(key: string): Promise<R2Object | null>;
};

// Préfixes autorisés. Chaque clé suit la forme `<préfixe>/<userId>-<reste>`.
const PREFIXES = ['cv', 'cv-thumbnails', 'folder-files', 'generations'] as const;

async function bucket(): Promise<R2Bucket> {
  const { env } = await getCloudflareContext({ async: true });
  return (env as unknown as { CV_BUCKET: R2Bucket }).CV_BUCKET;
}

// Enregistre un fichier et renvoie l'URL interne qui le sert.
export async function storePut(key: string, body: ArrayBuffer | Uint8Array, contentType: string): Promise<string> {
  await (await bucket()).put(key, body, { httpMetadata: { contentType } });
  return `/api/files/${key}`;
}

export async function storeGet(key: string): Promise<R2Object | null> {
  return (await bucket()).get(key);
}

// Vrai seulement si la clé a un préfixe connu et appartient à cet utilisateur.
export function ownsKey(userId: string, key: string): boolean {
  if (key.includes('..')) return false;
  const slash = key.indexOf('/');
  if (slash < 0) return false;
  const prefix = key.slice(0, slash);
  const rest = key.slice(slash + 1);
  return (PREFIXES as readonly string[]).includes(prefix) && rest.startsWith(`${userId}-`);
}
