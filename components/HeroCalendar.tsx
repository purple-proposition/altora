'use client';

import Icon from '@/components/Icon';

// Same "story" the calendar always told (an exam week, a break, a
// training week, a business-days-only company period, one interview),
// but anchored to real "today" via day offsets instead of hardcoded
// dates — so the "aujourd'hui" marker (and the whole narrative around
// it) is always correct for whoever's viewing the page, no more manual
// bumping every time the date moves on.
const WEEKDAY_RANGES: { type: string; from: number; to: number }[] = [
  { type: 'examen', from: -3, to: 1 },
  { type: 'conges', from: 4, to: 8 },
  { type: 'formation', from: 11, to: 15 },
  { type: 'entreprise', from: 18, to: 25 },
];
const FERIE_OFFSET = 9;
const EVENT_OFFSET = -1;

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
      date,
      day: date.getDate(),
      muted: date.getMonth() !== today.getMonth(),
      isToday: offset === 0,
      isEvent: offset === EVENT_OFFSET,
      isFerie: offset === FERIE_OFFSET,
      type,
    });
  }
  return cells;
}

export default function HeroCalendar() {
  const cells = buildGrid(new Date());

  return (
    <div className="landing-calendar-board">
      <div className="landing-calendar-weekdays">
        <span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span>
      </div>
      <div className="landing-calendar-grid">
        {cells.map((cell, i) => {
          const classes = ['landing-calendar-day'];
          if (cell.muted) classes.push('landing-calendar-day--muted');
          if (cell.type) classes.push(`landing-calendar-day--${cell.type}`);
          if (cell.isFerie) classes.push('landing-calendar-day--ferie');
          if (cell.isToday) classes.push('landing-calendar-day--today');
          if (cell.isEvent) classes.push('landing-calendar-day--has-event');

          if (cell.isEvent) {
            return (
              <span key={i} className={classes.join(' ')}>
                <span className="landing-calendar-day-number">{cell.day}</span>
                <span className="card-interview-pill landing-calendar-day-event"><Icon name="target" />L&apos;Oréal</span>
              </span>
            );
          }
          return <span key={i} className={classes.join(' ')}>{cell.day}</span>;
        })}
      </div>
    </div>
  );
}
