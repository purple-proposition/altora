'use client';

import { useId, useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { cn } from '@/lib/cn';

// Champ d'import de fichiers, même API que le composant du guide :
// accept, multiple, maxFiles, onFilesChange. Le parent reçoit la liste
// complète des fichiers retenus à chaque changement.
export function FileUploadFieldInput({
  accept,
  multiple = false,
  maxFiles = 1,
  onFilesChange,
  disabled = false,
  label = 'Choisir un fichier',
  className,
}: {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  onFilesChange?: (files: File[]) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const limit = multiple ? maxFiles : 1;
  const full = files.length >= limit;

  function update(next: File[]) {
    setFiles(next);
    onFilesChange?.(next);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!picked.length) return;
    const next = multiple ? [...files, ...picked].slice(0, limit) : picked.slice(0, 1);
    update(next);
  }

  function remove(index: number) {
    update(files.filter((_, i) => i !== index));
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        disabled={disabled || full}
        onChange={handleChange}
      />
      <label
        htmlFor={id}
        className={cn(
          'inline-flex h-11 w-fit cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 text-base font-medium text-neutral-900 hover:bg-neutral-100',
          (disabled || full) && 'pointer-events-none opacity-50',
        )}
      >
        <Upload size={16} />
        {label}
      </label>
      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-900">
              <span className="inline-flex min-w-0 items-center gap-2">
                <FileText size={16} className="shrink-0" />
                <span className="truncate">{f.name}</span>
              </span>
              <button type="button" onClick={() => remove(i)} aria-label={`Retirer ${f.name}`} className="text-neutral-500 hover:text-neutral-900">
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
