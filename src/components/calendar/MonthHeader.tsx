"use client";

import { ChevronLeft, ChevronRight } from "./icons";

interface MonthHeaderProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function MonthHeader({ label, onPrev, onNext, onToday }: MonthHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2 py-3">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Mois précédent"
        className="p-2 rounded-full active:bg-line/60"
      >
        <ChevronLeft />
      </button>

      <button
        type="button"
        onClick={onToday}
        className="text-lg font-bold capitalize tracking-tight text-ink"
      >
        {label}
      </button>

      <button
        type="button"
        onClick={onNext}
        aria-label="Mois suivant"
        className="p-2 rounded-full active:bg-line/60"
      >
        <ChevronRight />
      </button>
    </div>
  );
}
