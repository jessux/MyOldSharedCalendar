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

  return (
    <button
      type="button"
      onClick={() => onSelect(cell.date)}
      className={clsx(
        "relative flex flex-col items-stretch bg-paper p-1 text-left align-top",
        "min-h-[13vh] transition-colors",
        !cell.isCurrentMonth && "opacity-40",
        isSelected && "ring-2 ring-inset ring-ink/70"
      )}
    >
      <span
        className={clsx(
          "self-end text-[12px] font-semibold w-5 h-5 flex items-center justify-center rounded-full",
          cell.isToday ? "bg-ink text-paper" : "text-ink/80"
        )}
      >
        {cell.date.getDate()}
      </span>

      <div className="mt-1 flex flex-col gap-[2px] overflow-hidden">
        {visibleEvents.map((event) => (
          <span
            key={event.id}
            className="truncate rounded-sm px-1 py-[1px] text-[10px] leading-tight text-white"
            style={{
              backgroundColor:
                event.color_override ?? memberColors[event.created_by ?? ""] ?? "#4f83cc"
            }}
            title={event.title}
          >
            {event.title}
          </span>
        ))}

        {overflowCount > 0 && (
          <span className="text-[10px] font-medium text-ink/60 px-1">
            +{overflowCount}
          </span>
        )}
      </div>
    </button>
  );
}
