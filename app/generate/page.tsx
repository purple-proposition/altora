'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type State = 'idle' | 'loading' | 'done' | 'error';

type Analysis = {
  keywords: string[];
  adjustments: string[];
  missing: string[];
  atsScore: number;
  atsImprovements: string[];
};

const EMPTY_ANALYSIS: Analysis = {
  keywords: [], adjustments: [], missing: [], atsScore: 0, atsImprovements: [],
};

export default function GeneratePage() {
  return (
    <Suspense fallback={null}>
      <GenerateForm />
    </Suspense>
  );
}

function GenerateForm() {
  const searchParams = useSearchParams();
  const cardId = searchParams.get('cardId');
  const [jobPosting, setJobPosting] = useState(() => searchParams.get('job') ?? '');
  const [markedSent, setMarkedSent] = useState(false);
  const [contractType, setContractType] = useState<'alternance' | 'cdi'>('alternance');
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [lettreUrl, setLettreUrl] = useState('');
  const [analysis, setAnalysis] = useState<Analysis>(EMPTY_ANALYSIS);
  const [modifications, setModifications] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState<{ to: string; objet: string; corps: string } | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);

  async function handleCopyEmail() {
    if (!email) return;
    const toLine = email.to ? `À : ${email.to}\n` : '';
    await navigator.clipboard.writeText(`${toLine}Objet : ${email.objet}\n\n${email.corps}`);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  }

  function normalizeFilename(s: string): string {
    // NFD decomposes accented chars, then strip combining diacriticals U+0300–U+036F
    const noAccents = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const noSpecial = noAccents.replace(/[^a-zA-Z0-9 ]/g, '');
    const underscored = noSpecial.trim().replace(/\s+/g, '_');
    return underscored || 'Entreprise';
  }

  async function handleGenerate() {
    if (!jobPosting.trim()) return;
    setState('loading');
    setError('');
    setProgress(0);
    setStep('Démarrage…');
    const t0 = Date.now();

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobPosting, contractType, modifications: modifications.trim() || undefined }),
      });

      if (!res.ok || !res.body) throw new Error('Erreur serveur');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          const data = JSON.parse(part.slice(6));

          if (data.error) throw new Error(data.error);
          if (data.progress !== undefined) setProgress(data.progress);
          if (data.step) setStep(data.step);

          if (data.done) {
            const toUrl = (b64: string) => {
              const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
              return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
            };
            setCvUrl(toUrl(data.cv));
            setLettreUrl(toUrl(data.lettre));
            setAnalysis({
              keywords: data.keywords ?? [],
              adjustments: data.adjustments ?? [],
              missing: data.missing ?? [],
              atsScore: data.atsScore ?? 0,
              atsImprovements: data.atsImprovements ?? [],
            });
            setCompany(data.company ?? '');
            setEmail(data.email ?? null);
            setDuration(Math.round((Date.now() - t0) / 1000));
            setState('done');
          }
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
      setState('error');
    }
  }

  function handleReset() {
    if (cvUrl) URL.revokeObjectURL(cvUrl);
    if (lettreUrl) URL.revokeObjectURL(lettreUrl);
    setCvUrl(''); setLettreUrl('');
    setAnalysis(EMPTY_ANALYSIS);
    setModifications('');
    setCompany('');
    setEmail(null);
    setEmailCopied(false);
    setJobPosting('');
    setProgress(0); setStep('');
    setState('idle');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', background: '#fff' }}>
      <style>{`* { box-sizing: border-box; } textarea:focus { border-color: #000 !important; outline: none; }`}</style>
      <div style={{ width: '100%', maxWidth: '620px' }}>

        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: '#888', textDecoration: 'none', marginBottom: '20px' }}>
          ← Retour au suivi
        </Link>

        {/* ── IDLE / ERROR ── */}
        {(state === 'idle' || state === 'error') && (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {(['alternance', 'cdi'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setContractType(type)}
                  style={{
                    padding: '6px 16px', fontSize: '13px', fontWeight: 500,
                    border: '1px solid',
                    borderColor: contractType === type ? '#000' : '#ddd',
                    borderRadius: '20px',
                    background: contractType === type ? '#000' : '#fff',
                    color: contractType === type ? '#fff' : '#666',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {type === 'alternance' ? 'Alternance' : 'CDI'}
                </button>
              ))}
            </div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#000', marginBottom: '10px' }}>
              Fiche de poste
            </label>
            <textarea
              style={{ width: '100%', minHeight: '260px', padding: '14px', fontSize: '14px', fontFamily: 'Inter, system-ui, sans-serif', border: '1px solid #ddd', borderRadius: '6px', resize: 'vertical', lineHeight: 1.6, color: '#111' }}
              placeholder="Colle la fiche de poste ou un lien…"
              value={jobPosting}
              onChange={(e) => setJobPosting(e.target.value)}
            />
            {state === 'error' && (
              <div style={{ background: '#fff5f5', border: '1px solid #fdd', borderRadius: '6px', padding: '12px 14px', color: '#c00', fontSize: '13px', marginTop: '10px' }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                style={{ background: '#000', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 22px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', opacity: jobPosting.trim() ? 1 : 0.4 }}
                onClick={handleGenerate}
                disabled={!jobPosting.trim()}
              >
                Générer →
              </button>
            </div>
          </>
        )}

        {/* ── LOADING ── */}
        {state === 'loading' && (
          <div style={{ padding: '60px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: '#555' }}>{step}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#000', fontVariantNumeric: 'tabular-nums' }}>{progress}%</span>
            </div>
            <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '3px', overflow: 'hidden' }}>
              <div style={{ background: '#000', height: '100%', width: `${progress}%`, transition: 'width 0.6s ease', borderRadius: '4px' }} />
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {state === 'done' && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#999', marginBottom: '16px' }}>
              Généré en {duration}s
            </div>

            {/* ATS Score */}
            {analysis.atsScore > 0 && (() => {
              const s = analysis.atsScore;
              const color  = s >= 80 ? '#1a7a3c' : s >= 60 ? '#b45309' : '#c0392b';
              const bg     = s >= 80 ? '#f0faf4' : s >= 60 ? '#fffbeb' : '#fff5f5';
              const border = s >= 80 ? '#a7f3c0' : s >= 60 ? '#fde68a' : '#fecaca';
              return (
                <div style={{ border: `1px solid ${border}`, background: bg, borderRadius: '8px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                  <div style={{ flexShrink: 0, textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', fontWeight: 700, lineHeight: 1, color }}>{s}</div>
                    <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color, marginTop: '3px' }}>/ 100</div>
                  </div>
                  {analysis.atsImprovements.length > 0 && (
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#999', marginBottom: '6px' }}>Axes d&apos;amélioration</div>
                      <ul style={{ margin: 0, paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {analysis.atsImprovements.map((item, i) => (
                          <li key={i} style={{ fontSize: '12px', color: '#444', lineHeight: 1.5 }}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Downloads */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
              <a href={cvUrl} download={`Jesse_Sotomayor_CV_${normalizeFilename(company)}.pdf`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff', borderRadius: '6px', padding: '12px 20px', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
                ↓ CV.pdf
              </a>
              <a href={lettreUrl} download={`Jesse_Sotomayor_Lettre_${normalizeFilename(company)}.pdf`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff', borderRadius: '6px', padding: '12px 20px', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
                ↓ Lettre.pdf
              </a>
            </div>

            {cardId && (
              <button
                onClick={async () => {
                  try {
                    await fetch(`/api/cards/${encodeURIComponent(cardId)}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'sent' }),
                    });
                    setMarkedSent(true);
                  } catch { /* ignore */ }
                }}
                disabled={markedSent}
                style={{ width: '100%', marginBottom: '28px', marginTop: '-14px', background: markedSent ? '#f0faf4' : '#fff', color: markedSent ? '#1a7a3c' : '#000', border: `1px solid ${markedSent ? '#a7f3c0' : '#ddd'}`, borderRadius: '6px', padding: '10px 18px', fontSize: '13px', fontWeight: 500, cursor: markedSent ? 'default' : 'pointer' }}
              >
                {markedSent ? '✓ Marquée comme envoyée dans le suivi' : 'Marquer comme envoyée dans le suivi'}
              </button>
            )}

            {/* Email */}
            {email && (email.objet || email.corps) && (
              <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#999' }}>Email d&apos;envoi</span>
                  <button
                    onClick={handleCopyEmail}
                    style={{ background: emailCopied ? '#f0faf4' : '#f4f4f4', color: emailCopied ? '#1a7a3c' : '#333', border: `1px solid ${emailCopied ? '#a7f3c0' : '#e0e0e0'}`, borderRadius: '5px', padding: '5px 12px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
                  >
                    {emailCopied ? '✓ Copié' : 'Copier'}
                  </button>
                </div>
                <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: '6px', padding: '14px 16px', fontFamily: 'monospace', fontSize: '12.5px', lineHeight: 1.7, color: '#222', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {email.to
                    ? <><span style={{ color: '#888' }}>À : </span>{email.to}{'\n'}</>
                    : <><span style={{ color: '#ccc' }}>À : </span><span style={{ color: '#bbb', fontStyle: 'italic' }}>non détecté</span>{'\n'}</>
                  }
                  <span style={{ color: '#888' }}>Objet : </span>{email.objet}{'\n\n'}{email.corps}
                </div>
              </div>
            )}

            {/* Analysis */}
            <div style={{ borderTop: '1px solid #eee', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {analysis.keywords.length > 0 && (
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#999', marginBottom: '8px' }}>Mots-clés ATS intégrés</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {analysis.keywords.map((k, i) => (
                      <span key={i} style={{ background: '#f4f4f4', borderRadius: '4px', padding: '3px 9px', fontSize: '12px', color: '#333' }}>{k}</span>
                    ))}
                  </div>
                </div>
              )}
              {analysis.adjustments.length > 0 && (
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#999', marginBottom: '8px' }}>Ajustements réalisés</div>
                  <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {analysis.adjustments.map((a, i) => (
                      <li key={i} style={{ fontSize: '13px', color: '#333', lineHeight: 1.5 }}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.missing.length > 0 && (
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#999', marginBottom: '8px' }}>Compétences non couvertes</div>
                  <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {analysis.missing.map((m, i) => (
                      <li key={i} style={{ fontSize: '13px', color: '#888', lineHeight: 1.5 }}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modifications */}
            <div style={{ borderTop: '1px solid #eee', paddingTop: '24px', marginTop: '8px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#000', marginBottom: '10px' }}>
                Modifications à apporter
              </label>
              <textarea
                style={{ width: '100%', minHeight: '100px', padding: '12px 14px', fontSize: '13px', fontFamily: 'Inter, system-ui, sans-serif', border: '1px solid #ddd', borderRadius: '6px', resize: 'vertical', lineHeight: 1.6, color: '#111', outline: 'none' }}
                placeholder="Ex. : Renforcer le bullet CRM, raccourcir l'accroche, mettre davantage en avant le SEO, reformuler le 2e paragraphe de la lettre…"
                value={modifications}
                onChange={(e) => setModifications(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                <button
                  style={{ background: '#fff', color: '#000', border: '1px solid #ddd', borderRadius: '6px', padding: '10px 18px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
                  onClick={handleReset}
                >
                  Nouvelle fiche
                </button>
                <button
                  style={{ background: '#000', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 22px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', opacity: modifications.trim() ? 1 : 0.4 }}
                  onClick={handleGenerate}
                  disabled={!modifications.trim()}
                >
                  Appliquer →
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
