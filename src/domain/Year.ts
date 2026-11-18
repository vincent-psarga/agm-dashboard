/**
 * The reports are made per year, of one of these kinds:
 * - `school`: from the 1st of September of `startYear` to the 31st of August of the next year,
 *   the usual year of the association;
 * - `calendar`: from the 1st of January to the 31st of December of `startYear`.
 */
export type YearKind = 'school' | 'calendar';

export interface Year {
  kind: YearKind;
  startYear: number;
}

export interface YearBalance {
  year: Year;
  /** Balance on the first day of the year, before its first movement. */
  openingBalance: number;
  /** Balance on the last day of the year, after its last movement. */
  closingBalance: number;
  /** closingBalance - openingBalance */
  change: number;
}

/** 0-based month on which each kind of year starts. */
const FIRST_MONTH: Record<YearKind, number> = {
  school: 8, // September
  calendar: 0, // January
};

export function yearOf(date: Date, kind: YearKind): Year {
  const year = date.getUTCFullYear();
  return { kind, startYear: date.getUTCMonth() >= FIRST_MONTH[kind] ? year : year - 1 };
}

export function isSameYear(a: Year, b: Year): boolean {
  return a.kind === b.kind && a.startYear === b.startYear;
}

/** e.g. "2024-2025" for a school year, "2024" for a calendar year. */
export function yearLabel({ kind, startYear }: Year): string {
  return kind === 'school' ? `${startYear}-${startYear + 1}` : String(startYear);
}
