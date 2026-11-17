import type { Movement } from '../domain/Movement';

/** Builds a movement for tests: only the relevant fields need to be given. */
export function aMovement(overrides: Partial<Omit<Movement, 'date'>> & { date?: string } = {}): Movement {
  const { date = '2025-01-01', ...rest } = overrides;
  return {
    date: new Date(`${date}T00:00:00Z`),
    description: 'A movement',
    debit: 0,
    credit: 0,
    category: '',
    tag: '',
    balance: 0,
    ...rest,
  };
}
