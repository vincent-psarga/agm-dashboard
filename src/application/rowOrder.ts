import type { Movement } from '../domain/Movement';
import type { RowOrder } from '../domain/RowOrder';

/**
 * Checks that the rows of the file are sorted by date.
 *
 * The misplaced rows are the fewest rows to move for all the other ones to be sorted:
 * a single row with a typo in its date is reported alone, not with all the rows after it.
 * Both orders are accepted (oldest or most recent first): the one needing the fewest
 * moves is the order of the file, the oldest first winning a tie.
 */
export function analyzeRowOrder(movements: Movement[]): RowOrder {
  const dates = movements.map((movement) => movement.date.getTime());
  const oldestFirstSorted = longestSortedSubsequence(dates);
  const mostRecentFirstSorted = longestSortedSubsequence(dates.map((date) => -date));
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
 * Indexes of a longest non-decreasing subsequence of the values (patience sorting,
 * O(n log n)). Equal values are fine: several movements happen on the same day.
 */
function longestSortedSubsequence(values: number[]): Set<number> {
  // tails[k]: index of the smallest possible last value of a subsequence of length k + 1.
  const tails: number[] = [];
  const previousInSubsequence = new Array<number>(values.length).fill(-1);

  values.forEach((value, index) => {
    // First tail strictly greater than the value: equal values extend the subsequence.
    let low = 0;
    let high = tails.length;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (values[tails[middle]] <= value) low = middle + 1;
      else high = middle;
    }
    if (low > 0) previousInSubsequence[index] = tails[low - 1];
    tails[low] = index;
  });

  const indexes = new Set<number>();
  for (let index = tails[tails.length - 1] ?? -1; index !== -1; index = previousInSubsequence[index]) {
    indexes.add(index);
  }
  return indexes;
}
