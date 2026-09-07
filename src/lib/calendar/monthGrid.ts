import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths
} from "date-fns";
import { fr } from "date-fns/locale";
import type { CalendarEvent } from "@/types/database";

export interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

const WEEK_STARTS_ON_MONDAY = 1 as const;

export function buildMonthGrid(reference: Date, events: CalendarEvent[]): DayCell[] {
  const firstOfMonth = startOfMonth(reference);
  const lastOfMonth = endOfMonth(reference);

  const gridStart = startOfWeek(firstOfMonth, { weekStartsOn: WEEK_STARTS_ON_MONDAY });
  const gridEnd = endOfWeek(lastOfMonth, { weekStartsOn: WEEK_STARTS_ON_MONDAY });

  const eventsByDay = groupEventsByDay(events);

  const cells: DayCell[] = [];
  let cursor = gridStart;

  while (cursor <= gridEnd) {
    const key = format(cursor, "yyyy-MM-dd");
    cells.push({
      date: cursor,
      isCurrentMonth: isSameMonth(cursor, reference),
      isToday: isToday(cursor),
      events: eventsByDay.get(key) ?? []
    });
    cursor = addDays(cursor, 1);
  }

  return cells;
}

function groupEventsByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const start = new Date(event.starts_at);
    const end = new Date(event.ends_at);
    let cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    while (cursor <= last) {
      const key = format(cursor, "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
      cursor = addDays(cursor, 1);
    }
  }

  for (const list of map.values()) {
    list.sort((a, b) => (a.all_day === b.all_day ? 0 : a.all_day ? -1 : 1));
  }

  return map;
}

export function monthLabel(reference: Date): string {
  return format(reference, "MMMM yyyy", { locale: fr });
}

export function nextMonth(reference: Date): Date {
  return addMonths(reference, 1);
}

export function previousMonth(reference: Date): Date {
  return subMonths(reference, 1);
}

export const WEEKDAY_LABELS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return isSameDay(a, b);
}
