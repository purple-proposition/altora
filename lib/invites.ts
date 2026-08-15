// Closed-beta access: each invited person gets their own token embedded in
// the signup link sent directly to them, rather than a single shared code —
// a shared code can spread past whoever it was meant for, a per-person
// token can't (it's meaningless to anyone else, and only ever handed to
// one specific inbox). There is no separate signup form anymore: visiting
// the link with a valid token signs you straight in (see the "invite"
// Credentials provider in auth.ts), provisioning the account on first
// visit. The token is the only credential — no password is ever set for
// these accounts.
//
// `email` must be the person's REAL address when they already have an
// account: it's what the invite provider looks the user up by, so a
// placeholder address would silently strand them in a second, empty
// account instead of the one holding their CV, profile and past
// generations.
export const INVITES: Record<string, { name: string; email: string }> = {
  'leo-86124f9ab6d1': { name: 'Léo', email: 'leo.beneitomounard@rocket-school.eu' },
  'jesse-a216c9add011': { name: 'Jesse', email: 'jesse.sotomayor@rocket-school.eu' },
  // TEMPORAIRE : compte jetable pour vérifier le nouveau parcours en prod.
  'tmpflow-148c2c905343': { name: 'Camille', email: 'qa-parcours@altora.test' },
};

export function getInvite(code: string | null | undefined) {
  if (!code) return null;
  return INVITES[code] ?? null;
}
