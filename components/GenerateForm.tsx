'use client';
import Icon from '@/components/Icon';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SidebarCollapseToggle from '@/components/SidebarCollapseToggle';
import CvUpload from '@/components/CvUpload';

type State = 'intro' | 'idle' | 'loading' | 'done' | 'error';

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

export default function GenerateForm({ hasCv, cvFilename }: { hasCv: boolean; cvFilename?: string }) {
  return (
    <Suspense fallback={null}>
      <GenerateInner hasCv={hasCv} cvFilename={cvFilename} />
    </Suspense>
  );
}

function MethodExplanation() {
  return (
    <>
      <div className="method-card method-card--intro">
        <p className="method-card-text">
          Avant que 9 candidatures sur 10 ne soient lu pas un recruteur, elle passent d&apos;abord par un ATS (Applicant Tracking System, « système de suivi des candidatures »). Le logiciel la scanne en extrait le texte et cherche les mots-clés de l&apos;offre : intitulé du poste, compétences, outils. Le premier « lecteur » de ton CV est donc un algorithme, pas un humain, et mal structuré, il sera écarté avant même d&apos;être lu, même si ton profil est parfait pour le poste.
        </p>
      </div>

      <div className="method-explain-grid">
        <div className="method-card">
          <div className="method-card-head">
            <h3 className="method-card-title">Conçu pour passer les robots</h3>
          </div>
          <p className="method-card-text">
            Un CV sur une seule page, en une seule colonne, sans jargon, pour passer le filtre et enfin être lu.
          </p>
        </div>

        <div className="method-card">
          <div className="method-card-head">
            <h3 className="method-card-title">Tes propres règles en priorité</h3>
          </div>
          <p className="method-card-text">
            Chaque profil est unique et notre outil tient aussi compte de tes consignes pour que le résultat te ressemble vraiment.
          </p>
        </div>

        <div className="method-card">
          <div className="method-card-head">
            <h3 className="method-card-title">Sur mesure pour chaque offre</h3>
          </div>
          <p className="method-card-text">
            Tes expériences, compétences et outils sont réorganisés pour être pertinent pour chaque fiche de poste. Le modèle s&apos;en tient strictement à ton profil réel : zéro expérience inventée, zéro compétence que tu ne pourrais pas justifier en entretien.
          </p>
        </div>

        <div className="method-card">
          <div className="method-card-head">
            <h3 className="method-card-title">Une motivation qui ne se répète pas</h3>
          </div>
          <p className="method-card-text">
            Ta lettre de motivation ne répète pas le CV en phrases et suit une structure en 4 temps pour capter directement l&apos;attention du recruteur.
          </p>
        </div>
      </div>
    </>
  );
}

function GenerateInner({ hasCv, cvFilename }: { hasCv: boolean; cvFilename?: string }) {
  const searchParams = useSearchParams();
  const historyId = searchParams.get('historyId');
  const cardId = searchParams.get('cardId');
  const hasAutoTrigger = Boolean(historyId || cardId || searchParams.get('job'));
  const [jobPosting, setJobPosting] = useState(() => searchParams.get('job') ?? '');
  const [usingStoredDescription, setUsingStoredDescription] = useState(false);
  const [markedSent, setMarkedSent] = useState(false);
  // A history reopen or a prefilled posting (card link, ?job=) means the
  // user already made their intent clear — skip the intro pitch and go
  // straight to idle/loading, that's what the effects below expect.
  const [state, setState] = useState<State>(() => (hasAutoTrigger ? 'idle' : 'intro'));
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(0);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [lettreUrl, setLettreUrl] = useState('');
  const [analysis, setAnalysis] = useState<Analysis>(EMPTY_ANALYSIS);
  const [modifications, setModifications] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState<{ to: string; objet: string; corps: string } | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const [poste, setPoste] = useState('');
  const [methodOpen, setMethodOpen] = useState(false);
  // The app was cut down to a single flow (upload CV → paste/link the
  // offer → generate), so the CV import step — previously only reachable
  // from the old home page's profile overlay — lives directly on this
  // page now. Tracked locally (not just the server-computed `hasCv` prop)
  // so uploading updates the gate immediately, without a full reload.
  const [cvReady, setCvReady] = useState(hasCv);

  // A card imported from a URL already has its posting text saved (see the
  // import modal) — reuse it here instead of asking the user to paste it
  // again or re-fetching a page that might now be gone/blocked.
  useEffect(() => {
    if (!cardId || historyId) return;
    let cancelled = false;
    fetch(`/api/cards/${encodeURIComponent(cardId)}`)
      .then(res => (res.ok ? res.json() : null))
      .then(card => {
        if (cancelled || !card?.jobDescription) return;
        setJobPosting(card.jobDescription);
        setUsingStoredDescription(true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [cardId, historyId]);

  // Reopening a past generation from the sidebar history — restore the full
  // result view straight from storage instead of regenerating anything. The
  // job posting/contract type come back too, so "Appliquer" (below) still
  // has what it needs to re-run with modifications.
  useEffect(() => {
    if (!historyId) return;
    let cancelled = false;
    fetch(`/api/generations/${encodeURIComponent(historyId)}`)
      .then(res => (res.ok ? res.json() : null))
      .then(record => {
        if (cancelled || !record) return;
        setJobPosting(record.jobDescription || '');
        setCvUrl(record.cvUrl);
        setLettreUrl(record.lettreUrl);
        setAnalysis({
          keywords: record.analysis?.keywords ?? [],
          adjustments: record.analysis?.adjustments ?? [],
          missing: record.analysis?.missing ?? [],
          atsScore: record.analysis?.atsScore ?? 0,
          atsImprovements: record.analysis?.atsImprovements ?? [],
        });
        setCompany(record.company || '');
        setPoste(record.poste || '');
        setEmail(record.email || null);
        setGeneratedAt(record.createdAt || null);
        setState('done');
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [historyId]);

  // Arriving here already carrying a posting (a card's "Générer CV" link,
  // or a prefilled ?job= link) skips the idle form entirely and starts
  // generating right away — only someone who lands with nothing typed
  // still has to press the button themselves. A history reopen is handled
  // entirely by the effect above and must never also trigger a fresh run.
  const autoTriggeredRef = useRef(false);
  useEffect(() => {
    if (historyId) return;
    if (autoTriggeredRef.current) return;
    if (!jobPosting.trim()) return;
    if (!cardId && !searchParams.get('job')) return;
    autoTriggeredRef.current = true;
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobPosting, cardId, historyId]);

  async function handleCopyEmail() {
    if (!email) return;
    const toLine = email.to ? `À : ${email.to}\n` : '';
    await navigator.clipboard.writeText(`${toLine}Objet : ${email.objet}\n\n${email.corps}`);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  }

  function normalizeFilename(s: string): string {
    // NFD decomposes accented chars, then strip combining diacriticals U+0300–U+036F
    const noAccents = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
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
        body: JSON.stringify({ jobPosting, modifications: modifications.trim() || undefined }),
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
            const doneAnalysis: Analysis = {
              keywords: data.keywords ?? [],
              adjustments: data.adjustments ?? [],
              missing: data.missing ?? [],
              atsScore: data.atsScore ?? 0,
              atsImprovements: data.atsImprovements ?? [],
            };
            setCvUrl(toUrl(data.cv));
            setLettreUrl(toUrl(data.lettre));
            setAnalysis(doneAnalysis);
            setCompany(data.company ?? '');
            setPoste(data.poste ?? '');
            setEmail(data.email ?? null);
            setGeneratedAt(null);
            setDuration(Math.round((Date.now() - t0) / 1000));
            setState('done');

            // Persisted so the sidebar history can list it and reopen the
            // exact same result later — best-effort, a failure here shouldn't
            // block the user from seeing/downloading what was just generated.
            fetch('/api/generations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                cardId,
                company: data.company ?? '',
                poste: data.poste ?? '',
                jobDescription: jobPosting,
                cv: data.cv,
                lettre: data.lettre,
                analysis: doneAnalysis,
                email: data.email ?? null,
              }),
            }).catch(() => {});
          }
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
      setState('error');
    }
  }

  function handleReset() {
    if (cvUrl && cvUrl.startsWith('blob:')) URL.revokeObjectURL(cvUrl);
    if (lettreUrl && lettreUrl.startsWith('blob:')) URL.revokeObjectURL(lettreUrl);
    setCvUrl(''); setLettreUrl('');
    setAnalysis(EMPTY_ANALYSIS);
    setModifications('');
    setCompany('');
    setPoste('');
    setEmail(null);
    setEmailCopied(false);
    setGeneratedAt(null);
    setJobPosting('');
    setProgress(0); setStep('');
    setState('idle');
  }

  const scoreTone = analysis.atsScore >= 80 ? 'good' : analysis.atsScore >= 60 ? 'mid' : 'low';

  return (
    <>
      <div className="topbar-sticky">
        <div className="topbar-breadcrumb">
          <SidebarCollapseToggle />
          <span className="breadcrumb-item breadcrumb-item--active"><Icon name="file-text" />ATS Booster</span>
        </div>
      </div>

      <section className={`generate-view${state === 'done' || state === 'intro' ? ' generate-view--wide' : ''}`}>
        <div className="documents-header">
          <h1 className="documents-title">ATS Booster</h1>
        </div>

        {state === 'intro' && (
          <div className="generate-intro">
            <div className="method-card method-card--intro-standalone">
              <MethodExplanation />
            </div>
            <div className="generate-actions">
              <button type="button" className="btn-primary generate-intro-cta" onClick={() => setState('idle')}>
                {hasCv ? 'Génère ton CV optimisé' : 'Génère ton premier CV optimisé'}
              </button>
            </div>
          </div>
        )}

        {(state === 'idle' || state === 'error') && (
          <>
            <div className={`method-explainer${methodOpen ? ' method-explainer--open' : ''}`}>
              <button type="button" className="method-explainer-summary" onClick={() => setMethodOpen(o => !o)}>
                <span>Comment ATS Booster est pensé pour maximiser tes chances de décrocher ton alternance</span>
                <Icon name="chevron-down" className="method-explainer-chevron" />
              </button>

              <div className="method-explainer-collapse">
                <div className="method-explainer-body">
                  <MethodExplanation />
                </div>
              </div>
            </div>

            <CvUpload initialFilename={cvFilename} onUploaded={() => setCvReady(true)} />

            <div className="field-group">
              <span className="field-label">Fiche de poste</span>
              {usingStoredDescription ? (
                <div className="generate-stored-description">
                  <Icon name="check-circle" />
                  <span>Déjà en mémoire depuis le suivi, pas besoin de la recoller.</span>
                  <button
                    type="button"
                    className="generate-stored-description-edit"
                    onClick={() => { setUsingStoredDescription(false); setJobPosting(''); }}
                  >
                    Remplacer
                  </button>
                </div>
              ) : (
                <textarea
                  className="generate-textarea"
                  placeholder="Colle la fiche de poste ou un lien…"
                  value={jobPosting}
                  onChange={(e) => setJobPosting(e.target.value)}
                />
              )}
            </div>

            {state === 'error' && <div className="generate-error">{error}</div>}

            <div className="generate-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerate}
                disabled={!jobPosting.trim() || !cvReady}
                title={!cvReady ? "Importe d'abord ton CV" : undefined}
              >
                Générer →
              </button>
            </div>
          </>
        )}

        {state === 'loading' && (
          <div className="modal-overlay visible" role="dialog" aria-modal="true" aria-label="Génération en cours">
            <div className="modal generate-loading-modal">
              <div className="generate-progress-wrap">
                <div className="generate-progress-label">
                  <span>{step}</span>
                  <span>{progress}%</span>
                </div>
                <div className="generate-progress-track">
                  <div className="generate-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {state === 'done' && (
          <div className="generate-dashboard">
            <p className="generate-meta">
              {(poste || company) && (
                <span className="generate-meta-title">{[poste, company].filter(Boolean).join(' chez ')} · </span>
              )}
              {generatedAt
                ? `Généré le ${new Date(generatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                : `Généré en ${duration}s`}
            </p>

            <div className="dash-row">
              {analysis.atsScore > 0 && (
                <div className={`dash-tile dash-tile--score ats-score-card--${scoreTone}`}>
                  <div className="ats-score-value">
                    <div className="ats-score-number">{analysis.atsScore}</div>
                    <div className="ats-score-suffix">/ 100</div>
                  </div>
                  <div className="dash-tile-body">
                    <span className="dash-tile-title">Score ATS</span>
                    {analysis.atsImprovements.length > 0 && (
                      <ul className="generate-list">
                        {analysis.atsImprovements.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              <a className="dash-tile dash-tile--download" href={cvUrl} download={`Jesse_Sotomayor_CV_${normalizeFilename(company)}.pdf`}>
                <span className="dash-tile-icon"><Icon name="file-text" /></span>
                <span className="dash-tile-body">
                  <span className="dash-tile-title">Télécharger le CV</span>
                  <span className="dash-tile-subtitle">CV.pdf</span>
                </span>
              </a>

              <a className="dash-tile dash-tile--download" href={lettreUrl} download={`Jesse_Sotomayor_Lettre_${normalizeFilename(company)}.pdf`}>
                <span className="dash-tile-icon"><Icon name="mail" /></span>
                <span className="dash-tile-body">
                  <span className="dash-tile-title">Télécharger la lettre</span>
                  <span className="dash-tile-subtitle">Lettre.pdf</span>
                </span>
              </a>
            </div>

            {cardId && (
              <button
                type="button"
                className="btn-secondary generate-mark-sent"
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
              >
                {markedSent ? '✓ Marquée comme envoyée dans le suivi' : 'Marquer comme envoyée dans le suivi'}
              </button>
            )}

            <div className="dash-grid">
              <div className="dash-card">
                {analysis.keywords.length > 0 && (
                  <div className="generate-subsection">
                    <span className="field-label">Mots-clés ATS intégrés</span>
                    <div className="generate-pill-row">
                      {analysis.keywords.map((k, i) => <span key={i} className="card-meta-tag">{k}</span>)}
                    </div>
                  </div>
                )}
                {analysis.adjustments.length > 0 && (
                  <div className="generate-subsection">
                    <span className="field-label">Ajustements réalisés</span>
                    <ul className="generate-list">
                      {analysis.adjustments.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                )}
                {analysis.missing.length > 0 && (
                  <div className="generate-subsection">
                    <span className="field-label">Compétences non couvertes</span>
                    <ul className="generate-list generate-list--muted">
                      {analysis.missing.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {email && (email.objet || email.corps) && (
                <div className="dash-card">
                  <div className="generate-section-header">
                    <span className="field-label">Email d&apos;envoi</span>
                    <button type="button" className="btn-secondary generate-copy-btn" onClick={handleCopyEmail}>
                      {emailCopied ? '✓ Copié' : 'Copier'}
                    </button>
                  </div>
                  <div className="generate-email-block">
                    {email.to
                      ? <>À : {email.to}{'\n'}</>
                      : <>À : non détecté{'\n'}</>}
                    Objet : {email.objet}{'\n\n'}{email.corps}
                  </div>
                </div>
              )}
            </div>

            <div className="dash-card">
              <div className="field-group">
                <span className="field-label">Modifications à apporter</span>
                <textarea
                  className="generate-textarea generate-textarea--small"
                  placeholder="Ex. : Renforcer le bullet CRM, raccourcir l'accroche, mettre davantage en avant le SEO, reformuler le 2e paragraphe de la lettre…"
                  value={modifications}
                  onChange={(e) => setModifications(e.target.value)}
                />
              </div>
              <div className="generate-actions generate-actions--split">
                <button type="button" className="btn-secondary" onClick={handleReset}>Nouvelle fiche</button>
                <button type="button" className="btn-primary" onClick={handleGenerate} disabled={!modifications.trim()}>Appliquer →</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
