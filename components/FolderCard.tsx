'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DocThumbGrid, { type DocFile } from './DocThumbGrid';
import { deleteFolder, renameFolder } from '@/app/(tracker)/documents/actions';
import { safeCreateIcons } from '@/lib/icons';

export default function FolderCard({ folder, docs }: { folder: { id: number; name: string }; docs: DocFile[] }) {
  const router = useRouter();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(folder.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const dragDepthRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  useEffect(() => {
    if (renaming) inputRef.current?.select();
  }, [renaming]);

  useEffect(() => {
    safeCreateIcons();
  }, [menu, confirmingDelete]);

  function openMenu(e: React.MouseEvent) {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY });
  }

  async function submitRename() {
    setRenaming(false);
    const trimmed = name.trim();
    if (!trimmed || trimmed === folder.name) { setName(folder.name); return; }
    const fd = new FormData();
    fd.append('id', String(folder.id));
    fd.append('name', trimmed);
    await renameFolder(fd);
    router.refresh();
  }

  async function confirmDelete() {
    setConfirmingDelete(false);
    const fd = new FormData();
    fd.append('id', String(folder.id));
    await deleteFolder(fd);
    router.refresh();
  }

  async function uploadFiles(fileList: FileList) {
    setUploadError('');
    setUploading(true);
    const fd = new FormData();
    Array.from(fileList).forEach(f => fd.append('files', f));
    try {
      const res = await fetch(`/api/folders/${folder.id}/files`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error || 'Import impossible.'); return; }
      router.refresh();
    } catch {
      setUploadError('Import impossible.');
    } finally {
      setUploading(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    dragDepthRef.current += 1;
    setDragOver(true);
  }
  function handleDragLeave() {
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDragOver(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragDepthRef.current = 0;
    setDragOver(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  }

  return (
    <div
      className={`folder-card${dragOver ? ' folder-card--drag-over' : ''}`}
      onContextMenu={openMenu}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="folder-card-header">
        <i data-lucide="folder"></i>
        {renaming ? (
          <input
            ref={inputRef}
            className="folder-rename-input"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={submitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') submitRename();
              if (e.key === 'Escape') { setName(folder.name); setRenaming(false); }
            }}
            maxLength={100}
            autoFocus
          />
        ) : (
          <span className="folder-card-name">{folder.name}</span>
        )}
        <span className="folder-card-count">{docs.length}</span>
      </div>

      <div className="folder-card-body">
        {uploadError && <p className="folder-upload-error">{uploadError}</p>}
        {uploading ? (
          <p className="folder-empty">Import en cours…</p>
        ) : docs.length ? (
          <DocThumbGrid docs={docs} href={`/documents/folder/${folder.id}`} />
        ) : (
          <p className="folder-empty">Glisse un fichier ici pour l&apos;importer, ou clique-droit pour renommer/supprimer.</p>
        )}
      </div>

      {dragOver && (
        <div className="folder-card-drop-hint">
          <i data-lucide="upload"></i>
          Déposer pour importer
        </div>
      )}

      {menu && createPortal(
        <div className="folder-context-menu" style={{ top: menu.y, left: menu.x }}>
          <Link href={`/documents/folder/${folder.id}`} className="folder-context-item" onClick={() => setMenu(null)}>
            <i data-lucide="folder-open"></i>Ouvrir
          </Link>
          <button type="button" className="folder-context-item" onClick={() => { setMenu(null); setRenaming(true); }}>
            <i data-lucide="pencil"></i>Renommer
          </button>
          <button type="button" className="folder-context-item folder-context-item--danger" onClick={() => { setMenu(null); setConfirmingDelete(true); }}>
            <i data-lucide="trash-2"></i>Supprimer
          </button>
        </div>,
        document.body
      )}

      {confirmingDelete && createPortal(
        <div className="modal-overlay visible" role="dialog" aria-modal="true" aria-label="Supprimer le dossier">
          <div className="modal">
            <h2>Supprimer &quot;{folder.name}&quot; ?</h2>
            <p className="modal-hint">
              {docs.length > 0
                ? `Ce dossier et son contenu (${docs.length} fichier${docs.length > 1 ? 's' : ''}) seront supprimés définitivement.`
                : 'Ce dossier sera supprimé définitivement.'}
            </p>
            <div className="generate-actions generate-actions--split">
              <button type="button" className="btn-secondary" onClick={() => setConfirmingDelete(false)}>Annuler</button>
              <button type="button" className="btn-danger" onClick={confirmDelete}>Supprimer</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
