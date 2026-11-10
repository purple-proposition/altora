import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { UserProfile } from '@/lib/profile';

// Rendu en pdf-lib : les polices standard sont intégrées à la bibliothèque,
// sans lecture de fichiers sur le disque. pdfkit lisait ses fichiers .afm avec
// fs, ce qui fonctionnait sur Vercel mais plantait sur Cloudflare Workers.

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
const BLACK = rgb(0, 0, 0);

// Interligne « 1,15 » : Helvetica a un interligne simple d'environ 1,156 em.
const lineGapFor = (size: number) => size * 0.17;

type FontName = 'Helvetica' | 'Helvetica-Bold';
type Doc = { page: PDFPage; fonts: Record<FontName, PDFFont> };

// Les polices standard n'encodent que le jeu WinAnsi (latin, accents français,
// point médian, puce). Tout autre caractère est remplacé plutôt que de faire
// échouer le rendu.
function clean(text: string, font: PDFFont): string {
  const map: Record<string, string> = { '\u2192': '->', '\u2190': '<-', '\u2009': ' ', '\u202f': ' ', '\u00a0': ' ', '\u2011': '-' };
  let out = '';
  for (const ch of (text ?? '').replace(/\r?\n/g, ' ')) {
    const c = map[ch] ?? ch;
    try { font.encodeText(c); out += c; } catch { /* caractère non encodable ignoré */ }
  }
  return out;
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const test = cur ? `${cur} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= width || !cur) cur = test;
    else { lines.push(cur); cur = word; }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

export async function generatePDF(doc_fn: (doc: Doc) => void): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const fonts = {
    'Helvetica': await pdf.embedFont(StandardFonts.Helvetica),
    'Helvetica-Bold': await pdf.embedFont(StandardFonts.HelveticaBold),
  };
  const page = pdf.addPage([PAGE_W, PAGE_H]);
  doc_fn({ page, fonts });
  return Buffer.from(await pdf.save());
}

// Écrivain qui suit la hauteur utilisée. Ne crée jamais de page : si le contenu
// dépasse, `overflow` passe à true et le rendu est refait plus petit.
// y est compté depuis le haut, comme dans pdfkit ; pdf-lib compte depuis le bas.
function writer(doc: Doc, scale: number) {
  const bottom = PAGE_H - MB;
  const state = { y: MT, overflow: false };
  const S = (n: number) => n * scale;

  const place = (h: number) => {
    if (state.y + h > bottom) state.overflow = true;
  };
  const draw = (text: string, x: number, size: number, font: PDFFont) => {
    // Ligne de base : le haut de la ligne plus l'ascendante de la police.
    const base = PAGE_H - state.y - font.heightAtSize(size, { descender: false });
    doc.page.drawText(text, { x, y: base, size, font, color: BLACK });
  };

  // Ligne unique ; `right` place un texte aligné à la tabulation droite.
  function line(text: string, opts: { font: FontName; size: number; before?: number; after?: number; right?: string }) {
    const size = S(opts.size);
    const font = doc.fonts[opts.font];
    state.y += S(opts.before ?? 0);
    place(size * 1.2);
    draw(clean(text, font), ML, size, font);
    if (opts.right) {
      const r = clean(opts.right, font);
      draw(r, ML + TAB - font.widthOfTextAtSize(r, size), size, font);
    }
    state.y += size * 1.156 + S(opts.after ?? 0);
  }

  // Paragraphe avec retour à la ligne.
  function para(text: string, opts: { font: FontName; size: number; after?: number; indent?: number; bullet?: boolean }) {
    const size = S(opts.size);
    const font = doc.fonts[opts.font];
    const indent = opts.bullet ? BULLET_INDENT * scale : (opts.indent ?? 0) * scale;
    const x = ML + indent;
    const width = CW - indent;
    const lines = wrap(clean(text, font), font, size, width);
    const lh = size * 1.156 + lineGapFor(size);
    const h = lines.length * lh - lineGapFor(size);
    place(h);
    if (opts.bullet) draw('\u2022', ML, size, doc.fonts['Helvetica']);
    const y0 = state.y;
    lines.forEach((l, i) => { state.y = y0 + i * lh; draw(l, x, size, font); });
    state.y = y0 + h + S(opts.after ?? 0);
  }

  return { state, line, para, S };
}

// ── CV ─────────────────────────────────────────────────────────────────────

function renderCv(doc: Doc, cv: CVProfile, scale: number): boolean {
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

function renderLetter(doc: Doc, profile: UserProfile, data: { company: string; poste: string; paragraphs: string[] }, scale: number): boolean {
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
