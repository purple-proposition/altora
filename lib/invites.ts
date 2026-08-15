// Closed-beta access: each invited person gets their own token embedded in
// the signup link sent directly to them, rather than a single shared code —
// a shared code can spread past whoever it was meant for, a per-person
// token can't (it's meaningless to anyone else, and only ever handed to
// one specific inbox). Add a new entry here for each person invited.
export const INVITES: Record<string, { name: string }> = {
  'leo-86124f9ab6d1': { name: 'Léo' },
  'jesse-a216c9add011': { name: 'Jesse' },
};

export function getInvite(code: string | null | undefined) {
  if (!code) return null;
  return INVITES[code] ?? null;
}
