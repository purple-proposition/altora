'use client';

import { useState } from 'react';
import type { School } from '@/lib/school';

export default function SchoolSettingsForm({ initialSchool }: { initialSchool: School }) {
  const [school, setSchool] = useState(initialSchool);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof School>(key: K, value: School[K]) {
    setSchool(s => ({ ...s, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/school', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(school),
      });
      if (res.ok) {
        const { school: saved } = await res.json();
        setSchool(saved);
        setSaved(true);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="school-settings-form">
      <fieldset className="field-group">
        <legend className="field-label">Réglages école</legend>
        <label>Nom de l&apos;école
          <input type="text" value={school.name} onChange={e => set('name', e.target.value)} />
        </label>
        <div className="field-row">
          <label>Rythme d&apos;alternance
            <input type="text" value={school.rhythm} onChange={e => set('rhythm', e.target.value)} placeholder="ex: 4j entreprise / 1j école" />
          </label>
          <label>Rentrée
            <input type="text" value={school.availability} onChange={e => set('availability', e.target.value)} placeholder="ex: à partir d'octobre 2026" />
          </label>
        </div>
      </fieldset>

      <div className="profile-form-actions">
        <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {saved && <span className="field-hint">Réglages enregistrés.</span>}
      </div>
    </div>
  );
}
