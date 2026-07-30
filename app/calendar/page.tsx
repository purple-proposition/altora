'use client';

import '../tracker.css';
import Link from 'next/link';
import { useMemo, useState } from 'react';

// Données extraites du planning "Apollo 160 DBD - B3 : REC // ALT - LYON" (Rocket School),
// du 27/10/2025 au 25/09/2026. Type par défaut d'un jour de semaine dans la plage : "entreprise".
type EventType = 'formation' | 'conges' | 'examen' | 'examen_oral' | 'ferie';

const EVENT_LABELS: Record<EventType, string> = {
  formation: 'Journée de formation',
  conges: 'Congés pédagogique',
  examen: 'Examens écrit/oral',
  examen_oral: 'Examen oral (convocation)',
  ferie: 'Jour férié',
};

const SCHOOL_EVENTS: Record<string, EventType> = {
  // Octobre 2025
  '2025-10-27': 'formation', '2025-10-28': 'formation', '2025-10-29': 'formation',
  '2025-10-30': 'formation', '2025-10-31': 'formation',
  // Novembre 2025
  '2025-11-10': 'formation', '2025-11-11': 'ferie', '2025-11-12': 'formation',
  '2025-11-13': 'formation', '2025-11-14': 'formation', '2025-11-17': 'formation',
  // Décembre 2025
  '2025-12-15': 'formation', '2025-12-16': 'formation', '2025-12-17': 'formation',
  '2025-12-18': 'formation', '2025-12-19': 'formation',
  '2025-12-22': 'conges', '2025-12-23': 'conges', '2025-12-25': 'ferie',
  '2025-12-26': 'examen_oral', '2025-12-29': 'conges',
  // Janvier 2026
  '2026-01-01': 'ferie',
  '2026-01-26': 'formation', '2026-01-27': 'formation', '2026-01-28': 'formation',
  '2026-01-29': 'formation', '2026-01-30': 'formation',
  // Avril 2026
  '2026-04-06': 'ferie',
  '2026-04-20': 'formation', '2026-04-21': 'formation', '2026-04-22': 'formation',
  '2026-04-23': 'formation', '2026-04-24': 'formation',
  // Mai 2026
  '2026-05-01': 'ferie', '2026-05-08': 'ferie', '2026-05-14': 'ferie',
  '2026-05-25': 'ferie',
  '2026-05-26': 'formation', '2026-05-27': 'formation', '2026-05-28': 'formation',
  '2026-05-29': 'formation',
  // Juin 2026
  '2026-06-01': 'formation',
  '2026-06-08': 'formation', '2026-06-09': 'formation', '2026-06-10': 'formation',
  '2026-06-11': 'formation', '2026-06-12': 'formation',
  '2026-06-22': 'formation', '2026-06-23': 'formation',
  '2026-06-24': 'examen', '2026-06-25': 'examen', '2026-06-26': 'examen',
  // Juillet 2026
  '2026-07-14': 'ferie',
  '2026-07-27': 'formation', '2026-07-28': 'formation', '2026-07-29': 'formation',
  '2026-07-30': 'formation', '2026-07-31': 'formation',
  // Août 2026
  '2026-08-03': 'examen', '2026-08-04': 'examen', '2026-08-05': 'examen',
  '2026-08-06': 'examen', '2026-08-07': 'examen',
  '2026-08-10': 'conges', '2026-08-11': 'conges', '2026-08-12': 'conges',
  '2026-08-13': 'conges', '2026-08-14': 'conges', '2026-08-15': 'examen',
  '2026-08-17': 'formation', '2026-08-18': 'formation', '2026-08-19': 'formation',
  '2026-08-20': 'formation', '2026-08-21': 'formation',
  // Septembre 2026
  '2026-09-21': 'examen_oral',
  '2026-09-22': 'formation', '2026-09-23': 'formation', '2026-09-24': 'formation',
  '2026-09-25': 'formation',
};

const RANGE_START = '2025-10-07';
const RANGE_END = '2026-09-30';

const MONTH_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function buildMonthWeeks(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Lundi = 0
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  const cells: { key: string; day: number; inMonth: boolean; isWeekend: boolean }[] = [];
  const cursor = new Date(year, month, 1 - startOffset);
  for (let i = 0; i < totalCells; i++) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const d = cursor.getDate();
    const dow = (cursor.getDay() + 6) % 7;
    cells.push({ key: toKey(y, m, d), day: d, inMonth: m === month, isWeekend: dow >= 5 });
    cursor.setDate(cursor.getDate() + 1);
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function eventFor(key: string) {
  if (key < RANGE_START || key > RANGE_END) return null;
  const date = new Date(key + 'T00:00:00');
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return null; // week-end : pas d'événement

  const type = SCHOOL_EVENTS[key];
  if (type) return { type, label: EVENT_LABELS[type] };
  return { type: 'entreprise' as const, label: 'Semaine en entreprise' };
}

export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => ({ year: 2025, month: 9 })); // Octobre 2025

  const weeks = useMemo(() => buildMonthWeeks(cursor.year, cursor.month), [cursor]);

  const goPrev = () => setCursor(c => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }));
  const goNext = () => setCursor(c => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }));

  return (
    <div className="calendar-page">
      <Link href="/" className="calendar-back">← Retour au suivi</Link>

      <div className="calendar-header">
        <div className="calendar-title-row">
          <h1 className="calendar-title">{MONTH_LABELS[cursor.month]} {cursor.year}</h1>
          <div className="calendar-nav">
            <button type="button" className="calendar-nav-btn" onClick={goPrev} aria-label="Mois précédent">‹</button>
            <button type="button" className="calendar-nav-btn" onClick={goNext} aria-label="Mois suivant">›</button>
          </div>
        </div>
      </div>

      <div className="calendar-legend">
        <span className="calendar-legend-item calendar-event--entreprise"><span className="calendar-legend-dot" style={{ background: 'var(--text-muted)' }} />Semaine en entreprise</span>
        <span className="calendar-legend-item calendar-event--formation"><span className="calendar-legend-dot" style={{ background: 'var(--indigo)' }} />Journée de formation</span>
        <span className="calendar-legend-item calendar-event--conges"><span className="calendar-legend-dot" style={{ background: 'var(--amber)' }} />Congés pédagogique</span>
        <span className="calendar-legend-item calendar-event--examen"><span className="calendar-legend-dot" style={{ background: 'var(--green)' }} />Examens écrit/oral</span>
        <span className="calendar-legend-item calendar-event--examen_oral"><span className="calendar-legend-dot" style={{ background: 'var(--violet)' }} />Examen oral (convocation)</span>
        <span className="calendar-legend-item calendar-event--ferie"><span className="calendar-legend-dot" style={{ background: 'var(--rose)' }} />Jour férié</span>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {WEEKDAY_LABELS.map(w => <div key={w} className="calendar-weekday">{w}</div>)}
        </div>
        <div className="calendar-weeks">
          {weeks.map((week, wi) => (
            <div className="calendar-week" key={wi}>
              {week.map(cell => {
                const ev = eventFor(cell.key);
                return (
                  <div
                    key={cell.key}
                    className={`calendar-day${!cell.inMonth ? ' calendar-day--muted' : ''}${cell.isWeekend ? ' calendar-day--weekend' : ''}`}
                  >
                    <span className="calendar-day-number">{cell.day}</span>
                    {ev && <span className={`calendar-event calendar-event--${ev.type}`}>{ev.label}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
