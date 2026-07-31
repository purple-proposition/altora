import Anthropic from '@anthropic-ai/sdk';
import PDFDocument from 'pdfkit';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { assertSafeUrl } from '@/lib/ssrfGuard';
import { readCapped } from '@/lib/cappedFetch';
import { rateLimit } from '@/lib/rateLimit';

const MAX_JOB_POSTING_RESPONSE_BYTES = 2 * 1024 * 1024;

const JESSE_BASE = {
  name: 'Jesse Sotomayor',
  email: 'jessesotomayor@icloud.com',
  phone: '+33 6 06 95 41 36',
  linkedin: 'linkedin.com/in/jessesotomayor',
  portfolio: 'jessesotomayor.vercel.app',
  city: 'Lyon',
  title: "Data Marketing & IA · Alternance à partir d'octobre 2026 · 4j entreprise / 1j école",
  profil:
    "Étudiant en marketing digital spécialisé en acquisition et CRM, avec une expérience opérationnelle en emailing, analyse de performance et développement commercial. Co-fondateur d'un média digital ayant atteint 4 000 auditeurs mensuels et plus de 2 millions de vues grâce à une stratégie de contenu, de référencement et de community management. Recherche une alternance à partir d'octobre 2026.",
  experiences: [
    {
      company: 'Job Events',
      title: 'Chargé de marketing digital en alternance',
      dates: '10/2025 – Présent',
      bullets: [
        "Transfert complet d'un CRM vers un autre : migration d'une base de plus de 20 000 fiches, nettoyage intégral et enrichissement pour améliorer la segmentation et la conversion.",
        "Automatisation de processus via des outils d'IA pour réduire les tâches récurrentes et centraliser le suivi des performances.",
        "Gestion des campagnes de prospection sur Lemlist et des newsletters sur Odoo : paramétrage, ciblage, A/B testing et analyse des taux d'ouverture, de clic et de conversion.",
        "Refonte du site web : amélioration de l'expérience utilisateur et mise en place du suivi de performance via Google Analytics.",
        "Création de supports d'aide à la vente : présentations, one-pagers et contenus commerciaux.",
      ],
    },
    {
      company: '8Beats Radio',
      title: 'Co-fondateur / Responsable marketing digital',
      dates: '09/2021 – Présent',
      bullets: [
        "Développement de la croissance organique du média de 0 à 4 000 auditeurs mensuels grâce à une stratégie de contenu, de référencement naturel, d'animation des réseaux sociaux et de partenariats.",
        "Pilotage de la stratégie social media avec notamment plus de 2 millions de vues générées sur TikTok.",
        "Définition de l'identité de marque : charte graphique, expérience utilisateur du site et ligne éditoriale cohérente sur l'ensemble des supports.",
        "Projet incubé à l'Hôtel 71 (12 mois) puis accompagné par la French Tech Lyon (1 trimestre) : structuration opérationnelle, développement du projet et accélération de la croissance.",
      ],
    },
  ],
  formation: [
    {
      school: 'École Supérieure du Digital',
      degree: 'Bac +4 · Manager de la stratégie marketing et digitale',
      dates: '10/2026 – En cours',
      bullets: [] as string[],
    },
    {
      school: 'Rocket School',
      degree: 'Bac +3 · Marketing spécialisé en acquisition numérique',
      dates: '07/2025 – 10/2026',
      bullets: [] as string[],
    },
  ],
  competences:
    'Acquisition digitale · CRM · Marketing automation · IA générative · Emailing · Segmentation · A/B testing · Analyse de données · Reporting · Référencement naturel (SEO) · Référencement payant (SEA) · Optimisation de la conversion · Landing pages · Funnel marketing · Copywriting · Community management · Gestion de projet · UX/UI',
  outils:
    'Google Analytics · Google Ads · Meta Ads · Brevo · HubSpot · Odoo · Figma · Canva · Adobe Creative Suite · Microsoft Office · Notion · TikTok · Instagram · Claude',
  langues: 'Français : langue maternelle · Anglais : courant · Espagnol : intermédiaire',
};

// ── PDF helpers ──────────────────────────────────────────────────────────────

function generatePDF(doc_fn: (doc: InstanceType<typeof PDFDocument>) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Author: 'Jesse Sotomayor' } });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc_fn(doc);
    doc.end();
  });
}

// Renders all CV content onto `doc` with a `shrink` factor (0 < shrink ≤ 1).
// shrink < 1 compresses spacing uniformly to reclaim vertical space.
function renderCVContent(doc: InstanceType<typeof PDFDocument>, cv: typeof JESSE_BASE, shrink = 1.0): void {
  const M = 42.52;
  const W = 595.28 - M * 2;
  const PAGE_H = 841.89;
  const BOTTOM = PAGE_H - 40;
  let y = M;

  // ── Design system ───────────────────────────────────────────────
  // C.noir  → contenu principal (ce que le recruteur lit)
  // C.fonce → métadonnées/contextuel (dates, contact, titres italiques)
  // C.deco  → décoratif uniquement (filets HR — jamais sur du texte)
  const C = {
    noir:  '#111827',  // gray-900 — contrast 19:1
    fonce: '#4b5563',  // gray-600 — contrast  7:1
    deco:  '#d1d5db',  // gray-300 — décoratif
  };

  // ── Grille de gaps visuels : 4 / 8 / 12 / 16 ──────────────────────────────
  // Tous les gaps ci-dessous sont des GAPS VISUELS RÉELS en points.
  // Pour les éléments ln() (baseline) : constant = lineHeight(fontSize) + visualGap
  //   lineHeight(9pt)  ≈ 11pt  →  vg(gap) = sp(11 + gap)
  //   lineHeight(18pt) ≈ 22pt  →  vg(gap, 18) = sp(22 + gap)
  // Pour les éléments block() : constant = visualGap directement.
  const sp = (n: number) => Math.round(n * shrink);
  const vg = (gap: number, fontSize = 9) => sp(Math.round(fontSize * 1.2) + gap);
  const S = {
    // ── Header (ln → ln)
    nameToTitle:      vg(4, 18), // 4pt visuel après le nom (18pt)
    titleToContact:   vg(8),     // 8pt visuel titre → contact
    contactToProfile: vg(12),    // 12pt visuel contact → profil
    // ── Sections (block → blank → ln)
    profileToSection: sp(16),    // 16pt visuel — block-based ✓
    beforeSection:    sp(12),    // 12pt espace blanc avant label
    afterLabel:       vg(8),     // 8pt visuel label → premier contenu
    // ── Blocs expérience / formation (ln → ln)
    companyToTitle:   vg(4),     // 4pt visuel entreprise → intitulé
    titleToBullets:   vg(8),     // 8pt visuel intitulé → 1re puce
    // ── Puces et fins de bloc (block-based)
    betweenBullets:   sp(4),     // 4pt visuel entre puces ✓
    afterBlock:       sp(16),    // 16pt — aligné sur afterInline, gap uniforme ✓
    afterInline:      sp(16),    // 16pt visuel après inline ✓
  };

  const ln = (str: string, x: number, yPos: number, opts: object = {}) =>
    doc.text(str, x, yPos, { lineBreak: false, ...opts });
  const block = (str: string, x: number, yPos: number, opts: object = {}) =>
    doc.text(str, x, yPos, { lineBreak: true, lineGap: Math.max(1, sp(2)), ...opts });
  const hr = (yPos: number, color = C.deco) =>
    doc.moveTo(M, yPos).lineTo(M + W, yPos).lineWidth(0.3).strokeColor(color).stroke();

  // Guard: add new page only if truly needed (shouldn't fire with correct shrink)
  const newPage = (needed = 50) => {
    if (y + needed > BOTTOM) {
      doc.addPage({ size: 'A4', margin: 0 });
      y = M;
    }
  };

  const section = (label: string, needed = 60) => {
    newPage(needed);
    y += S.beforeSection;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(C.noir);
    ln(label, M, y, { characterSpacing: 0.6 });
    y += S.afterLabel;
  };

  // ── Header ──────────────────────────────────────────────────────
  doc.font('Helvetica-Bold').fontSize(18).fillColor(C.noir); ln(cv.name, M, y); y += S.nameToTitle;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.noir); ln(cv.title, M, y); y += S.titleToContact;
  doc.font('Helvetica').fontSize(9).fillColor(C.noir);
  const contactStr = `${cv.phone}  ·  ${cv.email}  ·  ${cv.linkedin}  ·  ${cv.portfolio}  ·  ${cv.city}`;
  ln(contactStr, M, y);
  // Liens cliquables sur chaque élément (doc.link() — l'option link de doc.text() est cassée dans PDFKit 0.15.2)
  const sep = '  ·  ';
  let lx = M;
  const addLink = (text: string, url: string) => { const w = doc.widthOfString(text); doc.link(lx, y, w, 9, url); lx += w + doc.widthOfString(sep); };
  addLink(cv.phone,    `tel:${cv.phone.replace(/\s/g, '')}`);
  addLink(cv.email,    `mailto:${cv.email}`);
  addLink(cv.linkedin, `https://${cv.linkedin}`);
  addLink(cv.portfolio,`https://${cv.portfolio}`);
  y += S.contactToProfile;

  // ── Profil ──────────────────────────────────────────────────────
  doc.font('Helvetica').fontSize(9).fillColor(C.noir);
  block(cv.profil, M, y, { width: W }); y = doc.y + S.profileToSection;

  // ── Expériences ─────────────────────────────────────────────────
  section('EXPÉRIENCES');
  for (const exp of cv.experiences) {
    newPage(80);
    const rowY = y;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(C.noir); ln(exp.title, M, rowY);
    doc.font('Helvetica').fontSize(9).fillColor(C.noir); ln(exp.dates, M, rowY, { align: 'right', width: W });
    y = rowY + S.companyToTitle;
    doc.font('Helvetica').fontSize(9).fillColor(C.noir); ln(exp.company, M, y); y += S.titleToBullets;
    doc.font('Helvetica').fontSize(9).fillColor(C.noir);
    for (let i = 0; i < exp.bullets.length; i++) {
      newPage(28);
      block(`– ${exp.bullets[i]}`, M + 10, y, { width: W - 10 });
      y = doc.y + (i < exp.bullets.length - 1 ? S.betweenBullets : 0);
    }
    y += S.afterBlock; // 16pt — uniforme avec afterInline
  }

  // ── Formation ───────────────────────────────────────────────────
  section('FORMATION');
  for (let fi = 0; fi < cv.formation.length; fi++) {
    const f = cv.formation[fi];
    newPage(70);
    const rowY = y;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(C.noir); ln(f.degree, M, rowY);
    doc.font('Helvetica').fontSize(9).fillColor(C.noir); ln(f.dates, M, rowY, { align: 'right', width: W });
    y = rowY + S.companyToTitle;
    doc.font('Helvetica').fontSize(9).fillColor(C.noir); block(f.school, M, y, { width: W });
    // 12pt entre entrées, afterInline après la dernière pour la transition section
    y = doc.y + (fi < cv.formation.length - 1 ? sp(12) : S.afterInline);
  }

  // ── Compétences ─────────────────────────────────────────────────
  section('COMPÉTENCES');
  doc.font('Helvetica').fontSize(9).fillColor(C.noir);
  block(cv.competences, M, y, { width: W }); y = doc.y + S.afterInline;

  // ── Outils ──────────────────────────────────────────────────────
  section('OUTILS');
  doc.font('Helvetica').fontSize(9).fillColor(C.noir);
  block(cv.outils, M, y, { width: W }); y = doc.y + S.afterInline;

  // ── Langues ─────────────────────────────────────────────────────
  // needed=42: header (~30) + one text line (~12) — no redundant standalone guard
  section('LANGUES', 42);
  doc.font('Helvetica').fontSize(9).fillColor(C.noir);
  ln(cv.langues, M, y);
}

// Strict 1-page enforcement: try shrink=1.0 → 0.91 → 0.83.
// Overflow is detected by intercepting doc.addPage().
async function buildCVPdf(cv: typeof JESSE_BASE): Promise<Buffer> {
  for (const shrink of [1.0, 0.91, 0.83]) {
    let overflowed = false;
    const buf = await generatePDF((doc) => {
      const origAddPage = doc.addPage.bind(doc);
      (doc as any).addPage = (...args: any[]) => { overflowed = true; return origAddPage(...args); };
      renderCVContent(doc, cv, shrink);
    });
    if (!overflowed) return buf;
  }
  // Absolute fallback (should never reach here with well-constrained content)
  return generatePDF((doc) => renderCVContent(doc, cv, 0.83));
}

async function buildLetterPdf(data: { company: string; poste: string; paragraphs: string[] }, isCDI = false): Promise<Buffer> {
  // Separators: em-dash and en-dash (non-date) → middle dot
  const clean = (s: string) =>
    s.replace(/\s*—\s*/g, ' · ')      // em-dash → point médian
     .replace(/\s+–\s+/g, ' · ');     // en-dash connecteur → point médian
  return generatePDF((doc) => {
    const M = 56.69; const W = 595.28 - M * 2; let y = M;
    const ln = (str: string, x: number, yPos: number, opts: object = {}) =>
      doc.text(str, x, yPos, { lineBreak: false, ...opts });

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#000'); ln('Jesse Sotomayor', M, y); y += 14;
    doc.font('Helvetica').fontSize(10).fillColor('#333');
    ln('jessesotomayor@icloud.com', M, y); y += 13;
    ln('+33 6 06 95 41 36', M, y); y += 30;

    const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.font('Helvetica').fontSize(10).fillColor('#333');
    ln(`Lyon, le ${dateStr}`, M, y - 57, { align: 'right', width: W });

    y += 10;

    // Clean poste: strip "Alternance", H/F markers, and feminine suffixes (all epicene patterns)
    const posteClean = data.poste
      .replace(/^alternance\s*[–\-:]\s*/i, '')        // "Alternance – Marketing" → "Marketing"
      .replace(/\s*[–\-]\s*alternance\s*$/i, '')      // "Marketing – Alternance" → "Marketing"
      .replace(/^alternance\s+/i, '')                 // "Alternance Marketing" (sans tiret) → "Marketing"
      .replace(/\s+en\s+alternance\s*$/i, '')         // "Marketing en alternance" → "Marketing"
      .replace(/\s*[\[(]?\s*[hf]\/[fh]\s*[\])]?\s*/gi, '') // H/F, F/H, (H/F)
      .replace(/\(e?é?e?s?\)/gi, '')                  // (e), (ée), (es) → masculin
      .replace(/\((trice|rice|euse)\)/gi, '')          // (trice), (rice), (euse) → masculin
      .replace(/\/é?e?s?\b/gi, '')                    // /e, /ée, /es → masculin
      .replace(/[.··](e|es|ée|ées|trice|rice|euse|eure)\b/gi, '') // Apprenti.e / Chargé·e → masculin
      .replace(/\s+/g, ' ')
      .trim();
    // Lowercase initial capital of job title: "Chargé…" → "chargé…"
    const posteLower = posteClean.charAt(0).toLowerCase() + posteClean.slice(1);
    // French elision: "de" → "d'" before a vowel or h
    const dePoste = /^[aeiouéèêëàâîïôùûüh]/i.test(posteLower) ? `d'${posteLower}` : `de ${posteLower}`;
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#000');
    doc.text(`Objet : Candidature au poste ${dePoste}${isCDI ? '' : ' en alternance'}`, M, y, { width: W, lineBreak: true });
    y = doc.y + 24;

    doc.font('Helvetica').fontSize(10).fillColor('#000');

    // Safety filter: strip elements injected elsewhere by the builder.
    // "Bonjour [Madame/Monsieur] [Nom]," is now Claude's first paragraph — allowed.
    // "Bien cordialement," is hardcoded below — strip if Claude duplicates it.
    const paras = data.paragraphs.filter((p) => {
      const t = p.trim().toLowerCase();
      return (
        !/^madame[,\s]/.test(t) &&             // ancienne formule d'appel seule
        !/^veuillez agr/.test(t) &&             // ancienne formule de politesse
        !/^je vous (prie|adresse)/.test(t) &&   // variante formule de politesse
        !/^(bien\s+)?cordialement/.test(t) &&   // "Cordialement" / "Bien cordialement,"
        !/^au plaisir/.test(t) &&               // "Au plaisir d'échanger,"
        !/^jesse sotomayor/.test(t) &&          // signature (injectée séparément)
        !/^objet\s*:/.test(t) &&                // ligne Objet (injectée séparément)
        !/^lyon,?\s+le\s/.test(t) &&            // date (injectée séparément)
        !/^jessesotomayor@/.test(t) &&          // email (injecté séparément)
        !/^\+33/.test(t)                        // téléphone (injecté séparément)
      );
    });

    // Salutation line (paragraphs[0] = "Bonjour Madame [Nom]," or "Bonjour,")
    // gets the same block rendering but with tighter spacing after.
    for (let i = 0; i < paras.length; i++) {
      doc.text(clean(paras[i]), M, y, { width: W, lineBreak: true, align: 'justify' as 'justify', lineGap: 1.5 });
      y = doc.y + (i === 0 ? 14 : 16); // tighter gap after salutation
    }

    // Modern 2026 closing — hardcoded, never comes from Claude
    y += 4;
    doc.font('Helvetica').fontSize(10).fillColor('#000');
    doc.text('Bien cordialement,', M, y, { lineBreak: false });
    y = doc.y + 22;
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#000');
    ln('Jesse Sotomayor', M, y);
  });
}

// ── Letter jargon sanitizer ──────────────────────────────────────────────────
// Applies AFTER Claude's output, BEFORE PDF build.
// Catches banned English jargon and formulas Claude may have missed.
// Ordered: most specific patterns first, catch-alls last.
function sanitizeLetter(paragraphs: string[]): string[] {
  type Rule = [RegExp, string];
  const rules: Rule[] = [
    // nurturing — specific compounds first (éviter double préposition "de l'accompagnement")
    [/séquences?\s+de\s+nurturing/gi,        "séquences d'accompagnement"],
    [/logiques?\s+de\s+nurturing/gi,         "logiques d'accompagnement"],
    [/campagnes?\s+de\s+nurturing/gi,        "campagnes d'accompagnement"],
    [/séquences?\s+de?\s+nurturing/gi,       "séquences d'accompagnement"],
    [/nurturing\s+clients?/gi,               "accompagnement client"],
    [/lead\s+nurturing/gi,                   "accompagnement dans la durée"],
    [/\bnurture\b/gi,                        "accompagner"],
    [/\bdu\s+nurturing\b/gi,                 "de l'accompagnement"],
    [/\bde\s+nurturing\b/gi,                 "d'accompagnement"],   // "campagnes de nurturing" → "campagnes d'accompagnement"
    [/\ble\s+nurturing\b/gi,                 "l'accompagnement"],
    [/\bnurturing\b/gi,                      "accompagnement"],
    // other English jargon — always wrong in a French cover letter
    [/\blifecycle\b/gi,                      "cycle de vie d'un contact"],
    [/\btouchpoints?\b/gi,                   "points de contact"],
    [/\bonboarding\b/gi,                     "prise en main"],
    [/\bfunnel\b/gi,                         "parcours"],
    [/\bpipeline\b/gi,                       "suivi des contacts"],
    [/\bscalable\b/gi,                       "reproductible"],
    [/\bbuzzword\b/gi,                       "effet de mode"],
    // slide-deck / roadmap vocabulary
    [/\broadmap\b/gi,                        "plan d'action"],
    [/\bframeworks?\b/gi,                    "méthode"],
    [/\buse\s+cases?\b/gi,                   "cas d'usage"],
    [/\binsights?\b/gi,                      "enseignements"],
    [/\bmindset\b/gi,                        "état d'esprit"],
    // banned English formulas used in French marketing
    [/\bopère à un endroit rare\b/gi,        "travaille sur un positionnement singulier"],
    [/\btravaille à l'intersection de\b/gi,  "travaille à la jonction de"],
    // vocabulary: "plateformes" → "outils"
    [/plateformes?\s+d['']emailing/gi,       "outils d'emailing"],
    [/plateformes?\s+CRM/gi,                 "outils CRM"],
    [/plateformes?\s+de\s+gestion/gi,        "outils de gestion"],
    // vocabulary: SaaS — article et formulation
    [/\bune\s+SaaS\b/g,                      "une solution SaaS"],
    [/\bun\s+SaaS\b/g,                       "une solution SaaS"],
    [/\bd['']un\s+SaaS\b/g,                  "d'une solution SaaS"],
    [/\bla\s+SaaS\b/g,                       "la solution SaaS"],
    [/\bcette\s+SaaS\b/g,                    "cette solution SaaS"],
    [/\bsa\s+SaaS\b/g,                       "sa solution SaaS"],
    // Point médian — codepoints \u EXPLICITES (bullet-proof, pas de confusion d'encodage)
    // · MIDDLE DOT  • BULLET  ⋅ DOT OP  ‧ HYPHENATION PT
    // ・ KATAKANA  \u FF65 HALFWIDTH  · GREEK  ∙ BULLET OP  ․ ONE DOT LEADER
    [/^\s*[·•⋅‧・･·∙․]\s*/gm, ''],
    [/\s*[·•⋅‧・･·∙․]\s*$/gm, ''],
    [/\s*[·•⋅‧・･·∙․]\s*/g,   ', '],
    [/,\s*,/g, ','],
    [/,\s*\./g, '.'],
    // Disponibilité : date immuable octobre 2026 — corriger tout mois erroné
    [/disponible\s+à\s+partir\s+de\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|novembre|décembre)\s+2026/gi,
      "disponible à partir d'octobre 2026"],
    [/à\s+partir\s+de\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|novembre|décembre)\s+2026/gi,
      "à partir d'octobre 2026"],
    // Closing sur-familier : supprimer "ou avec [Prénom]"
    [/\s+ou\s+avec\s+[A-ZÉÈÊËÀÂÎÏÔÛÙ][a-zéèêëàâîïôûùü]+\.?/g, '.'],
    // Formule présomptueuse
    [/Ce\s+que\s+vous\s+cherchez,?\s+c[''']est/gi, 'Vous cherchez'],
    // UI/UX — toujours les deux ensemble (seulement si UI ou UX est isolé, pas dans GUI, etc.)
    [/(?<![A-Z])UX(?!\/)/g,  "UI/UX"],
    [/(?<![A-Z])UI(?!\/)/g,  "UI/UX"],
    // self-referential founder phrases → remove or rephrase
    [/\bCette\s+expérience\s+de\s+fondateur\b/gi,     "Ce projet"],
    [/\bCette\s+expérience\s+d['']entrepreneur\b/gi,  "Ce projet"],
    [/\bmon\s+expérience\s+de\s+fondateur\b/gi,       "ce que j'ai construit"],
    // "je suis convaincu que" — interdit (opinion sans preuve)
    [/\bje\s+suis\s+convaincu\s+qu[e']/gi,    "je pense que"],
    [/\bje\s+suis\s+persuadé\s+qu[e']/gi,     "je pense que"],
    // HubSpot ne doit pas apparaître dans la lettre pour Job Events
    [/\bHubSpot\b/g, 'Odoo'],
    // "immédiatement" contradictoire avec disponibilité octobre 2026
    [/\bcontribuer\s+immédiatement\b/gi,    'contribuer dès octobre 2026'],
    [/\bimmédiatement\s+contribuer\b/gi,    'contribuer dès octobre 2026'],
    [/\bpeux\s+immédiatement\b/gi,          'pourrai dès octobre 2026'],
    [/\bimmédiatement\s+disponible\b/gi,    'disponible à partir d\'octobre 2026'],
    // expressions corporates creuses interdites dans la lettre
    [/\brésonne\s+avec\s+ma\s+conviction\b/gi,  'correspond à ce que je pratique'],
    [/\bvotre\s+vision\s+du\b/gi,               'votre positionnement'],
    [/\bje\s+suis\s+enthousiaste\s+à\s+l['']idée\s+de\b/gi, 'je souhaite'],
    [/\bje\s+suis\s+enthousiaste\s+à\s+l['']idée\b/gi,      'je souhaite'],
    // typo: "job Events" → "Job Events"
    [/\bjob\s+Events\b/g, 'Job Events'],
    // 8Beats: Claude invente parfois une collaboration avec une agence web — faux, tout est fait par Jesse
    [/\bj['']ai\s+(?:aussi\s+)?travaillé\s+(?:directement\s+)?avec\s+(?:l['']agence\s+web|les?\s+(?:partenaires?\s+externes?|prestataires?))[^.]*\./gi, ''],
    [/\ben\s+collaboration\s+avec\s+(?:une?\s+)?(?:agence\s+web|prestataire)[^.]*\./gi, ''],
    // transitions creuses en début de para[3] → formulations directes
    [/^Au[- ]delà\s+de\s+cela,?\s*/gim,         'Depuis 2021, '],
    [/^Au[- ]delà\s+de\s+mon\s+alternance,?\s*/gim, 'Par ailleurs, '],
    // closing: "en échanger" is grammatically wrong → replace with "en discuter"
    [/\bd['']en\s+échanger\s+avec\s+vous\b/gi, "d'en discuter avec vous"],
    [/\bj['']en\s+échangerai\b/gi,             "j'en discuterai"],
    // chronology: "En parallèle" introducing 8Beats → cleaner alternatives
    [/En parallèle,?\s+je\s+gère\s+8Beats/gi,       "Je gère par ailleurs 8Beats"],
    [/En parallèle,?\s+j['']ai\s+lancé\s+8Beats/gi, "J'ai également lancé 8Beats"],
    // typography: job titles in letters → always lowercase in French context
    [/\bgrowth\s+[Hh]acker\b/g,   "growth hacker"],
    [/\bGrowth\s+[Hh]acker\b/g,   "growth hacker"],
    [/\bcontent\s+[Mm]anager\b/g,  "content manager"],
    [/\bContent\s+[Mm]anager\b/g,  "content manager"],
    [/\bproduct\s+[Mm]anager\b/g,  "product manager"],
    [/\bProject\s+[Mm]anager\b/g,  "project manager"],
  ];

  // Codepoints de tous les points médians connus — approche char-par-char, 100% bullet-proof
  const MIDDOT_CODES = new Set([
    0x00B7, // MIDDLE DOT
    0x2022, // BULLET
    0x22C5, // DOT OPERATOR
    0x2027, // HYPHENATION POINT
    0x30FB, // KATAKANA MIDDLE DOT
    0xFF65, // HALFWIDTH KATAKANA MIDDLE DOT
    0x0387, // GREEK ANO TELEIA
    0x2219, // BULLET OPERATOR
    0x2024, // ONE DOT LEADER
  ]);

  return paragraphs.map(p => {
    let s = p;
    for (const [pattern, replacement] of rules) {
      s = s.replace(pattern, replacement);
    }
    // Passage nucléaire final : char-par-char, indépendant de tout encodage regex
    s = Array.from(s).map(c => MIDDOT_CODES.has(c.codePointAt(0) ?? 0) ? ', ' : c).join('');
    s = s.replace(/,\s*,/g, ',').replace(/,\s*\./g, '.').replace(/^\s*,\s*/gm, '').replace(/\s{2,}/g, ' ');
    return s.trim();
  });
}

// ── URL fetcher ──────────────────────────────────────────────────────────────

function isUrl(s: string) { return /^https?:\/\//i.test(s); }

async function fetchJobPosting(url: string): Promise<string> {
  const safeUrl = await assertSafeUrl(url);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(safeUrl, {
      signal: ctrl.signal,
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
    });
    if (!res.ok) throw new Error(`La page a répondu ${res.status}`);
    const html = await readCapped(res, MAX_JOB_POSTING_RESPONSE_BYTES);
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ').trim().slice(0, 10000);
    if (text.length < 200) throw new Error('Contenu trop court – le site bloque les requêtes automatiques (ex. LinkedIn, Indeed)');
    return text;
  } finally { clearTimeout(timer); }
}

// ── SSE helper ───────────────────────────────────────────────────────────────

type SSEPayload = Record<string, unknown>;

function makeStream() {
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const enc = new TextEncoder();
  const send = (data: SSEPayload) => writer.write(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
  const close = () => writer.close();
  return { readable, send, close };
}

// ── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401 });
  }

  // This route calls Claude and renders PDFs — expensive enough to be worth
  // throttling per user, separately from the cheaper parse-offer lookup.
  if (!rateLimit(`generate:${session.user.id}`, 10, 60 * 60_000)) {
    return new Response(JSON.stringify({ error: 'Trop de générations, réessaie dans une heure.' }), { status: 429 });
  }

  let body: { jobPosting?: string; modifications?: unknown; contractType?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Corps de requête invalide' }), { status: 400 });
  }
  const { jobPosting, modifications, contractType = 'alternance' } = body;
  const isCDI = contractType === 'cdi';
  if (!jobPosting?.trim()) {
    return new Response(JSON.stringify({ error: 'Fiche de poste manquante' }), { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY non configurée' }), { status: 500 });
  }

  const { readable, send, close } = makeStream();

  (async () => {
    try {
      let jobText = jobPosting.trim();

      // Step 1 – URL fetch
      if (isUrl(jobText)) {
        await send({ progress: 8, step: 'Chargement de la fiche…' });
        try { jobText = await fetchJobPosting(jobText); }
        catch (e: unknown) {
          await send({ error: e instanceof Error ? e.message : 'Impossible de charger la fiche' });
          return;
        }
      }

      // Step 2 – Claude
      await send({ progress: 15, step: 'Analyse de la fiche…' });

      const client = new Anthropic({ apiKey });

      const systemPrompt = `Tu es un générateur expert de CV et lettres de motivation en français pour Jesse Sotomayor.

MISSION
Transformer une fiche de poste en CV + lettre + email de candidature : professionnels, ciblés, crédibles, ATS-friendly. Ne jamais inventer d'expérience, outil, diplôme, résultat ou affinité sectorielle.

PRINCIPES FONDAMENTAUX
Jesse est un homme : masculin partout, supprimer toutes les formes épicènes : H/F, (e), (trice), /e, mais aussi les formes avec point médian ou point ordinaire : "Apprenti.e" → "Apprenti", "Chargé·e" → "Chargé", "Coordinateur.trice" → "Coordinateur". Supprimer tous ces suffixes partout : dans l'intitulé du poste, le titre du CV, l'objet de la lettre et l'objet de l'email.
Standard France 2026 : toujours la formulation la plus répandue, la plus compatible ATS. Jamais plus originale si moins standard.
Pas de première personne dans le CV. "Je" sobre et direct dans la lettre uniquement.
Ponctuation : jamais de tiret cadratin (—). Le demi-cadratin (–) est réservé aux intervalles de dates et chiffres uniquement.
Jamais d'élision devant un nom propre commençant par un chiffre : "de 8Beats", jamais "d'8Beats".
Chiffres : toujours "plus de 2 000", jamais "2 000+". Introduire les chiffres dans une formulation fluide, jamais balancés secs.

CV / LETTRE : DIFFÉRENCE FONDAMENTALE
CV = faits, résultats, mots-clés ATS. La lettre ne répète pas le CV.
Lettre = pourquoi ce poste, pourquoi cette entreprise, pourquoi ce moment, ce que Jesse apporte concrètement.

━━━ CV ━━━

CONTENU
Ordre antichronologique strict : expériences ET formation, du plus récent au plus ancien. Non négociable.
Bullets : verbe d'action fort + contexte + outil/méthode + résultat chiffré si disponible. 1 ligne, 2 maximum.
Réordonner bullets, compétences et outils par pertinence décroissante pour le poste. Ne JAMAIS supprimer un outil ni une compétence — seulement réordonner. Tous les outils et compétences du profil de base doivent apparaître sans exception.
Profil : 3 phrases max. Jamais de "Fort intérêt pour…" ni d'affinité sectorielle non prouvée par une expérience concrète.
${isCDI ? 'CDI — PROFIL : ne jamais écrire "alternance", "Recherche une alternance" ni "en alternance". Si une disponibilité est mentionnée, utiliser "Disponible à partir d\'octobre 2026".' : ''}
Interdit dans le profil et les bullets : "compétences validées", "compétences certifiées", "compétences prouvées", "compétences démontrées" — sauf si une certification réelle existe. Une compétence se montre par un résultat ou une action concrète, pas par une auto-déclaration de validation.
Formation : nom de l'école + diplôme + dates uniquement. Zéro bullet, zéro description pédagogique. "bullets":[] dans le JSON.
${isCDI ? "CDI — FORMATION : ne pas inclure l'École Supérieure du Digital (Bac +4, 10/2026 – En cours). Cette formation n'a pas encore débuté et est incompatible avec un CDI. Inclure uniquement Rocket School." : ''}
${isCDI
  ? 'Title : "[intitulé EXACT du poste dans la fiche]". Juste le rôle exact, rien d\'autre — jamais de suffixe "Alternance", "CDI" ou de rythme scolaire. ✅ "Chargé de marketing digital"'
  : 'Title : "[intitulé EXACT du poste dans la fiche] · Alternance à partir d\'octobre 2026 · 4j entreprise / 1j école". Les trois parties séparées par · sont obligatoires et immuables. ✅ "Chargé de marketing · Alternance à partir d\'octobre 2026 · 4j entreprise / 1j école"'}
RÈGLE IMMUABLE — SÉPARATEURS CV : dans les champs structurés du CV (titre sous le nom, intitulés de poste, diplômes, ligne de contact), le séparateur est toujours " · ". Le " – " est réservé aux intervalles de dates uniquement. ❌ "Bac +4 – Manager…" ✅ "Bac +4 · Manager…"
RÈGLE IMMUABLE — PONCTUATION LETTRE : dans le corps de la lettre de motivation, le point médian " · " est ABSOLUMENT INTERDIT sous toutes ses variantes. Ni tiret d'incise (—), ni parenthèse, ni liste avec séparateur. Toute énumération ou incise doit être reformulée avec : virgule, deux-points, point-virgule, ou point. ❌ "concrètement · la gestion social media" ❌ "création visuelle · exactement ce que demandent" ❌ "structurant la croissance · une compétence transférable" ✅ "concrètement : la gestion social media et l'optimisation e-commerce." ✅ "création visuelle, ce qui correspond à vos fiches produits." ✅ "structurant la croissance. Cette compétence est transférable à vos campagnes." Construire des phrases complètes avec sujet-verbe-complément. Ne jamais utiliser · comme deux-points, tiret ou virgule.
RÈGLE IMMUABLE — UN SEUL DEUX-POINTS PAR PHRASE : jamais deux " : " dans la même phrase, même séparés par une proposition. Un deux-points ouvre une seule fois ; s'il faut annoncer puis détailler, couper en deux phrases distinctes. ❌ "Votre offre m'a intéressé pour une raison claire : elle combine trois sujets sur lesquels je travaille depuis octobre 2025 : la gestion de bases, l'automatisation, le reporting." ✅ "Votre offre m'a intéressé pour une raison claire. Elle combine trois sujets sur lesquels je travaille depuis octobre 2025 : la gestion de bases, l'automatisation, le reporting." Avant de finaliser chaque paragraphe, compter les " : " par phrase — si une phrase en contient plus d'un, la scinder.
RÈGLE — RESPIRATION DES ÉNUMÉRATIONS : toute liste de 3 éléments ou plus après un deux-points doit être séparée par des virgules classiques, jamais un enchaînement télégraphique sans respiration. Relire chaque phrase longue (plus de 25 mots) et vérifier qu'elle contient au moins une virgule si elle juxtapose plusieurs idées ou compléments.

1 PAGE A4 STRICTE
Couper dans cet ordre : raccourcir bullets (1 ligne max) → condenser profil (3 lignes, 2 si serré) → retirer bullets peu pertinents → regrouper compétences. Maximum 4 bullets par expérience, viser 3. Les outils ne sont jamais supprimés ni coupés.

STRUCTURE CV : Profil → Expériences → Formation → Compétences → Outils → Langues

━━━ LETTRE DE MOTIVATION ━━━

PRÉ-ANALYSE OBLIGATOIRE (avant d'écrire la moindre ligne)
1. Identifier les 3 attentes principales du poste dans la fiche.
2. Trouver dans le CV les 3 éléments les plus pertinents pour y répondre.
3. Éliminer tout ce qui est secondaire — ne pas forcer une expérience peu alignée.
4. Si la fiche est vague : rester général et crédible, ne pas sur-personnaliser ni inventer des détails sur l'entreprise.
La lettre doit donner envie de lire le CV, pas le remplacer.

STYLE — appliquer ces trois principes dans au moins un paragraphe de la lettre (pas systématiquement partout, pour rester naturel) :
— Tricolon : regrouper trois éléments en rythme ternaire plutôt qu'une liste plate. ✅ "Enrichir, segmenter, mesurer : c'est ce triptyque que je pratique chaque semaine."
— Phrase clivée pour appuyer une idée forte : "C'est ce travail de fiabilisation des données qui m'intéresse." plutôt que "Ce travail de fiabilisation des données m'intéresse."
— Chute : chaque paragraphe de preuve (paragraphs[2], [3]) doit se terminer sur une phrase courte et affirmée qui referme l'idée, pas sur une énumération qui s'arrête.

RÈGLE FONDAMENTALE — STRUCTURE DE LA LETTRE
Respecter la séparation stricte entre : (1) besoin du poste et de l'entreprise ; (2) preuve principale ; (3) preuve complémentaire ; (4) contribution projetée + disponibilité. Ne jamais sauter directement à une expérience sans avoir posé le besoin. Ne jamais mentionner la disponibilité avant le dernier paragraphe.

STRUCTURE EN 5 PARAGRAPHES — FONCTIONS OBLIGATOIRES
paragraphs[0] : Salutation — "Bonjour [Prénom]," si connu, sinon "Bonjour,"

paragraphs[1] : CONSTAT / BESOINS DU POSTE
Entrer directement par le poste : pourquoi cette mission intéresse Jesse, ce qui fait le lien entre leurs enjeux et son profil, ce qu'il vient chercher ou apporter.
— INTERDIT : ne jamais résumer l'activité de l'entreprise ou son marché. Le recruteur le sait. Phrases interdites : "Scale Plus accompagne…", "Votre entreprise est spécialisée dans…", "Vous aidez vos clients à…", toute reformulation de la page d'accueil ou de l'annonce.
— Test : si la première phrase pourrait être écrite par quelqu'un qui a juste lu le site vitrine, la supprimer et réécrire.
— Commencer par la motivation, l'adéquation avec la mission, ou ce qui attire dans le poste.
— INTERDITES — formules d'accroche théâtrales et corporates : ❌ "m'a arrêté" ❌ "a retenu mon attention" ❌ "a immédiatement suscité mon intérêt" ❌ "m'a sauté aux yeux" ❌ "ne pouvait pas me laisser indifférent" ❌ "correspond en tout point à" ❌ "je suis enthousiaste à l'idée de" ❌ "résonne avec ma conviction" ❌ "Votre vision du [X] résonne" ❌ "je suis passionné par" ❌ "contribuer au développement digital de [entreprise]". Ces formules sonnent faux ou décrivent l'entreprise. Préférer un constat direct et factuel, toujours avec "Votre offre" (jamais "Cette offre") : ✅ "Votre offre combine trois sujets sur lesquels je travaille concrètement…" ✅ "Votre offre m'a intéressé pour une raison claire : elle combine…"
— Jamais "Depuis octobre 2025…" dans ce paragraphe.
— Jamais de mention de disponibilité ici.
— Jamais d'entrée directe dans une expérience.
— INTERDIT — AFFINITÉ SECTORIELLE NON PROUVÉE : ne jamais affirmer un intérêt pour un secteur ou un environnement (ex. "L'environnement B2B événementiel vous intéresse", "Le secteur de la santé me passionne") sans expérience concrète qui le justifie dans le CV de base. Si aucune expérience sectorielle n'existe, ne pas mentionner le secteur — rester sur les compétences transférables (données, segmentation, automatisation) et laisser le CV/l'entreprise parler d'eux-mêmes. Test : si la phrase pourrait être vraie pour n'importe quel candidat sans expérience dans ce secteur, la supprimer.

RÈGLE — UNE SEULE MENTION DE "DEPUIS OCTOBRE 2025" DANS TOUTE LA LETTRE : cette date ne peut apparaître qu'une fois, dans paragraphs[2] (preuve Job Events). Interdite ailleurs, même reformulée ("Depuis octobre…", "Depuis cette date…").

paragraphs[2] : PREUVE PRINCIPALE — l'expérience la plus directement alignée avec le poste
Ordre par défaut : Job Events d'abord. Exception : si 8Beats est l'expérience clairement plus pertinente pour le poste (ex: rôle SEO, contenu, social media pur, création), alors 8Beats peut être paragraphs[2] et Job Events paragraphs[3].
— INTERDIT ABSOLU : ne jamais mélanger les deux expériences dans le même paragraphe.
— Faits concrets, outils, résultats ou méthodes. Ne jamais inventer de missions ou de résultats non présents dans le CV de base.

paragraphs[3] : PREUVE COMPLÉMENTAIRE — 8BEATS UNIQUEMENT
Apporter une seconde facette utile au poste. Renforcer la crédibilité du profil.
— Présenter 8Beats comme un projet construit depuis 2021.
— Mettre l'accent sur la complémentarité avec le poste : croissance, contenu, communication, UI/UX.
— Résultats disponibles : 4 000 auditeurs mensuels, plus de 2 millions de vues.
— Ne pas répéter les mêmes mots que dans paragraphs[2].
— La date "2021" apparaît une seule fois dans le paragraphe, jamais deux fois dans la même phrase. ❌ "j'ai lancé 8Beats Radio en 2021, un média… depuis 2021" ✅ "j'ai lancé 8Beats Radio en 2021, un média qui…"
— INTERDIT ABSOLU : ne jamais mélanger Job Events et 8Beats dans le même paragraphe. Chacun a son propre bloc.
— Peut être fusionné avec paragraphs[2] UNIQUEMENT si 8Beats n'est absolument pas aligné avec le poste (cas rare).
— TRANSITION OBLIGATOIRE : la première phrase de paragraphs[3] doit créer un lien logique explicite avec paragraphs[2] (complémentarité, contraste, ou angle différent sur une même qualité) — jamais une simple juxtaposition du type "Depuis 2021, j'ai également lancé…". ❌ "Depuis 2021, j'ai également lancé 8Beats Radio…" ✅ "Cette rigueur sur la donnée, je la retrouve dans un projet plus personnel : 8Beats Radio…" ✅ "À côté de cette pratique CRM, 8Beats Radio m'a appris une autre dimension du marketing…"

paragraphs[4] : PROJECTION + DISPONIBILITÉ + CLÔTURE
Montrer la contribution concrète à l'entreprise. Mentionner la disponibilité une seule fois.
— La disponibilité apparaît UNIQUEMENT ici : "à partir d'octobre 2026".
— Une seule phrase de clôture, courte. Soit la date de disponibilité, soit "Je serai ravi d'en discuter lors d'un premier échange." — pas les deux si elles se répètent. Ne pas surcharger avec deux phrases de clôture redondantes.
— Toujours présent.
— CHUTE AFFIRMÉE : la dernière phrase du paragraphe doit être une affirmation directe, jamais une formule molle ou passive. ❌ "serais heureux d'en parler de vive voix" ❌ "n'hésitez pas à me contacter" ✅ "Je suis prêt à en discuter." ✅ une phrase courte, rythmée, qui referme la lettre sur une note factuelle plutôt qu'une politesse générique.

"Bien cordialement,\nJesse Sotomayor" injecté automatiquement — ne jamais l'inclure dans paragraphs.

VERROUILLAGE ÉDITORIAL — DISPONIBILITÉ ET CLÔTURE
La disponibilité a une seule fonction : conclure la lettre. Elle n'est pas un sujet récurrent.
— Une seule mention autorisée, dans paragraphs[4], sous une forme unique et concise.
— Interdite dans paragraphs[1], [2] et [3], sans exception, même reformulée, même indirectement.
— Expressions interdites dans paragraphs[1-3] : toute date de prise de fonction, toute projection temporelle, "dès", "à partir de", "en octobre", "à vos côtés à partir de", "pour une prise de poste", "dès que possible", "dès [mois]", toute formule qui suggère un début de collaboration.
— Si une phrase prépare ou anticipe la disponibilité sans utiliser le mot "disponible" → la supprimer quand même.
— Ne pas réintroduire la disponibilité dans une phrase du type "Je pourrais contribuer dès X à vos missions" si la date est déjà mentionnée juste après.
— Le dernier paragraphe contient soit la disponibilité, soit la formule de clôture — pas deux phrases qui répètent la même idée finale.

TEST OBLIGATOIRE AVANT FINALISATION :
1. Si on retire paragraphs[4] : aucun autre paragraphe ne doit suggérer, préparer ou rappeler la disponibilité. Si c'est le cas → supprimer la mention.
2. Si on relit paragraphs[4] : il ne doit contenir qu'une seule idée de projection finale. Si deux phrases disent la même chose sous une forme différente → en supprimer une.
RÈGLE : chaque paragraphe = une seule fonction principale. Pas de mélange intérêt entreprise + preuve + disponibilité dans le même bloc.

TRANSITIONS APPROUVÉES
Ouverture (paragraphs[1]) — préférer une accroche qui donne envie de lire, pas juste une déclaration sèche :
"Votre offre m'a arrêté pour une raison précise : …" / "Ce qui m'a attiré dans votre annonce, c'est …" / "Ce que vous proposez correspond à quelque chose que j'ai déjà fait concrètement : …" / "En lisant votre offre, j'ai reconnu un terrain sur lequel je travaille déjà…"
À éviter comme première phrase : "Ce poste m'intéresse parce que" seul — trop abrupt, pas d'accroche.
Suite de lettre : "Mon expérience chez Job Events montre que…" / "Mon projet 8Beats complète cette logique…" / "Je peux apporter…" / "Je serai disponible à partir d'octobre 2026…" (paragraphs[4] uniquement)
— PRÉFÉRER LE MODE AFFIRMÉ AU CONDITIONNEL : dans paragraphs[2], [3] et [4], éviter "je pourrais", "je serais heureux de", "j'aimerais" — préférer des formulations affirmées ("je peux", "j'apporte", "je mets en place"). Le conditionnel est réservé aux formules de politesse finales admises, jamais à la présentation des compétences ou de la contribution.

RÈGLE — COHÉRENCE TYPOGRAPHIQUE DES INTITULÉS DE POSTE
Appliquer une capitalisation uniforme dans toute la lettre et l'objet. Jamais de casse mixte incohérente ("growth Hacker", "Content manager"...). Choisir soit tout en minuscules ("growth hacker"), soit en Title Case ("Growth Hacker"), et s'y tenir partout. Un filtre automatique corrige les cas les plus courants.

RÈGLE — CONNECTEURS TEMPORELS VRAIS
Chaque connecteur temporel doit être chronologiquement exact.
Job Events (depuis 10/2025) est l'expérience la plus récente. 8Beats (depuis 09/2021) est antérieure.
Quand 8Beats est introduit après Job Events : ne jamais écrire "En parallèle" — 8Beats a commencé bien avant.
Formulations correctes : "Depuis 2021, j'ai également développé…", "Avant cela,", "Plus tôt,", "Cette logique s'inscrit aussi dans…", "À côté de cela,"
Test : chaque connecteur temporel doit être vrai sur le plan chronologique. Si faux → remplacer.

CONTRAINTES LETTRE
200-250 mots. 3-4 phrases par paragraphe, 5 max.
Utiliser "votre" systématiquement : "votre offre", "vos missions", "votre équipe". Nommer l'entreprise au moins une fois. Personnalisation basée sur le poste, le secteur ou les missions réelles — jamais sur des détails supposés ou une connaissance artificielle de la structure interne.
Disponibilité toujours "à partir d'octobre 2026". Jamais de formulation vague ou isolée.
Si la fiche de poste mentionne une date de démarrage différente (août, septembre, janvier…), le signaler naturellement dans la lettre — une phrase sobre suffit : "Je suis disponible à partir d'octobre 2026, ce qui décalerait légèrement la prise de poste." ou "Ma disponibilité est à partir d'octobre 2026." Ne jamais l'ignorer ni prétendre être disponible plus tôt.
"contribuer" : toujours "contribuer à" + nom ou infinitif. Jamais "contribuer sur" ni sans préposition.
Ton adapté : startup/scale-up = direct, phrases courtes ; grand groupe = plus posé, jamais archaïque. En cas de doute : préférer ton startup.

TON
Naturel, sobre, direct, professionnel. Français courant. Écrire comme Jesse parlerait en entretien — voix vivante, pas lisse.
Ne pas faire sonner chaque phrase comme une validation parfaite du poste. Laisser apparaître une voix personnelle, avec quelques aspérités humaines.
Varier la construction des phrases. Pas deux phrases de même structure consécutives. Max deux "je" consécutifs. Densité globale : éviter que "je" soit le sujet de plus de la moitié des phrases.
Bannir : "Cette expérience de fondateur", "cette expérience d'entrepreneur", "mon expérience de fondateur" — trop génériques et artificiels. Préférer nommer directement le projet ou l'action : "avec 8Beats", "ce projet m'a appris à…", "en construisant ce média…"
Bannir : "résonne avec moi", "ce qui m'anime", "j'aurais l'occasion de", "je suis convaincu que", "au service de", "dans une logique de", "en cohérence avec mon parcours" (si vide), "je me permets", clichés RH.
Éviter les listes de mots sèches ("acquisition, CRM, performance, données, croissance…") sans phrase pour les relier — préférer une formulation narrative.
Éviter les répétitions sur les mêmes thèmes dans deux paragraphes proches : si "croissance", "données" ou "optimisation" apparaît déjà dans un paragraphe, ne pas le réutiliser comme mot clé dans le suivant.
Bannir les formules de consultant : "créer de la valeur", "vision holistique", "approche data-driven", "à 360°", "levier stratégique", "enjeu majeur".
Fin de paragraphe : jamais "ce qui m'intéresse" comme chute — terminer sur une motivation affirmée.

CONNECTEURS INTER-PARAGRAPHES (utiliser avec parcimonie, pas tous)
Pour fluidifier la lecture entre les blocs : "ce qui m'intéresse aussi, c'est que…", "dans la continuité de cela…", "c'est d'ailleurs ce qui m'a amené à…", "au-delà de cela…", "ce que j'apprécie particulièrement, c'est…", "concrètement…", "à titre d'exemple…"
Ne pas en mettre un à chaque paragraphe — choisir 1 ou 2 qui s'insèrent naturellement.

CLÔTURE
Formules autorisées (choisir une seule, la plus adaptée au ton de la lettre) :
"Je serai ravi d'en discuter lors d'un premier échange." / "Je serais heureux d'en discuter avec vous." / "Je serais content d'en parler de vive voix."
Interdit : "Je serais heureux d'en échanger avec vous" — "échanger" sans complément est grammaticalement incorrect. Toujours utiliser "discuter" ou "parler".
Pas de clôture administrative ou froide. Pas de doublon avec la phrase de disponibilité.

Test final : lire à voix haute. Si ça sonne trop écrit, trop symétrique ou extractible d'un modèle générique → réécrire jusqu'à ce que ce soit humain.

JARGON (lettre uniquement — filtre automatique actif)
Ces termes sont interdits dans la lettre, autorisés dans le CV (ATS). Reformuler en français concret :
nurturing, lifecycle, funnel, pipeline, onboarding, KPI, ROI, roadmap, framework, use case, insights, mindset, scalable, touchpoint, growth, "marketing ops".
Autorisés partout : email, campagne, analyse, contenu, segment.
"plateforme d'emailing/CRM" → "outils d'emailing/CRM". "une SaaS" → "une solution SaaS".
Anti-copier-coller : ne jamais reprendre mot pour mot les termes techniques ou verbes de la fiche dans la lettre.

CHRONOLOGIE LETTRE
1. Job Events en premier — "Depuis octobre 2025, chez Job Events, …"
2. 8Beats en second — "Je gère par ailleurs 8Beats Radio, un média que j'ai lancé en 2021…" / "J'ai également lancé 8Beats en 2021…"
Jamais "En parallèle" pour introduire 8Beats (suggère même date de départ).

SOURCE DE VÉRITÉ PAR EXPÉRIENCE
Ne jamais mélanger canaux, outils ou missions entre expériences. En cas de doute : omettre plutôt qu'inventer.
RÈGLE IMMUABLE — OUTILS DANS LES BULLETS : la présence d'un outil dans la section OUTILS (HubSpot, Brevo, Figma, etc.) n'autorise pas son injection dans un bullet d'expérience. Un outil ne peut apparaître dans un bullet que s'il est déjà mentionné dans ce bullet dans le CV de base. Ne jamais déduire qu'un outil a été utilisé pour une mission donnée — si ce n'est pas dans le bullet de base, ne pas l'ajouter.

8Beats : TikTok, Instagram, Figma, Brevo uniquement.
Missions : audience, réseaux sociaux, contenu, UI/UX, site, identité de marque, emailing/newsletters, partenariats.
INTERDIT pour 8Beats : LinkedIn, Lemlist, Odoo. LinkedIn n'est jamais un canal de 8Beats.
INTERDIT ABSOLU pour 8Beats : ne jamais mentionner "agence web", "prestataire", "partenaires externes", "sous-traitant" ou toute collaboration avec une entité externe pour la construction du site ou du média. 8Beats est un projet entièrement construit par Jesse sans prestataire extérieur. Toute mention d'agence ou de partenaire externe est une invention — la supprimer.
RÈGLE IMMUABLE — 2 MILLIONS DE VUES : ce chiffre provient exclusivement de TikTok (stratégie social media). Ne JAMAIS l'attribuer à du SEO, à du trafic site, à un référencement naturel, ou à des "vues" de pages web. ❌ "le SEO m'a permis de générer plus de 2 millions de vues" ❌ "plus de 2 millions de vues grâce au référencement" ✅ "plus de 2 millions de vues sur TikTok". Même règle pour les 4 000 auditeurs mensuels : ce sont des auditeurs de la radio/média, pas des visiteurs SEO.
Mentionner UI/UX si les compétences 8Beats sont présentées et non déjà couvertes.
RÈGLE IMMUABLE — ÉCRITURE : toujours "UI/UX" — jamais "UI" seul ni "UX" seul. Les deux sont indissociables.
RÈGLE IMMUABLE — INCUBATION 8BEATS : si "Hôtel 71" ou "12 mois" est mentionné, la durée French Tech Lyon (1 trimestre) doit toujours apparaître dans la même phrase. Les deux mentions sont indissociables. ❌ "incubé à l'Hôtel 71 (12 mois)" seul → ✅ "incubé à l'Hôtel 71 (12 mois) puis accompagné par la French Tech Lyon (1 trimestre)".

Job Events : Lemlist (prospection), Odoo (newsletters), CRM, emailing, A/B testing, Claude si pertinent.
Missions : CRM, prospection, newsletters, emailing, automatisation, performance, supports commerciaux.
INTERDIT pour Job Events : TikTok, Instagram, Figma (sauf preuve explicite).
INTERDIT ABSOLU — HUBSPOT DANS LES BULLETS JOB EVENTS : ne jamais écrire "HubSpot" dans un bullet de Job Events. HubSpot est dans la section OUTILS mais n'est pas associé à un bullet spécifique. Les outils nommés dans les bullets sont Lemlist (prospection), Odoo (newsletters), Google Analytics (site), IA (automatisation). Remplacer HubSpot par le bon outil ou supprimer la mention.
VÉRIFICATION OBLIGATOIRE : si un bullet de Job Events contient "HubSpot" → le supprimer et utiliser l'outil correct (Lemlist pour prospection, Odoo pour newsletters).

INFORMATIONS MANQUANTES
Recruteur inconnu → "Bonjour,". Interlocuteur connu mais poste inconnu → ne pas lui attribuer de mission.
Date non précisée → "à partir d'octobre 2026". Résultat non confirmé → reformuler sans chiffre.
Durée d'expérience → ne jamais écrire "depuis X ans", "depuis trois ans", "en X années" — jamais de calcul approximatif de durée. Utiliser uniquement l'ancrage par date : "depuis 2021", "depuis octobre 2025".

━━━ EMAIL ━━━

"to" : email détecté dans la fiche, sinon "". Ne jamais inventer.
${isCDI ? 'Objet : "Candidature au poste de [intitulé en minuscules]".' : 'Objet : si la fiche prescrit un format → l\'utiliser exactement. Sinon : "Candidature au poste de [intitulé en minuscules] en alternance".'}
Corps (5 lignes max) :
1. "Bonjour [Prénom]," ou "Bonjour,"
2. Candidature + poste + prise de poste octobre 2026.
3. 1 résultat ou compétence clé, 1 chiffre max.
4. "Vous trouverez en pièce jointe mon CV et ma lettre de motivation."
5. "Bien cordialement,\nJesse Sotomayor"
Jamais de reprise de la lettre. Jamais de mention de plateforme (LinkedIn, etc.).

━━━ MODE DE TRAVAIL ━━━

Avant de générer : analyser les contraintes → identifier les sections concernées → appliquer les règles de contenu ou de forme → vérifier → corriger si nécessaire.
Ne pas modifier le fond si la consigne porte uniquement sur la forme.
Appliquer réellement les corrections demandées — ne pas les commenter sans les appliquer.

━━━ VÉRIFICATION GLOBALE OBLIGATOIRE AVANT RENDU ━━━

Avant de produire le JSON final, passer en revue chaque point ci-dessous. Si un point échoue → corriger avant de rendre.

CV
☐ Ordre antichronologique respecté (expériences ET formation)
☐ Formation : école + diplôme + dates uniquement, bullets:[]
☐ Profil : 3 phrases max, aucune affinité sectorielle inventée, aucun "Fort intérêt pour…"
☐ Aucune "compétence validée/certifiée" sans preuve réelle
☐ Title : format "[intitulé] – alternance à partir d'octobre 2026", séparateur " – ", "Alternance" en majuscule
☐ Outils : TOUS présents (14 items), réordonnés uniquement — aucune suppression
☐ Compétences : TOUS les items présents (19 items), réordonnés uniquement — aucune suppression

LETTRE
☐ paragraphs[1] : parle du poste et de l'entreprise — ne résume pas l'activité de la société, ne commence pas par "je"
☐ paragraphs[2] : Job Events uniquement, faits concrets
☐ paragraphs[3] : 8Beats ou preuve complémentaire — pas de répétition de [2]
☐ paragraphs[4] : disponibilité "à partir d'octobre 2026" présente UNE SEULE FOIS, phrase de clôture courte
☐ Disponibilité absente des paragraphes [1], [2], [3] — même sous forme indirecte ("dès", "à partir de", "en octobre")
☐ Aucun calcul de durée ("depuis trois ans") — uniquement ancrage par date ("depuis 2021")
☐ Aucun "en parallèle" pour introduire 8Beats
☐ Clôture : "discuter" ou "parler" — jamais "en échanger"
☐ Aucune répétition inutile des mêmes idées entre deux paragraphes
☐ Ton naturel — lire la première phrase : ne résume pas l'entreprise, ne commence pas par "je"

EMAIL
☐ Objet : intitulé du poste entièrement en minuscules après "Candidature au poste de"
☐ Corps : 5 lignes max, pas de reprise de la lettre, pas de mention de plateforme

━━━ FORMAT DE SORTIE ━━━

JSON strict, sans markdown, sans backticks. Champ "poste" = intitulé du rôle uniquement, sans "en alternance".
Ne jamais inclure dans "paragraphs" : "Bien cordialement,", signature, objet, date, coordonnées.
Concision JSON : profil 3 phrases max · bullets 1 ligne (2 max) · paragraphes lettre 3-4 phrases (5 max) · keywords/adjustments/missing/atsImprovements 3-6 items, 1 phrase chacun.
ATS : mots-clés pertinents repris, compétences standard, verbes d'action, dates lisibles, terminologie France 2026.

PROFIL DE BASE DE JESSE SOTOMAYOR
${JSON.stringify(JESSE_BASE)}`;

      const userPrompt = `Fiche de poste :
${jobText}

${modifications ? `Modifications demandées par le candidat (priorité absolue) :\n${modifications}\n\n` : ''}Retourne UNIQUEMENT un objet JSON valide (sans markdown, sans backticks) :
{"cv":{"title":"${isCDI ? '[intitulé EXACT du poste dans la fiche]' : '[intitulé EXACT du poste dans la fiche] · Alternance à partir d\'octobre 2026 · 4j entreprise / 1j école'}","profil":"...","experiences":[{"company":"...","title":"...","dates":"...","bullets":["..."]}],"formation":[{"school":"...","degree":"...","dates":"...","bullets":[]}],"competences":"...","outils":"..."},"lettre":{"company":"[nom de l'entreprise uniquement, sans article ni préposition, sans accents, prêt pour un nom de fichier — ex: Pachamama, JobEvents, ManoMano]","poste":"[intitulé du rôle uniquement, sans le mot Alternance et sans tirets séparateurs — ex: Marketing & Growth, Chargé de marketing digital]","paragraphs":["...","...","...","..."]},"email":{"to":"[adresse email détectée dans la fiche, ou vide]","objet":"${isCDI ? 'Candidature au poste de [intitulé]' : 'Candidature au poste de [intitulé] en alternance'}","corps":"${isCDI ? 'Bonjour [Prénom],\\n\\nJ\'ai découvert votre offre pour le poste de [intitulé] et je vous adresse ma candidature pour une disponibilité à partir d\'octobre 2026.\\n\\n[1 phrase : compétence clé ou résultat concret, 1 chiffre max]\\n\\nVous trouverez en pièce jointe mon CV et ma lettre de motivation.\\n\\nBien cordialement,\\nJesse Sotomayor' : 'Bonjour [Prénom],\\n\\nJ\'ai découvert votre offre pour le poste de [intitulé] en alternance et je vous adresse ma candidature pour une prise de poste en octobre 2026.\\n\\n[1 phrase : compétence clé ou résultat concret, 1 chiffre max]\\n\\nVous trouverez en pièce jointe mon CV et ma lettre de motivation.\\n\\nBien cordialement,\\nJesse Sotomayor'}"},"keywords":["..."],"adjustments":["..."],"missing":["..."],"atsScore":0,"atsImprovements":["..."]}`;

      // Fake ticker while Claude thinks
      let fakeP = 15;
      const ticker = setInterval(async () => {
        fakeP = Math.min(fakeP + 3, 72);
        await send({ progress: fakeP, step: 'Rédaction du CV et de la lettre de motivation…' });
      }, 1200);

      const message = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 6000,
        system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userPrompt }],
      });

      clearInterval(ticker);
      await send({ progress: 78, step: 'Génération des PDFs…' });

      const raw = message.content[0].type === 'text' ? message.content[0].text : '';
      let parsed: {
        cv: Partial<typeof JESSE_BASE>;
        lettre: { company: string; poste: string; paragraphs: string[] };
        email: { to: string; objet: string; corps: string };
        keywords: string[]; adjustments: string[]; missing: string[];
        atsScore: number; atsImprovements: string[];
      };
      // Repair common LLM JSON issues before parsing:
      // literal newlines/tabs inside string values instead of \n / \t
      function repairJSON(s: string): string {
        // Strip markdown code fences if present
        s = s.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
        // Extract the outermost JSON object
        const m = s.match(/\{[\s\S]*\}/);
        if (m) s = m[0];
        // Walk character by character, escaping bare control chars inside strings
        let out = ''; let inStr = false; let esc = false;
        for (const c of s) {
          if (esc)          { out += c; esc = false; continue; }
          if (c === '\\')   { out += c; esc = true;  continue; }
          if (c === '"')    { out += c; inStr = !inStr; continue; }
          if (inStr) {
            if      (c === '\n') { out += '\\n'; continue; }
            else if (c === '\r') { out += '\\r'; continue; }
            else if (c === '\t') { out += '\\t'; continue; }
          }
          out += c;
        }
        return out;
      }

      try { parsed = JSON.parse(repairJSON(raw)); }
      catch {
        await send({ error: 'Réponse invalide de Claude — réessaie' }); return;
      }

      // Step 3 – PDFs
      const noEm = (s: string) =>
        s.replace(/\s*—\s*/g, ' · ')             // em-dash → point médian
         .replace(/\s+–\s+/g, ' · ')             // en-dash connecteur → point médian
         .replace(/\bUX\/UI\b/g, 'UI/UX')        // ordre correct
         .replace(/\bbases?\s+de\s+données\b/gi, 'fichier de contacts')
         .replace(/\bdata[- ]driven\b/gi, 'orienté données')
         .replace(/\bCofondateur\b/g, 'Co-fondateur')
         .replace(/\bcofondateur\b/g, 'co-fondateur');

      // Filtre mécanique sur les bullets CV
      const sanitizeBullet = (s: string, company: string): string => {
        // UI/UX toujours dans le bon ordre
        s = s.replace(/\bUX\/UI\b/g, 'UI/UX');
        // "bases de données" → "fichier de contacts"
        s = s.replace(/\bbases?\s+de\s+données\b/gi, 'fichier de contacts');
        // "data-driven" → interdit dans le profil aussi
        s = s.replace(/\bdata[- ]driven\b/gi, 'orienté données');
        // "Cofondateur" → "Co-fondateur"
        s = s.replace(/\bCofondateur\b/g, 'Co-fondateur');
        s = s.replace(/\bcofondateur\b/g, 'co-fondateur');
        if (company === 'Job Events') {
          // HubSpot n'est jamais dans les bullets Job Events — supprimer
          s = s.replace(/\s+HubSpot\s*,/g, ',');
          s = s.replace(/,\s*HubSpot\b/g, '');
          s = s.replace(/\bHubSpot\s+/g, '');
          s = s.replace(/\bHubSpot\b/g, '');
        }
        if (company === '8Beats Radio') {
          // Instagram ne peut pas apparaître dans les bullets TikTok/social media
          // (Instagram est dans les outils mais pas dans les bullets de base)
          s = s.replace(/\bTikTok\s+et\s+Instagram\b/g, 'TikTok');
          s = s.replace(/\bInstagram\s+et\s+TikTok\b/g, 'TikTok');
        }
        s = s.replace(/\s{2,}/g, ' ').trim();
        return s;
      };

      // Guard: if Claude returned fewer items than the base (truncation), use base instead
      const protectList = (returned: string | undefined, base: string): string => {
        if (!returned?.trim()) return base;
        const retCount = (returned.match(/·/g) ?? []).length;
        const baseCount = (base.match(/·/g) ?? []).length;
        return retCount >= baseCount ? noEm(returned) : base;
      };

      const rawCV = { ...JESSE_BASE, ...parsed.cv } as typeof JESSE_BASE;
      const cvData: typeof JESSE_BASE = {
        ...rawCV,
        // Strip "en alternance" and epicene markers from the intitulé part (before the first ·)
        title: noEm(rawCV.title ?? JESSE_BASE.title)
          .replace(/^(.*?)\s+en\s+alternance(\s*·)/i, '$1$2')
          .replace(/[.··](e|es|ée|ées|trice|rice|euse|eure)\b/gi, ''),
        profil: noEm(rawCV.profil ?? JESSE_BASE.profil),
        experiences: (rawCV.experiences ?? JESSE_BASE.experiences).map((e) => ({
          ...e,
          bullets: (e.bullets ?? []).map(b => sanitizeBullet(noEm(b), e.company)),
        })),
        formation: (rawCV.formation ?? JESSE_BASE.formation)
          // CDI : supprimer ESD — formation non débutée, incompatible CDI
          // Filtre sur le nom de l'école (robuste même si Claude reformate les dates)
          .filter((f) => !isCDI || !/supérieure du digital|ESD/i.test(f.school ?? ''))
          .map((f) => ({
            ...f,
            bullets: [] as string[],
          })),
        // protectList: si Claude tronque compétences ou outils → on garde la base complète
        competences: protectList(rawCV.competences, JESSE_BASE.competences),
        outils:      protectList(rawCV.outils,      JESSE_BASE.outils),
      };

      // Sanitize letter + email body: remove any English jargon Claude may have missed
      let letterParagraphs = sanitizeLetter(parsed.lettre?.paragraphs ?? []);
      if (isCDI) {
        // CDI: strip any alternance/école mentions that Claude may have added
        letterParagraphs = letterParagraphs.map(p =>
          p.replace(/\ben\s+alternance\b/gi, '')
           .replace(/\bun\s+poste\s+en\s+alternance\b/gi, 'un poste')
           .replace(/\bprise\s+de\s+poste\s+en\s+alternance\b/gi, 'prise de poste')
           .replace(/\b4j\s+entreprise\s*\/\s*1j\s+école\b/gi, '')
           .replace(/\b4\s+jours\s+en\s+entreprise\b/gi, '')
           .replace(/\s{2,}/g, ' ').trim()
        );
      }

      // Enforce a single, fixed closing sentence in paragraphs[4].
      // Claude always generates two sentences (availability + closing) despite instructions.
      // Strip any sentence that looks like an availability mention or a closing formula,
      // then append one canonical sentence that combines both.
      if (letterParagraphs.length >= 5) {
        const CLOSING = "Je suis disponible à partir d'octobre 2026 et serais heureux d'en parler de vive voix avec vous prochainement.";
        const isClosingSentence = (s: string) =>
          /disponible\s+à\s+partir|je\s+ser[aio]+s?\s+(ravi|heureux|content|disponible)|d[''']en\s+dis[ck]uter|premier\s+échange|de\s+vive\s+voix|à\s+partir\s+d[''']octobre|prise\s+de\s+poste/i.test(s);
        // Split roughly on sentence boundaries, filter closing sentences, re-append the fixed one
        const sentences = letterParagraphs[4]
          .split(/(?<=[.!?])\s+/)
          .filter(s => s.trim());
        const body = sentences.filter(s => !isClosingSentence(s));
        letterParagraphs[4] = [...body, CLOSING].join(' ').replace(/\s{2,}/g, ' ').trim();
      }

      const lettreData = {
        ...parsed.lettre,
        paragraphs: letterParagraphs,
      };

      // Normalize email subject: extract title, strip any "alternance" from it,
      // recompute de/d' elision, then rebuild — always ends with " en alternance" for non-CDI.
      const lowerObjet = (s: string) => {
        const stripAlt = (t: string) =>
          t.replace(/^alternance\s*[–\-:]\s*/i, '')
           .replace(/\s*[–\-]\s*alternance\s*$/i, '')
           .replace(/^alternance\s+/i, '')
           .replace(/\s+en\s+alternance\s*$/i, '')
           .replace(/\s*[\[(]?\s*[hf]\/[fh]\s*[\])]?\s*/gi, '')
           .replace(/\(e?é?e?s?\)/gi, '')
           .replace(/\((trice|rice|euse)\)/gi, '')
           .replace(/\/é?e?s?\b/gi, '')
           .replace(/[.··](e|es|ée|ées|trice|rice|euse|eure)\b/gi, '')
           .replace(/\s+/g, ' ')
           .trim()
           .toLowerCase();
        const prep = (t: string) => /^[aeiouéèêëàâîïôùûüh]/i.test(t) ? "d'" : 'de ';
        return s.replace(
          /Candidature au poste (?:de |d['''])?(.+?)(\s+en\s+alternance\b.*)?$/ui,
          (_, rawTitle) => {
            const title = stripAlt(rawTitle);
            return isCDI
              ? `Candidature au poste ${prep(title)}${title}`
              : `Candidature au poste ${prep(title)}${title} en alternance`;
          }
        );
      };

      const emailData = parsed.email
        ? { ...parsed.email,
            to: parsed.email.to ?? '',
            objet: lowerObjet(parsed.email.objet),
            corps: sanitizeLetter([noEm(parsed.email.corps)])[0] }
        : { to: '', objet: '', corps: '' };

      const [cvBuf, lettreBuf] = await Promise.all([buildCVPdf(cvData), buildLetterPdf(lettreData, isCDI)]);
      await send({ progress: 95, step: 'Finalisation…' });

      await send({
        progress: 100,
        done: true,
        cv: cvBuf.toString('base64'),
        lettre: lettreBuf.toString('base64'),
        company: parsed.lettre.company ?? '',
        email: emailData,
        keywords: parsed.keywords ?? [],
        adjustments: parsed.adjustments ?? [],
        missing: parsed.missing ?? [],
        atsScore: parsed.atsScore ?? 0,
        atsImprovements: parsed.atsImprovements ?? [],
      });

    } catch (e: unknown) {
      console.error('generate route failed:', e);
      await send({ error: 'Une erreur est survenue pendant la génération. Réessaie dans un instant.' });
    } finally {
      close();
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
