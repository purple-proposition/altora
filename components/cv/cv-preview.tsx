import type { CvDoc } from '@/components/cv/cv-doc';

// Aperçu du CV en HTML, mis à jour à chaque modification. Ne montre que les
// éléments visibles, comme le PDF exporté.
export function CvPreview({ doc, identity }: {
  doc: CvDoc;
  identity: { name: string; email: string; phone: string; city: string; linkedin: string; portfolio: string };
}) {
  const contact = [identity.city, identity.phone, identity.email, identity.linkedin, identity.portfolio].filter(Boolean).join(' · ');
  const exps = doc.experiences.filter(e => !e.hidden);
  const formations = doc.formation.filter(f => !f.hidden);

  return (
    <article className="mx-auto w-full max-w-[560px] bg-neutral-50 px-10 py-10 text-xs leading-relaxed text-neutral-900 ring-1 ring-neutral-200">
      <header>
        <h2 className="text-2xl font-bold leading-none tracking-tight">{identity.name}</h2>
        {doc.title && <p className="mt-1 font-semibold">{doc.title}</p>}
        {contact && <p className="mt-1 text-xs text-neutral-500">{contact}</p>}
      </header>

      {doc.profil && (
        <section className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider">Profil</h3>
          <p className="mt-1">{doc.profil}</p>
        </section>
      )}

      {exps.length > 0 && (
        <section className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider">Expériences</h3>
          {exps.map((e, i) => (
            <div key={i} className="mt-2">
              <p className="font-semibold">{[e.title, e.company].filter(Boolean).join(' · ')} <span className="font-normal text-neutral-500">{e.dates}</span></p>
              <ul className="mt-1 list-disc pl-5">
                {e.bullets.filter(b => !b.hidden && b.text.trim()).map((b, j) => <li key={j}>{b.text}</li>)}
              </ul>
            </div>
          ))}
        </section>
      )}

      {formations.length > 0 && (
        <section className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider">Formation</h3>
          {formations.map((f, i) => (
            <p key={i} className="mt-1">
              <span className="font-semibold">{[f.degree, f.school].filter(Boolean).join(' · ')}</span>{' '}
              <span className="text-neutral-500">{f.dates}</span>
            </p>
          ))}
        </section>
      )}

      {doc.competences && (
        <section className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider">Compétences</h3>
          <p className="mt-1">{doc.competences}</p>
        </section>
      )}
      {doc.outils && (
        <section className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider">Outils</h3>
          <p className="mt-1">{doc.outils}</p>
        </section>
      )}
      {doc.langues && (
        <section className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider">Langues</h3>
          <p className="mt-1">{doc.langues}</p>
        </section>
      )}
    </article>
  );
}
