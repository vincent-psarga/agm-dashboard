import type { Movement } from '../domain/Movement';
import { yearOf } from '../domain/Year';
import type { Year, YearBalance, YearKind } from '../domain/Year';
import { balancesOf } from './computeSummary';
import { analyzeRowOrder } from './rowOrder';

/** The years of the given kind covered by the movements, from the most recent to the oldest. */
export function listYears(movements: Movement[], kind: YearKind): Year[] {
  const startYears = new Set(movements.map((movement) => yearOf(movement.date, kind).startYear));
  return [...startYears].sort((a, b) => b - a).map((startYear) => ({ kind, startYear }));
}

/** The movements of a year, or all of them when no year is given. */
export function movementsOfYear(movements: Movement[], year: Year | null): Movement[] {
  if (year === null) return movements;
  return movements.filter(
    (movement) => yearOf(movement.date, year.kind).startYear === year.startYear,
  );
}

/**
 * Balances of the given year and of the previous ones found in the file,
 * from the oldest to the given one, to see how the association did over time.
 *
 * A year ends with the balance of its last row in the file, and starts with the balance the
 * previous year ended with, so that consecutive years always match. The first year of the
 * file starts with the balance before its first row.
 */
export function compareWithPreviousYears(
  movements: Movement[],
  year: Year,
  previousYearsCount = 2,
): YearBalance[] {
  // Known from the whole file: the rows of a single year are not enough.
  const { mostRecentFirst } = analyzeRowOrder(movements);
  const balances: YearBalance[] = [];
  const oldestFirst = listYears(movements, year.kind)
    .filter(({ startYear }) => startYear <= year.startYear)
    .reverse();

  for (const previousYear of oldestFirst) {
    const { initialBalance, finalBalance } = balancesOf(
      movementsOfYear(movements, previousYear),
      mostRecentFirst,
    );
    const openingBalance = balances.at(-1)?.closingBalance ?? initialBalance;
    balances.push({
      year: previousYear,
      openingBalance,
      closingBalance: finalBalance,
      change: Math.round((finalBalance - openingBalance) * 100) / 100,
    });
  }

  return balances.slice(-(previousYearsCount + 1));
}
