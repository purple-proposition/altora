'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
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
      body: JSON.stringify({ name, email, password, school, promotion }),
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#f5f5f7', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '380px', background: '#fff', borderRadius: '20px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <span style={{ fontFamily: '"BBH Hegarty", "Inter", sans-serif', fontSize: '28px', fontWeight: 800 }}>Altora</span>
        </div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '6px' }}>Prénom</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '16px', marginBottom: '16px', boxSizing: 'border-box' }}
        />
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '6px' }}>École</label>
        <input
          type="text"
          value={school}
          onChange={e => setSchool(e.target.value)}
          placeholder="Rocket School…"
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '16px', marginBottom: '16px', boxSizing: 'border-box' }}
        />
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '6px' }}>Promotion</label>
        <input
          type="text"
          value={promotion}
          onChange={e => setPromotion(e.target.value)}
          placeholder="Spoutnik 75…"
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '16px', marginBottom: '16px', boxSizing: 'border-box' }}
        />
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '6px' }}>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '16px', marginBottom: '16px', boxSizing: 'border-box' }}
        />
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '6px' }}>Mot de passe <span style={{ fontWeight: 400 }}>(8 caractères min.)</span></label>
        <input
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
        <p style={{ fontSize: '13px', color: '#666', textAlign: 'center', marginTop: '16px' }}>
          Déjà un compte ? <Link href="/login" style={{ color: '#4f46e5', fontWeight: 600 }}>Se connecter</Link>
        </p>
      </form>
    </div>
  );
}
