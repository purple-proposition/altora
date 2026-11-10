'use client';
import Icon from '@/components/Icon';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import CvUpload from '@/components/CvUpload';
import { CvPreview } from '@/components/cv/cv-preview';
import { CvEditor } from '@/components/cv/cv-editor';
import { toCvDoc, toExportCv, type CvDoc } from '@/components/cv/cv-doc';
import { LetterPreview } from '@/components/cv/letter-preview';
import { LetterEditor } from '@/components/cv/letter-editor';
import { toLetterDoc, toExportLetter, type LetterDoc } from '@/components/cv/letter-doc';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/cn';
import { FlowSteps } from '@/components/flow-steps';
import { Check, Download } from 'lucide-react';
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
  hasGenerations: boolean;
}) {
  return (
    <Suspense fallback={null}>
      <GenerateInner {...props} />
    </Suspense>
  );
}

function GenerateInner({ firstName, hasCv, cvFilename, profile: initialProfile, profileReady, hasGenerations }: {
  firstName: string;
  hasCv: boolean;
  cvFilename?: string;
  profile: UserProfile;
  profileReady: boolean;
  hasGenerations: boolean;
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
  // Modèle éditable du CV : présent après une génération, absent pour une
  // génération rouverte depuis l'historique (qui ne garde que les PDF).
  const [doc, setDoc] = useState<CvDoc | null>(null);
  const [exportError, setExportError] = useState('');
  // Lettre éditable, et étape affichée : d'abord le CV, puis la lettre.
  const [letter, setLetter] = useState<LetterDoc | null>(null);
  const [docStep, setDocStep] = useState<'cv' | 'lettre'>('cv');
  // Génération enregistrée côté serveur : les modifications y sont sauvées.
  const [generationId, setGenerationId] = useState<string | null>(null);
  // Suggestions cochées comme traitées (affichage seulement).
  const [doneSuggestions, setDoneSuggestions] = useState<number[]>([]);

  // Sauvegarde automatique des modifications (une seconde après la dernière
  // frappe). Aucun appel au modèle : seule la base est mise à jour.
  useEffect(() => {
    if (!generationId || !doc) return;
    const timer = setTimeout(() => {
      fetch(`/api/generations/${encodeURIComponent(generationId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvData: doc, lettreData: letter ?? undefined }),
      }).catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, [doc, letter, generationId]);
  const [lettreUrl, setLettreUrl] = useState('');
  const [analysis, setAnalysis] = useState<Analysis>(EMPTY_ANALYSIS);
  const [modifications, setModifications] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState<{ to: string; objet: string; corps: string } | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const [poste, setPoste] = useState('');
  // Une candidature déjà produite (dans cette session ou lors d'une visite
  // précédente) suffit à ne plus présenter l'écran comme le tout premier.
  const [everGenerated, setEverGenerated] = useState(hasGenerations);
  // Vrai pendant la réouverture d'un résultat enregistré (rechargement de page).
  const [restoring, setRestoring] = useState(Boolean(historyId));

  // Ouvrir une génération passée depuis le panneau de gauche restaure le
  // résultat tel quel depuis le stockage, sans rien régénérer.
  useEffect(() => {
    if (!historyId) return;
    let cancelled = false;
    setRestoring(true);
    fetch(`/api/generations/${encodeURIComponent(historyId)}`)
      .then(res => (res.ok ? res.json() : null))
      .then(record => {
        if (cancelled || !record) return;
        setJobPosting(record.jobDescription || '');
        setCvUrl(record.cvUrl || '');
        // Une génération récente contient les données éditables : on rouvre
        // l'éditeur tel qu'il a été laissé. Une ancienne n'a que ses PDF.
        setDoc(record.cvData ? toCvDoc(record.cvData) : null);
        setLetter(record.lettreData ? toLetterDoc(record.lettreData) : null);
        setGenerationId(record.cvData ? record.id : null);
        setLettreUrl(record.lettreUrl || '');
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
      .catch(() => {})
      .finally(() => { if (!cancelled) setRestoring(false); });
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

  // Nom des fichiers téléchargés : cv_prenom_nom_entreprise.pdf
  // et lettre_de_motivation_prenom_nom_entreprise.pdf (minuscules, sans accents).
  // Télécharge un PDF produit par /api/export à partir des données éditées.
  async function downloadPdf(kind: 'cv' | 'lettre_de_motivation', payload: object) {
    setExportError('');
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(kind === 'cv' ? { kind: 'cv', cv: payload } : { kind: 'lettre', lettre: payload }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setExportError(data.error || "L'export a échoué.");
      return;
    }
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName(kind);
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadName(kind: 'cv' | 'lettre_de_motivation') {
    return [kind, lastNameForFile, normalizeFilename(company)].join('_').toLowerCase() + '.pdf';
  }

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
            const doneAnalysis: Analysis = {
              keywords: data.keywords ?? [],
              adjustments: data.adjustments ?? [],
              missing: data.missing ?? [],
              atsScore: data.atsScore ?? 0,
              atsImprovements: data.atsImprovements ?? [],
            };
            if (data.cvData) setDoc(toCvDoc(data.cvData));
            if (data.lettreData) setLetter(toLetterDoc(data.lettreData));
            setDocStep('cv');
            setGenerationId(data.generationId ?? null);
            setAnalysis(doneAnalysis);
            setCompany(data.company ?? '');
            setPoste(data.poste ?? '');
            setEmail(data.email ?? null);
            setGeneratedAt(null);
            setDuration(Math.round((Date.now() - t0) / 1000));
            setEverGenerated(true);
            setStep('done');

            // Le serveur a déjà enregistré le résultat : on met son identifiant
            // dans l'adresse, pour qu'un rechargement le rouvre sans régénérer.
            if (data.generationId) {
              window.history.replaceState(null, '', `/generate?historyId=${encodeURIComponent(data.generationId)}`);
            }
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
    setDoc(null); setLetter(null); setDocStep('cv'); setExportError(''); setGenerationId(null); setDoneSuggestions([]);
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
      <section className={cn('mx-auto w-full px-6 pb-24 pt-10', step === 'done' ? 'max-w-[1200px]' : 'max-w-2xl')}>
        <div className="mb-10">
          <FlowSteps current={step === 'welcome' ? 0 : step === 'verify' ? 1 : step === 'offer' ? 2 : 3} />
        </div>

        {step === 'welcome' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-4xl font-bold leading-none tracking-tight text-neutral-950">{firstName ? `Bonjour ${firstName}` : 'Bienvenue'}</h1>
              <p className="mt-3 text-base text-neutral-500">Importe ton CV. Altora en extrait ton parcours, tu le vérifies, puis tu colles une offre.</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 p-6">
              <CvUpload initialFilename={cvName} onUploaded={handleCvUploaded} />
            </div>
            {extracting && <p className="text-sm text-neutral-500">Lecture de ton CV en cours…</p>}
            {cvReady && !extracting && (
              <Button type="button" variant="outline" className="self-start" onClick={() => setStep('verify')}>Continuer avec ce CV →</Button>
            )}
          </div>
        )}

        {step === 'verify' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-4xl font-bold leading-none tracking-tight text-neutral-950">
                {profileReady && wantsProfile ? 'Mon profil' : 'Vérifie ton profil'}
              </h1>
              <p className="mt-3 text-base text-neutral-500">
                {profileReady && wantsProfile
                  ? 'Ces informations servent de base à chaque CV et lettre. Plus elles sont exactes, meilleur est le résultat.'
                  : 'Voici ce qui a été lu dans ton CV. Corrige ce qui est inexact et complète ce qui manque : rien ne sera inventé au-delà.'}
              </p>
              <button type="button" className="mt-3 text-sm text-neutral-700 underline underline-offset-4 hover:text-neutral-950" onClick={() => setStep('welcome')}>
                Importer un autre CV
              </button>
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
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-4xl font-bold leading-none tracking-tight text-neutral-950">{everGenerated ? 'Une nouvelle offre' : 'Ta première offre'}</h1>
              <p className="mt-3 text-base text-neutral-500">Colle le texte de l&apos;offre ou son lien. Altora adapte ton CV et ta lettre à cette offre précise.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-posting">Fiche de poste</Label>
              <textarea
                id="job-posting"
                className="min-h-72 w-full rounded-lg border border-neutral-300 bg-neutral-50 p-4 text-base text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900"
                placeholder="Colle la fiche de poste ou son lien (https://…)"
                value={jobPosting}
                onChange={(e) => setJobPosting(e.target.value)}
              />
              <p className="text-sm text-neutral-500">Si le lien ne s&apos;ouvre pas (site protégé), colle le texte à la place.</p>
            </div>
            {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={handleGenerate} disabled={!jobPosting.trim() || !cvReady}>
                Générer mon CV et ma lettre →
              </Button>
              <Button type="button" variant="outline" onClick={() => setStep('verify')}>Modifier mon profil</Button>
              {!cvReady && <span className="text-sm text-neutral-500">Importe d&apos;abord ton CV.</span>}
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col gap-6 rounded-2xl border border-neutral-200 p-8" role="status" aria-live="polite">
            <div>
              <h1 className="text-2xl font-bold leading-none tracking-tight text-neutral-950">Génération en cours</h1>
              <p className="mt-2 text-sm text-neutral-500">Environ 20 à 40 secondes. Ne ferme pas la page.</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-700">{progressStep}</span>
                <span className="font-medium tabular-nums text-neutral-950">{progress} %</span>
              </div>
              <div className="h-1 w-full overflow-hidden bg-neutral-200">
                <div className="h-full bg-neutral-900 transition-[width] duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        )}

        {step === 'done' && doc && (
          <div className="flex flex-col gap-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold leading-none tracking-tight text-neutral-950">{[poste, company].filter(Boolean).join(' · ') || 'Ta candidature'}</h1>
                <p className="mt-2 text-sm text-neutral-500">Tes modifications sont enregistrées automatiquement.</p>
              </div>
              <Button type="button" variant="outline" onClick={startNewApplication}>Nouvelle offre</Button>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 flex flex-col gap-4 rounded-2xl border border-neutral-200 p-6 md:col-span-4">
                <p className="text-sm font-medium text-neutral-500">Compatibilité avec l&apos;offre</p>
                <p className="text-[56px] leading-none font-bold tabular-nums tracking-tight text-neutral-950">{analysis.atsScore}<span className="text-2xl text-neutral-400"> %</span></p>
                <div className="h-1 w-full overflow-hidden bg-neutral-200">
                  <div className="h-full bg-neutral-900" style={{ width: `${Math.min(100, Math.max(0, analysis.atsScore))}%` }} />
                </div>
              </div>
              <div className="col-span-12 rounded-2xl border border-neutral-200 p-6 md:col-span-4">
                <p className="text-sm font-semibold text-neutral-950">Modifications faites</p>
                <ul className="mt-3 flex flex-col gap-2 text-sm text-neutral-700">
                  {analysis.adjustments.map((a, i) => (
                    <li key={i} className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-neutral-900" />{a}</li>
                  ))}
                </ul>
              </div>
              <div className="col-span-12 rounded-2xl border border-neutral-200 p-6 md:col-span-4">
                <p className="text-sm font-semibold text-neutral-950">Suggestions restantes</p>
                <p className="mt-1 text-xs text-neutral-500">Facultatif. Coche ce que tu as traité.</p>
                <ul className="mt-3 flex flex-col gap-2 text-sm">
                  {[...analysis.missing, ...analysis.atsImprovements].map((s, i) => (
                    <li key={i}>
                      <label className="flex cursor-pointer gap-2">
                        <input
                          type="checkbox"
                          className="mt-1 size-4 shrink-0 accent-neutral-900"
                          checked={doneSuggestions.includes(i)}
                          onChange={() => setDoneSuggestions(d => (d.includes(i) ? d.filter(x => x !== i) : [...d, i]))}
                        />
                        <span className={doneSuggestions.includes(i) ? 'text-neutral-400 line-through' : 'text-neutral-700'}>{s}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="inline-flex self-start rounded-lg bg-neutral-100 p-1" role="tablist">
              {(['cv', 'lettre'] as const).map(k => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={docStep === k}
                  disabled={k === 'lettre' && !letter}
                  onClick={() => setDocStep(k)}
                  className={cn(
                    'h-9 rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-40',
                    docStep === k ? 'bg-neutral-50 text-neutral-950' : 'text-neutral-600 hover:text-neutral-950',
                  )}
                >
                  {k === 'cv' ? '1. CV' : '2. Lettre de motivation'}
                </button>
              ))}
            </div>

            {docStep === 'cv' && (
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-6 lg:sticky lg:top-24 lg:self-start">
                  <CvPreview doc={doc} identity={{ name: profile.name, email: profile.email, phone: profile.phone, city: profile.city, linkedin: profile.linkedin, portfolio: profile.portfolio }} />
                </div>
                <div className="col-span-12 flex flex-col gap-6 lg:col-span-6">
                  <CvEditor doc={doc} onChange={setDoc} />
                </div>
              </div>
            )}

            {docStep === 'lettre' && letter && (
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-6 lg:sticky lg:top-24 lg:self-start">
                  <LetterPreview
                    doc={letter}
                    identity={{ name: profile.name, email: profile.email, phone: profile.phone, city: profile.city, linkedin: profile.linkedin, portfolio: profile.portfolio }}
                    contractSuffix={({ alternance: ' en alternance', stage: ' en stage', cdi: ' en CDI', cdd: ' en CDD' } as Record<string, string>)[profile.soughtContract] ?? ''}
                  />
                </div>
                <div className="col-span-12 flex flex-col gap-6 lg:col-span-6">
                  <LetterEditor doc={letter} onChange={setLetter} />
                </div>
              </div>
            )}

            <div className="sticky bottom-0 z-10 -mx-6 flex flex-wrap items-center gap-3 border-t border-neutral-200 bg-neutral-50/95 px-6 py-4 backdrop-blur">
              {docStep === 'cv' ? (
                <>
                  <Button type="button" onClick={() => downloadPdf('cv', toExportCv(doc))}><Download size={16} />Télécharger le CV</Button>
                  {letter && <Button type="button" variant="outline" onClick={() => setDocStep('lettre')}>Passer à la lettre →</Button>}
                </>
              ) : (
                <>
                  {letter && <Button type="button" onClick={() => downloadPdf('lettre_de_motivation', toExportLetter(letter))}><Download size={16} />Télécharger la lettre</Button>}
                  <Button type="button" variant="outline" onClick={() => downloadPdf('cv', toExportCv(doc))}>Télécharger le CV</Button>
                  <Button type="button" variant="outline" onClick={() => setDocStep('cv')}>← Retour au CV</Button>
                </>
              )}
              {exportError && <span className="text-sm text-red-600">{exportError}</span>}
            </div>
          </div>
        )}

        {step === 'done' && restoring && (
          <p className="text-sm text-neutral-500">Chargement du résultat…</p>
        )}

        {step === 'done' && !doc && !restoring && (
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
              <Button type="button" onClick={startNewApplication}>
                <Icon name="plus" />Postuler à une autre annonce</Button>
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

              <a className="dash-tile dash-tile--download" href={cvUrl} download={downloadName('cv')}>
                <span className="dash-tile-icon"><Icon name="file-text" /></span>
                <span className="dash-tile-body">
                  <span className="dash-tile-title">Télécharger le CV</span>
                  <span className="dash-tile-subtitle">CV.pdf</span>
                </span>
              </a>

              <a className="dash-tile dash-tile--download" href={lettreUrl} download={downloadName('lettre_de_motivation')}>
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
                <textarea className="min-h-32 w-full rounded-lg border border-neutral-300 bg-neutral-50 p-4 text-base text-neutral-900 placeholder:text-neutral-400 outline-none focus-visible:border-neutral-900"
                  placeholder="Ex. : Renforcer le bullet CRM, raccourcir l'accroche, mettre davantage en avant le SEO, reformuler le 2e paragraphe de la lettre…"
                  value={modifications}
                  onChange={(e) => setModifications(e.target.value)}
                />
              </div>
              <div className="generate-actions">
                <Button type="button" onClick={handleGenerate} disabled={!modifications.trim()}>Appliquer →</Button>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
