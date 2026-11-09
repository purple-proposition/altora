import PDFDocument from 'pdfkit';
import type { UserProfile } from '@/lib/profile';

// Type du CV utilisé par le rendu : profil complet plus l'intitulé du poste.
export type CVProfile = UserProfile & { title: string };

// ── Mise en page commune : CV et lettre suivent le modèle « CV anonymisé.docx » ──
// Format A4 (210 × 297 mm), marges haut/bas 50 pt, gauche/droite 60 pt,
// police Arial (équivalent Helvetica, mêmes métriques), noir sur blanc.
// Tailles en points : nom 22 gras, titres de section 10 gras, texte 10,
// coordonnées 9. Espacements repris du modèle (en pt).
export const PAGE_W = 595.28;
export const PAGE_H = 841.89;
const ML = 60;
const MT = 50;
const MB = 50;
const CW = PAGE_W - ML * 2; // 492 pt
const TAB = 470;            // position de la tabulation droite (dates)
const BULLET_INDENT = 18;   // retrait des puces (360 twips)
const BLACK = '#000000';

// Interligne « 1,15 » : Helvetica a un interligne simple d'environ 1,156 em.
const lineGapFor = (size: number) => size * 0.17;

export function generatePDF(doc_fn: (doc: InstanceType<typeof PDFDocument>) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    try {
      doc_fn(doc);
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

// Écrivain qui suit la hauteur utilisée. Ne crée jamais de page : si le contenu
// dépasse, `overflow` passe à true et le rendu est refait plus petit.
function writer(doc: InstanceType<typeof PDFDocument>, scale: number) {
  const bottom = PAGE_H - MB;
  const state = { y: MT, overflow: false };
  const S = (n: number) => n * scale;

  const place = (h: number) => {
    if (state.y + h > bottom) state.overflow = true;
  };

  // Ligne unique ; `right` place un texte aligné à la tabulation droite.
  function line(text: string, opts: { font: string; size: number; before?: number; after?: number; right?: string }) {
    const size = S(opts.size);
    state.y += S(opts.before ?? 0);
    place(size * 1.2);
    doc.font(opts.font).fontSize(size).fillColor(BLACK);
    doc.text(text, ML, state.y, { lineBreak: false, width: CW });
    if (opts.right) {
      doc.text(opts.right, ML, state.y, { lineBreak: false, width: TAB, align: 'right' });
    }
    state.y += size * 1.156 + S(opts.after ?? 0);
  }

  // Paragraphe avec retour à la ligne.
  function para(text: string, opts: { font: string; size: number; after?: number; indent?: number; bullet?: boolean }) {
    const size = S(opts.size);
    const indent = opts.bullet ? BULLET_INDENT * scale : (opts.indent ?? 0) * scale;
    const x = ML + indent;
    const width = CW - indent;
    doc.font(opts.font).fontSize(size).fillColor(BLACK);
    const h = doc.heightOfString(text, { width, lineGap: lineGapFor(size) });
    place(h);
    if (opts.bullet) {
      doc.font('Helvetica').text('•', ML, state.y, { lineBreak: false });
    }
    doc.text(text, x, state.y, { width, lineGap: lineGapFor(size), lineBreak: true });
    state.y += h + S(opts.after ?? 0);
  }

  return { state, line, para, S };
}

// ── CV ─────────────────────────────────────────────────────────────────────

function renderCv(doc: InstanceType<typeof PDFDocument>, cv: CVProfile, scale: number): boolean {
  const w = writer(doc, scale);

  // En-tête : nom, intitulé, coordonnées (mêmes tailles et espacements que le modèle).
  w.line(cv.name, { font: 'Helvetica-Bold', size: 22, after: 2 });
  w.line(cv.title, { font: 'Helvetica-Bold', size: 10, after: 6 });
  const contact = [cv.phone, cv.email, cv.linkedin, cv.portfolio, cv.city].filter(Boolean).join(' · ');
  w.line(contact, { font: 'Helvetica', size: 9, after: 10 });
  if (cv.profil) w.para(cv.profil, { font: 'Helvetica', size: 10, after: 4 });

  const section = (title: string) => w.line(title.toUpperCase(), { font: 'Helvetica-Bold', size: 10, before: 14, after: 6 });

  if (cv.experiences.length) {
    section('Expériences');
    for (const exp of cv.experiences) {
      w.line(exp.title, { font: 'Helvetica-Bold', size: 10, before: 6, right: exp.dates });
      w.line(exp.company, { font: 'Helvetica', size: 10, after: 2 });
      for (const b of exp.bullets) {
        if (b.trim()) w.para(b, { font: 'Helvetica', size: 10, after: 2, bullet: true });
      }
    }
  }

  if (cv.formation.length) {
    section('Formation');
    for (const f of cv.formation) {
      w.line(f.degree, { font: 'Helvetica-Bold', size: 10, before: 6, right: f.dates });
      w.line(f.school, { font: 'Helvetica', size: 10, after: 4 });
    }
  }

  if (cv.competences) {
    section('Compétences');
    w.para(cv.competences, { font: 'Helvetica', size: 10, after: 4 });
  }
  if (cv.outils) {
    section('Outils');
    w.para(cv.outils, { font: 'Helvetica', size: 10, after: 4 });
  }
  if (cv.langues) {
    section('Langues');
    w.para(cv.langues, { font: 'Helvetica', size: 10, after: 4 });
  }

  return w.state.overflow;
}

// Une seule page : on réduit les tailles par paliers si le contenu déborde.
export async function buildCVPdf(cv: CVProfile): Promise<Buffer> {
  for (const scale of [1.0, 0.92, 0.85]) {
    let overflow = false;
    const buf = await generatePDF((doc) => { overflow = renderCv(doc, cv, scale); });
    if (!overflow) return buf;
  }
  return generatePDF((doc) => { renderCv(doc, cv, 0.85); });
}

// ── Lettre ─────────────────────────────────────────────────────────────────

export function contractSuffix(p: UserProfile): string {
  return p.soughtContract === 'alternance' ? ' en alternance'
    : p.soughtContract === 'stage' ? ' en stage'
    : p.soughtContract === 'cdi' ? ' en CDI'
    : p.soughtContract === 'cdd' ? ' en CDD'
    : '';
}

function renderLetter(doc: InstanceType<typeof PDFDocument>, profile: UserProfile, data: { company: string; poste: string; paragraphs: string[] }, scale: number): boolean {
  const w = writer(doc, scale);
  const poste = data.poste.trim();
  const dePoste = /^[aeiouyéèêëàâîïôùûüh]/i.test(poste) ? "d'" : 'de ';

  // En-tête identique au CV : nom, coordonnées.
  w.line(profile.name, { font: 'Helvetica-Bold', size: 22, after: 2 });
  const contact = [profile.phone, profile.email, profile.linkedin, profile.portfolio, profile.city].filter(Boolean).join(' · ');
  w.line(contact, { font: 'Helvetica', size: 9, after: 20 });

  // Objet, en gras comme le titre du CV.
  w.line(`Objet : Candidature au poste ${dePoste}${poste}${contractSuffix(profile)}`, { font: 'Helvetica-Bold', size: 10, after: 10 });

  for (const p of data.paragraphs) {
    if (p.trim()) w.para(p, { font: 'Helvetica', size: 10, after: 10 });
  }
  w.line('Bien cordialement,', { font: 'Helvetica', size: 10, after: 2 });
  w.line(profile.name, { font: 'Helvetica-Bold', size: 10 });

  return w.state.overflow;
}

export async function buildLetterPdf(profile: UserProfile, data: { company: string; poste: string; paragraphs: string[] }): Promise<Buffer> {
  for (const scale of [1.0, 0.92, 0.85]) {
    let overflow = false;
    const buf = await generatePDF((doc) => { overflow = renderLetter(doc, profile, data, scale); });
    if (!overflow) return buf;
  }
  return generatePDF((doc) => { renderLetter(doc, profile, data, 0.85); });
}
