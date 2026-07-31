import Link from 'next/link';

export type DocFile = { url: string; filename: string; thumbnailUrl?: string | null; createdAt?: number };

// Purely visual, non-interactive — just a peek at what a folder holds, not a
// file browser. This used to render a live <embed type="application/pdf">,
// but Chrome's built-in PDF viewer draws its own hover toolbar (zoom, rotate,
// download) as part of the plugin's own rendering surface — pointer-events:
// none on the embed, plus an opaque blocker on top, both failed to suppress
// it, since that toolbar isn't dispatched through normal DOM events. A
// static <img> (the actual first page, rendered server-side at upload time)
// or, failing that, a generic file icon, sidesteps the problem entirely:
// there is nothing left that a browser could ever consider "hoverable".
function Sheet({ doc }: { doc: DocFile }) {
  return (
    <div className="doc-thumb-sheet">
      {doc.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={doc.thumbnailUrl} alt="" draggable={false} />
      ) : (
        <i data-lucide="file-text"></i>
      )}
    </div>
  );
}

export default function DocThumbGrid({ docs, href }: { docs: DocFile[]; href: string }) {
  if (docs.length === 0) return null;

  if (docs.length === 1) {
    return (
      <Link href={href} className="doc-thumb-grid">
        <div className="doc-thumb-bare">
          <Sheet doc={docs[0]} />
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className="doc-thumb-grid">
      <div className="doc-thumb-bare doc-thumb-fan">
        {docs.slice(0, 3).map((doc, i) => (
          <div className={`doc-thumb-fan-layer doc-thumb-fan-layer--${i}`} key={doc.url}>
            <Sheet doc={doc} />
          </div>
        ))}
      </div>
    </Link>
  );
}
