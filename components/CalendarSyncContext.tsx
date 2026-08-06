'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

// Lets KanbanAnimation report which interview dates are currently
// "active" (a card is sitting in the Entretien column with that date)
// so HeroCalendar can light up the matching day at the exact same
// moment — both mockups are telling the same story, so an interview
// appearing/disappearing on one has to show up on the other too,
// instead of the calendar carrying its own unrelated static date.
export type CalendarSyncEvent = { id: string; day: number; label: string };

type CalendarSyncApi = {
  events: CalendarSyncEvent[];
  addEvent: (event: CalendarSyncEvent) => void;
  removeEvent: (id: string) => void;
};

const CalendarSyncContext = createContext<CalendarSyncApi | null>(null);

export function CalendarSyncProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<CalendarSyncEvent[]>([]);

  const api = useMemo<CalendarSyncApi>(() => ({
    events,
    addEvent: (event) => setEvents((prev) => [...prev.filter((e) => e.id !== event.id), event]),
    removeEvent: (id) => setEvents((prev) => prev.filter((e) => e.id !== id)),
  }), [events]);

  return <CalendarSyncContext.Provider value={api}>{children}</CalendarSyncContext.Provider>;
}

// Returns null outside a provider (e.g. if either mockup is ever reused
// somewhere without the other) — callers should treat that as "no sync
// available" rather than throwing.
export function useCalendarSync() {
  return useContext(CalendarSyncContext);
}
