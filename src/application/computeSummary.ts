import type {
  CategoryBreakdown,
  CategoryMovement,
  CategoryTotal,
  Cotisation,
  ChartSlice,
  FinancialSummary,
  TagGroup,
} from '../domain/FinancialSummary';
import type { Movement } from '../domain/Movement';
import { normalizeText } from './cellParsers';
import { analyzeRowOrder } from './rowOrder';

/** Number of categories named in the pie charts, the other ones are grouped together. */
export const NAMED_SLICES_COUNT = 5;

const COTISATION_CATEGORIES = ['cotisation', 'cotisations'];
const COMMAND_TAG_PREFIX = 'cmd:';
const PRESTATION_TAG_PREFIX = 'presta:';

/**
 * @param mostRecentFirst order of the rows in the whole file: it must be given when the
 * movements are only a part of the file (e.g. a school year), as a few rows are not enough
 * to know it.
 */
export function computeSummary(
  movements: Movement[],
  mostRecentFirst = analyzeRowOrder(movements).mostRecentFirst,
): FinancialSummary {
  if (movements.length === 0) throw new Error('Cannot summarize an empty list of movements');

  const ordered = orderChronologically(movements, mostRecentFirst);
  const cotisations = cotisationsOf(ordered);

  return {
    period: { start: ordered[0].date, end: ordered[ordered.length - 1].date },
    ...balancesOf(movements, mostRecentFirst),
    cotisations,
    cotisationsTotal: sum(cotisations.map((cotisation) => cotisation.amount)),
    expenses: breakdown(ordered, (movement) => movement.debit),
    incomes: breakdown(ordered, (movement) => movement.credit),
    groupedCommands: groupByTag(ordered, COMMAND_TAG_PREFIX),
    prestations: groupByTag(ordered, PRESTATION_TAG_PREFIX),
  };
}

/**
 * Balance before the first row of the file and after its last row.
 *
 * The rows are taken in the order of the file, not sorted by date: the "Solde" column follows
 * the order of the rows, so a row with a typo in its date must not change which balance is
 * read. The initial balance is deduced from the first row, by cancelling its movement.
 */
export function balancesOf(
  movements: Movement[],
  mostRecentFirst = analyzeRowOrder(movements).mostRecentFirst,
): { initialBalance: number; finalBalance: number } {
  const fileOrder = mostRecentFirst ? [...movements].reverse() : movements;
  const first = fileOrder[0];
  const last = fileOrder[fileOrder.length - 1];
  return {
    initialBalance: roundCents(first.balance - first.credit + first.debit),
    finalBalance: last.balance,
  };
}

/**
 * Bank exports are often sorted from the most recent movement to the oldest one.
 * The order of the file is kept for movements happening on the same day, as it is
 * the only information we have to know which one came first.
 */
export function orderChronologically(
  movements: Movement[],
  mostRecentFirst = analyzeRowOrder(movements).mostRecentFirst,
): Movement[] {
  const fileOrder = mostRecentFirst ? [...movements].reverse() : [...movements];
  return fileOrder.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** The membership fees paid in the given movements, in the same order. */
export function cotisationsOf(movements: Movement[]): Cotisation[] {
  return movements.filter(isCotisation).map(toCotisation);
}

function isCotisation(movement: Movement): boolean {
  return COTISATION_CATEGORIES.includes(normalizeText(movement.category));
}

function toCotisation(movement: Movement): Cotisation {
  return { memberName: memberName(movement.description), date: movement.date, amount: movement.credit };
}

/**
 * Removes the leading "Cotisation" word the descriptions start with:
 * "Cotisation - Alice Martin" -> "Alice Martin".
 */
export function memberName(description: string): string {
  const name = description.replace(/^\s*cotisations?\b[\s:,-]*/i, '').trim();
  return name || description.trim();
}

export function breakdown(
  movements: Movement[],
  amountOf: (movement: Movement) => number,
): CategoryBreakdown {
  const movementsByCategory = new Map<string, CategoryMovement[]>();
  for (const movement of movements) {
    const amount = amountOf(movement);
    if (amount === 0) continue;
    const categoryMovements = movementsByCategory.get(movement.category) ?? [];
    categoryMovements.push({ date: movement.date, description: movement.description, amount });
    movementsByCategory.set(movement.category, categoryMovements);
  }

  const categories = [...movementsByCategory.entries()]
    .map(([category, categoryMovements]) => ({
      category,
      amount: sum(categoryMovements.map((movement) => movement.amount)),
      movements: categoryMovements,
    }))
    .sort((a, b) => b.amount - a.amount || a.category.localeCompare(b.category));

  return {
    total: sum(categories.map((category) => category.amount)),
    categories,
    slices: toSlices(categories),
  };
}

function toSlices(categories: CategoryBreakdown['categories']): ChartSlice[] {
  // Grouping a single category under "others" would hide its name for nothing.
  const toSlice = ({ category, amount }: CategoryTotal): ChartSlice => ({ category, amount });
  if (categories.length <= NAMED_SLICES_COUNT + 1) return categories.map(toSlice);

  const named = categories.slice(0, NAMED_SLICES_COUNT).map(toSlice);
  const others = categories.slice(NAMED_SLICES_COUNT);
  return [...named, { category: null, amount: sum(others.map((category) => category.amount)) }];
}

/** Groups the movements tagged "<prefix><key>" by key, e.g. "cmd:sword" -> "sword". */
export function groupByTag(movements: Movement[], prefix: string): TagGroup[] {
  const groups = new Map<string, { expenses: number; incomes: number }>();

  for (const movement of movements) {
    for (const key of tagKeys(movement.tag, prefix)) {
      const group = groups.get(key) ?? { expenses: 0, incomes: 0 };
      group.expenses += movement.debit;
      group.incomes += movement.credit;
      groups.set(key, group);
    }
  }

  return [...groups.entries()]
    .map(([key, { expenses, incomes }]) => ({
      key,
      expenses: roundCents(expenses),
      incomes: roundCents(incomes),
      difference: roundCents(incomes - expenses),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/** Extracts the keys of a prefix from a tag cell, e.g. "cmd:sword" -> ["sword"]. */
function tagKeys(tag: string, prefix: string): string[] {
  const keys = tag
    .split(/[\s,;]+/)
    .filter((part) => part.toLowerCase().startsWith(prefix))
    .map((part) => part.slice(prefix.length).trim())
    .filter((key) => key !== '');
  return [...new Set(keys)];
}

function sum(values: number[]): number {
  return roundCents(values.reduce((total, value) => total + value, 0));
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}
