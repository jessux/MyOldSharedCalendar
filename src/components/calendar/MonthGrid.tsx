"use client";

import { DayCellView } from "./DayCellView";
import { WEEKDAY_LABELS_FR, type DayCell } from "@/lib/calendar/monthGrid";

interface MonthGridProps {
  cells: DayCell[];
  memberColors: Record<string, string>;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

export function MonthGrid({
  cells,
  memberColors,
  selectedDate,
  onSelectDate,
}: MonthGridProps) {
  return (
    <div className="paper-calendar">
      <div className="paper-weekday-grid" aria-hidden="true">
        {WEEKDAY_LABELS_FR.map((label) => (
          <span key={label} className="paper-weekday">
            {label}
          </span>
        ))}
      </div>
      <div className="paper-calendar-grid">
        {cells.map((cell) => (
          <DayCellView
            key={cell.date.toISOString()}
            cell={cell}
            memberColors={memberColors}
            isSelected={
              selectedDate?.toDateString() === cell.date.toDateString()
            }
            onSelect={onSelectDate}
          />
        ))}
      </div>
    </div>
  );
}
