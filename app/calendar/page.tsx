import Link from 'next/link';

export default function CalendarPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', background: '#fff' }}>
      <div style={{ width: '100%', maxWidth: '620px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: '#888', textDecoration: 'none', marginBottom: '20px' }}>
          ← Retour au suivi
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: 500, margin: '0 0 8px' }}>Calendrier</h1>
        <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>
          Bientôt disponible : visualise ici tes entretiens et deadlines de candidature.
        </p>
      </div>
    </div>
  );
}
