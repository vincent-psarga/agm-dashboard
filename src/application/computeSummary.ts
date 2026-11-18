import type {
  CategoryBreakdown,
  Cotisation,
  ChartSlice,
  FinancialSummary,
  GroupedCommand,
} from '../domain/FinancialSummary';
import type { Movement } from '../domain/Movement';
import { normalizeText } from './cellParsers';
import { analyzeRowOrder } from './rowOrder';

/** Number of categories named in the pie charts, the other ones are grouped together. */
export const NAMED_SLICES_COUNT = 5;

const COTISATION_CATEGORIES = ['cotisation', 'cotisations'];
const COMMAND_TAG_PREFIX = 'cmd:';

export function computeSummary(movements: Movement[]): FinancialSummary {
  if (movements.length === 0) throw new Error('Cannot summarize an empty list of movements');

  const ordered = orderChronologically(movements);
  const cotisations = ordered.filter(isCotisation).map(toCotisation);

  return {
    period: { start: ordered[0].date, end: ordered[ordered.length - 1].date },
    ...balancesOf(ordered),
    cotisations,
    cotisationsTotal: sum(cotisations.map((cotisation) => cotisation.amount)),
    expenses: breakdown(ordered, (movement) => movement.debit),
    incomes: breakdown(ordered, (movement) => movement.credit),
    groupedCommands: groupCommands(ordered),
  };
}

/**
 * Balance before the first movement and after the last one.
 * The initial balance is deduced from the first movement, by cancelling it.
 */
export function balancesOf(movements: Movement[]): { initialBalance: number; finalBalance: number } {
  const ordered = orderChronologically(movements);
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
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
export function orderChronologically(movements: Movement[]): Movement[] {
  const { mostRecentFirst } = analyzeRowOrder(movements);
  const fileOrder = mostRecentFirst ? [...movements].reverse() : [...movements];
  return fileOrder.sort((a, b) => a.date.getTime() - b.date.getTime());
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
  const totals = new Map<string, number>();
  for (const movement of movements) {
    const amount = amountOf(movement);
    if (amount === 0) continue;
    totals.set(movement.category, (totals.get(movement.category) ?? 0) + amount);
  }

  const categories = [...totals.entries()]
    .map(([category, amount]) => ({ category, amount: roundCents(amount) }))
    .sort((a, b) => b.amount - a.amount || a.category.localeCompare(b.category));

  return {
    total: sum(categories.map((category) => category.amount)),
    categories,
    slices: toSlices(categories),
  };
}

function toSlices(categories: CategoryBreakdown['categories']): ChartSlice[] {
  // Grouping a single category under "others" would hide its name for nothing.
  if (categories.length <= NAMED_SLICES_COUNT + 1) return categories;

  const named = categories.slice(0, NAMED_SLICES_COUNT);
  const others = categories.slice(NAMED_SLICES_COUNT);
  return [...named, { category: null, amount: sum(others.map((category) => category.amount)) }];
}

export function groupCommands(movements: Movement[]): GroupedCommand[] {
  const commands = new Map<string, { expenses: number; incomes: number }>();

  for (const movement of movements) {
    for (const key of commandKeys(movement.tag)) {
      const command = commands.get(key) ?? { expenses: 0, incomes: 0 };
      command.expenses += movement.debit;
      command.incomes += movement.credit;
      commands.set(key, command);
    }
  }

  return [...commands.entries()]
    .map(([key, { expenses, incomes }]) => ({
      key,
      expenses: roundCents(expenses),
      incomes: roundCents(incomes),
      difference: roundCents(incomes - expenses),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/** Extracts the command keys from a tag cell, e.g. "cmd:sword" -> ["sword"]. */
function commandKeys(tag: string): string[] {
  const keys = tag
    .split(/[\s,;]+/)
    .filter((part) => part.toLowerCase().startsWith(COMMAND_TAG_PREFIX))
    .map((part) => part.slice(COMMAND_TAG_PREFIX.length).trim())
    .filter((key) => key !== '');
  return [...new Set(keys)];
}

function sum(values: number[]): number {
  return roundCents(values.reduce((total, value) => total + value, 0));
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}
