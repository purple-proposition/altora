import Anthropic from '@anthropic-ai/sdk';
import mammoth from 'mammoth';
import WordExtractor from 'word-extractor';
import { UserProfile, emptyProfile } from './profile';

const EXTRACTION_INSTRUCTIONS = `Extrait les informations de ce CV et retourne UNIQUEMENT un objet JSON valide (sans markdown, sans backticks), avec exactement cette forme :
{"name":"...","email":"...","phone":"...","linkedin":"...","portfolio":"...","city":"...","school":"...","soughtContract":"","availability":"...","rhythm":"...","profil":"...","experiences":[{"company":"...","title":"...","dates":"...","bullets":["..."]}],"formation":[{"school":"...","degree":"...","dates":"...","bullets":[]}],"competences":"item1 · item2 · ...","outils":"item1 · item2 · ...","langues":"Français : ... · Anglais : ...","interests":"item1 · item2 · ..."}

Règles :
— Ne rien inventer : si une info est absente du CV, laisser une chaîne vide "" ou un tableau vide [].
— "dates" au format "MM/AAAA – MM/AAAA" ou "MM/AAAA – Présent". Ordre antichronologique pour experiences et formation.
— "competences", "outils" et "interests" : items séparés par " · ".
— "interests" : centres d'intérêt, loisirs, engagements associatifs, sports, bénévolat.
— "langues" : chaque langue avec son niveau s'il est indiqué, séparées par " · ".
— "school" : l'établissement de la formation EN COURS (la plus récente, si elle n'est pas terminée), pas toute la liste.
— "soughtContract" : "alternance", "stage" ou "cdi" UNIQUEMENT si le CV l'indique explicitement (mention "recherche une alternance", "en vue d'un stage"…), sinon "".
— "availability" : date ou période de début mentionnée dans le CV, sinon "".
— "rhythm" : rythme d'alternance s'il est indiqué (ex: "4 jours entreprise / 1 jour école"), sinon "".`;

function parseProfileJSON(raw: string, fallbackName: string, fallbackEmail: string): UserProfile | null {
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
}

async function askClaude(content: Anthropic.MessageParam['content']): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 4000,
    messages: [{ role: 'user', content }],
  });
  return message.content[0].type === 'text' ? message.content[0].text : '';
}

// Best-effort structured extraction of a candidate profile from an uploaded
// CV. Supports PDF (sent to Claude as a native document), DOCX (text pulled
// via mammoth), and legacy DOC (text pulled via word-extractor) — anything
// else falls back to the user filling the profile form manually. Never
// throws: callers treat this as a pre-fill convenience, not a required step.
export async function extractProfileFromCV(
  bytes: Buffer,
  ext: '.pdf' | '.docx' | '.doc',
  fallbackName: string,
  fallbackEmail: string,
): Promise<UserProfile | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    let raw: string;
    if (ext === '.pdf') {
      raw = await askClaude([
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: bytes.toString('base64') } },
        { type: 'text', text: EXTRACTION_INSTRUCTIONS },
      ]);
    } else {
      const cvText = ext === '.docx'
        ? (await mammoth.extractRawText({ buffer: bytes })).value
        : (await new WordExtractor().extract(bytes)).getBody();
      if (!cvText?.trim()) return null;
      raw = await askClaude(`${EXTRACTION_INSTRUCTIONS}\n\nTexte du CV :\n${cvText.slice(0, 15000)}`);
    }

    return parseProfileJSON(raw, fallbackName, fallbackEmail);
  } catch {
    // Extraction failing (rate limit, unreadable scan, malformed JSON,
    // unparsable legacy .doc) is not fatal — the upload itself already succeeded.
    return null;
  }
}
