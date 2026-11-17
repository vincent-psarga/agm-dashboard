import type { Movement } from '../domain/Movement';
import { MovementsFileError } from '../domain/MovementsFileError';
import type { Cell, Sheet, SheetRows } from '../domain/SpreadsheetReader';
import { normalizeText, parseAmount, parseDate, parseText } from './cellParsers';

type Column = 'date' | 'description' | 'debit' | 'credit' | 'category' | 'tag' | 'balance';

/** Accepted header names for each column (normalized: lower-case, without accents). */
const COLUMN_ALIASES: Record<Column, string[]> = {
  date: ['date'],
  description: ['description', 'libelle'],
  debit: ['debit'],
  credit: ['credit'],
  category: ['raison', 'categorie', 'category', 'reason'],
  tag: ['tag', 'tags'],
  balance: ['solde', 'balance'],
};

/** Header names reported to the user when a column is missing, as they appear in the bank export. */
const COLUMN_NAMES: Record<Column, string> = {
  date: 'Date',
  description: 'Description',
  debit: 'Débit',
  credit: 'Crédit',
  category: 'Raison',
  tag: 'Tag',
  balance: 'Solde',
};

const REQUIRED_COLUMNS: Column[] = ['date', 'debit', 'credit', 'category', 'balance'];

/** How many rows are scanned to find the header row (some exports start with a title). */
const HEADER_SEARCH_DEPTH = 15;

type ColumnIndexes = Partial<Record<Column, number>>;

type HeaderSearch =
  | { found: true; headerRowIndex: number; indexes: ColumnIndexes }
  | { found: false; missing: Column[] };

/**
 * Turns the bank export into movements, in the order of the file.
 * When the file has several sheets, the first one having the expected columns and
 * at least one movement is used. Rows without a valid date (blank lines, totals...) are ignored.
 */
export function parseMovements(sheets: Sheet[]): Movement[] {
  let closest: { sheet: Sheet; missing: Column[] } | null = null;
  let sheetWithoutMovements: Sheet | null = null;

  for (const sheet of sheets) {
    const header = findHeader(sheet.rows);
    if (!header.found) {
      if (!closest || header.missing.length < closest.missing.length) {
        closest = { sheet, missing: header.missing };
      }
      continue;
    }

    const movements = readMovements(sheet.rows, header.headerRowIndex, header.indexes);
    if (movements.length > 0) return movements;
    sheetWithoutMovements ??= sheet;
  }

  const severalSheets = sheets.length > 1;
  if (sheetWithoutMovements) {
    throw new MovementsFileError(
      'noMovements',
      [],
      severalSheets ? sheetWithoutMovements.name : undefined,
    );
  }
  throw new MovementsFileError(
    'missingColumns',
    (closest?.missing ?? REQUIRED_COLUMNS).map((column) => COLUMN_NAMES[column]),
    severalSheets ? closest?.sheet.name : undefined,
  );
}

function readMovements(rows: SheetRows, headerRowIndex: number, indexes: ColumnIndexes): Movement[] {
  const movements: Movement[] = [];
  for (const row of rows.slice(headerRowIndex + 1)) {
    const movement = parseRow(row, indexes);
    if (movement) movements.push(movement);
  }
  return movements;
}

function findHeader(rows: SheetRows): HeaderSearch {
  let leastMissing = REQUIRED_COLUMNS;

  const candidates = rows.slice(0, HEADER_SEARCH_DEPTH);
  for (let headerRowIndex = 0; headerRowIndex < candidates.length; headerRowIndex++) {
    const indexes = mapColumns(candidates[headerRowIndex]);
    const missing = REQUIRED_COLUMNS.filter((column) => indexes[column] === undefined);
    if (missing.length === 0) return { found: true, headerRowIndex, indexes };
    if (missing.length < leastMissing.length) leastMissing = missing;
  }

  return { found: false, missing: leastMissing };
}

function mapColumns(row: Cell[]): ColumnIndexes {
  const indexes: ColumnIndexes = {};
  row.forEach((cell, index) => {
    if (typeof cell !== 'string') return;
    const header = normalizeText(cell);
    for (const [column, aliases] of Object.entries(COLUMN_ALIASES) as [Column, string[]][]) {
      if (indexes[column] === undefined && aliases.includes(header)) {
        indexes[column] = index;
      }
    }
  });
  return indexes;
}

function parseRow(row: Cell[], indexes: ColumnIndexes): Movement | null {
  const cell = (column: Column) => (indexes[column] === undefined ? null : row[indexes[column]]);

  const date = parseDate(cell('date'));
  if (!date) return null;

  return {
    date,
    description: parseText(cell('description')),
    debit: Math.abs(parseAmount(cell('debit')) ?? 0),
    credit: Math.abs(parseAmount(cell('credit')) ?? 0),
    category: parseText(cell('category')),
    tag: parseText(cell('tag')),
    balance: parseAmount(cell('balance')) ?? 0,
  };
}
