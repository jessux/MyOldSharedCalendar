"use client";

import { ChevronLeftIcon, ChevronRightIcon, ShareIcon, LogOutIcon } from "./icons";

interface MonthHeaderProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onShare: () => void;
  onSignOut: () => void;
}

export function MonthHeader({
  label,
  onPrev,
  onNext,
  onShare,
  onSignOut,
}: MonthHeaderProps) {
  const handleSignOut = async () => {
    try {
      await onSignOut();
    } catch (err) {
      console.error("Erreur lors de la deconnexion:", err);
    }
  };

  return (
    <header className="relative flex items-center justify-between gap-2 px-3 py-3 sm:px-4">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Mois precedent"
          className="flex h-9 w-9 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-200/60 active:scale-95"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="min-w-[9rem] text-center text-lg font-semibold capitalize tracking-tight text-stone-900 sm:text-xl">
          {label}
        </h1>
        <button
          type="button"
          onClick={onNext}
          aria-label="Mois suivant"
          className="flex h-9 w-9 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-200/60 active:scale-95"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onShare}
          aria-label="Partager le calendrier"
          className="flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 active:scale-95 sm:px-5 sm:py-3 sm:text-base"
        >
          <ShareIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="hidden sm:inline">Partager</span>
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          aria-label="Se deconnecter"
          title="Se deconnecter"
          className="flex h-9 w-9 items-center justify-center rounded-full text-stone-600 transition hover:bg-red-100 hover:text-red-700 active:scale-95"
        >
          <LogOutIcon className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
