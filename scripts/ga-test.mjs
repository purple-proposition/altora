// One-off connectivity check: confirms the service account key + GA4
// account access actually work end to end, by fetching the Altora
// property's own details from the Analytics Admin API.
//
// Run: node scripts/ga-test.mjs
import { GoogleAuth } from 'google-auth-library';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROPERTY_ID = '548636619';

const auth = new GoogleAuth({
  keyFile: path.join(__dirname, '..', 'secrets', 'ga-service-account.json'),
  scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
});

const client = await auth.getClient();
const { token } = await client.getAccessToken();

const res = await fetch(`https://analyticsadmin.googleapis.com/v1beta/properties/${PROPERTY_ID}`, {
  headers: { Authorization: `Bearer ${token}` },
});

const body = await res.json();
console.log('Status:', res.status);
console.log(JSON.stringify(body, null, 2));
