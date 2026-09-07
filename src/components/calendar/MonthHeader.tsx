"use client";

import type { SVGProps } from "react";

interface MonthHeaderProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onSignOut: () => Promise<unknown> | void;
  onShare?: () => void;
}

function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ShareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4" />
      <path d="m15.4 6.5-6.8 4" />
    </svg>
  );
}

function LogOutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
    </svg>
  );
}

export function MonthHeader({
  label,
  onPrev,
  onNext,
  onToday,
  onSignOut,
  onShare,
}: MonthHeaderProps) {
  const handleSignOut = async () => {
    try {
      await onSignOut();
    } catch (error) {
      console.error("Erreur lors de la deconnexion :", error);
    }
  };

  return (
    <header className="flex items-center justify-between gap-2 px-3 py-3 sm:px-4">
      <div className="flex items-center gap-1">
        <button type="button" onClick={onPrev} aria-label="Mois precedent" className="flex h-9 w-9 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-200/60 active:scale-95">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button type="button" onClick={onToday} className="min-w-[8.5rem] rounded-lg px-2 py-1 text-center text-lg font-semibold capitalize tracking-tight text-stone-900 transition hover:bg-stone-200/50 sm:text-xl">
          {label}
        </button>
        <button type="button" onClick={onNext} aria-label="Mois suivant" className="flex h-9 w-9 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-200/60 active:scale-95">
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {onShare && (
          <button type="button" onClick={onShare} aria-label="Partager le calendrier" className="flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 active:scale-95 sm:px-5 sm:py-3 sm:text-base">
            <ShareIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="hidden sm:inline">Partager</span>
          </button>
        )}
        <button type="button" onClick={handleSignOut} aria-label="Se deconnecter" title="Se deconnecter" className="flex h-9 w-9 items-center justify-center rounded-full text-stone-600 transition hover:bg-red-100 hover:text-red-700 active:scale-95">
          <LogOutIcon className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
