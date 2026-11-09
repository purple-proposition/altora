import { ensureSchema } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { createEmailCode } from '@/lib/otp';
import { sendMail, MailNotConfiguredError } from '@/lib/mail';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as { email?: string } | null;
  const email = (body?.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return Response.json({ error: 'Adresse e-mail invalide.' }, { status: 400 });
  }
  // Throttle both per address and per client so codes can't be spammed.
  if (!rateLimit(`otp-email:${email}`, 5, 15 * 60_000) || !rateLimit(`otp-ip:${clientIp(req)}`, 20, 15 * 60_000)) {
    return Response.json({ error: 'Trop de tentatives. Réessaie dans quelques minutes.' }, { status: 429 });
  }
  await ensureSchema();
  const code = await createEmailCode(email);
  try {
    await sendMail(
      email,
      'Ton code de connexion Altora',
      `Ton code Altora : ${code}\n\nIl expire dans 10 minutes. Si tu n'as pas demandé ce code, ignore ce message.`,
    );
  } catch (err) {
    if (err instanceof MailNotConfiguredError) {
      console.warn('[otp] mail not configured; code not delivered');
      return Response.json({ error: "L'envoi des codes n'est pas encore activé." }, { status: 503 });
    }
    throw err;
  }
  return Response.json({ ok: true });
}
