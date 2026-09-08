"use client";

import type { CSSProperties, SVGProps } from "react";

interface MonthHeaderProps {
  label: string;
  year: number;
  monthIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onShare?: () => void;
}

const MONTH_ACCENTS = [
  "#2d416c",
  "#176b78",
  "#247447",
  "#d49a22",
  "#ce5274",
  "#2682a1",
  "#b83232",
  "#7d4c8f",
  "#2d416c",
  "#176b78",
  "#247447",
  "#b83232"
];

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

export function MonthHeader({
  label,
  year,
  monthIndex,
  onPrev,
  onNext,
  onToday,
  onShare,
}: MonthHeaderProps) {
  return (
    <header
      className="calendar-month-header"
      style={{ "--month-accent": MONTH_ACCENTS[monthIndex] ?? MONTH_ACCENTS[0] } as CSSProperties}
    >
      <div className="calendar-month-nav">
        <button type="button" onClick={onPrev} aria-label="Mois precedent" className="calendar-icon-button">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div className="calendar-month-heading">
          <span className="calendar-year">{year}</span>
          <span className="calendar-month-label">{label.replace(` ${year}`, "")}</span>
        </div>
        <button type="button" onClick={onNext} aria-label="Mois suivant" className="calendar-icon-button">
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="calendar-action-row">
        <button type="button" onClick={onToday} className="calendar-today-button">
          Aujourd&apos;hui
        </button>
        {onShare && (
          <button type="button" onClick={onShare} aria-label="Partager le calendrier" className="calendar-share-button">
            <ShareIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="hidden sm:inline">Partager</span>
          </button>
        )}
      </div>
    </header>
  );
}
