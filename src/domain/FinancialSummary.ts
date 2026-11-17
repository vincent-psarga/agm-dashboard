export interface Period {
  start: Date;
  end: Date;
}

export interface CategoryTotal {
  /** The category name. An empty string means "uncategorized". */
  category: string;
  amount: number;
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

export interface GroupedCommand {
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
  groupedCommands: GroupedCommand[];
}
