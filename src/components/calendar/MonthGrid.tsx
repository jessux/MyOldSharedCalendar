"use client";

import { DayCellView } from "./DayCellView";
import type { DayCell } from "@/lib/calendar/monthGrid";

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
    <div className="paper-calendar-grid grid grid-cols-7">
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
  );
}
