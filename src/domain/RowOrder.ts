import type { Movement } from './Movement';

/** A movement whose row is not at its place, given the dates of the rows around it. */
export interface MisplacedMovement {
  movement: Movement;
  /** The row just above in the file, if any. */
  previous: Movement | null;
  /** The row just below in the file, if any. */
  next: Movement | null;
}

export interface RowOrder {
  /** Whether the file lists the most recent movements first (some bank exports do). */
  mostRecentFirst: boolean;
  /**
   * The rows which are not sorted by date. They usually come from a typo in the date,
   * and make the balances of the periods wrong.
   */
  misplaced: MisplacedMovement[];
}
