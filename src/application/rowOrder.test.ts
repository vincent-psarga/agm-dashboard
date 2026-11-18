import { describe, expect, it } from 'vitest';
import { aMovement } from '../test/movementFactory';
import { analyzeRowOrder } from './rowOrder';

/** One movement per date, numbered like Excel rows below a header. */
const movementsOn = (...dates: string[]) =>
  dates.map((date, index) => aMovement({ date, description: date, rowNumber: index + 2 }));

const misplacedRows = (dates: string[]) =>
  analyzeRowOrder(movementsOn(...dates)).misplaced.map(({ movement }) => movement.rowNumber);

describe('analyzeRowOrder', () => {
  it('finds nothing to report when the rows are sorted from the oldest to the most recent', () => {
    expect(analyzeRowOrder(movementsOn('2024-09-01', '2024-09-01', '2024-10-15'))).toEqual({
      mostRecentFirst: false,
      misplaced: [],
    });
  });

  it('accepts files sorted from the most recent to the oldest', () => {
    expect(analyzeRowOrder(movementsOn('2024-10-15', '2024-09-01', '2024-09-01'))).toEqual({
      mostRecentFirst: true,
      misplaced: [],
    });
  });

  it('reports only the row with a typo in its year, not the rows after it', () => {
    expect(
      misplacedRows(['2025-08-10', '2026-08-20', '2025-08-25', '2025-09-02', '2025-09-10']),
    ).toEqual([3]);
  });

  it('reports a row with an earlier date than its neighbours', () => {
    expect(misplacedRows(['2025-01-10', '2025-02-10', '2024-03-10', '2025-04-10'])).toEqual([4]);
  });

  it('reports a misplaced first row', () => {
    expect(misplacedRows(['2027-01-01', '2025-01-10', '2025-02-10', '2025-03-10'])).toEqual([2]);
  });

  it('gives the rows around a misplaced one, to help fixing it', () => {
    const [first, typo, next] = movementsOn('2025-08-10', '2026-08-20', '2025-08-25');

    expect(analyzeRowOrder([first, typo, next]).misplaced).toEqual([
      { movement: typo, previous: first, next },
    ]);
  });
});
