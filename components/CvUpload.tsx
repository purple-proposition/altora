'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';

// Standalone, controlled version of the CV upload widget that used to
// only exist as static markup + imperative DOM wiring inside the old
// home page's profile overlay (see public/tracker.js) — that version
// depended on global element IDs and a page-injected window global, so
// it couldn't be reused here on its own. Same endpoint (POST
// /api/profile/cv), same accepted types, just real React state instead.
export default function CvUpload({
  initialFilename,
  onUploaded,
}: {
  initialFilename?: string;
  onUploaded?: (filename: string) => void;
}) {
  const [filename, setFilename] = useState(initialFilename ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/profile/cv', { method: 'POST', body: formData });
      // The route always answers JSON, but something in front of it (a proxy
      // rejecting the body size, a gateway timeout) may not — parsing
      // defensively keeps those cases showing a real message rather than a
      // JSON syntax error.
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Échec de l'envoi du CV.");
      if (!data?.filename) throw new Error("Échec de l'envoi du CV.");
      setFilename(data.filename);
      onUploaded?.(data.filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi du CV.");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="field-group">
      <span className="field-label">Ton CV</span>
      <div className="cv-upload-row">
        <input type="file" id="cv-file-input-generate" accept=".pdf,.doc,.docx" hidden onChange={handleChange} disabled={uploading} />
        <label htmlFor="cv-file-input-generate" className="btn-add-contact">
          <Icon name="upload" />
          {uploading ? 'Envoi…' : filename ? 'Remplacer' : 'Importer'}
        </label>
        {filename && (
          <span className="cv-filename-btn">
            <Icon name="file-text" />
            <span>{filename}</span>
          </span>
        )}
      </div>
      {error && <div className="generate-error">{error}</div>}
    </div>
  );
}
