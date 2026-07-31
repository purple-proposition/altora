'use client';

import { useState } from 'react';

type DocFile = { url: string; filename: string; createdAt?: number };

export default function FolderDetailView({ docs }: { docs: DocFile[] }) {
  const [sort, setSort] = useState<'alpha' | 'date'>('alpha');

  const sorted = [...docs].sort((a, b) => {
    if (sort === 'alpha') return a.filename.localeCompare(b.filename, 'fr');
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  return (
    <>
      <div className="folder-detail-toolbar">
        <span className="folder-detail-sort-label">Trier par</span>
        <div className="folder-detail-sort-group">
          <button
            type="button"
            className={`folder-detail-sort-btn${sort === 'alpha' ? ' folder-detail-sort-btn--active' : ''}`}
            onClick={() => setSort('alpha')}
          >
            Ordre alphabétique
          </button>
          <button
            type="button"
            className={`folder-detail-sort-btn${sort === 'date' ? ' folder-detail-sort-btn--active' : ''}`}
            onClick={() => setSort('date')}
          >
            Date de création
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="folder-empty">Ce dossier est vide.</p>
      ) : (
        <div className="folder-detail-grid">
          {sorted.map(doc => (
            <a className="folder-detail-item" href={doc.url} target="_blank" rel="noopener noreferrer" key={doc.url}>
              <div className="doc-thumb-bare">
                <embed src={doc.url} type="application/pdf" />
              </div>
              <span className="folder-detail-item-name">{doc.filename}</span>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
