import type { LetterDoc } from '@/components/cv/letter-doc';

// Aperçu de la lettre en HTML : même ordre et mêmes tailles que le PDF
// (en-tête comme le CV, objet en gras, paragraphes, formule de politesse).
export function LetterPreview({ doc, identity, contractSuffix }: {
  doc: LetterDoc;
  identity: { name: string; email: string; phone: string; city: string; linkedin: string; portfolio: string };
  contractSuffix: string;
}) {
  const contact = [identity.phone, identity.email, identity.linkedin, identity.portfolio, identity.city].filter(Boolean).join(' · ');
  const poste = doc.poste.trim();
  const dePoste = /^[aeiouyéèêëàâîïôùûüh]/i.test(poste) ? "d'" : 'de ';

  return (
    <article className="mx-auto w-full max-w-[560px] bg-white px-10 py-10 text-[13px] leading-relaxed text-neutral-900 shadow-sm ring-1 ring-neutral-200">
      <header>
        <h2 className="text-2xl font-bold tracking-tight">{identity.name}</h2>
        {contact && <p className="mt-1 text-xs text-neutral-500">{contact}</p>}
      </header>

      <p className="mt-6 font-semibold">Objet : Candidature au poste {dePoste}{poste}{contractSuffix}</p>

      <div className="mt-4 flex flex-col gap-3">
        {doc.paragraphs.filter(p => p.trim()).map((p, i) => <p key={i}>{p}</p>)}
      </div>

      <p className="mt-4">Bien cordialement,</p>
      <p className="font-semibold">{identity.name}</p>
    </article>
  );
}
