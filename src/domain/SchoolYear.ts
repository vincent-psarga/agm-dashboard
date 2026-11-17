/**
 * The association works on school years: a school year runs from the 1st of September
 * of `startYear` to the 31st of August of the following year.
 */
export interface SchoolYear {
  startYear: number;
}

/** 0-based month (September) on which a school year starts. */
export const SCHOOL_YEAR_FIRST_MONTH = 8;

export function schoolYearOf(date: Date): SchoolYear {
  const year = date.getUTCFullYear();
  return { startYear: date.getUTCMonth() >= SCHOOL_YEAR_FIRST_MONTH ? year : year - 1 };
}

/** e.g. "2024-2025" */
export function schoolYearLabel({ startYear }: SchoolYear): string {
  return `${startYear}-${startYear + 1}`;
}
