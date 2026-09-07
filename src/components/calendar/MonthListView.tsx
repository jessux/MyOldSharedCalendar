"use client";

import clsx from "clsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { DayCell } from "@/lib/calendar/monthGrid";
import { getPublicHolidayName } from "@/lib/calendar/publicHolidays";
import { getSchoolHolidayName, type SchoolZone } from "@/lib/calendar/schoolHolidays";

interface MonthListViewProps {
  cells: DayCell[];
  memberColors: Record<string, string>;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  schoolZone: SchoolZone;
}

export function MonthListView({
  cells,
  memberColors,
  selectedDate,
  onSelectDate,
  schoolZone
}: MonthListViewProps) {
  const currentMonthCells = cells.filter((c) => c.isCurrentMonth);

  return (
    <div className="w-full flex flex-col divide-y divide-line border-t border-b border-line">
      {currentMonthCells.map((cell) => {
        const isSelected =
          !!selectedDate && selectedDate.toDateString() === cell.date.toDateString();
        const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;
        const holidayName = getPublicHolidayName(cell.date);
        const vacationName = getSchoolHolidayName(cell.date, schoolZone);

        return (
          <button
            key={cell.date.toISOString()}
            type="button"
            onClick={() => onSelectDate(cell.date)}
            className={clsx(
              "flex items-stretch gap-3 px-3 py-2 text-left min-h-[56px]",
              vacationName && "bg-amber-50",
              isWeekend && !vacationName && "bg-line/10",
              isSelected && "ring-2 ring-inset ring-ink/70",
              cell.isToday && "bg-ink/5"
            )}
          >
            <div className="flex flex-col items-center justify-center w-12 flex-shrink-0">
              <span
                className={clsx(
                  "text-xl font-bold w-9 h-9 flex items-center justify-center rounded-full",
                  cell.isToday ? "bg-ink text-paper" : holidayName ? "text-red-600" : "text-ink"
                )}
              >
                {cell.date.getDate()}
              </span>
              <span className="text-[10px] uppercase text-ink/50 font-semibold mt-0.5">
                {format(cell.date, "EEE", { locale: fr })}
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
              {holidayName && (
                <span className="text-[11px] font-semibold text-red-600 truncate">
                  {holidayName}
                </span>
              )}
              {vacationName && (
                <span className="text-[11px] font-semibold text-amber-700 truncate">
                  {vacationName}
                </span>
              )}
              {cell.events.length === 0 && !holidayName && !vacationName ? (
                <span className="text-xs text-ink/30 italic">—</span>
              ) : (
                cell.events.map((event) => (
                  <span
                    key={event.id}
                    className="truncate rounded-sm px-2 py-0.5 text-xs leading-tight text-white w-fit max-w-full"
                    style={{
                      backgroundColor:
                        event.color_override ?? memberColors[event.created_by ?? ""] ?? "#4f83cc"
                    }}
                    title={event.title}
                  >
                    {event.title}
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
