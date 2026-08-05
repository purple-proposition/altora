// One-off setup script: marks 'generate_lead' (fired from QuoteModal.tsx
// on a successful HubSpot submission) as a GA4 Key Event, so it shows up
// as a conversion everywhere in GA4's UI/reports instead of just being a
// raw custom event.
//
// Run: node scripts/ga-setup.mjs
import { GoogleAuth } from 'google-auth-library';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROPERTY_ID = '548636619';
const KEY_EVENT_NAME = 'generate_lead';

const auth = new GoogleAuth({
  keyFile: path.join(__dirname, '..', 'secrets', 'ga-service-account.json'),
  scopes: ['https://www.googleapis.com/auth/analytics.edit'],
});

const client = await auth.getClient();
const { token } = await client.getAccessToken();

async function callAdminApi(pathSuffix, options = {}) {
  const res = await fetch(`https://analyticsadmin.googleapis.com/v1beta/${pathSuffix}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
  });
  const body = await res.json();
  return { status: res.status, body };
}

const existing = await callAdminApi(`properties/${PROPERTY_ID}/keyEvents`);
const alreadyExists = existing.body.keyEvents?.some((e) => e.eventName === KEY_EVENT_NAME);

if (alreadyExists) {
  console.log(`Key event "${KEY_EVENT_NAME}" already exists — nothing to do.`);
} else {
  const created = await callAdminApi(`properties/${PROPERTY_ID}/keyEvents`, {
    method: 'POST',
    body: JSON.stringify({ eventName: KEY_EVENT_NAME, countingMethod: 'ONCE_PER_EVENT' }),
  });
  console.log('Status:', created.status);
  console.log(JSON.stringify(created.body, null, 2));
}
