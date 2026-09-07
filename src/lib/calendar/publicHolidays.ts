import { format } from "date-fns";

export interface PublicHoliday {
  date: string; // yyyy-MM-dd
  name: string;
}

/**
 * Calcule le dimanche de Paques pour une annee donnee (algorithme de Meeus/Jones/Butcher).
 */
function computeEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Retourne tous les jours feries francais (metropole) pour une annee donnee.
 * Fonctionne pour n'importe quelle annee, sans donnee externe.
 */
export function getPublicHolidays(year: number): PublicHoliday[] {
  const easter = computeEaster(year);

  const holidays: PublicHoliday[] = [
    { date: `${year}-01-01`, name: "Jour de l'An" },
    { date: format(addDays(easter, 1), "yyyy-MM-dd"), name: "Lundi de Paques" },
    { date: `${year}-05-01`, name: "Fete du Travail" },
    { date: `${year}-05-08`, name: "Victoire 1945" },
    { date: format(addDays(easter, 39), "yyyy-MM-dd"), name: "Ascension" },
    { date: format(addDays(easter, 50), "yyyy-MM-dd"), name: "Lundi de Pentecote" },
    { date: `${year}-07-14`, name: "Fete Nationale" },
    { date: `${year}-08-15`, name: "Assomption" },
    { date: `${year}-11-01`, name: "Toussaint" },
    { date: `${year}-11-11`, name: "Armistice 1918" },
    { date: `${year}-12-25`, name: "Noel" }
  ];

  return holidays;
}

let cache: Map<number, Map<string, string>> = new Map();

export function getPublicHolidayName(date: Date): string | null {
  const year = date.getFullYear();
  if (!cache.has(year)) {
    const map = new Map<string, string>();
    for (const h of getPublicHolidays(year)) {
      map.set(h.date, h.name);
    }
    cache.set(year, map);
  }
  const key = format(date, "yyyy-MM-dd");
  return cache.get(year)?.get(key) ?? null;
}
