'use client';

import Icon from '@/components/Icon';
import { useCalendarSync } from '@/components/CalendarSyncContext';

// Same "story" the calendar always told (an exam week, a break, a
// training week, a business-days-only company period), anchored to real
// "today" via day offsets instead of hardcoded dates, so the
// "aujourd'hui" marker (and the whole narrative around it) is always
// correct for whoever's viewing the page, no more manual bumping every
// time the date moves on. The interview event itself is no longer one
// of these fixed ranges: it comes from CalendarSyncContext, driven live
// by KanbanAnimation (see that file's beat2/beat3), so this calendar
// always reflects whatever interview is currently active there.
// Semaines pleines, ancrees sur le lundi de la semaine en cours. Les
// bornes etaient auparavant exprimees en jours depuis aujourd'hui, ce qui
// derivait d'un jour a l'autre : selon le jour de la semaine ou la page
// etait consultee, le lundi de chaque bloc tombait juste en dehors de sa
// propre plage et restait blanc. En raisonnant en semaines, un bloc
// couvre toujours son lundi au vendredi entiers.
const WEEK_RANGES: { type: string; week: number }[] = [
  { type: 'examen', week: 0 },
  { type: 'conges', week: 1 },
  { type: 'formation', week: 2 },
  { type: 'entreprise', week: 3 },
  { type: 'entreprise', week: 4 },
];

// Vrais jours feries francais a date fixe. L'ancien reperage par decalage
// (aujourd'hui + 9 jours) se deplacait chaque jour et pouvait tomber
// n'importe quand, week-end compris ; le 15 aout est le 15 aout.
const FERIES = [[0, 1], [4, 1], [4, 8], [6, 14], [7, 15], [10, 1], [10, 11], [11, 25]];

function isWeekday(date: Date) {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function mondayOf(date: Date) {
  const d = startOfDay(date);
  // getDay() vaut 0 le dimanche : on decale pour que lundi soit l'origine.
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function buildGrid(today: Date) {
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  // Monday-first offset: getDay() is 0 (Sun) .. 6 (Sat), shift so Monday is 0.
  const leadingDays = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - leadingDays);

  const todayStart = startOfDay(today);
  const weekZero = mondayOf(today);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const offset = Math.round((startOfDay(date).getTime() - todayStart.getTime()) / 86400000);
    const week = Math.round((mondayOf(date).getTime() - weekZero.getTime()) / (7 * 86400000));
    // Les jours qui debordent sur le mois voisin restent gris : ils ne
    // portent ni couleur de periode ni jour ferie, sinon un 1er septembre
    // affiche en fin de grille se colorait comme s'il appartenait encore
    // au mois affiche.
    const muted = date.getMonth() !== today.getMonth();
    const type = muted ? undefined : WEEK_RANGES.find((r) => r.week === week && isWeekday(date))?.type;
    cells.push({
      day: date.getDate(),
      muted,
      isToday: offset === 0,
      isFerie: !muted && FERIES.some(([m, d]) => date.getMonth() === m && date.getDate() === d),
      type,
    });
  }
  return cells;
}

export default function HeroCalendar() {
  const cells = buildGrid(new Date());
  const calendarSync = useCalendarSync();

  return (
    <div className="landing-calendar-board">
      <div className="landing-calendar-weekdays">
        <span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span>
      </div>
      <div className="landing-calendar-grid">
        {cells.map((cell, i) => {
          // Every day cell always renders the event-pill slot (see the
          // collapsed default state in .landing-calendar-day-event) so
          // it can transition smoothly in/out at 0.8s in sync with
          // KanbanAnimation's own interview move, instead of the pill
          // just popping in/out on mount/unmount.
          const event = !cell.muted ? calendarSync?.events.find((e) => e.day === cell.day) : undefined;
          const classes = ['landing-calendar-day'];
          if (cell.muted) classes.push('landing-calendar-day--muted');
          if (cell.type) classes.push(`landing-calendar-day--${cell.type}`);
          if (cell.isFerie) classes.push('landing-calendar-day--ferie');
          if (cell.isToday) classes.push('landing-calendar-day--today');

          return (
            <span key={i} className={classes.join(' ')}>
              <span className="landing-calendar-day-number">{cell.day}</span>
              <span className={`card-interview-pill landing-calendar-day-event${event ? ' is-visible' : ''}`}>
                <Icon name="target" />{event?.label}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
