/**
 * A single movement on the association's bank account.
 * Amounts are always positive: `debit` is money leaving the account,
 * `credit` is money received on the account.
 */
export interface Movement {
  date: Date;
  description: string;
  debit: number;
  credit: number;
  /** The category of the movement (the "Raison" column). Empty when not categorized. */
  category: string;
  tag: string;
  /** Balance of the account right after this movement. */
  balance: number;
}
