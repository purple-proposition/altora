import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { UserProfile } from '@/lib/profile';
import { CV_TEXT_SCALE } from '@/components/cv/cv-doc';

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
// Marges de 15 mm, comme le CV de référence (une page A4 pleine).
const ML = 42.52;
const MT = 42.52;
const MB = 42.52;
const MR = 42.52;
const CW = PAGE_W - ML * 2;
const TAB = CW;             // dates alignées sur la marge de droite
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

// ── CV : mise en page reproduite à l'identique du CV de référence ───────────
// Mesures relevées sur « CV - Jesse Sotomayor - GL Events.pdf » :
// Helvetica / Helvetica-Bold, corps 9 pt, nom 18 pt, marges 15 mm, interligne
// 12,4 pt, écarts entre blocs : 17 (titre → contenu), 14 (titre → entreprise),
// 16,4 (entre puces), 27,4 (entre expériences), 38,4 (entre sections).
const CV_NAME = 18;
const CV_BODY = 9;
const CV_LEAD = 12.4;
const CV_TRACK = 0.6;          // interlettrage des titres de section
const CV_DASH_INDENT = 10;     // les puces sont des tirets « – » en début de paragraphe
const CV_TOP = MT + 0.718 * CV_NAME; // ligne de base du nom
const CV_RIGHT = PAGE_W - MR;

function renderCv(doc: Doc, cv: CVProfile, _scale: number): { overflow: boolean; fill: number } {
  const bottom = PAGE_H - MB;
  let y = CV_TOP;             // ligne de base courante, comptée depuis le haut
  let overflow = false;
  const fonts = doc.fonts;

  // Interlettrage : chaque caractère est posé à la main (pdf-lib n'a pas d'option dédiée).
  const put = (text: string, x: number, base: number, font: PDFFont, size: number, track = 0) => {
    const t = clean(text, font);
    if (!track) {
      doc.page.drawText(t, { x, y: PAGE_H - base, size, font, color: BLACK });
      return font.widthOfTextAtSize(t, size);
    }
    let cx = x;
    for (const ch of t) {
      doc.page.drawText(ch, { x: cx, y: PAGE_H - base, size, font, color: BLACK });
      cx += font.widthOfTextAtSize(ch, size) + track;
    }
    return cx - x;
  };
  const check = () => { if (y > bottom) overflow = true; };

  // Une ligne alignée à droite (dates) sur la ligne de base courante.
  const right = (text: string, font: PDFFont, size: number) => {
    const t = clean(text, font);
    const w = font.widthOfTextAtSize(t, size);
    put(t, CV_RIGHT - w, y, font, size);
  };

  // Paragraphe enroulé. Retourne la ligne de base de la dernière ligne.
  const paragraph = (text: string, font: PDFFont, x: number, width: number) => {
    const lines = wrap(clean(text, fonts['Helvetica']), fonts['Helvetica'], CV_BODY, width);
    lines.forEach((l, i) => {
      if (i > 0) y += CV_LEAD;
      check();
      put(l, x, y, font, CV_BODY);
    });
    return y;
  };

  // Nom, intitulé, coordonnées, profil.
  put(cv.name, ML, y, fonts['Helvetica-Bold'], CV_NAME);
  y += 17.54;
  put(cv.title, ML, y, fonts['Helvetica-Bold'], CV_BODY);
  y += 17.0;
  const contact = [cv.phone, cv.email, cv.linkedin, cv.portfolio, cv.city].filter(Boolean).join('  ·  ');
  put(contact, ML, y, fonts['Helvetica'], CV_BODY);
  if (cv.profil) {
    y += 21.0;
    paragraph(cv.profil, fonts['Helvetica'], ML, CW);
  }

  // Titre de section : gras, interlettrage 0,6 pt, 38,4 pt sous le bloc précédent.
  const section = (title: string, first = false) => {
    if (!first) y += 38.4;
    check();
    put(title.toUpperCase(), ML, y, fonts['Helvetica-Bold'], CV_BODY, CV_TRACK);
    y += 17.0;
  };

  if (cv.experiences.length) {
    section('Expériences');
    cv.experiences.forEach((exp, ei) => {
      if (ei > 0) y += 27.4;
      check();
      put(exp.title, ML, y, fonts['Helvetica-Bold'], CV_BODY);
      right(exp.dates, fonts['Helvetica'], CV_BODY);
      y += 14.0;
      put(exp.company, ML, y, fonts['Helvetica'], CV_BODY);
      y += 17.0;
      const bullets = exp.bullets.filter(b => b.trim());
      bullets.forEach((b, bi) => {
        if (bi > 0) y += 16.4;
        const line = `– ${b}`;
        paragraph(line, fonts['Helvetica'], ML + CV_DASH_INDENT, CW - CV_DASH_INDENT);
      });
    });
  }

  if (cv.formation.length) {
    section('Formation');
    cv.formation.forEach((f, fi) => {
      if (fi > 0) y += 23.4;
      check();
      put(f.degree, ML, y, fonts['Helvetica-Bold'], CV_BODY);
      right(f.dates, fonts['Helvetica'], CV_BODY);
      y += 14.0;
      put(f.school, ML, y, fonts['Helvetica'], CV_BODY);
    });
  }

  const textSection = (title: string, text: string) => {
    section(title);
    paragraph(text, fonts['Helvetica'], ML, CW);
  };
  if (cv.competences) textSection('Compétences', cv.competences);
  if (cv.outils) textSection('Outils', cv.outils);
  if (cv.langues) textSection('Langues', cv.langues);

  check();
  // Remplissage : position de la dernière ligne par rapport à la zone utile.
  return { overflow, fill: (y - MT) / (bottom - MT) };
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
  w.line(profile.name, { font: 'Helvetica-Bold', size: 20, after: 4 });
  const contact = [profile.phone, profile.email, profile.linkedin, profile.portfolio, profile.city].filter(Boolean).join(' · ');
  w.line(contact, { font: 'Helvetica', size: 9, after: 24 });

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

// Le CV n'est produit que s'il tient sur une page : sinon l'appelant refuse
// l'export et propose des corrections.
export async function measureCvFill(cv: CVProfile): Promise<{ fill: number; scale: number }> {
  let fill = 0;
  await generatePDF((doc) => { fill = renderCv(doc, cv, 1).fill; });
  return { fill, scale: 1 };
}

export async function buildCVPdf(cv: CVProfile): Promise<Buffer> {
  return generatePDF((doc) => { renderCv(doc, cv, 1); });
}
