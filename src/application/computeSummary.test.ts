import { describe, expect, it } from 'vitest';
import { aMovement } from '../test/movementFactory';
import { computeSummary } from './computeSummary';

describe('computeSummary', () => {
  describe('period and balances', () => {
    const movements = [
      aMovement({ date: '2025-01-10', credit: 30, balance: 130 }),
      aMovement({ date: '2025-06-01', debit: 50, balance: 80 }),
      aMovement({ date: '2025-12-20', credit: 20, balance: 100 }),
    ];

    it('covers the dates of the first and last movements', () => {
      const { period } = computeSummary(movements);

      expect(period).toEqual({
        start: new Date('2025-01-10T00:00:00Z'),
        end: new Date('2025-12-20T00:00:00Z'),
      });
    });

    it('computes the initial balance from the first movement, before it happened', () => {
      expect(computeSummary(movements).initialBalance).toBe(100);
    });

    it('uses the balance after the last movement as final balance', () => {
      expect(computeSummary(movements).finalBalance).toBe(100);
    });

    it('gives the same result when the file lists the most recent movements first', () => {
      const summary = computeSummary([...movements].reverse());

      expect(summary.initialBalance).toBe(100);
      expect(summary.finalBalance).toBe(100);
    });

    it('keeps the order of the file for movements of the same day', () => {
      const sameDay = [
        aMovement({ date: '2025-02-01', debit: 10, balance: 90 }),
        aMovement({ date: '2025-02-01', debit: 20, balance: 70 }),
      ];

      const summary = computeSummary(sameDay);

      expect(summary.initialBalance).toBe(100);
      expect(summary.finalBalance).toBe(70);
    });
  });

  describe('cotisations', () => {
    it('lists the movements of the "cotisation" category, whatever the case', () => {
      const alice = aMovement({ description: 'Alice', category: 'Cotisation', credit: 30 });
      const bob = aMovement({ description: 'Bob', category: ' cotisations ', credit: 25 });
      const other = aMovement({ category: 'Subvention', credit: 500 });

      const summary = computeSummary([alice, other, bob]);

      expect(summary.cotisations).toEqual([alice, bob]);
      expect(summary.cotisationsTotal).toBe(55);
    });
  });

  describe('expenses and incomes', () => {
    it('sums the amounts by category, from the biggest to the smallest', () => {
      const summary = computeSummary([
        aMovement({ category: 'Rent', debit: 100 }),
        aMovement({ category: 'Insurance', debit: 210.5 }),
        aMovement({ category: 'Rent', debit: 120 }),
        aMovement({ category: 'Grant', credit: 500 }),
      ]);

      expect(summary.expenses.categories).toEqual([
        { category: 'Rent', amount: 220 },
        { category: 'Insurance', amount: 210.5 },
      ]);
      expect(summary.expenses.total).toBe(430.5);
      expect(summary.incomes.categories).toEqual([{ category: 'Grant', amount: 500 }]);
    });

    it('names the 5 biggest categories in the chart and groups the other ones', () => {
      const amounts = [70, 60, 50, 40, 30, 20, 10];
      const summary = computeSummary(
        amounts.map((debit, index) => aMovement({ category: `C${index + 1}`, debit })),
      );

      expect(summary.expenses.slices).toEqual([
        { category: 'C1', amount: 70 },
        { category: 'C2', amount: 60 },
        { category: 'C3', amount: 50 },
        { category: 'C4', amount: 40 },
        { category: 'C5', amount: 30 },
        { category: null, amount: 30 },
      ]);
    });

    it('does not create an "others" slice for a single remaining category', () => {
      const summary = computeSummary(
        [60, 50, 40, 30, 20, 10].map((debit, index) => aMovement({ category: `C${index + 1}`, debit })),
      );

      expect(summary.expenses.slices.map((slice) => slice.category)).toEqual([
        'C1',
        'C2',
        'C3',
        'C4',
        'C5',
        'C6',
      ]);
    });
  });

  describe('grouped commands', () => {
    it('groups the movements tagged "cmd:<key>" by key', () => {
      const summary = computeSummary([
        aMovement({ tag: 'cmd:sword', debit: 450 }),
        aMovement({ tag: 'cmd:sword', credit: 150 }),
        aMovement({ tag: 'cmd:sword', credit: 140 }),
        aMovement({ tag: 'cmd:mask', debit: 100 }),
        aMovement({ tag: 'cmd:mask', credit: 120 }),
        aMovement({ tag: 'other', debit: 999 }),
      ]);

      expect(summary.groupedCommands).toEqual([
        { key: 'mask', expenses: 100, incomes: 120, difference: 20 },
        { key: 'sword', expenses: 450, incomes: 290, difference: -160 },
      ]);
    });

    it('supports several tags on the same movement', () => {
      const summary = computeSummary([aMovement({ tag: 'urgent, cmd:sword', credit: 10 })]);

      expect(summary.groupedCommands).toEqual([
        { key: 'sword', expenses: 0, incomes: 10, difference: 10 },
      ]);
    });
  });
});
