// Closed-beta access: each invited person gets their own token embedded in
// the signup link sent directly to them, rather than a single shared code —
// a shared code can spread past whoever it was meant for, a per-person
// token can't (it's meaningless to anyone else, and only ever handed to
// one specific inbox). There is no separate signup form anymore: visiting
// the link with a valid token signs you straight in (see the "invite"
// Credentials provider in auth.ts), provisioning the account on first
// visit. `email` here is just an internal DB key, never shown or used to
// log in some other way — the token is the only credential.
export const INVITES: Record<string, { name: string; email: string }> = {
  'leo-86124f9ab6d1': { name: 'Léo', email: 'leo@invite.altora.local' },
  'jesse-a216c9add011': { name: 'Jesse', email: 'jesse@invite.altora.local' },
};

export function getInvite(code: string | null | undefined) {
  if (!code) return null;
  return INVITES[code] ?? null;
}
