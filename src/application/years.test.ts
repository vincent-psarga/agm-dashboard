import { describe, expect, it } from 'vitest';
import { yearLabel, yearOf } from '../domain/Year';
import type { Year } from '../domain/Year';
import { aMovement } from '../test/movementFactory';
import { compareWithPreviousYears, cotisationsByYear, listYears, movementsOfYear } from './years';

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);
const school = (startYear: number): Year => ({ kind: 'school', startYear });
const calendar = (startYear: number): Year => ({ kind: 'calendar', startYear });

describe('yearOf', () => {
  it.each([
    ['2024-09-01', 2024],
    ['2024-12-31', 2024],
    ['2025-01-01', 2024],
    ['2025-08-31', 2024],
    ['2025-09-01', 2025],
  ])('puts %s in the school year starting in %d', (date, startYear) => {
    expect(yearOf(utc(date), 'school')).toEqual(school(startYear));
  });

  it.each([
    ['2024-01-01', 2024],
    ['2024-12-31', 2024],
    ['2025-01-01', 2025],
  ])('puts %s in the calendar year %d', (date, startYear) => {
    expect(yearOf(utc(date), 'calendar')).toEqual(calendar(startYear));
  });
});

describe('yearLabel', () => {
  it('shows both calendar years of a school year', () => {
    expect(yearLabel(school(2024))).toBe('2024-2025');
  });

  it('shows the calendar year', () => {
    expect(yearLabel(calendar(2024))).toBe('2024');
  });
});

describe('listYears', () => {
  it('lists the school years covered by the movements, most recent first', () => {
    const movements = [
      aMovement({ date: '2023-10-01' }),
      aMovement({ date: '2024-06-30' }),
      aMovement({ date: '2025-09-15' }),
      aMovement({ date: '2024-09-01' }),
    ];

    expect(listYears(movements, 'school')).toEqual([school(2025), school(2024), school(2023)]);
  });

  it('lists the calendar years covered by the movements, most recent first', () => {
    const movements = [
      aMovement({ date: '2023-10-01' }),
      aMovement({ date: '2024-06-30' }),
      aMovement({ date: '2025-09-15' }),
      aMovement({ date: '2024-09-01' }),
    ];

    expect(listYears(movements, 'calendar')).toEqual([calendar(2025), calendar(2024), calendar(2023)]);
  });
});

describe('movementsOfYear', () => {
  const august = aMovement({ date: '2024-08-31' });
  const september = aMovement({ date: '2024-09-01' });
  const nextAugust = aMovement({ date: '2025-08-31' });
  const movements = [august, september, nextAugust];

  it('keeps the movements from the 1st of September to the 31st of August', () => {
    expect(movementsOfYear(movements, school(2024))).toEqual([september, nextAugust]);
  });

  it('keeps the movements from the 1st of January to the 31st of December', () => {
    expect(movementsOfYear(movements, calendar(2025))).toEqual([nextAugust]);
  });

  it('keeps all the movements when no year is selected', () => {
    expect(movementsOfYear(movements, null)).toEqual(movements);
  });
});

describe('compareWithPreviousYears', () => {
  // One movement per school year, from 2021-2022 to 2024-2025.
  const movements = [
    aMovement({ date: '2021-10-01', credit: 100, balance: 1100 }),
    aMovement({ date: '2022-10-01', credit: 200, balance: 1300 }),
    aMovement({ date: '2023-10-01', debit: 50, balance: 1250 }),
    aMovement({ date: '2024-10-01', credit: 750, balance: 2000 }),
  ];

  it('gives the balances of the school year and of the 2 previous ones, oldest first', () => {
    expect(compareWithPreviousYears(movements, school(2024))).toEqual([
      { year: school(2022), openingBalance: 1100, closingBalance: 1300, change: 200 },
      { year: school(2023), openingBalance: 1300, closingBalance: 1250, change: -50 },
      { year: school(2024), openingBalance: 1250, closingBalance: 2000, change: 750 },
    ]);
  });

  it('starts each year with the balance of the last row of the previous one', () => {
    const rows = [
      aMovement({ date: '2024-09-03', balance: 1234 }),
      aMovement({ date: '2025-07-10', balance: 5678 }),
      aMovement({ date: '2025-09-01', balance: 5656 }),
      aMovement({ date: '2026-08-30', balance: 123 }),
      aMovement({ date: '2026-09-01', balance: 456 }),
    ];

    expect(compareWithPreviousYears(rows, school(2026))).toEqual([
      { year: school(2024), openingBalance: 1234, closingBalance: 5678, change: 4444 },
      { year: school(2025), openingBalance: 5678, closingBalance: 123, change: -5555 },
      { year: school(2026), openingBalance: 123, closingBalance: 456, change: 333 },
    ]);
  });

  it('ends a year with the balance of its last row in the file, even with a typo in a date', () => {
    const rows = [
      aMovement({ date: '2025-08-10', debit: 10, balance: 500 }),
      // Typed 2026 instead of 2025: this row belongs to 2025-2026 by its date.
      aMovement({ date: '2026-08-20', credit: 150, balance: 650 }),
      aMovement({ date: '2025-08-25', debit: 40, balance: 610 }),
      aMovement({ date: '2025-09-02', credit: 30, balance: 640 }),
    ];

    expect(compareWithPreviousYears(rows, school(2025))).toEqual([
      { year: school(2024), openingBalance: 510, closingBalance: 610, change: 100 },
      { year: school(2025), openingBalance: 610, closingBalance: 640, change: 30 },
    ]);
  });

  it('starts the first shown year with the balance of the year before it, even if not shown', () => {
    const rows = [
      aMovement({ date: '2021-10-01', balance: 1000 }),
      aMovement({ date: '2022-10-01', balance: 1300 }),
      aMovement({ date: '2023-10-01', balance: 1250 }),
      aMovement({ date: '2024-10-01', balance: 2000 }),
    ];

    const [firstShown] = compareWithPreviousYears(rows, school(2024));

    expect(firstShown).toMatchObject({ year: school(2022), openingBalance: 1000 });
  });

  it('ignores the school years following the selected one', () => {
    const years = compareWithPreviousYears(movements, school(2022));

    expect(years.map(({ year }) => year.startYear)).toEqual([2021, 2022]);
  });

  it('compares calendar years from the 1st of January to the 31st of December', () => {
    const rows = [
      aMovement({ date: '2024-03-01', balance: 100 }),
      aMovement({ date: '2024-11-01', balance: 300 }),
      aMovement({ date: '2025-02-01', balance: 250 }),
    ];

    expect(compareWithPreviousYears(rows, calendar(2025))).toEqual([
      { year: calendar(2024), openingBalance: 100, closingBalance: 300, change: 200 },
      { year: calendar(2025), openingBalance: 300, closingBalance: 250, change: -50 },
    ]);
  });

  it('only shows the selected school year when the file has no previous one', () => {
    const years = compareWithPreviousYears(movements, school(2021));

    expect(years.map(({ year }) => year.startYear)).toEqual([2021]);
  });
});

describe('cotisationsByYear', () => {
  const aCotisation = (date: string, description: string, credit: number) =>
    aMovement({ date, description, credit, category: 'Cotisation' });

  const movements = [
    aCotisation('2023-09-15', 'Cotisation Zoé', 25),
    aMovement({ date: '2024-03-10', debit: 200, category: 'Assurance' }),
    aCotisation('2024-09-12', 'Cotisation Bob', 30),
    aCotisation('2024-09-10', 'Cotisation Alice', 30),
    aMovement({ date: '2025-10-01', debit: 80, category: 'Location' }),
  ];

  it('gives the fees paid each school year, from the oldest year to the most recent', () => {
    const years = cotisationsByYear(movements, 'school');

    expect(years.map(({ year }) => yearLabel(year))).toEqual(['2023-2024', '2024-2025', '2025-2026']);
    expect(years.map(({ cotisations }) => cotisations.length)).toEqual([1, 2, 0]);
    expect(years.map(({ total }) => total)).toEqual([25, 60, 0]);
  });

  it('lists the members of a year by payment date', () => {
    const [, schoolYear2024] = cotisationsByYear(movements, 'school');

    expect(schoolYear2024.cotisations).toEqual([
      { memberName: 'Alice', date: utc('2024-09-10'), amount: 30 },
      { memberName: 'Bob', date: utc('2024-09-12'), amount: 30 },
    ]);
  });

  it('gives the fees paid each calendar year', () => {
    const years = cotisationsByYear(movements, 'calendar');

    expect(years.map(({ year }) => yearLabel(year))).toEqual(['2023', '2024', '2025']);
    expect(years.map(({ total }) => total)).toEqual([25, 60, 0]);
  });
});
