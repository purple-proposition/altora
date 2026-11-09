// Sends transactional mail. Delivery is wired to Cloudflare's send_email
// binding (env.SEND_EMAIL), which only works once a sending domain is
// verified in Cloudflare Email Service. Until then, sendMail throws and the
// code is NOT logged in production.
import { getCloudflareContext } from '@opennextjs/cloudflare';

type SendEmailBinding = { send(msg: unknown): Promise<unknown> };

export class MailNotConfiguredError extends Error {}

export async function sendMail(to: string, subject: string, text: string): Promise<void> {
  const from = process.env.MAIL_FROM;
  let binding: SendEmailBinding | undefined;
  try {
    binding = (getCloudflareContext().env as { SEND_EMAIL?: SendEmailBinding }).SEND_EMAIL;
  } catch {
    binding = undefined;
  }
  if (!binding || !from) {
    throw new MailNotConfiguredError('Mail sender not configured');
  }
  await binding.send({ to, from, subject, text });
}
