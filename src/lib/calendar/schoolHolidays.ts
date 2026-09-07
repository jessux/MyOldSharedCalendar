export type SchoolZone = "A" | "B" | "C";

export interface SchoolHolidayPeriod {
  name: string;
  zones: SchoolZone[];
  startDate: string; // yyyy-MM-dd, inclus
  endDate: string; // yyyy-MM-dd, inclus
}

/**
 * Vacances scolaires officielles, annee scolaire 2026-2027 (France metropolitaine).
 * Source : education.gouv.fr / service-public.gouv.fr.
 * A completer pour les annees suivantes lorsque publiees par le ministere.
 */
export const SCHOOL_HOLIDAYS_2026_2027: SchoolHolidayPeriod[] = [
  {
    name: "Vacances de la Toussaint",
    zones: ["A", "B", "C"],
    startDate: "2026-10-17",
    endDate: "2026-11-02"
  },
  {
    name: "Vacances de Noel",
    zones: ["A", "B", "C"],
    startDate: "2026-12-19",
    endDate: "2027-01-04"
  },
  {
    name: "Vacances d'hiver",
    zones: ["C"],
    startDate: "2027-02-06",
    endDate: "2027-02-22"
  },
  {
    name: "Vacances d'hiver",
    zones: ["A"],
    startDate: "2027-02-13",
    endDate: "2027-03-01"
  },
  {
    name: "Vacances d'hiver",
    zones: ["B"],
    startDate: "2027-02-20",
    endDate: "2027-03-08"
  },
  {
    name: "Vacances de printemps",
    zones: ["C"],
    startDate: "2027-04-03",
    endDate: "2027-04-19"
  },
  {
    name: "Vacances de printemps",
    zones: ["A"],
    startDate: "2027-04-10",
    endDate: "2027-04-26"
  },
  {
    name: "Vacances de printemps",
    zones: ["B"],
    startDate: "2027-04-17",
    endDate: "2027-05-03"
  },
  {
    name: "Vacances d'ete",
    zones: ["A", "B", "C"],
    startDate: "2027-07-03",
    endDate: "2027-08-31"
  }
];

/**
 * Academies -> zone. Utilise pour proposer une zone par defaut a l'utilisateur.
 */
export const ACADEMY_ZONES: Record<string, SchoolZone> = {
  Montpellier: "C",
  Paris: "C",
  Creteil: "C",
  Versailles: "C",
  Toulouse: "C",
  Besancon: "A",
  Bordeaux: "A",
  "Clermont-Ferrand": "A",
  Dijon: "A",
  Grenoble: "A",
  Limoges: "A",
  Lyon: "A",
  Poitiers: "A",
  "Aix-Marseille": "B",
  Amiens: "B",
  Lille: "B",
  "Nancy-Metz": "B",
  Nantes: "B",
  Nice: "B",
  Normandie: "B",
  "Orleans-Tours": "B",
  Reims: "B",
  Rennes: "B",
  Strasbourg: "B"
};

function toDateOnly(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function getSchoolHolidayName(date: Date, zone: SchoolZone): string | null {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  for (const period of SCHOOL_HOLIDAYS_2026_2027) {
    if (!period.zones.includes(zone)) continue;
    const start = toDateOnly(period.startDate);
    const end = toDateOnly(period.endDate);
    if (day >= start && day <= end) {
      return period.name;
    }
  }
  return null;
}
