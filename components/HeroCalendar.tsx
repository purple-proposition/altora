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
const WEEKDAY_RANGES: { type: string; from: number; to: number }[] = [
  { type: 'examen', from: -3, to: 1 },
  { type: 'conges', from: 4, to: 8 },
  { type: 'formation', from: 11, to: 15 },
  { type: 'entreprise', from: 18, to: 25 },
];
const FERIE_OFFSET = 9;

function isWeekday(date: Date) {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildGrid(today: Date) {
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  // Monday-first offset: getDay() is 0 (Sun) .. 6 (Sat), shift so Monday is 0.
  const leadingDays = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - leadingDays);

  const todayStart = startOfDay(today);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const offset = Math.round((startOfDay(date).getTime() - todayStart.getTime()) / 86400000);
    const type = WEEKDAY_RANGES.find((r) => offset >= r.from && offset <= r.to && isWeekday(date))?.type;
    cells.push({
      day: date.getDate(),
      muted: date.getMonth() !== today.getMonth(),
      isToday: offset === 0,
      isFerie: offset === FERIE_OFFSET,
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
