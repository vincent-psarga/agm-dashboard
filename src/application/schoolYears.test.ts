import { describe, expect, it } from 'vitest';
import { schoolYearLabel, schoolYearOf } from '../domain/SchoolYear';
import { aMovement } from '../test/movementFactory';
import { compareWithPreviousSchoolYears, listSchoolYears, movementsOfSchoolYear } from './schoolYears';

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe('schoolYearOf', () => {
  it.each([
    ['2024-09-01', 2024],
    ['2024-12-31', 2024],
    ['2025-01-01', 2024],
    ['2025-08-31', 2024],
    ['2025-09-01', 2025],
  ])('puts %s in the school year starting in %d', (date, startYear) => {
    expect(schoolYearOf(utc(date))).toEqual({ startYear });
  });
});

describe('schoolYearLabel', () => {
  it('shows both calendar years', () => {
    expect(schoolYearLabel({ startYear: 2024 })).toBe('2024-2025');
  });
});

describe('listSchoolYears', () => {
  it('lists the school years covered by the movements, most recent first', () => {
    const movements = [
      aMovement({ date: '2023-10-01' }),
      aMovement({ date: '2024-06-30' }),
      aMovement({ date: '2025-09-15' }),
      aMovement({ date: '2024-09-01' }),
    ];

    expect(listSchoolYears(movements)).toEqual([
      { startYear: 2025 },
      { startYear: 2024 },
      { startYear: 2023 },
    ]);
  });
});

describe('movementsOfSchoolYear', () => {
  const august = aMovement({ date: '2024-08-31' });
  const september = aMovement({ date: '2024-09-01' });
  const nextAugust = aMovement({ date: '2025-08-31' });
  const movements = [august, september, nextAugust];

  it('keeps the movements from the 1st of September to the 31st of August', () => {
    expect(movementsOfSchoolYear(movements, { startYear: 2024 })).toEqual([september, nextAugust]);
  });

  it('keeps all the movements when no school year is selected', () => {
    expect(movementsOfSchoolYear(movements, null)).toEqual(movements);
  });
});

describe('compareWithPreviousSchoolYears', () => {
  // One movement per school year, from 2021-2022 to 2024-2025.
  const movements = [
    aMovement({ date: '2021-10-01', credit: 100, balance: 1100 }),
    aMovement({ date: '2022-10-01', credit: 200, balance: 1300 }),
    aMovement({ date: '2023-10-01', debit: 50, balance: 1250 }),
    aMovement({ date: '2024-10-01', credit: 750, balance: 2000 }),
  ];

  it('gives the balances of the school year and of the 2 previous ones, oldest first', () => {
    expect(compareWithPreviousSchoolYears(movements, { startYear: 2024 })).toEqual([
      { schoolYear: { startYear: 2022 }, openingBalance: 1100, closingBalance: 1300, change: 200 },
      { schoolYear: { startYear: 2023 }, openingBalance: 1300, closingBalance: 1250, change: -50 },
      { schoolYear: { startYear: 2024 }, openingBalance: 1250, closingBalance: 2000, change: 750 },
    ]);
  });

  it('ignores the school years following the selected one', () => {
    const years = compareWithPreviousSchoolYears(movements, { startYear: 2022 });

    expect(years.map(({ schoolYear }) => schoolYear.startYear)).toEqual([2021, 2022]);
  });

  it('only shows the selected school year when the file has no previous one', () => {
    const years = compareWithPreviousSchoolYears(movements, { startYear: 2021 });

    expect(years.map(({ schoolYear }) => schoolYear.startYear)).toEqual([2021]);
  });
});
