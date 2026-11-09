// Modèle éditable de la lettre côté client.
export type LetterDoc = { company: string; poste: string; paragraphs: string[] };

export function toLetterDoc(raw: { company?: string; poste?: string; paragraphs?: string[] }): LetterDoc {
  return {
    company: raw.company ?? '',
    poste: raw.poste ?? '',
    paragraphs: raw.paragraphs ?? [],
  };
}

export function toExportLetter(doc: LetterDoc) {
  return { company: doc.company, poste: doc.poste, paragraphs: doc.paragraphs.filter(p => p.trim()) };
}
