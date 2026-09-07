"use client";

import clsx from "clsx";
import type { DayCell } from "@/lib/calendar/monthGrid";

const MAX_VISIBLE_EVENTS = 3;

interface DayCellViewProps {
  cell: DayCell;
  memberColors: Record<string, string>;
  isSelected: boolean;
  onSelect: (date: Date) => void;
}

export function DayCellView({ cell, memberColors, isSelected, onSelect }: DayCellViewProps) {
  const visibleEvents = cell.events.slice(0, MAX_VISIBLE_EVENTS);
  const overflowCount = cell.events.length - visibleEvents.length;
  const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;

  return (
    <button
      type="button"
      onClick={() => onSelect(cell.date)}
      className={clsx(
        "paper-day relative flex flex-col items-stretch transition-colors",
        !cell.isCurrentMonth && "paper-day--outside",
        isWeekend && "paper-day--weekend",
        isSelected && "paper-day--selected"
      )}
    >
      <span
        className={clsx(
          "paper-day-number self-start",
          cell.isToday && "paper-day-number--today"
        )}
      >
        {cell.date.getDate()}
      </span>

      <div className="paper-day-events">
        {visibleEvents.map((event) => (
          <span
            key={event.id}
            className="paper-event truncate leading-tight"
            style={{
              "--event-color":
                event.color_override ?? memberColors[event.created_by ?? ""] ?? "#4f83cc",
              backgroundColor:
                event.color_override ?? memberColors[event.created_by ?? ""] ?? "#4f83cc"
            } as React.CSSProperties}
            title={event.title}
          >
            {event.title}
          </span>
        ))}

        {overflowCount > 0 && (
          <span className="text-[10px] font-bold text-ink/60 px-1">
            +{overflowCount}
          </span>
        )}
      </div>
    </button>
  );
}
