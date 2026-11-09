'use client';

import { useState } from 'react';
import { FileUploadFieldInput } from '@/components/inputs/file-upload-field-input';

// Import du CV : même endpoint (POST /api/profile/cv), état React local.
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

  async function upload(file: File) {
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/profile/cv', { method: 'POST', body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Échec de l'envoi du CV.");
      if (!data?.filename) throw new Error("Échec de l'envoi du CV.");
      setFilename(data.filename);
      onUploaded?.(data.filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi du CV.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {filename && <p className="text-sm text-neutral-500">CV enregistré : {filename}</p>}
      <FileUploadFieldInput
        label="Ton CV"
        hint="PDF, DOC ou DOCX, 10 Mo maximum."
        dropLabel="Dépose ton CV ici"
        browseLabel="Choisir un fichier"
        replaceLabel="Remplacer le CV"
        accept=".pdf,.doc,.docx"
        maxFiles={1}
        maxSizeBytes={10 * 1024 * 1024}
        disabled={uploading}
        errorMessage={error || undefined}
        error={Boolean(error)}
        onFilesChange={(files) => { if (files[0]) upload(files[0]); }}
      />
      {uploading && <p className="text-sm text-neutral-500">Envoi en cours…</p>}
    </div>
  );
}
