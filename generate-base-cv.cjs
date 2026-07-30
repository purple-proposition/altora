'use strict';
const PDFDocument = require('./node_modules/pdfkit');
const fs = require('fs');
const path = require('path');

const JESSE_BASE = {
  name: 'Jesse Sotomayor',
  email: 'jessesotomayor@icloud.com',
  phone: '+33 6 06 95 41 36',
  linkedin: 'linkedin.com/in/jessesotomayor',
  portfolio: 'jessesotomayor.vercel.app',
  city: 'Lyon',
  title: "Manager de la stratégie marketing et digitale · Alternance à partir d'octobre 2026 · 4j entreprise / 1j école",
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
      bullets: [],
    },
    {
      school: 'Rocket School',
      degree: 'Bac +3 · Marketing spécialisé en acquisition numérique',
      dates: '07/2025 – 10/2026',
      bullets: [],
    },
  ],
  competences:
    'Acquisition digitale · CRM · Marketing automation · IA générative · Emailing · Segmentation · A/B testing · Analyse de données · Reporting · Référencement naturel (SEO) · Référencement payant (SEA) · Optimisation de la conversion · Landing pages · Funnel marketing · Copywriting · Community management · Gestion de projet · UX/UI',
  outils:
    'Google Analytics · Google Ads · Meta Ads · Brevo · HubSpot · Odoo · Figma · Canva · Adobe Creative Suite · Microsoft Office · Notion · TikTok · Instagram · Claude',
  langues: 'Français : langue maternelle · Anglais : courant · Espagnol : intermédiaire',
};

function generatePDF(doc_fn) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Author: 'Jesse Sotomayor' } });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc_fn(doc);
    doc.end();
  });
}

function renderCVContent(doc, cv, shrink = 1.0) {
  const M = 42.52;
  const W = 595.28 - M * 2;
  const PAGE_H = 841.89;
  const BOTTOM = PAGE_H - 40;
  let y = M;

  const C = { noir: '#111827', fonce: '#4b5563', deco: '#d1d5db' };
  const sp = n => Math.round(n * shrink);
  const vg = (gap, fontSize = 9) => sp(Math.round(fontSize * 1.2) + gap);
  const S = {
    nameToTitle:      vg(4, 18),
    titleToContact:   vg(8),
    contactToProfile: vg(12),
    profileToSection: sp(16),
    beforeSection:    sp(12),
    afterLabel:       vg(8),
    companyToTitle:   vg(4),
    titleToBullets:   vg(8),
    betweenBullets:   sp(4),
    afterBlock:       sp(16),
    afterInline:      sp(16),
  };

  const ln = (str, x, yPos, opts = {}) => doc.text(str, x, yPos, { lineBreak: false, ...opts });
  const block = (str, x, yPos, opts = {}) => doc.text(str, x, yPos, { lineBreak: true, lineGap: Math.max(1, sp(2)), ...opts });

  const newPage = (needed = 50) => {
    if (y + needed > BOTTOM) { doc.addPage({ size: 'A4', margin: 0 }); y = M; }
  };
  const section = (label, needed = 60) => {
    newPage(needed);
    y += S.beforeSection;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(C.noir);
    ln(label, M, y, { characterSpacing: 0.6 });
    y += S.afterLabel;
  };

  // Header
  doc.font('Helvetica-Bold').fontSize(18).fillColor(C.noir); ln(cv.name, M, y); y += S.nameToTitle;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.noir); ln(cv.title, M, y); y += S.titleToContact;
  doc.font('Helvetica').fontSize(9).fillColor(C.noir);
  const contactStr = `${cv.phone}  ·  ${cv.email}  ·  ${cv.linkedin}  ·  ${cv.portfolio}  ·  ${cv.city}`;
  ln(contactStr, M, y);
  const sep = '  ·  ';
  let lx = M;
  const addLink = (text, url) => { const w = doc.widthOfString(text); doc.link(lx, y, w, 9, url); lx += w + doc.widthOfString(sep); };
  addLink(cv.phone, `tel:${cv.phone.replace(/\s/g, '')}`);
  addLink(cv.email, `mailto:${cv.email}`);
  addLink(cv.linkedin, `https://${cv.linkedin}`);
  addLink(cv.portfolio, `https://${cv.portfolio}`);
  y += S.contactToProfile;

  // Profil
  doc.font('Helvetica').fontSize(9).fillColor(C.noir);
  block(cv.profil, M, y, { width: W }); y = doc.y + S.profileToSection;

  // Expériences
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
    y += S.afterBlock;
  }

  // Formation
  section('FORMATION');
  for (let fi = 0; fi < cv.formation.length; fi++) {
    const f = cv.formation[fi];
    newPage(70);
    const rowY = y;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(C.noir); ln(f.degree, M, rowY);
    doc.font('Helvetica').fontSize(9).fillColor(C.noir); ln(f.dates, M, rowY, { align: 'right', width: W });
    y = rowY + S.companyToTitle;
    doc.font('Helvetica').fontSize(9).fillColor(C.noir); block(f.school, M, y, { width: W });
    y = doc.y + (fi < cv.formation.length - 1 ? sp(12) : S.afterInline);
  }

  // Compétences
  section('COMPÉTENCES');
  doc.font('Helvetica').fontSize(9).fillColor(C.noir);
  block(cv.competences, M, y, { width: W }); y = doc.y + S.afterInline;

  // Outils
  section('OUTILS');
  doc.font('Helvetica').fontSize(9).fillColor(C.noir);
  block(cv.outils, M, y, { width: W }); y = doc.y + S.afterInline;

  // Langues
  section('LANGUES', 42);
  doc.font('Helvetica').fontSize(9).fillColor(C.noir);
  ln(cv.langues, M, y);
}

async function buildCVPdf(cv) {
  for (const shrink of [1.0, 0.91, 0.83]) {
    let overflowed = false;
    const buf = await generatePDF(doc => {
      const origAddPage = doc.addPage.bind(doc);
      doc.addPage = (...args) => { overflowed = true; return origAddPage(...args); };
      renderCVContent(doc, cv, shrink);
    });
    if (!overflowed) return buf;
  }
  return generatePDF(doc => renderCVContent(doc, cv, 0.83));
}

(async () => {
  const buf = await buildCVPdf(JESSE_BASE);
  const out = path.join(process.env.HOME, 'Downloads', 'CV_Jesse_Sotomayor.pdf');
  fs.writeFileSync(out, buf);
  console.log('✓ PDF généré :', out);
})();
