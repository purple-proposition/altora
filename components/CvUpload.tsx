'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';
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
  // Remonte le champ après chaque envoi : il repart vide, prêt à remplacer le CV.
  const [fieldKey, setFieldKey] = useState(0);

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
      setFieldKey(k => k + 1);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Label>Ton CV</Label>
      {filename && (
        <span className="inline-flex items-center gap-2 text-sm text-neutral-700">
          <FileText size={16} />
          {filename}
        </span>
      )}
      <FileUploadFieldInput
        key={fieldKey}
        accept=".pdf,.doc,.docx"
        maxFiles={1}
        disabled={uploading}
        label={uploading ? 'Envoi…' : filename ? 'Remplacer le CV' : 'Importer mon CV'}
        onFilesChange={(files) => { if (files[0]) upload(files[0]); }}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
