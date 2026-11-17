import { describe, expect, it } from 'vitest';
import { normalizeText, parseAmount, parseDate } from './cellParsers';

describe('normalizeText', () => {
  it('lower-cases, trims and removes accents', () => {
    expect(normalizeText('  Débit ')).toBe('debit');
  });
});

describe('parseAmount', () => {
  it.each([
    [12.5, 12.5],
    [null, 0],
    ['', 0],
    ['1234.56', 1234.56],
    ['1 234,56 €', 1234.56],
    ['1.234,56', 1234.56],
    ['1,234.56', 1234.56],
    ['-45,10', -45.1],
  ])('parses %j as %d', (cell, expected) => {
    expect(parseAmount(cell)).toBe(expected);
  });

  it('returns null for values that are not amounts', () => {
    expect(parseAmount('n/a')).toBeNull();
    expect(parseAmount(true)).toBeNull();
  });
});

describe('parseDate', () => {
  const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);

  it('keeps Date cells, at midnight UTC', () => {
    expect(parseDate(new Date('2025-03-14T15:30:00Z'))).toEqual(utc('2025-03-14'));
  });

  it('parses Excel serial numbers', () => {
    expect(parseDate(45658)).toEqual(utc('2025-01-01'));
  });

  it('parses day-first strings', () => {
    expect(parseDate('14/03/2025')).toEqual(utc('2025-03-14'));
    expect(parseDate('14/03/25')).toEqual(utc('2025-03-14'));
  });

  it('parses ISO strings', () => {
    expect(parseDate('2025-03-14')).toEqual(utc('2025-03-14'));
  });

  it('returns null for invalid dates', () => {
    expect(parseDate('31/02/2025')).toBeNull();
    expect(parseDate('Total')).toBeNull();
    expect(parseDate(null)).toBeNull();
  });
});
