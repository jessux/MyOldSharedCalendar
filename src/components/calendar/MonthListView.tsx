"use client";

import clsx from "clsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { DayCell } from "@/lib/calendar/monthGrid";
import { getPublicHolidayName } from "@/lib/calendar/publicHolidays";
import { getSchoolHolidayName, type SchoolZone } from "@/lib/calendar/schoolHolidays";
import { CategoryIcon } from "./categoryIcons";
import { ExpandIcon, CollapseIcon } from "./icons";

const COMPACT_DOT_LIMIT = 5;

interface MonthListViewProps {
  cells: DayCell[];
  memberColors: Record<string, string>;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  schoolZone: SchoolZone;
  compact: boolean;
  onToggleCompact: () => void;
}

export function MonthListView({
  cells,
  memberColors,
  selectedDate,
  onSelectDate,
  schoolZone,
  compact,
  onToggleCompact
}: MonthListViewProps) {
  const currentMonthCells = cells.filter((c) => c.isCurrentMonth);

  return (
    <div className={clsx("paper-list w-full flex flex-col divide-y", compact && "paper-list--compact")}>
      <button
        type="button"
        onClick={onToggleCompact}
        className="calendar-list-compact-toggle"
        aria-pressed={!compact}
      >
        {compact ? <ExpandIcon /> : <CollapseIcon />}
        <span>{compact ? "Agrandir" : "Réduire"}</span>
      </button>

      {currentMonthCells.map((cell) => {
        const isSelected =
          !!selectedDate && selectedDate.toDateString() === cell.date.toDateString();
        const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;
        const holidayName = getPublicHolidayName(cell.date);
        const vacationName = getSchoolHolidayName(cell.date, schoolZone);

        if (compact) {
          const visibleEvents = cell.events.slice(0, COMPACT_DOT_LIMIT);
          const hiddenCount = cell.events.length - visibleEvents.length;

          return (
            <button
              key={cell.date.toISOString()}
              type="button"
              onClick={() => onSelectDate(cell.date)}
              className={clsx(
                "paper-list-row paper-list-row--compact flex items-center gap-2 px-3 text-left",
                vacationName && "bg-amber-50",
                isWeekend && !vacationName && "bg-line/10",
                isSelected && "ring-2 ring-inset ring-ink/70",
                cell.isToday && "bg-ink/5"
              )}
            >
              <span
                className={clsx(
                  "calendar-list-compact-date font-bold flex-shrink-0",
                  cell.isToday && "paper-list-date--today",
                  !cell.isToday && holidayName && "calendar-list-date--holiday"
                )}
              >
                {cell.date.getDate()}
              </span>
              <span className="calendar-list-compact-weekday flex-shrink-0 uppercase">
                {format(cell.date, "EEEEE", { locale: fr })}
              </span>
              {(holidayName || vacationName) && (
                <span className="calendar-list-compact-badge truncate">
                  {holidayName ?? vacationName}
                </span>
              )}
              <span className="calendar-list-compact-dots flex-1 flex items-center gap-1 min-w-0 justify-end">
                {visibleEvents.map((event) => (
                  <span
                    key={event.id}
                    className="calendar-list-compact-dot"
                    title={event.title}
                    style={{
                      backgroundColor:
                        event.color_override ?? memberColors[event.created_by ?? ""] ?? "#4f83cc"
                    }}
                  />
                ))}
                {hiddenCount > 0 && (
                  <span className="calendar-list-compact-more">+{hiddenCount}</span>
                )}
              </span>
            </button>
          );
        }

        return (
          <button
            key={cell.date.toISOString()}
            type="button"
            onClick={() => onSelectDate(cell.date)}
            className={clsx(
              "paper-list-row flex items-stretch gap-3 px-3 py-2 text-left min-h-[56px]",
              vacationName && "bg-amber-50",
              isWeekend && !vacationName && "bg-line/10",
              isSelected && "ring-2 ring-inset ring-ink/70",
              cell.isToday && "bg-ink/5"
            )}
          >
            <div className="calendar-list-date-column flex flex-col items-center justify-center flex-shrink-0">
              <span
                className={clsx(
                  "paper-list-date flex items-center justify-center font-bold",
                  cell.isToday ? "paper-list-date--today" : holidayName && "calendar-list-date--holiday"
                )}
              >
                {cell.date.getDate()}
              </span>
              <span className="calendar-list-weekday mt-1 uppercase">
                {format(cell.date, "EEE", { locale: fr })}
              </span>
            </div>

            <div className="calendar-list-events flex-1 flex flex-col justify-center gap-1 min-w-0">
              {holidayName && (
                <span className="calendar-list-holiday truncate">
                  {holidayName}
                </span>
              )}
              {vacationName && (
                <span className="calendar-list-vacation truncate">
                  {vacationName}
                </span>
              )}
              {cell.events.length === 0 && !holidayName && !vacationName ? (
                <span className="calendar-list-empty">Journée libre</span>
              ) : (
                cell.events.map((event) => (
                  <span
                    key={event.id}
                    className="calendar-list-event truncate"
                    style={{
                      backgroundColor:
                        event.color_override ?? memberColors[event.created_by ?? ""] ?? "#4f83cc"
                    }}
                    title={event.title}
                  >
                    <CategoryIcon category={event.category} className="calendar-list-event-icon" />
                    <span className="truncate">{event.title}</span>
                  </span>
                ))
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
