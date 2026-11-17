import type { Movement } from '../domain/Movement';
import { schoolYearOf } from '../domain/SchoolYear';
import type { SchoolYear, SchoolYearBalance } from '../domain/SchoolYear';
import { balancesOf } from './computeSummary';

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

/**
 * Balances of the given school year and of the previous ones found in the file,
 * from the oldest to the given one, to see how the association did over time.
 */
export function compareWithPreviousSchoolYears(
  movements: Movement[],
  schoolYear: SchoolYear,
  previousYearsCount = 2,
): SchoolYearBalance[] {
  return listSchoolYears(movements)
    .filter(({ startYear }) => startYear <= schoolYear.startYear)
    .slice(0, previousYearsCount + 1)
    .reverse()
    .map((year) => {
      const { initialBalance, finalBalance } = balancesOf(movementsOfSchoolYear(movements, year));
      return {
        schoolYear: year,
        openingBalance: initialBalance,
        closingBalance: finalBalance,
        change: Math.round((finalBalance - initialBalance) * 100) / 100,
      };
    });
}
