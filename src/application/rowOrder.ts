import type { Movement } from '../domain/Movement';
import type { RowOrder } from '../domain/RowOrder';

/**
 * Checks that the rows of the file are sorted by month: rows of the same month may be in
 * any order (the day does not matter), but a row in the wrong month or year is reported.
 *
 * The misplaced rows are the fewest rows to move for all the other ones to be sorted:
 * a single row with a typo in its date is reported alone, not with all the rows after it.
 * Both orders are accepted (oldest or most recent first): the one needing the fewest
 * moves is the order of the file, the oldest first winning a tie.
 */
export function analyzeRowOrder(movements: Movement[]): RowOrder {
  const months = movements.map(({ date }) => date.getUTCFullYear() * 12 + date.getUTCMonth());
  const oldestFirstSorted = longestSortedSubsequence(months);
  const mostRecentFirstSorted = longestSortedSubsequence(months.map((month) => -month));
  const mostRecentFirst = mostRecentFirstSorted.size > oldestFirstSorted.size;
  const sorted = mostRecentFirst ? mostRecentFirstSorted : oldestFirstSorted;

  return {
    mostRecentFirst,
    misplaced: movements.flatMap((movement, index) =>
      sorted.has(index)
        ? []
        : [
            {
              movement,
              previous: movements[index - 1] ?? null,
              next: movements[index + 1] ?? null,
            },
          ],
    ),
  };
}

/**
 * Indexes of a longest non-decreasing subsequence of the values: the rows to keep.
 * Equal values are fine: several movements happen in the same month.
 *
 * Several subsequences may be equally long: the one spanning the smallest range is kept,
 * so that the reported row is the one standing out from its neighbours.
 * E.g. in [Dec, Nov, Dec], the November row is reported rather than the first December one.
 */
function longestSortedSubsequence(values: number[]): Set<number> {
  // For the best subsequence ending at each index: its length, its first value and the
  // previous index in it. Quadratic, which is fine for the size of a bank export.
  const length = new Array<number>(values.length).fill(1);
  const first = [...values];
  const previous = new Array<number>(values.length).fill(-1);

  for (let index = 0; index < values.length; index++) {
    for (let before = 0; before < index; before++) {
      if (values[before] > values[index]) continue;
      const isLonger = length[before] + 1 > length[index];
      const isTighter = length[before] + 1 === length[index] && first[before] > first[index];
      if (isLonger || isTighter) {
        length[index] = length[before] + 1;
        first[index] = first[before];
        previous[index] = before;
      }
    }
  }

  let last = -1;
  for (let index = 0; index < values.length; index++) {
    const span = values[index] - first[index];
    if (
      last === -1 ||
      length[index] > length[last] ||
      (length[index] === length[last] && span < values[last] - first[last])
    ) {
      last = index;
    }
  }

  const indexes = new Set<number>();
  for (let index = last; index !== -1; index = previous[index]) indexes.add(index);
  return indexes;
}
