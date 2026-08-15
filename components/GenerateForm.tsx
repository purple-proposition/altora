'use client';
import Icon from '@/components/Icon';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SidebarCollapseToggle from '@/components/SidebarCollapseToggle';
import CvUpload from '@/components/CvUpload';
import ProfileForm from '@/components/ProfileForm';
import type { UserProfile } from '@/lib/profile';

// Parcours en quatre temps : accueil nominatif et import du CV, vérification
// de ce que l'IA en a extrait, import d'une offre, résultat. Chaque étape ne
// demande qu'une chose, et les personnes déjà équipées (CV importé, profil
// rempli) démarrent directement à l'import d'une offre.
type Step = 'welcome' | 'verify' | 'offer' | 'loading' | 'done';

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

export default function GenerateForm(props: {
  firstName: string;
  hasCv: boolean;
  cvFilename?: string;
  profile: UserProfile;
  profileReady: boolean;
}) {
  return (
    <Suspense fallback={null}>
      <GenerateInner {...props} />
    </Suspense>
  );
}

function GenerateInner({ firstName, hasCv, cvFilename, profile: initialProfile, profileReady }: {
  firstName: string;
  hasCv: boolean;
  cvFilename?: string;
  profile: UserProfile;
  profileReady: boolean;
}) {
  const searchParams = useSearchParams();
  const historyId = searchParams.get('historyId');
  const wantsProfile = searchParams.get('step') === 'profil';

  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [cvReady, setCvReady] = useState(hasCv);
  // Suit le nom du fichier importé pendant la session : l'étape de
  // vérification monte son propre encart d'import après l'envoi, et sans cet
  // état il repartait de la valeur rendue par le serveur (vide) et affichait
  // « Importer » alors que le CV venait juste d'être déposé.
  const [cvName, setCvName] = useState(cvFilename ?? '');

  const [step, setStep] = useState<Step>(() => {
    if (historyId) return 'done';
    if (wantsProfile) return 'verify';
    if (!hasCv) return 'welcome';
    if (!profileReady) return 'verify';
    return 'offer';
  });

  const [jobPosting, setJobPosting] = useState('');
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(0);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [lettreUrl, setLettreUrl] = useState('');
  const [analysis, setAnalysis] = useState<Analysis>(EMPTY_ANALYSIS);
  const [modifications, setModifications] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState<{ to: string; objet: string; corps: string } | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const [poste, setPoste] = useState('');

  // Ouvrir une génération passée depuis le panneau de gauche restaure le
  // résultat tel quel depuis le stockage, sans rien régénérer.
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
        setStep('done');
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [historyId]);

  // Le CV vient d'être importé : l'extraction a tourné côté serveur, on
  // récupère ce qu'elle a produit pour le soumettre à vérification plutôt que
  // de laisser la personne découvrir des champs vides.
  const [extracting, setExtracting] = useState(false);
  async function handleCvUploaded(filename: string) {
    setCvReady(true);
    setCvName(filename);
    setExtracting(true);
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const { profile: fetched } = await res.json();
        if (fetched) setProfile(fetched);
      }
    } catch { /* le formulaire reste éditable même si la relecture échoue */ }
    setExtracting(false);
    setStep('verify');
  }

  async function handleCopyEmail() {
    if (!email) return;
    const toLine = email.to ? `À : ${email.to}\n` : '';
    await navigator.clipboard.writeText(`${toLine}Objet : ${email.objet}\n\n${email.corps}`);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  }

  function normalizeFilename(s: string): string {
    const noAccents = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    const noSpecial = noAccents.replace(/[^a-zA-Z0-9 ]/g, '');
    return noSpecial.trim().replace(/\s+/g, '_') || 'Entreprise';
  }

  const lastNameForFile = normalizeFilename(profile.name || firstName);

  async function handleGenerate() {
    if (!jobPosting.trim()) return;
    setStep('loading');
    setError('');
    setProgress(0);
    setProgressStep('Démarrage…');
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
          if (data.step) setProgressStep(data.step);

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
            setStep('done');

            // Enregistré pour que le panneau de gauche puisse rouvrir ce
            // résultat plus tard. Au mieux : un échec ici ne doit pas
            // empêcher de voir et télécharger ce qui vient d'être produit.
            fetch('/api/generations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                company: data.company ?? '',
                poste: data.poste ?? '',
                jobDescription: jobPosting,
                cv: data.cv,
                lettre: data.lettre,
                analysis: doneAnalysis,
                email: data.email ?? null,
              }),
            })
              .then(() => { window.dispatchEvent(new Event('altora-generations-changed')); })
              .catch(() => {});
          }
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
      setStep('offer');
    }
  }

  function startNewApplication() {
    if (cvUrl && cvUrl.startsWith('blob:')) URL.revokeObjectURL(cvUrl);
    if (lettreUrl && lettreUrl.startsWith('blob:')) URL.revokeObjectURL(lettreUrl);
    setCvUrl(''); setLettreUrl('');
    setAnalysis(EMPTY_ANALYSIS);
    setModifications('');
    setCompany(''); setPoste('');
    setEmail(null); setEmailCopied(false);
    setGeneratedAt(null);
    setJobPosting('');
    setProgress(0); setProgressStep('');
    setError('');
    setStep('offer');
    // Enlève ?historyId de l'URL, sinon revenir ici rouvrirait l'ancienne
    // fiche au lieu de la nouvelle candidature qu'on vient de commencer.
    window.history.replaceState(null, '', '/generate');
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

      <section className={`generate-view${step === 'done' ? ' generate-view--wide' : ''}`}>

        {step === 'welcome' && (
          <div className="onboard-step">
            <h1 className="onboard-title">Bienvenue {firstName} 👋</h1>
            <p className="onboard-lead">
              Altora réécrit ton CV et ta lettre de motivation pour chaque offre à
              laquelle tu postules, afin qu&apos;ils passent les filtres automatiques
              des recruteurs et arrivent jusqu&apos;à un humain.
            </p>
            <p className="onboard-lead">
              Pour commencer, importe ton CV actuel. Peu importe sa mise en forme :
              il sert de base d&apos;informations, pas de modèle. L&apos;IA en extrait
              tes expériences, ta formation et tes compétences, et tu pourras tout
              relire juste après.
            </p>

            <div className="onboard-card">
              <CvUpload initialFilename={cvName} onUploaded={handleCvUploaded} />
              <p className="field-hint">PDF, DOC ou DOCX, 10 Mo maximum.</p>
            </div>

            {extracting && <p className="field-hint">Lecture de ton CV en cours…</p>}
          </div>
        )}

        {step === 'verify' && (
          <div className="onboard-step">
            <h1 className="onboard-title">
              {profileReady && wantsProfile ? 'Mon profil' : 'Vérifie ce qu’on a lu dans ton CV'}
            </h1>
            <p className="onboard-lead">
              {profileReady && wantsProfile
                ? 'Ces informations servent de base à chaque CV et lettre générés. Plus elles sont complètes et exactes, meilleur est le résultat.'
                : "Voici ce que l’IA a extrait. Corrige ce qui est inexact et complète ce qui manque : tout ce qui est ici sert de matière première, et le modèle ne s’autorise jamais à inventer au-delà."}
            </p>

            <div className="onboard-card">
              <CvUpload initialFilename={cvName} onUploaded={handleCvUploaded} />
            </div>

            <ProfileForm
              key={profile.name + profile.experiences.length}
              initialProfile={profile}
              submitLabel={profileReady && wantsProfile ? 'Enregistrer mon profil' : 'Continuer →'}
              savingLabel="Enregistrement…"
              onSaved={(saved) => {
                setProfile(saved);
                if (!(profileReady && wantsProfile)) setStep('offer');
              }}
            />
          </div>
        )}

        {step === 'offer' && (
          <div className="onboard-step">
            <h1 className="onboard-title">
              {company || poste ? 'Une autre candidature' : 'Ta première offre'}
            </h1>
            <p className="onboard-lead">
              Colle l&apos;offre qui t&apos;intéresse, ou simplement son lien. L&apos;IA
              en extrait l&apos;intitulé du poste, l&apos;entreprise, les compétences
              attendues et les mots-clés, puis réécrit ton CV et ta lettre pour cette
              offre précise. Si une adresse de contact figure dans l&apos;annonce, le
              mail de candidature est préparé aussi.
            </p>

            <details className="onboard-details">
              <summary>Pourquoi réécrire à chaque fois, et qu&apos;est-ce que ça change ?</summary>
              <div className="onboard-details-body">
                <p>
                  Avant d&apos;être lue par un recruteur, une candidature passe presque
                  toujours par un ATS (<em>Applicant Tracking System</em>), un logiciel
                  qui extrait le texte du CV et le compare aux termes de l&apos;offre.
                  Un CV mal structuré, sur deux colonnes ou truffé de jargon est écarté
                  avant même d&apos;être vu, même quand le profil correspond.
                </p>
                <p>
                  Concrètement, Altora reprend <strong>tes</strong> expériences et
                  réorganise leur présentation : les compétences que l&apos;offre
                  demande remontent, le vocabulaire s&apos;aligne sur celui de
                  l&apos;annonce, et le CV tient sur une page en une seule colonne.
                  La lettre, elle, ne paraphrase pas le CV : elle explique pourquoi ce
                  poste, pourquoi cette entreprise, et ce que tu apportes.
                </p>
                <p>
                  Rien n&apos;est inventé : le modèle s&apos;en tient strictement à ton
                  profil. Zéro expérience ajoutée, zéro compétence que tu ne pourrais
                  pas justifier en entretien.
                </p>
              </div>
            </details>

            <div className="field-group">
              <span className="field-label">Fiche de poste</span>
              <textarea
                className="generate-textarea"
                placeholder="Colle la fiche de poste ou son lien…"
                value={jobPosting}
                onChange={(e) => setJobPosting(e.target.value)}
              />
            </div>

            {error && <div className="generate-error">{error}</div>}

            <div className="generate-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerate}
                disabled={!jobPosting.trim() || !cvReady}
                title={!cvReady ? "Importe d'abord ton CV" : undefined}
              >
                Générer mon CV et ma lettre →
              </button>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="modal-overlay visible" role="dialog" aria-modal="true" aria-label="Génération en cours">
            <div className="modal generate-loading-modal">
              <div className="generate-progress-wrap">
                <div className="generate-progress-label">
                  <span>{progressStep}</span>
                  <span>{progress}%</span>
                </div>
                <div className="generate-progress-track">
                  <div className="generate-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="generate-dashboard">
            <div className="generate-done-header">
              <p className="generate-meta">
                {(poste || company) && (
                  <span className="generate-meta-title">{[poste, company].filter(Boolean).join(' chez ')} · </span>
                )}
                {generatedAt
                  ? `Généré le ${new Date(generatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                  : `Généré en ${duration}s`}
              </p>
              <button type="button" className="btn-primary" onClick={startNewApplication}>
                <Icon name="plus" />Postuler à une autre annonce
              </button>
            </div>

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

              <a className="dash-tile dash-tile--download" href={cvUrl} download={`${lastNameForFile}_CV_${normalizeFilename(company)}.pdf`}>
                <span className="dash-tile-icon"><Icon name="file-text" /></span>
                <span className="dash-tile-body">
                  <span className="dash-tile-title">Télécharger le CV</span>
                  <span className="dash-tile-subtitle">CV.pdf</span>
                </span>
              </a>

              <a className="dash-tile dash-tile--download" href={lettreUrl} download={`${lastNameForFile}_Lettre_${normalizeFilename(company)}.pdf`}>
                <span className="dash-tile-icon"><Icon name="mail" /></span>
                <span className="dash-tile-body">
                  <span className="dash-tile-title">Télécharger la lettre</span>
                  <span className="dash-tile-subtitle">Lettre.pdf</span>
                </span>
              </a>
            </div>

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
              <div className="generate-actions">
                <button type="button" className="btn-primary" onClick={handleGenerate} disabled={!modifications.trim()}>Appliquer →</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
