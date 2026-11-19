import type { Year } from './Year';

export interface Period {
  start: Date;
  end: Date;
}

/** A movement of a category, with the amount counted in that category. */
export interface CategoryMovement {
  date: Date;
  description: string;
  amount: number;
}

export interface CategoryTotal {
  /** The category name. An empty string means "uncategorized". */
  category: string;
  amount: number;
  /** The movements of the category, from the oldest to the most recent. */
  movements: CategoryMovement[];
}

export interface ChartSlice {
  /** The category name, or `null` for the slice grouping all the other categories. */
  category: string | null;
  amount: number;
}

export interface CategoryBreakdown {
  total: number;
  /** Sorted from biggest to smallest amount. */
  categories: CategoryTotal[];
  /** The biggest categories, the remaining ones being grouped in a single "others" slice. */
  slices: ChartSlice[];
}

export interface Cotisation {
  /** The member's name, taken from the movement description. */
  memberName: string;
  date: Date;
  amount: number;
}

/** The membership fees paid during a year. */
export interface YearCotisations {
  year: Year;
  /** From the oldest to the most recent. */
  cotisations: Cotisation[];
  total: number;
}

/**
 * Movements sharing a tag "<prefix>:<key>", e.g. "cmd:sword" for a grouped order or
 * "presta:chateau-montby" for a prestation.
 */
export interface TagGroup {
  key: string;
  expenses: number;
  incomes: number;
  /** incomes - expenses */
  difference: number;
}

export interface FinancialSummary {
  period: Period;
  initialBalance: number;
  finalBalance: number;
  cotisations: Cotisation[];
  cotisationsTotal: number;
  expenses: CategoryBreakdown;
  incomes: CategoryBreakdown;
  /** Movements tagged "cmd:<key>". */
  groupedCommands: TagGroup[];
  /** Movements tagged "presta:<place>". */
  prestations: TagGroup[];
}
