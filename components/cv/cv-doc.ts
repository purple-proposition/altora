// Taille fixe du CV : 9,5 pt pour le texte courant, tous les autres éléments
// s'en déduisent. Pas d'ajustement automatique : si le CV ne tient pas, il est
// signalé et il faut corriger le contenu.
export const CV_TEXT_SCALE = 0.95;

// Modèle éditable du CV côté client. Chaque élément peut être masqué sans être
// supprimé : le masquage ne concerne que l'aperçu et l'export.

export type Bullet = { text: string; hidden: boolean };
export type Experience = { company: string; title: string; dates: string; hidden: boolean; bullets: Bullet[] };
export type FormationItem = { school: string; degree: string; dates: string; hidden: boolean };
export type CvDoc = {
  title: string;
  profil: string;
  competences: string;
  outils: string;
  langues: string;
  experiences: Experience[];
  formation: FormationItem[];
};

type RawCv = {
  title?: string; profil?: string; competences?: string; outils?: string; langues?: string;
  experiences?: { company?: string; title?: string; dates?: string; hidden?: boolean; bullets?: (string | { text?: string; hidden?: boolean })[] }[];
  formation?: { school?: string; degree?: string; dates?: string; hidden?: boolean }[];
};

// Transforme la réponse de génération, ou un CV déjà édité et sauvegardé,
// en modèle éditable (les éléments masqués le restent).
export function toCvDoc(raw: RawCv): CvDoc {
  return {
    title: raw.title ?? '',
    profil: raw.profil ?? '',
    competences: raw.competences ?? '',
    outils: raw.outils ?? '',
    langues: raw.langues ?? '',
    experiences: (raw.experiences ?? []).map(e => ({
      company: e.company ?? '',
      title: e.title ?? '',
      dates: e.dates ?? '',
      hidden: !!e.hidden,
      bullets: (e.bullets ?? []).map(b => (typeof b === 'string' ? { text: b, hidden: false } : { text: b.text ?? '', hidden: !!b.hidden })),
    })),
    formation: (raw.formation ?? []).map(f => ({
      school: f.school ?? '',
      degree: f.degree ?? '',
      dates: f.dates ?? '',
      hidden: !!f.hidden,
    })),
  };
}

// Ce qui part vers /api/export : seulement les éléments visibles.
export function toExportCv(doc: CvDoc) {
  return {
    title: doc.title,
    profil: doc.profil,
    competences: doc.competences,
    outils: doc.outils,
    langues: doc.langues,
    experiences: doc.experiences
      .filter(e => !e.hidden)
      .map(e => ({
        company: e.company,
        title: e.title,
        dates: e.dates,
        bullets: e.bullets.filter(b => !b.hidden).map(b => b.text),
      })),
    formation: doc.formation
      .filter(f => !f.hidden)
      .map(f => ({ school: f.school, degree: f.degree, dates: f.dates })),
  };
}
