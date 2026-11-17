import type { Movement } from '../domain/Movement';
import { schoolYearOf } from '../domain/SchoolYear';
import type { SchoolYear } from '../domain/SchoolYear';

/** The school years covered by the movements, from the most recent to the oldest. */
export function listSchoolYears(movements: Movement[]): SchoolYear[] {
  const startYears = new Set(movements.map((movement) => schoolYearOf(movement.date).startYear));
  return [...startYears].sort((a, b) => b - a).map((startYear) => ({ startYear }));
}

/** The movements of a school year, or all of them when no school year is given. */
export function movementsOfSchoolYear(movements: Movement[], schoolYear: SchoolYear | null): Movement[] {
  if (schoolYear === null) return movements;
  return movements.filter(
    (movement) => schoolYearOf(movement.date).startYear === schoolYear.startYear,
  );
}
