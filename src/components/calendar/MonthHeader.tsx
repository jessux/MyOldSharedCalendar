"use client";

import { ChevronLeft, ChevronRight, LogOut } from "./icons";

interface MonthHeaderProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onSignOut?: () => void;
}

export function MonthHeader({ label, onPrev, onNext, onToday, onSignOut }: MonthHeaderProps) {
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

      <div className="flex items-center">
        <button
          type="button"
          onClick={onNext}
          aria-label="Mois suivant"
          className="p-2 rounded-full active:bg-line/60"
        >
          <ChevronRight />
        </button>
        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Se déconnecter"
            className="p-2 rounded-full active:bg-line/60"
          >
            <LogOut />
          </button>
        )}
      </div>
    </div>
  );
}
