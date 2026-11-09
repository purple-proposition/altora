'use client';

import { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';

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

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
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
      e.target.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="cv-file-input-generate">Ton CV</Label>
      <div className="flex flex-wrap items-center gap-3">
        <input id="cv-file-input-generate" type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={handleChange} disabled={uploading} />
        <span className="inline-flex h-11 items-center rounded-lg border border-neutral-300 bg-white px-4 text-base font-medium text-neutral-900 hover:bg-neutral-100">
          <label htmlFor="cv-file-input-generate" className="inline-flex cursor-pointer items-center gap-2">
            <Upload size={16} />
            {uploading ? 'Envoi…' : filename ? 'Remplacer' : 'Importer'}
          </label>
        </span>
        {filename && (
          <span className="inline-flex items-center gap-2 text-sm text-neutral-700">
            <FileText size={16} />
            {filename}
          </span>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
