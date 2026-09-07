"use client";

import clsx from "clsx";
import { WEEKDAY_LABELS_FR, type DayCell } from "@/lib/calendar/monthGrid";
import { DayCellView } from "./DayCellView";

interface MonthGridProps {
  cells: DayCell[];
  memberColors: Record<string, string>;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

export function MonthGrid({ cells, memberColors, selectedDate, onSelectDate }: MonthGridProps) {
  return (
    <div className="w-full select-none">
      <div className="grid grid-cols-7 border-b border-line pb-1 mb-1">
        {WEEKDAY_LABELS_FR.map((label) => (
          <div
            key={label}
            className="text-center text-[11px] font-semibold uppercase tracking-wide text-ink/60"
          >
            {label}
          </div>
        ))}
      </div>

      <div
        className={clsx("grid grid-cols-7 gap-[2px] bg-line rounded-md overflow-hidden", "auto-rows-fr")}
        style={{ minHeight: "68vh" }}
      >
        {cells.map((cell) => (
          <DayCellView
            key={cell.date.toISOString()}
            cell={cell}
            memberColors={memberColors}
            isSelected={
              !!selectedDate && selectedDate.toDateString() === cell.date.toDateString()
            }
            onSelect={onSelectDate}
          />
        ))}
      </div>
    </div>
  );
}
