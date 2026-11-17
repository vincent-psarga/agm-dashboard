import type { Cell } from '../domain/SpreadsheetReader';

const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
const DAY_MS = 24 * 60 * 60 * 1000;

/** Lower-cases, trims and strips accents: "Débit " -> "debit". */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

export function parseText(cell: Cell | undefined): string {
  if (cell === null || cell === undefined) return '';
  if (cell instanceof Date) return cell.toISOString();
  return String(cell).trim();
}

/**
 * Parses an amount, accepting numbers and strings such as "1 234,56 €" or "1,234.56".
 * Empty cells are 0. Returns `null` when the value cannot be understood.
 */
export function parseAmount(cell: Cell | undefined): number | null {
  if (cell === null || cell === undefined || cell === '') return 0;
  if (typeof cell === 'number') return Number.isFinite(cell) ? cell : null;
  if (typeof cell !== 'string') return null;

  let text = cell.replace(/[\s  €$]/g, '');
  if (text === '') return 0;

  const lastComma = text.lastIndexOf(',');
  const lastDot = text.lastIndexOf('.');
  if (lastComma > lastDot) {
    // "1.234,56" or "1234,56": the comma is the decimal separator.
    text = text.replace(/\./g, '').replace(',', '.');
  } else {
    // "1,234.56" or "1234.56": commas are thousands separators.
    text = text.replace(/,/g, '');
  }

  if (!/^[-+]?\d*\.?\d+$/.test(text)) return null;
  return Number(text);
}

/**
 * Parses a date. All dates are expressed at midnight UTC so that they are
 * not shifted by the time zone of the browser.
 * Accepts Date objects, Excel serial numbers, "dd/mm/yyyy" and "yyyy-mm-dd" strings.
 */
export function parseDate(cell: Cell | undefined): Date | null {
  if (cell instanceof Date) {
    return Number.isNaN(cell.getTime())
      ? null
      : new Date(Date.UTC(cell.getUTCFullYear(), cell.getUTCMonth(), cell.getUTCDate()));
  }
  if (typeof cell === 'number' && cell > 0) {
    return new Date(EXCEL_EPOCH_MS + Math.floor(cell) * DAY_MS);
  }
  if (typeof cell !== 'string') return null;

  const text = cell.trim();
  const dayFirst = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(text);
  if (dayFirst) {
    const [, day, month, year] = dayFirst;
    const fullYear = year.length === 2 ? 2000 + Number(year) : Number(year);
    return buildUtcDate(fullYear, Number(month), Number(day));
  }
  const isoLike = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
  if (isoLike) {
    const [, year, month, day] = isoLike;
    return buildUtcDate(Number(year), Number(month), Number(day));
  }
  return null;
}

function buildUtcDate(year: number, month: number, day: number): Date | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  const isValid =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return isValid ? date : null;
}
