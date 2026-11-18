import type { Movement } from '../domain/Movement';
import { schoolYearOf } from '../domain/SchoolYear';
import type { SchoolYear, SchoolYearBalance } from '../domain/SchoolYear';
import { balancesOf } from './computeSummary';
import { analyzeRowOrder } from './rowOrder';

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
 *
 * A year ends with the balance of its last row in the file, and starts with the balance the
 * previous year ended with, so that consecutive years always match. The first year of the
 * file starts with the balance before its first row.
 */
export function compareWithPreviousSchoolYears(
  movements: Movement[],
  schoolYear: SchoolYear,
  previousYearsCount = 2,
): SchoolYearBalance[] {
  // Known from the whole file: the rows of a single year are not enough.
  const { mostRecentFirst } = analyzeRowOrder(movements);
  const balances: SchoolYearBalance[] = [];
  const oldestFirst = listSchoolYears(movements)
    .filter(({ startYear }) => startYear <= schoolYear.startYear)
    .reverse();

  for (const year of oldestFirst) {
    const { initialBalance, finalBalance } = balancesOf(
      movementsOfSchoolYear(movements, year),
      mostRecentFirst,
    );
    const openingBalance = balances.at(-1)?.closingBalance ?? initialBalance;
    balances.push({
      schoolYear: year,
      openingBalance,
      closingBalance: finalBalance,
      change: Math.round((finalBalance - openingBalance) * 100) / 100,
    });
  }

  return balances.slice(-(previousYearsCount + 1));
}
