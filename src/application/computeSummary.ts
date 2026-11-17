import type {
  CategoryBreakdown,
  ChartSlice,
  FinancialSummary,
  GroupedCommand,
} from '../domain/FinancialSummary';
import type { Movement } from '../domain/Movement';
import { normalizeText } from './cellParsers';

/** Number of categories named in the pie charts, the other ones are grouped together. */
export const NAMED_SLICES_COUNT = 5;

const COTISATION_CATEGORIES = ['cotisation', 'cotisations'];
const COMMAND_TAG_PREFIX = 'cmd:';

export function computeSummary(movements: Movement[]): FinancialSummary {
  if (movements.length === 0) throw new Error('Cannot summarize an empty list of movements');

  const ordered = orderChronologically(movements);
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  const cotisations = ordered.filter(isCotisation);

  return {
    period: { start: first.date, end: last.date },
    initialBalance: roundCents(first.balance - first.credit + first.debit),
    finalBalance: last.balance,
    cotisations,
    cotisationsTotal: sum(cotisations.map((movement) => movement.credit)),
    expenses: breakdown(ordered, (movement) => movement.debit),
    incomes: breakdown(ordered, (movement) => movement.credit),
    groupedCommands: groupCommands(ordered),
  };
}

/**
 * Bank exports are often sorted from the most recent movement to the oldest one.
 * The order of the file is kept for movements happening on the same day, as it is
 * the only information we have to know which one came first.
 */
export function orderChronologically(movements: Movement[]): Movement[] {
  const isMostRecentFirst =
    movements[0].date.getTime() > movements[movements.length - 1].date.getTime();
  const fileOrder = isMostRecentFirst ? [...movements].reverse() : [...movements];
  return fileOrder.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function isCotisation(movement: Movement): boolean {
  return COTISATION_CATEGORIES.includes(normalizeText(movement.category));
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
