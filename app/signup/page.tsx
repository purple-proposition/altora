'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import AltoraLogo from '@/components/AltoraLogo';
import { getInvite } from '@/lib/invites';

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupInner />
    </Suspense>
  );
}

function SignupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('invite');
  // The invite's name is only ever used to greet the right person by name
  // — it's looked up again server-side (app/api/auth/signup/route.ts) on
  // submit, this is just for the welcome message and to prefill the field,
  // never trusted on its own to grant access.
  const inviteName = getInvite(inviteCode)?.name ?? null;

  const [name, setName] = useState(inviteName ?? '');
  const [school, setSchool] = useState('');
  const [promotion, setPromotion] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, school, promotion, invite: inviteCode }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Erreur lors de la création du compte.');
      setLoading(false);
      return;
    }

    const signInRes = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (signInRes?.error) {
      setError('Compte créé, mais la connexion a échoué. Réessaie de te connecter.');
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#f5f5f7', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '380px', background: '#fff', borderRadius: '20px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <AltoraLogo style={{ width: '128px', height: '32px' }} />
        </div>

        {!inviteName ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '15px', color: '#171717', fontWeight: 600, margin: '0 0 8px' }}>Inscription sur invitation uniquement</p>
            <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
              Altora est en bêta privée pour le moment. Si on t&apos;a promis un accès, utilise le lien qu&apos;on t&apos;a envoyé.
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '15px', color: '#171717', fontWeight: 600, textAlign: 'center', margin: '0 0 24px' }}>
              Bienvenue {inviteName} 👋 cet accès t&apos;est réservé.
            </p>
            <form onSubmit={handleSubmit}>
              <label htmlFor="signup-name" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '6px' }}>Prénom</label>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '16px', marginBottom: '16px', boxSizing: 'border-box' }}
              />
              <label htmlFor="signup-school" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '6px' }}>École</label>
              <input
                id="signup-school"
                type="text"
                value={school}
                onChange={e => setSchool(e.target.value)}
                placeholder="Rocket School…"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '16px', marginBottom: '16px', boxSizing: 'border-box' }}
              />
              <label htmlFor="signup-promotion" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '6px' }}>Promotion</label>
              <input
                id="signup-promotion"
                type="text"
                value={promotion}
                onChange={e => setPromotion(e.target.value)}
                placeholder="Spoutnik 75…"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '16px', marginBottom: '16px', boxSizing: 'border-box' }}
              />
              <label htmlFor="signup-email" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '6px' }}>Email</label>
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '16px', marginBottom: '16px', boxSizing: 'border-box' }}
              />
              <label htmlFor="signup-password" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '6px' }}>Mot de passe <span style={{ fontWeight: 400 }}>(8 caractères min.)</span></label>
              <input
                id="signup-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '16px', marginBottom: '16px', boxSizing: 'border-box' }}
              />
              {error && <p style={{ color: '#c0392b', fontSize: '13px', margin: '0 0 16px' }}>{error}</p>}
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: '999px', border: 'none', background: '#4f46e5', color: '#fff', fontSize: '16px', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Création…' : 'Créer mon compte'}
              </button>
            </form>
          </>
        )}

        <p style={{ fontSize: '13px', color: '#666', textAlign: 'center', marginTop: '16px' }}>
          Déjà un compte ? <Link href="/login" style={{ color: '#4f46e5', fontWeight: 600 }}>Se connecter</Link>
        </p>
      </div>
    </main>
  );
}
