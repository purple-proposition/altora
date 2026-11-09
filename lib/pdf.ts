import PDFDocument from 'pdfkit';
import type { UserProfile } from '@/lib/profile';

// Type du CV utilisé par le rendu : profil complet plus l'intitulé du poste.
export type CVProfile = UserProfile & { title: string };

export function contractSuffix(p: UserProfile): string {
  return p.soughtContract === 'alternance' ? ' en alternance'
    : p.soughtContract === 'stage' ? ' en stage'
    : p.soughtContract === 'cdi' ? ' en CDI'
    : p.soughtContract === 'cdd' ? ' en CDD'
    : '';
}

// ── PDF helpers ──────────────────────────────────────────────────────────────

export function generatePDF(doc_fn: (doc: InstanceType<typeof PDFDocument>) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
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
export function renderCVContent(doc: InstanceType<typeof PDFDocument>, cv: CVProfile, shrink = 1.0): void {
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
  // Champs vides écartés avant le join : LinkedIn et portfolio sont facultatifs,
  // et les concaténer tels quels laissait des séparateurs orphelins bien
  // visibles ("06 12 34 56 78 · nom@mail.com ·  ·  · Lyon"). Filtrer ici plutôt
  // qu'après coup garde aussi les liens cliquables alignés sur le texte réel,
  // puisque les deux parcourent désormais la même liste.
  const sep = '  ·  ';
  const contactParts: { text: string; url?: string }[] = [
    { text: cv.phone, url: `tel:${cv.phone.replace(/\s/g, '')}` },
    { text: cv.email, url: `mailto:${cv.email}` },
    { text: cv.linkedin, url: `https://${cv.linkedin}` },
    { text: cv.portfolio, url: `https://${cv.portfolio}` },
    { text: cv.city },
  ].filter(p => p.text?.trim());
  ln(contactParts.map(p => p.text).join(sep), M, y);
  // Liens cliquables sur chaque élément (doc.link() — l'option link de doc.text() est cassée dans PDFKit 0.15.2)
  let lx = M;
  for (const part of contactParts) {
    const w = doc.widthOfString(part.text);
    if (part.url) doc.link(lx, y, w, 9, part.url);
    lx += w + doc.widthOfString(sep);
  }
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

  // ── Centres d'intérêt ───────────────────────────────────────────
  // Rubrique facultative : rendue seulement si elle est renseignée, pour ne
  // pas consommer de la hauteur (le CV tient sur une page stricte) avec un
  // en-tête suivi de rien.
  if (cv.interests?.trim()) {
    y = doc.y + S.afterInline;
    section("CENTRES D'INTÉRÊT", 42);
    doc.font('Helvetica').fontSize(9).fillColor(C.noir);
    ln(cv.interests, M, y);
  }
}

// Strict 1-page enforcement: try shrink=1.0 → 0.91 → 0.83.
// Overflow is detected by intercepting doc.addPage().
export async function buildCVPdf(cv: CVProfile): Promise<Buffer> {
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

// Accords masculin/féminin des mots que le/la candidat·e emploie sur soi.
// Volontairement limité aux adjectifs et participes réellement employés en
// lettre de motivation : la liste sert de dictionnaire, ce sont les contextes
// ci-dessous qui décident d'appliquer ou non, jamais un remplacement global.
// Sans ancrage, "un sérieux atout" deviendrait "un sérieuse atout".
export async function buildLetterPdf(profile: UserProfile, data: { company: string; poste: string; paragraphs: string[] }): Promise<Buffer> {
  // Le point médian est le séparateur des CHAMPS STRUCTURÉS du CV, pas une
  // ponctuation de prose : le prompt l'interdit d'ailleurs explicitement dans
  // le corps de la lettre (voir "RÈGLE IMMUABLE — PONCTUATION LETTRE"). Le
  // convertir ici produisait exactement ce que cette règle cherche à éviter,
  // du type "j'ai travaillé concrètement · la gestion des réseaux sociaux".
  // La virgule est l'équivalent correct d'un tiret d'incise en prose.
  const clean = (s: string) =>
    s.replace(/\s*—\s*/g, ', ')       // tiret d'incise → virgule
     .replace(/\s+–\s+/g, ', ')       // demi-cadratin connecteur → virgule
     .replace(/,\s*([,.;:])/g, '$1'); // évite ", ," ou ", ." si le tiret jouxtait déjà une ponctuation
  return generatePDF((doc) => {
    const M = 56.69; const W = 595.28 - M * 2; let y = M;
    const ln = (str: string, x: number, yPos: number, opts: object = {}) =>
      doc.text(str, x, yPos, { lineBreak: false, ...opts });

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#000'); ln(profile.name, M, y); y += 14;
    doc.font('Helvetica').fontSize(10).fillColor('#333');
    ln(profile.email, M, y); y += 13;
    ln(profile.phone, M, y); y += 30;

    const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.font('Helvetica').fontSize(10).fillColor('#333');
    ln(`${profile.city}, le ${dateStr}`, M, y - 57, { align: 'right', width: W });

    y += 10;

    // Clean poste: strip "Alternance", H/F markers, and resolve epicene suffixes
    // to a single grammatical gender (masculine by default, feminine if the
    // candidate's profile says so).
    let posteClean = data.poste
      .replace(/^alternance\s*[–\-:]\s*/i, '')        // "Alternance – Marketing" → "Marketing"
      .replace(/\s*[–\-]\s*alternance\s*$/i, '')      // "Marketing – Alternance" → "Marketing"
      .replace(/^alternance\s+/i, '')                 // "Alternance Marketing" (sans tiret) → "Marketing"
      .replace(/\s+en\s+alternance\s*$/i, '')         // "Marketing en alternance" → "Marketing"
      .replace(/\s*[\[(]?\s*[hf]\/[fh]\s*[\])]?\s*/gi, ''); // H/F, F/H, (H/F)
    posteClean = profile.civility === 'Mme'
      ? posteClean
          .replace(/\((e)\)/gi, 'e')                              // (e) → e
          .replace(/\((trice|rice|euse)\)/gi, '$1')                // (trice) → trice
          .replace(/\/é?e\b/gi, 'e')                              // /e, /ée → e
          .replace(/[.··]e\b/gi, 'e')                             // Chargé.e → Chargée
          .replace(/eur\b(?=\s|$)/gi, 'rice')                     // Coordinateur → Coordinatrice (heuristique)
      : posteClean
          .replace(/\(e?é?e?s?\)/gi, '')                          // (e), (ée), (es) → masculin
          .replace(/\((trice|rice|euse)\)/gi, '')                  // (trice), (rice), (euse) → masculin
          .replace(/\/é?e?s?\b/gi, '')                            // /e, /ée, /es → masculin
          .replace(/[.··](e|es|ée|ées|trice|rice|euse|eure)\b/gi, ''); // Apprenti.e / Chargé·e → masculin
    posteClean = posteClean.replace(/\s+/g, ' ').trim();
    // Lowercase initial capital of job title: "Chargé…" → "chargé…"
    const posteLower = posteClean.charAt(0).toLowerCase() + posteClean.slice(1);
    // French elision: "de" → "d'" before a vowel or h
    const dePoste = /^[aeiouéèêëàâîïôùûüh]/i.test(posteLower) ? `d'${posteLower}` : `de ${posteLower}`;
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#000');
    doc.text(`Objet : Candidature au poste ${dePoste}${contractSuffix(profile)}`, M, y, { width: W, lineBreak: true });
    y = doc.y + 24;

    doc.font('Helvetica').fontSize(10).fillColor('#000');

    // Safety filter: strip elements injected elsewhere by the builder.
    // "Bonjour [Madame/Monsieur] [Nom]," is now Claude's first paragraph — allowed.
    // "Bien cordialement," is hardcoded below — strip if Claude duplicates it.
    const nameLower = profile.name.trim().toLowerCase();
    const emailLower = profile.email.trim().toLowerCase();
    const cityLower = profile.city.trim().toLowerCase();
    const paras = data.paragraphs.filter((p) => {
      const t = p.trim().toLowerCase();
      return (
        !/^madame[,\s]/.test(t) &&             // ancienne formule d'appel seule
        !/^veuillez agr/.test(t) &&             // ancienne formule de politesse
        !/^je vous (prie|adresse)/.test(t) &&   // variante formule de politesse
        !/^(bien\s+)?cordialement/.test(t) &&   // "Cordialement" / "Bien cordialement,"
        !/^au plaisir/.test(t) &&               // "Au plaisir d'échanger,"
        (!nameLower || !t.startsWith(nameLower)) &&  // signature (injectée séparément)
        !/^objet\s*:/.test(t) &&                // ligne Objet (injectée séparément)
        (!cityLower || !new RegExp(`^${cityLower},?\\s+le\\s`).test(t)) && // date (injectée séparément)
        (!emailLower || !t.startsWith(emailLower)) && // email (injecté séparément)
        !/^\+?\d[\d\s.]{6,}/.test(t)            // téléphone (injecté séparément)
      );
    });

    // Salutation line (paragraphs[0] = "Bonjour Madame [Nom]," or "Bonjour,")
    // gets the same block rendering but with tighter spacing after.
    for (let i = 0; i < paras.length; i++) {
      doc.text(clean(paras[i]), M, y, { width: W, lineBreak: true, align: 'justify' as 'justify', lineGap: 1.5 });
      y = doc.y + (i === 0 ? 14 : 16); // tighter gap after salutation
    }

    // Closing formula — hardcoded, never comes from Claude
    y += 4;
    doc.font('Helvetica').fontSize(10).fillColor('#000');
    doc.text('Bien cordialement,', M, y, { lineBreak: false });
    y = doc.y + 22;
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#000');
    ln(profile.name, M, y);
  });
}

