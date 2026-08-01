import Anthropic from '@anthropic-ai/sdk';
import { UserProfile, emptyProfile } from './profile';

// Best-effort structured extraction of a candidate profile from an uploaded
// CV (PDF only — DOC/DOCX have no reliable text-extraction path here and
// fall back to the user filling the profile form manually). Never throws:
// callers treat this as a pre-fill convenience, not a required step.
export async function extractProfileFromPdf(pdfBytes: Buffer, fallbackName: string, fallbackEmail: string): Promise<UserProfile | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: pdfBytes.toString('base64') },
          },
          {
            type: 'text',
            text: `Extrait les informations de ce CV et retourne UNIQUEMENT un objet JSON valide (sans markdown, sans backticks), avec exactement cette forme :
{"name":"...","email":"...","phone":"...","linkedin":"...","portfolio":"...","city":"...","availability":"...","profil":"...","experiences":[{"company":"...","title":"...","dates":"...","bullets":["..."]}],"formation":[{"school":"...","degree":"...","dates":"...","bullets":[]}],"competences":"item1 · item2 · ...","outils":"item1 · item2 · ...","langues":"Français : ... · Anglais : ..."}
Règles : ne rien inventer — si une info est absente du CV, laisser une chaîne vide "" ou un tableau vide []. "dates" au format "MM/AAAA – MM/AAAA" ou "MM/AAAA – Présent". "competences"/"outils" séparés par " · ". Ordre antichronologique pour experiences et formation.`,
          },
        ],
      }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);

    const base = emptyProfile(fallbackName, fallbackEmail);
    return {
      ...base,
      ...parsed,
      name: parsed.name || base.name,
      email: parsed.email || base.email,
      experiences: Array.isArray(parsed.experiences) ? parsed.experiences : [],
      formation: Array.isArray(parsed.formation) ? parsed.formation : [],
    };
  } catch {
    // Extraction failing (rate limit, unreadable scan, malformed JSON) is
    // not fatal — the upload itself already succeeded.
    return null;
  }
}
